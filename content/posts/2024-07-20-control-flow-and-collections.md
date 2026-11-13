---
layout: post
title: "控制流、Sequence 与 Array.sort 的实现"
description: "重读控制流与集合协议，记下模式匹配、遍历语义和标准库排序的几处边界。"
date: "2024-07-20"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "集合"]
---

翻旧代码翻到一段 `forEach` 里写 `return` 的循环，作者以为能提前结束，实际上只是跳出了那一次闭包调用。这类错不报错、不崩、测试也可能过，最难查。索性把控制流和集合这几处语义边界重新过了一遍。

先记三条最容易记反的：`forEach` 里的 `return` 只退出闭包，`enumerated()` 给的是计数而不是索引，`sort()` 从来没承诺稳定。

## switch 不贯穿，fallthrough 才是贯穿

Swift 的 `switch` 默认不贯穿，每个 case 执行完自动退出，C 系里漏写 `break` 那类事故就没了。要贯穿必须显式写 `fallthrough`，但它不检查下一个 case 的匹配条件，直接进语句体。

```swift
let value = 5
switch value {
case 1...3:
    print("low")
case 4...6:
    print("mid")
    fallthrough
case 7:
    print("此处无条件执行，即使 value 不是 7")
default:
    break
}
```

输出是 `mid`，接着是那行中文提示——`value` 明明是 5，`case 7` 的语句体照样执行了。`fallthrough` 是控制流跳转，不是再匹配一次；下一个 case 带 `let` 绑定时，编译器会直接报错。

区间、元组、枚举关联值、`where` 都能拿来匹配，枚举还会做穷尽性检查，新增 case 时所有漏处理的 `switch` 立刻编译失败。

```swift
switch (httpCode, mimeType) {
case (200, "application/json"):
    decodeJSON()
case (200, let mime) where mime.hasPrefix("image/"):
    renderImage()
case (400...499, _):
    showClientError()
default:
    reportUnexpected()
}
```

匹配由 `~=` 定义，标准库为区间、`Equatable` 等提供了重载，自定义类型也能自己重载 `~=`。

## 给循环打标签

嵌套循环里 `break` 默认只跳最内层。Swift 允许给循环加标签：

```swift
outer: for row in matrix {
    for cell in row {
        guard cell.isValid else { break outer }
        process(cell)
    }
}
```

`continue outer` 同理，`while` 和 `repeat...while` 上也能用。

## 遍历数组的几种写法

| 方式 | 得到什么 | 关键差异 |
| --- | --- | --- |
| `for x in a` | 元素 | 最常用，走 Sequence 的迭代器 |
| `var it = a.makeIterator()` | 手动调用 `next()` | 可跨函数、跨循环推进，适合需要「两个序列不同步消费」的场景 |
| `for i in a.indices` | 真实索引类型 | 对 `ArraySlice` 也正确，索引不一定从 0 开始 |
| `for (offset, x) in a.enumerated()` | 从 0 起算的计数 | `offset` 是 `Int` 计数，**不是索引** |
| `a.forEach { ... }` | 元素 | 闭包里的 `return` 只退出闭包，不跳出外层 |

`enumerated()` 的 `offset` 从 0 开始，而 `ArraySlice` 的 `startIndex` 可能不是 0，拿 `offset` 去索引切片会越界或者取错元素。要索引加元素，用 `zip(a.indices, a)`。

```swift
let slice = array[3...]              // startIndex == 3
for (index, element) in zip(slice.indices, slice) {
    print(index, element)           // 索引与元素严格对应
}
```

`forEach` 的 `return` 等价于 `continue`，不是 `break`，也没法用 `break outer` 提前终止整个遍历。

## Sequence 与 Collection 差在哪

`Sequence` 只要求提供一个遵守 `IteratorProtocol` 的迭代器，`next()` 返回 `Element?`。它不保证可重复遍历，也不保证有限；遍历一遍之后再调 `makeIterator()` 会得到什么，取决于实现。

`Collection` 继承 `Sequence`，额外承诺可多次、非破坏性遍历，有 `startIndex` / `endIndex`，支持下标，提供 `indices` 和 `count`。注意 `count` 不一定是 O(1)，`Collection` 允许 O(n)；只有 `RandomAccessCollection` 才把索引移动和距离计算约束到 O(1)。

`underestimatedCount` 是迭代器给出的「至少有多少元素」的下界，允许低估、不许高估，`Array(sequence)` 会用它做 `reserveCapacity`，省掉反复扩容。

```swift
struct Countdown: Sequence, IteratorProtocol {
    var current: Int
    mutating func next() -> Int? {
        guard current > 0 else { return nil }
        defer { current -= 1 }
        return current
    }
}
for n in Countdown(current: 3) { print(n) }   // 3 2 1
```

同一个类型同时遵守 `Sequence` 和 `IteratorProtocol` 时，`makeIterator()` 默认返回 `self`，所以上面这个类型是一次性的。要可重复遍历，得把迭代器拆成独立类型。

## sort 的实现策略

笔记里记的是「快排、元素少于 20 改插入排序、递归过深切成堆排序」。这套组合就是 introsort（Musser 1997）的经典结构，目的是把最坏情况锁住：

1. 小区间用插入排序：常数因子小、顺序访问缓存友好，元素接近有序时接近 O(n)；
2. 主体用快速排序分区：平均 O(n log n)，原地，缓存局部性好；
3. 监控递归深度，超过约 `2 * floor(log2(n))` 时切换堆排序：堆排序最坏 O(n log n)，快排也就没法在坏枢轴下退化成 O(n²)。

实现细节随版本变过（源码在 `stdlib/public/core/Sort.swift`，历史上调整过算法和阈值），笔记里那个「20」属于某个时期的实现，不该写进业务假设。

API 文档没承诺 `sort()` 稳定，相等元素的相对顺序不能依赖。业务上需要稳定顺序，就把原始下标显式当次级键：

```swift
let stable = items
    .enumerated()
    .sorted {
        if $0.element.score != $1.element.score {
            return $0.element.score > $1.element.score
        }
        return $0.offset < $1.offset        // 相等时保持原顺序
    }
    .map(\.element)
```

## Set 与 Dictionary 的代价

两者都建立在 `Hashable` 上。标准库为哈希引入了随机化种子，抵御构造碰撞的攻击，内部用开放寻址的哈希表，负载因子到阈值就扩容。平均查找、插入 O(1)，最坏 O(n)，迭代顺序不保证。

| 操作 | `Array` | `Set` | `Dictionary` |
| --- | --- | --- | --- |
| 查找某元素 | O(n) | O(1) 平均 | O(1) 平均（按键） |
| 尾部追加 | O(1) 摊还 | O(1) 平均 | — |
| 保持插入顺序 | 是 | 否 | 否 |
| 自动去重 | 否 | 是 | 键唯一 |
| 内存布局 | 连续 | 哈希桶 | 哈希桶 |

把自定义类型当 `Dictionary` 的键时，`==` 和 `hash(into:)` 必须一致：相等必然同哈希，同哈希不必相等。另外，对象待在容器里的时候被改掉，哈希就失效了。

这四条边界——`forEach` 的 `return`、`enumerated()` 的 offset、排序稳定性、`Sequence` 的单次遍历——每一条我都在线上见过对应的缺陷。
