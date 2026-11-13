---
layout: post
title: "Substring、区间与运算符：Swift 语法糖背后的设计"
description: "从 Substring 共享内存讲到 Range、运算符与 where。"
date: "2024-06-22"
category: "iOS"
comments: true
tags: ["iOS","Swift","语法"]
---

有次在列表里缓存了每行的标题，为了省事直接存了 `prefix(30)` 的结果。一个几十 MB 的日志文件读进来，切完只剩几十行短标题，内存却一直没降。原因很简单：`Substring` 不拷贝，它和原字符串共享同一块缓冲区。

这篇是那之后把字符串、区间、运算符这几块重新理了一遍的笔记。

## Substring 的共享与陷阱

`String` 的 `prefix`、`suffix` 和区间下标返回的是 `Substring`，不是 `String`。它只记起止 `String.Index`，和原字符串共享字符缓冲区，所以切一段前缀是常数级操作，不拷贝整段文本。

代价是 `Substring` 持有对原缓冲区的强引用。长期存进属性、字典或者缓存，那一整份原始 `String` 就释放不掉，哪怕你只留了三个字。要长期持有，就 `String(sub)` 拷一份出来。

```swift
let raw = loadHugeLog()                    // 假设返回一份很大的 String
let head: Substring = raw.prefix(80)       // 共享 raw 的缓冲区，零拷贝
// 只把必要部分落盘 / 存模型：
let title = String(head)                   // 独立拷贝，raw 可被释放
```

`String.Index` 只对产生它的那一份 `String` 及其 `Substring` 有效。把 A 字符串的 Index 拿到 B 上用属于未定义行为。要把位置跨函数存下来，存整数偏移量、再用 `index(_:offsetBy:)` 重建更稳。

`prefix(5)` 在长度不足时返回全部内容，不会越界。`dropFirst`、`dropLast`、`prefix(while:)` 同样返回 `Substring`。

## StringProtocol 让 API 同时吃两种字符串

标准库用 `StringProtocol` 抽出了 `String` 与 `Substring` 的共同能力。自定义字符串工具别把参数写死成 `String`，否则调用方每次都得先 `String(sub)` 物化一次，白付一次拷贝。

```swift
import Foundation

func head<S: StringProtocol>(_ s: S) -> Character? {
    s.first
}

func lineCount(_ s: some StringProtocol) -> Int {
    s.split(separator: "\n").count
}

let whole = "alpha\nbeta\ngamma"
let sub: Substring = whole.prefix(11)
head(whole)        // 可选值 "a"
head(sub)          // 可选值 "a"
lineCount(whole)   // 3
let detached = String(sub)   // 真正独立的 String
```

泛型让调用方传任意具体类型；`some StringProtocol` 隐藏具体类型，底层仍是单一类型，没有装箱。

`StringProtocol` 带 `Self` 和关联类型要求，不能直接当存储属性的类型，所以只能走泛型或 `some`。Swift 5.7 之后 `some StringProtocol` 依旧是不透明类型，不会引入 `any` 的装箱与动态派发成本。

## 为什么不能用整数下标

`String` 是 `Character`（字素簇）的集合，一个字符可能由多个 Unicode 标量组合而成。所以 `s[2]` 编译不过，必须走 `String.Index`；`count` 要遍历整串字素簇，复杂度 `O(n)`。

`utf8`、`utf16`、`unicodeScalars` 是确定宽度的序列；`Character` 视图要做字素簇边界判定，最贵。`String.Index` 遵循 `Comparable`，但不遵循 `Strideable`——字符宽度可变，Swift 干脆不提供整数随机访问，逼你用 `index(_:offsetBy:)` 把代价写在脸上。

## `??` 与 @autoclosure

Nil-Coalescing 运算符 `??` 右结合，链式写法取第一个非 `nil` 的值。

```swift
let a: Int? = nil
let b: Int? = nil
let c: Int? = 42
let d: Int? = 7

let value = a ?? b ?? c ?? d ?? 0   // 42，d 与 0 不会被求值
```

`??` 的第二个参数被 `@autoclosure` 包裹，只有左侧为 `nil` 时才求值，所以 `d` 和 `0` 在这条链里根本没被算到。这也是 `x ?? expensive()` 能放心写的原因。

`Optional.map` 变换值并保留一层 Optional，`flatMap` 把嵌套的 Optional 拍平。

```swift
// 强调「取第一个非 nil」用 ??；强调「对存在的值做变换」用 map / flatMap
let displayName = nickname ?? fullName ?? "匿名"

func lookup(id: Int) -> String? { id == 1 ? "赵帅" : nil }
let optionalID: Int? = 1
let resolved = optionalID.flatMap(lookup)   // String?，不会变成 String??
```

`nickname`、`fullName` 这里假设已有声明，只为说明链式语义。

## Range 的约束是 Comparable

Range 只要求 `Bound: Comparable`，不要求能数数。`"a"..."z"` 合法，因为 `String` 遵循 `Comparable`，表达的是字典序区间。三种形态：`ClosedRange`（`a...b`，含两端）、`Range`（`0..<10`，不含上界）、`PartialRangeFrom`（`5...`，只有下界）。要用 `stride` 或整数步进，边界还得遵循 `Strideable`。

`RangeExpression` 让这几种区间都能进 `switch` 的 `case`，靠 `~=` 匹配，`case 0..<10` 才写得通。`contains` 对 `Strideable` 的整数边界是常数级比较；对 `String` 只做字典序比较，并不意味着能枚举出中间所有值。

```swift
let letters = "a"..."z"        // ClosedRange<String>
letters.contains("k")          // true
let half = 0..<10              // Range<Int>
let from = 5...                // PartialRangeFrom<Int>
```

## 自定义运算符

自定义运算符要先声明再实现。中缀运算符还得指定优先级组，组里可写 `associativity`、`higherThan` / `lowerThan` 和 `assignment`。

```swift
import Foundation

// 前缀运算符
prefix operator +++
prefix func +++ (value: Int) -> Int {
    value + 2
}

// 中缀运算符与优先级组
precedencegroup VectorAdd {
    associativity: left
    higherThan: AdditionPrecedence
    assignment: false
}

infix operator ⊕: VectorAdd

func ⊕ (lhs: [Int], rhs: [Int]) -> [Int] {
    zip(lhs, rhs).map { $0 + $1 }
}

let result = [1, 2, 3] ⊕ [4, 5, 6]   // [5, 7, 9]
let n = +++5                          // 7
```

`associativity: left` 决定同级从左往右结合；`higherThan: AdditionPrecedence` 把它挂到标准库加法之上；`assignment: false` 表示不是赋值类运算符。

运算符字符集合有限制，`⊕` 这类 Unicode 符号合法。自定义运算符默认全局可见，同名重复声明会编译冲突，优先级组也尽量复用标准库已有的。

## stride 的边界与浮点误差

`stride(from:to:by:)` 是半开区间，不含上界；`stride(from:through:by:)` 是闭区间，含上界。

```swift
Array(stride(from: 0, to: 10, by: 2))        // [0, 2, 4, 6, 8]
Array(stride(from: 0, through: 10, by: 2))   // [0, 2, 4, 6, 8, 10]
```

浮点版本要小心。`by` 是反复累加的，`0.1` 无法用二进制精确表示，误差累积下来末项可能停在 `0.9999999999999999` 附近，甚至多出一个越界元素。做刻度、动画帧或进度条时别用浮点 `stride`，改用整数步长再缩放：

```swift
let ticks = stride(from: 0, through: 10, by: 1).map { Double($0) / 10.0 }
```

## 可变参数本质是数组

`Int...` 只是语法糖，函数体里拿到的是 `[Int]`，`for`、`map`、`count` 都能用。限制有三条：一个函数最多一个可变参数；不能标 `inout`；Swift 没有 splat 语法，不能把已有的 `[Int]` 直接喂给另一个 `Int...` 函数，只能额外重载一个接受 `[Int]` 的版本。

## `where` 能出现在哪

`where` 是约束，位置是固定的几类：

```swift
// 1. 泛型声明的约束
func allEqual<C: Collection>(_ c: C) -> Bool where C.Element: Equatable {
    guard let first = c.first else { return true }
    return !c.contains { $0 != first }
}

// 2. extension 的成员约束
extension Array where Element: Numeric {
    func total() -> Element { reduce(.zero, +) }
}

// 3. for-in 的过滤条件
for n in numbers where n % 2 == 0 { print(n) }

// 4. switch / catch / if case 的模式约束
switch value {
case let x where x > 0: break
default: break
}
do { try work() } catch let e as IOError where e.code == 2 { handle(e) }

// 5. associatedtype 的约束
protocol Container {
    associatedtype Item where Item: Hashable
}
```

`numbers`、`value`、`work()`、`IOError`、`handle` 都是假设调用方已有的声明。extension 上只能用 `where`，写不出 `extension Array<T: Numeric>` 这种形式。
