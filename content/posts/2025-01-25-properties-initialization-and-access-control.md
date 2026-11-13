---
layout: post
title: "属性、初始化器与访问控制"
description: "记一下 Swift 属性、初始化器和访问控制里几处容易记错的规则。"
date: "2025-01-25"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "语言细节"]
---

review 时看到有人把 `private(set)` 当成「文件内可写」用，结果同一个文件里另一个类型赋值时编译不过，改了半天。这类规则平时不写就忘，索性按能验证的行为整理一遍。

## 存储属性、计算属性与 lazy

计算属性不存值。`get` 取值，可选 `set` 写入，省略参数名就用 `newValue`，只读的话 `get` 也能省：

```swift
struct Rect {
    var origin: (x: Double, y: Double)
    var size: (w: Double, h: Double)

    var centerX: Double {
        get { origin.x + size.w / 2 }
        set { origin.x = newValue - size.w / 2 }
    }

    var area: Double { size.w * size.h }     // 只读，省略 get
}
```

`lazy` 把初始化推到首次访问。只能用 `var`，不能叠观察器，初始化表达式里能访问 `self`。**`lazy` 不是线程安全的**——两个线程同时首次访问，可能各初始化一次，并发场景自己加锁或者换一次性容器。

`lazy` 配闭包能把构造逻辑收在一处：

```swift
lazy var formatter: DateFormatter = {
    let f = DateFormatter()
    f.dateStyle = .medium
    return f
}()
```

末尾那个 `()` 是立即调用闭包取返回值。漏了它，属性类型就变成闭包了，编译能过，用的时候才发现不对。

## 属性观察器

`willSet` / `didSet` 在写入前后触发，可以用 `newValue` / `oldValue`，也能自定义参数名：

```swift
var progress: Double = 0 {
    willSet { print("即将从 \(progress) 变为 \(newValue)") }
    didSet {
        if progress != oldValue { needsLayout = true }
    }
}
```

四条容易记错的规则：

1. 初始化期间（包括在 `init` 里赋初值）**不触发**观察器；
2. `willSet` 里属性本身还是旧值，新值在 `newValue`；`didSet` 里属性已经是新值，旧值在 `oldValue`；
3. `didSet` 里再给同一个属性赋值**不会递归触发**，这是语言保证的；
4. 观察器和 `get` / `set` 不能共存。

## static 与 class

`static` 声明类型级属性或方法；`class` 只能用在 class 上，允许子类 `override`，所以 `static` 大致等于 `final class`。存储型的类型属性必须有默认值。

类型属性是懒加载的，但运行时保证只初始化一次、且线程安全，跟实例上的 `lazy` 不是一回事。

```swift
class Theme {
    class var identifier: String { "base" }     // 可重写
    static let version = 1                      // 不可重写
}
```

## 下标

`subscript` 让类型支持方括号，可读写、可重载、可多参数，也能写成泛型：

```swift
struct Matrix {
    let rows: Int, columns: Int
    private var values: [Double]

    subscript(row: Int, column: Int) -> Double {
        get {
            precondition(row >= 0 && row < rows && column >= 0 && column < columns)
            return values[row * columns + column]
        }
        set { values[row * columns + column] = newValue }
    }
}
```

泛型下标适合做弱类型的取值接口：

```swift
struct Payload {
    private var storage: [String: Any] = [:]
    subscript<T>(_ key: String, as type: T.Type) -> T? {
        storage[key] as? T
    }
}
// payload["timeout", as: Int.self]
```

自定义集合时 `indices` 必须返回一个 `Collection`，其 `Element` 就是该集合的 `Index`。不提供就拿不到 `for i in collection.indices`、切片以及那一堆默认实现。

## mutating 与 nonmutating

值类型的方法默认不能改 `self`（相当于 `let`），要改就标 `mutating`：

```swift
struct Stack<Element> {
    private var items: [Element] = []
    mutating func push(_ x: Element) { items.append(x) }
    mutating func pop() -> Element? { items.popLast() }
}
```

`mutating` 还改了调用语义：只能对 `var` 调用，给 `self` 赋值等于整体替换。`nonmutating set` 用在下标上，允许在 `let` 常量里写入，因为写的是引用目标、不是结构体本身。枚举切换 `self` 的 case 同样要 `mutating`。类没这些限制，引用类型的方法本来就能改属性。

## 两段式初始化

Swift 类的初始化分两段，目的是别让父类方法访问到还没初始化的子类属性：

- 第一段：从子类往上，每个类先初始化自己引入的存储属性，再调 `super.init`；
- 第二段：从父类往下，`super.init` 返回后才能访问 `self`、调实例方法、读继承来的属性。

配套四条编译期检查：指定初始化器先初始化本类属性再向上代理；第一段里不能调实例方法、不能读属性值；便利初始化器要先横向代理到本类的指定初始化器，之后才能访问 `self`；便利初始化器不能直接调 `super.init`。

```swift
class Vehicle {
    var wheels: Int
    init(wheels: Int) { self.wheels = wheels }       // 指定初始化器
    convenience init() { self.init(wheels: 4) }      // 便利初始化器
}

class Bicycle: Vehicle {
    var hasBell: Bool
    init(hasBell: Bool) {
        self.hasBell = hasBell                       // 先本类属性
        super.init(wheels: 2)                        // 再向上
        self.hasBell = hasBell && wheels > 0         // 此后才可用 self
    }
}
```

## 便利初始化器的继承规则

以前笔记里写的是「写了 `override init`，父类的 convenience init 就会自动继承」，不准确。实际规则是：

> 子类若**实现了父类的全部指定初始化器**（显式重写，或在不引入新存储属性时自动继承），就自动继承父类的全部便利初始化器。

触发条件是全部 designated initializer 都被覆盖，不是写过任意一个 `override`。只重写一个、父类还有另一个指定初始化器时，便利初始化器不会自动继承；反过来，子类一个指定初始化器都不写、新属性又都有默认值，那就继承父类全部指定初始化器，连带继承全部便利初始化器。

继承来的便利初始化器内部那句 `self.init(...)` 会动态派发到子类对应的指定初始化器，继承才能正常工作。重写便利初始化器写 `convenience override init(...)`，仍然要横向代理到本类的指定初始化器。

## required、可失败初始化器与 final

`required init` 要求所有子类都提供实现。靠自动继承满足的就不用写 `required`；否则必须显式实现并同样标注（这时不写 `override`）。`UITableViewCell` 的 `init(style:reuseIdentifier:)`、`NSCoding` 的 `init(coder:)` 都是典型例子。

`init?` 构造失败返回 nil，`init!` 是隐式解包版本，不推荐——它把失败推迟到使用的时候崩。枚举的 `init?(rawValue:)` 是标准库内置的。`init?` 能调 `init`，反过来不行：`init` 调 `init?` 而不解包，就没法把失败传播出去。

`final` 禁止重写和继承，还让编译器把调用从函数表派发改成直接派发并内联。还有一条边界：**extension 不能 override 类中已有的方法**，这点跟 Objective-C 的 category 不同（category 的同名方法会替换原实现，依赖加载顺序，本来就该避免）。extension 能加新方法、计算属性、下标、协议遵循，不能加存储属性，也不能覆盖已有成员。

## setter 的访问级别可以低于 getter

```swift
public struct Session {
    public private(set) var token: String      // 外部可读，仅本类型内部可写
    fileprivate(set) var retryCount = 0        // 本文件内可写
}
```

比把属性设成 private 再手写 getter 简洁，只读契约直接写在类型声明里。注意 `private(set)` 的写权限止于声明所在的作用域，不是整个文件；要文件级可写得用 `fileprivate(set)`。

碰到奇怪的编译错误，先问两句：这次赋值走的是存储属性还是观察器？这个 `init` 是指定还是便利，`super.init` 放在第几步？
