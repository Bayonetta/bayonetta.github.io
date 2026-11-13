---
layout: post
title: "为什么 Swift 是类型安全的：从值语义到内存所有权"
description: "把类型安全拆成可核对的规则，再讲到值语义与 some/any 的成本。"
date: "2024-05-25"
category: "iOS"
comments: true
tags: ["iOS","Swift","类型系统"]
---

从 Objective-C 迁过来的项目，最先崩的往往不是新写的 Swift 代码，而是那些一路 `id` 传下来的老接口。编译期一路绿灯，等到线上某个字典少了一个键，才在 `valueForKey:` 上炸出 `NSUnknownKeyException`。Swift 做的事，说白了就是把这些失败点尽量往编译期挪。

## 具体挪了哪些

- 静态类型检查：类型在编译期确定，不符直接编译失败。
- 无隐式数值转换：`Int` 与 `Double` 不能直接相加，得写 `Double(i)`。
- Optional 显式化：`nil` 只能在 Optional 里，`Int?` 与 `Int` 是不同类型，取值走 `if let`、`guard let` 或 `??`，强制解包 `!` 需要评审。
- 数组越界检查：`array[10]` 触发 trap，不会读到相邻内存的脏数据。
- 使用前必须初始化：definite initialization 保证每条路径都先赋值，编译器拒绝可能未初始化的代码。
- 内存排他性访问：修改访问期间不允许另一处同时访问，`array.sort { array[$0] < array[$1] }` 这类重叠访问会在运行时报冲突。

对照 Objective-C 更清楚。`id` 本质是 `objc_object *`，不做静态类型检查，消息经 `objc_msgSend` 运行时派发；向 `nil` 发消息静默返回 0 或 `nil`；KVC 的 `valueForKey:` 用字符串键，拼错要到运行时才抛异常。

## 值类型、引用类型与写时复制

`struct`、`enum` 是值语义，赋值拷贝值；`class` 是引用语义，拷贝的是指向同一个堆对象的指针。

「值类型总在栈上」是过度简化。它通常内联在栈、寄存器或外层值里，但一旦成为 `class` 的存储属性、被逃逸闭包捕获、或者装进存在容器，就跟着宿主一起上堆。`class` 实例则总在堆上，由 ARC 维护引用计数。

标准库容器把两者组合成写时复制：`Array`、`Dictionary`、`String` 的值持有一个堆上缓冲区的引用，读取时共享，写入前检查引用是否唯一，不唯一才拷贝。`isKnownUniquelyReferenced` 就是暴露给自定义 COW 的判定函数，要求传入 `inout` 的类实例；对 Objective-C 类实例和某些运行时对象它会返回 `false`，自己实现容器时容易在这里踩坑。

```swift
final class Storage {
    var items: [Int]
    init(_ items: [Int]) { self.items = items }
}

struct IntStack {
    private var storage = Storage([])
    private mutating func ensureUnique() {
        if !isKnownUniquelyReferenced(&storage) {
            storage = Storage(storage.items)
        }
    }
    mutating func push(_ x: Int) {
        ensureUnique()
        storage.items.append(x)
    }
    var count: Int { storage.items.count }
}

var a = IntStack()
a.push(1)
var b = a          // 共享同一 Storage
b.push(2)          // 写入前拷贝，a 与 b 分离
```

`mutating` 把「这个方法会改自身」写进了签名，编译器据此生成 `inout self` 并施加排他性检查，值语义才立得住。

## enum 当和类型用

带关联值的 `enum` 就是和类型。Apple 文档里的 Barcode 例子够说明问题：

```swift
enum Barcode {
    case upc(Int, Int, Int, Int)
    case qrCode(String)
}

var productBarcode = Barcode.upc(8, 85909, 51226, 3)
productBarcode = .qrCode("ABCDEFGHIJKLMNOP")

switch productBarcode {
case let .upc(numberSystem, manufacturer, product, check):
    print("UPC: \(numberSystem), \(manufacturer), \(product), \(check)")
case let .qrCode(productCode):
    print("QR code: \(productCode)")
}
```

`switch` 必须穷尽所有 case，新增 case 时编译器会逐个指出没处理的地方。`case let` 把关联值绑到局部变量，取值和类型一起被检查。

`CaseIterable` 要求所有 case 不带关联值，编译器会合成 `static var allCases` 供遍历。raw value 的自动分配规则也值得记牢：`Int` 类型下未显式指定的 case 取前一个的值加 1；`String` 类型下未指定就取 case 名本身。

递归枚举必须写 `indirect`。值类型的存储布局要在编译期定死，关联值又是自身类型时大小算不出来。`indirect` 在 case 或整个 enum 上插一层堆上的间接盒，把递归变成固定大小的指针。

```swift
indirect enum ArithmeticExpression {
    case number(Int)
    case addition(ArithmeticExpression, ArithmeticExpression)
    case multiplication(ArithmeticExpression, ArithmeticExpression)
}
```

代价是每个递归节点多一次堆分配和引用计数操作，换来的是能用值语义表达树形结构。

## weak 与 unowned

`weak` 必须声明成 `var` 且是 Optional。对象释放后，运行时通过 weak side table 把引用置成 `nil`，访问是安全的，代价是每次都要解包。

`unowned` 非 Optional、不做置空，访问已释放对象会触发运行时 trap。`unowned(unsafe)` 连检查都去掉，等价于悬垂指针，风险最高。`unowned` 省掉一次 side table 查表，只应在被引用对象的生命周期确定严格长于引用方时用，比如父子对象之间。闭包捕获列表里的 `[weak self]` 和 `[unowned self]` 是同一组语义。

## some、any 与泛型

- `some P`（不透明类型）：被调用方选定一个具体类型，对调用方隐藏，同一函数的所有返回路径必须是同一个具体类型。无装箱、静态派发、保留关联类型信息，可参与特化。
- `any P`（存在类型，Swift 5.7 起要求显式写 `any`）：类型擦除，用存在容器承载，里面有值缓冲、witness table，必要时还有 vtable；调用走动态派发。值类型超过内联缓冲（约三个字长）就要堆分配，产生装箱成本，关联类型信息也被擦掉。
- 泛型 `func f<T: P>(_ x: T)`：调用方选定具体类型，编译期可特化，静态派发，无装箱。

选择其实不难：想隐藏实现又要保持同一个具体类型、还要留住关联类型，用 `some`；要异构集合或运行时多态，用 `any`；要调用方决定类型又要性能，用泛型。把 `any` 误用在热路径上，代价是每次调用一次间接跳转，加上大值类型的堆分配与 ARC 开销。

## 两张表

| 维度 | 值类型 `struct` / `enum` | 引用类型 `class` |
| --- | --- | --- |
| 赋值 | 拷贝值（COW 容器写入前才拷缓冲区） | 拷贝指针，共享同一实例 |
| 存储位置 | 通常内联，可随宿主上堆 | 堆上对象 |
| 生命周期 | 由作用域与值语义决定 | ARC 引用计数 |
| 可变性 | 需 `mutating`，受排他性检查 | 方法可直接改属性 |
| 相等判定 | 值相等（`Equatable`） | 默认 `===` 身份相等 |
| 继承 | 不支持 | 支持继承与 `deinit` |

| 方案 | 类型由谁定 | 派发方式 | 额外开销 |
| --- | --- | --- | --- |
| 泛型 `<T: P>` | 调用方 | 静态，可特化 | 代码体积可能膨胀 |
| `some P` | 被调用方 | 静态 | 无装箱 |
| `any P` | 运行时 | 动态，经 witness table | 存在容器、装箱、间接跳转 |

日常写业务我一般先用泛型或 `some`，确实需要异构集合才上 `any`。
