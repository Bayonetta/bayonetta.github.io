---
layout: post
title: "协议、关联类型与面向协议编程"
description: "从协议扩展的静态派发讲起，记一下小协议、associatedtype 与 any 的边界。"
date: "2025-02-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "协议"]
---

协议扩展那个坑，我第一次踩的时候盯了很久：给 `Greeter` 加了 `casual()` 的默认实现，`Polite` 里也写了同名方法，可把它赋给 `Greeter` 类型的变量之后，调用出来的还是默认实现。没有警告，没有报错，就是行为不对。

原因在派发方式上。这篇从那儿展开，把协议能要求什么、扩展为什么静态派发、`any` 的边界串一遍。

先看一眼 `Array`。它是结构体，序列遍历、随机访问、区间替换、字面量构造、打印描述这些能力都不是继承来的，是分别遵循 `Sequence`、`Collection`、`RandomAccessCollection`、`RangeReplaceableCollection`、`ExpressibleByArrayLiteral`、`CustomStringConvertible` 拼出来的。

## 协议能要求什么

实例/类型属性（`get` / `get set`）、实例/类型方法、`init`、下标、`mutating` 方法都能要求。属性要求只管读写性：

```swift
protocol Named {
    var name: String { get }                 // 至少可读
    var displayName: String { get set }      // 可读写
    static var kind: String { get }
    init(name: String)
    mutating func rename(to newName: String)
}
```

两个容易漏的细节：协议声明了 `init` 时，类实现必须写 `required init`（除非 `final`）；要求 `get` 的，实现可以给 `set`；要求 `get set` 的，实现不能只给只读计算属性。

协议组合用 `&`，叠上 `AnyObject` 就能把值类型挡在外面：

```swift
func configure(_ target: any Named & AnyObject) { ... }
func draw(_ shape: any Named & Drawable) { ... }
```

## @objc optional 和默认实现不是一回事

`@objc optional` 来自 Objective-C 互操作，只能用在 `@objc` 协议上，而且只有类能遵循：

```swift
@objc protocol DataSource {
    @objc optional func numberOfSections() -> Int
}
if let n = source.numberOfSections?() { ... }
```

它靠运行时检查方法有没有实现，走消息派发。Swift 那边的做法是协议扩展给默认实现：

```swift
extension Named {
    var displayName: String { name }
}
```

后者在编译期就定下了，没有运行时探测开销，也不要求 `@objc`。两者别混着用，混起来的行为很难推理。

## 协议扩展为什么是静态派发

规则一句话：

> 只有**在协议主体中声明**的要求，才通过 witness table 动态派发；仅在协议扩展里新增的方法/属性，按调用点的**静态类型**派发。

```swift
protocol Greeter {
    func official() -> String          // 声明在协议主体 → 动态派发
}

extension Greeter {
    func official() -> String { "Hello" }
    func casual() -> String { "Hi" }   // 只在扩展里 → 静态派发
}

struct Polite: Greeter {
    func official() -> String { "Good day" }
    func casual() -> String { "How do you do" }
}

let p: Greeter = Polite()
p.official()    // "Good day"  —— 经 witness table 找到实现
p.casual()      // "Hi"        —— 静态类型是 Greeter，调到扩展默认实现！

Polite().casual()   // "How do you do" —— 静态类型是 Polite，调到自己的实现
```

同一个对象、同一个方法名，只因为变量声明类型不同就得到不同结果。泛型里更隐蔽：形参的静态类型就是协议约束，`T: Greeter` 的函数内部调 `casual()`，永远走扩展实现。

两种修法：

1. 想让遵循类型自定义 → 把 `casual()` 声明移回协议主体，扩展只留默认实现；
2. 本来就是基于其他要求推导出的固定行为 → 留在扩展里，命名上体现它是模板方法，内部只调协议要求（这些调用会正确动态派发）。

```swift
protocol Greeter {
    func official() -> String
    func casual() -> String            // 声明回主体
}
extension Greeter {
    func casual() -> String { official().lowercased() }   // 默认实现
}
```

**想让遵循者能覆盖的能力，都得声明在协议主体里**。协议扩展只负责默认实现和通用算法。

## 跟继承比，差在结构上

Objective-C 时代要一个可变数组，得走 `NSObject → NSArray → NSMutableArray` 这条继承链。继承把「是什么」和「能做什么」绑在一起，代价很明确：子类继承全部父类状态与行为、深层继承树脆弱、单继承表达不了多个正交角色、值类型压根参与不了。

Swift 把能力拆成细粒度协议，类型按需组合：

| 维度 | 继承（OOP） | 协议 + 扩展（POP） |
| --- | --- | --- |
| 复用单位 | 父类 | 协议要求 + 默认实现 |
| 组合能力 | 单继承 | 可遵循多个协议 |
| 值类型 | 不可用 | struct / enum 原生支持 |
| 状态 | 随继承引入 | 协议不强制引入存储 |
| 耦合点 | 父类实现细节 | 明确的能力契约 |
| 派发 | vtable / 消息 | witness table / 静态（见上） |

我自己的习惯是先列**角色**——可缓存、可序列化、可展示、可撤销——每个角色定义成一个只含必要要求的小协议，通用算法用协议扩展写在这些要求上。只有当一组类型确实共享状态和生命周期时才上类继承，继承树控制在两层以内。

## 条件一致性

`extension` 上的 `where` 约束 `Element`，元素满足条件时 `Array` 才获得这个能力。标准库里「元素可比较时数组才可比较」就是这么实现的：

```swift
protocol TextRepresentable {
    var text: String { get }
}

extension Array: TextRepresentable where Element: TextRepresentable {
    var text: String {
        map(\.text).joined(separator: ", ")
    }
}

struct Person: TextRepresentable {
    let name: String
    var text: String { name }
}

[Person(name: "A"), Person(name: "B")].text   // "A, B"
// [1, 2].text  → 编译错误：Int 不遵循 TextRepresentable
```

这叫条件一致性，让整个类型获得协议遵循。给普通方法加 `where` 只是限制某个方法能不能用，是另一回事。

## associatedtype 与 any

带关联类型的协议用 `associatedtype` 声明占位类型，实现时用 `typealias` 或者从方法签名推断：

```swift
protocol Container {
    associatedtype Item
    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(i: Int) -> Item { get }
}

struct IntStack: Container {
    var items: [Int] = []
    var count: Int { items.count }
    mutating func append(_ item: Int) { items.append(item) }   // 推断 Item == Int
    subscript(i: Int) -> Int { items[i] }
}
```

Swift 5.7 起，带 `associatedtype` 或 `Self` 的协议当作类型用时必须写 `any`，编译器强制你显式化：

```swift
let c: any Container = IntStack()   // 装箱，抹去具体 Item 类型
func dump<C: Container>(_ c: C) { ... }   // 泛型，保留具体类型
```

`any` 有装箱和方法派发开销，而且带关联类型的存在类型上很多操作直接不可用（`Item` 未知）。泛型和 `some` 保留静态类型信息。只有真需要把异构对象塞进同一个数组时才用 `any`，其余场合优先泛型或 `some`。

静态派发这个坑最麻烦的地方在于它不给任何编译警告。代码看着像实现了，行为就是不一致。评审时我会专门扫一眼：协议扩展里的方法，有没有该声明进协议主体的漏在外面。
