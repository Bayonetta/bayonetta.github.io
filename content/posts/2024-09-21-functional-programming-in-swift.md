---
layout: post
title: "函数式构造单元与并行 map 的线程安全"
description: "从三个构造单元讲到词频统计，再修正一个非线程安全的 parallelMap。"
date: "2024-09-21"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "函数式编程"]
---

几年前写过一个 `parallelMap`，本地跑得好好的，上了灰度以后结果数组偶尔少几个元素，偶尔顺序乱掉。当时以为是网络层的问题，查了两天才发现是 `concurrentPerform` 里并发 `append`。这篇从那次的复盘开始写。

## 先把标准库那几个拆开

Swift 的高阶函数，拆到底大多是 filter、map、reduce 的组合。

| 函数 | 构造单元 | 签名要点 | 典型用途 |
| --- | --- | --- | --- |
| `filter` | 筛选 | `(Element) throws -> Bool` | 保留满足条件的元素 |
| `map` | 映射 | `(Element) throws -> T` | 一对一变换，元素数不变 |
| `flatMap` | 映射 + 展平 | `(Element) throws -> Sequence` | 一对多后压平一层 |
| `compactMap` | 映射 + 筛选 | `(Element) throws -> T?` | 丢弃 nil 并解包 |
| `reduce` | 折叠 | `(Result, Element) throws -> Result` | 聚合成单值 |
| `reduce(into:)` | 折叠（原地） | `(inout Result, Element)` | 聚合到可变容器 |
| `zip` | 组合 | 两个 Sequence | 并行遍历、构造键值对 |
| `prefix(while:)` / `drop(while:)` | 筛选（前缀） | 谓词 | 取/丢连续前缀 |
| `first(where:)` / `allSatisfy` | 筛选 + 短路 | 谓词 | 短路查询 |
| `mapValues` / `compactMapValues` | 映射 | 只作用于 Dictionary 的 value | 保留键结构 |
| `joined()` | 展平 | 序列的序列 | 拼接 |
| `sorted(by:)` | 重排 | 比较闭包 | 全量排序 |

`reduce` 每一步都返回新值，语义上传入的是不可变副本，很容易写出 `acc + [x]` 这种反复分配的代码。`reduce(into:)` 把累积器以 `inout` 传进去，直接原地追加：

```swift
let grouped = words.reduce(into: [String: Int]()) { counts, word in
    counts[word, default: 0] += 1
}
```

## 拿词频统计当例子

Jon Bentley 曾向 Donald Knuth 提过这个题：统计一段文本里各词出现的次数，按频率输出。Knuth 用 literate programming 给了实现。

```swift
import Foundation

func wordFrequencies(in text: String) -> [(word: String, count: Int)] {
    let words = text
        .lowercased()
        .components(separatedBy: CharacterSet.letters.inverted)  // 按非字母切分
        .filter { !$0.isEmpty }

    let counts = words.reduce(into: [String: Int]()) { acc, w in
        acc[w, default: 0] += 1
    }

    return counts
        .sorted { lhs, rhs in
            lhs.value == rhs.value ? lhs.key < rhs.key : lhs.value > rhs.value
        }
        .map { (word: $0.key, count: $0.value) }
}
```

`sorted` 里那个 `lhs.key < rhs.key` 别省。字典迭代无序，不加次级键的话每次跑出来的顺序都可能不一样，测试会莫名其妙地飘。

命令式版本用 `for` 循环加字典累加通常更快，也少一个中间数组。不过几万词的规模下差别不明显，真正决定性能的是分词方式和排序。

`components(separatedBy:)` 会产生中间数组。文件大了就该换 `enumerateSubstrings(in:options:)` 或者按块流式读，否则内存峰值跟文本长度线性相关。

## 那个 parallelMap 错在哪

Java 有 `parallelStream`，Swift 标准库没有对应物，于是很多人（包括我）会顺手给 `Array` 加一个：

```swift
// 错误示例：不要这样写
extension Array {
    func parallelMap<T>(_ transform: (Element) -> T) -> [T] {
        let n = self.count
        if n == 0 { return [] }
        var result = ContiguousArray<T>()
        result.reserveCapacity(n)

        DispatchQueue.concurrentPerform(iterations: n) { i in
            result.append(transform(self[i]))       // 多个线程同时写同一个对象
        }
        return Array(result)
    }
}
```

至少三个问题：

1. **数据竞争**：`concurrentPerform` 在线程池上并发跑多个迭代，`result.append` 同时改 `ContiguousArray` 的长度、引用计数和存储缓冲区。Swift 集合不是线程安全的，这属于未定义行为，轻则丢数据、顺序错乱，重则内存破坏直接崩。
2. **顺序不保证**：即便加了锁，`append` 的先后也取决于调度，结果乱序，不满足 `map` 的语义。
3. **捕获 `self` 与泛型推导**：闭包里读 `self[i]` 本身没问题，但读写混在一处，排查时很容易误判问题来源。

用 Thread Sanitizer 跑会稳定报 data race。`reserveCapacity` 只解决了扩容，没解决并发写。

## 三种修法

**A. 预分配固定缓冲区，各写各的下标（推荐）**

关键是让每个迭代只写互不重叠的内存位置。Swift 数组没法原地构造未初始化元素，用 `UnsafeMutableBufferPointer` 配一个占位：

```swift
import Dispatch
import Foundation

extension Array {
    func parallelMap<T>(_ transform: (Element) -> T) -> [T] {
        let n = count
        guard n > 0 else { return [] }

        return Array<T>(unsafeUninitializedCapacity: n) { buffer, initialized in
            // buffer 已分配，但元素尚未初始化；各下标互不重叠
            let base = buffer.baseAddress!
            DispatchQueue.concurrentPerform(iterations: n) { i in
                (base + i).initialize(to: transform(self[i]))
            }
            initialized = n
        }
    }
}
```

`unsafeUninitializedCapacity` 给的是一段已分配但未初始化的连续内存。每个下标只由一个线程 `initialize(to:)`，不用锁，天然保序。代价是必须恰好初始化 `n` 个元素并设好 `initialized`，否则就是泄漏或者读到未初始化内存。

Swift 6 的严格并发检查下，跨线程闭包必须是 `@Sendable`，`self` 和元素也得满足 `Sendable`。生产代码的签名更接近 `func parallelMap<T: Sendable>(_ transform: @Sendable (Element) -> T) -> [T] where Element: Sendable`。

常见的替代写法是用 `Optional` 数组占位再 `compactMap`：

```swift
var slots = [T?](repeating: nil, count: n)
DispatchQueue.concurrentPerform(iterations: n) { i in
    slots[i] = transform(self[i])       // 仍然不安全，见下
}
return slots.compactMap { $0 }
```

这没解决问题。`slots` 被多个并发闭包共同捕获，数组的值语义和写时复制检查（`isKnownUniquelyReferenced`）不是为并发写设计的，不同下标写入照样构成数据竞争。

**B. 用锁或串行队列保护 append**

```swift
let lock = NSLock()
DispatchQueue.concurrentPerform(iterations: n) { i in
    let value = transform(self[i])
    lock.lock(); defer { lock.unlock() }
    result.append(value)
}
```

正确性有了，但锁把并行写串行化了，顺序仍然不确定。只适合 `transform` 极重、写结果占比极小的场景。

**C. 按块分区**

把 `0..<n` 切成跟 CPU 核数相当的连续区间，每个任务在自己的局部数组里算，最后按块顺序拼接。

## 什么时候真值得并行

`concurrentPerform` 要调度到 GCD 线程池，有固定开销。按 Amdahl 定律，串行部分仍然决定上限。我自己的判断顺序是：

1. 先确认 `transform` 是纯函数，没有共享状态，没有 I/O；
2. 单次 `transform` 的成本要显著大于调度成本，一般是微秒级以上，或者本身就是计算密集型；
3. 元素数量要够多，几十个元素并行通常更慢；
4. 注意优先级反转：并发任务默认继承发起方的 QoS，在后台队列里塞一堆高优先级任务会拖累主线程响应；
5. 最后用 Instruments 或基准测试验证，别凭感觉。

UI 层代码基本用不上。一次 `map` 处理几百个模型对象的耗时远小于一帧。

## 什么时候不该用函数式

三个否决条件：闭包里有副作用，就用 `for...in`；链式调用产生多个中间数组且数据量可观，合并成单次遍历或者加 `lazy`；链式步骤多到读者要反复回溯类型，拆成具名中间变量。

并行化是另一层的决策，跟用不用 `map` 没关系。
