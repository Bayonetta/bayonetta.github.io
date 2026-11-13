---
layout: post
title: "SwiftUI 的 propertyWrapper 家族"
description: "按所有权把 State / Binding / StateObject 等包装器理一遍，顺便记几处常见误用。"
date: "2025-06-28"
category: "iOS"
comments: true
tags: ["iOS", "SwiftUI", "属性包装器"]
---

在 `@ObservedObject` 上踩过一次：父视图每刷新一次，`Model()` 就重新构造一次，页面上的计数跟着归零。查下来是把「自己创建的对象」标成了 `@ObservedObject`，而它不持有对象。

SwiftUI 的状态管理全建在 `@propertyWrapper` 上。选错包装器，基本都是同一个原因：没想清楚这份状态归谁所有。

## propertyWrapper 的原理

属性包装器是 `@propertyWrapper` 标注的类型，核心是 `wrappedValue`：编译器把被包装属性改写成存储属性，读写转发到 `wrappedValue`。

```swift
@propertyWrapper
struct Clamped {
    private var value: Int
    let range: ClosedRange<Int>

    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }

    var projectedValue: Int { value }     // 通过 $name 访问

    init(wrappedValue: Int, range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}

struct Settings {
    @Clamped(range: 0...100) var volume: Int = 50
}

var s = Settings()
s.volume = 180
print(s.volume)      // 100
print(s.$volume)     // 100，读的是 projectedValue
```

`init(wrappedValue:)` 让带默认值的写法生效；`projectedValue` 可选，投影成 `$name`，SwiftUI 大量用它传绑定；包装器可带额外参数（如 `range`）。

编译器展开：生成 `_volume` 存 `Clamped`，`volume` 转发到 `_volume.wrappedValue`，`$volume` 转发到 `_volume.projectedValue`。`_` 前缀属性真实存在，`init` 里直接写 `_volume = Clamped(...)` 合法，一些初始化报错要从这里看。

## 常用包装器一览

先把常见的按「拥有者」排一张表，后面再挑几个容易错的展开。

| 包装器 | 拥有者 | 适用数据 | 关键点 |
| --- | --- | --- | --- |
| `@State` | 当前视图 | 值类型、局部状态 | 应标 `private`；SwiftUI 在视图重建时保留存储 |
| `@Binding` | 外部 | 值类型 | 只是对他人状态的读写引用，`$state` 生成 |
| `@StateObject` | 当前视图 | `ObservableObject` 引用类型 | 由 SwiftUI 持有，视图重建不丢 |
| `@ObservedObject` | 外部 | `ObservableObject` 引用类型 | 不持有，仅订阅 |
| `@EnvironmentObject` | 祖先视图 | `ObservableObject` | 沿环境注入，缺失时运行时崩溃 |
| `@Environment` | 系统/祖先 | 值或对象 | 按 key path 读取环境值 |
| `@AppStorage` | UserDefaults | 基础类型 | 跨启动持久化 |
| `@SceneStorage` | 场景 | 基础类型 | 场景恢复，随场景销毁 |
| `@GestureState` | 当前视图 | 值类型 | 手势结束自动复位初值 |
| `@FocusState` | 当前视图 | 焦点标记 | 控制/读取输入焦点 |
| `@Bindable` | 外部（iOS 17+） | `@Observable` 对象 | 生成该对象属性的绑定 |

### State 与 Binding

`@State` 是视图私有的真值来源，`@Binding` 是对它的引用，单向所有、双向读写：

```swift
struct Parent: View {
    @State private var query = ""

    var body: some View {
        Child(query: $query)          // $query 是 Binding<String>
    }
}

struct Child: View {
    @Binding var query: String

    var body: some View {
        TextField("Search", text: $query)
    }
}
```

`@State` 只应声明为 `private`，SwiftUI 不保证跨视图直接传递时状态仍一致；适合值类型与轻量局部状态，引用类型、跨视图共享或需要生命周期管理时改用对象模型。

初始化坑：`init` 里给 `@State` 赋值要写 `_query = State(initialValue: value)`，写成 `query = value` 是给计算属性赋值。

### StateObject 与 ObservedObject 的区别

两者都订阅 `ObservableObject` 的 `objectWillChange`，区别在**所有权**：

```swift
final class Model: ObservableObject {
    @Published var count = 0
}

struct Correct: View {
    @StateObject private var model = Model()      // 本视图创建 → 自己持有
    var body: some View { Text("\(model.count)") }
}

struct Wrong: View {
    @ObservedObject private var model = Model()   // 不持有 → 视图重建时可能被重新创建
    var body: some View { Text("\(model.count)") }
}
```

`Wrong` 里父视图一刷新、视图重新构造，`Model()` 可能再跑一次，计数重置。**谁创建对象谁用 `@StateObject`，外部传入已有对象用 `@ObservedObject`**。`@EnvironmentObject` 由祖先用 `.environmentObject(...)` 注入，缺了会运行时崩溃。

### Environment 与系统值

`@Environment` 按 key path 读环境值，包括系统提供的（`\.dismiss`、`\.colorScheme`、`\.managedObjectContext`）和自定义 `EnvironmentKey`：

```swift
struct SheetContent: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Button("Close") { dismiss() }
            .foregroundStyle(scheme == .dark ? .white : .black)
    }
}
```

`@AppStorage` 与 `@SceneStorage` 都只能存基础类型（或 `RawRepresentable`）；前者写进 UserDefaults 跨启动保留，后者用于场景状态恢复、随场景销毁。UserDefaults 不适合存大块数据。

`@GestureState` 手势结束自动回初值，适合临时位移，要保留的效果写进 `@State`，两者常成对出现。`@FocusState` 管理键盘焦点，可配合 `.focused($field, equals: .username)` 与枚举精确控制。

## Observation 框架改变了什么

WWDC23 的 `@Observable` 宏用编译期生成的代码替代 `ObservableObject` + `@Published`，按属性粒度追踪依赖：只有被读取的属性变化才触发对应视图更新，而不是 `objectWillChange` 一发全刷。

```swift
@Observable final class Profile {
    var name = ""          // 无需 @Published
}

struct Detail: View {
    @Bindable var profile: Profile      // iOS 17+，生成 $profile.name 绑定

    var body: some View {
        TextField("Name", text: $profile.name)
    }
}
```

新模型下 `@State` 可用于 `@Observable` 对象并承担所有权，传入的引用直接用普通属性，`@Bindable` 只在需要 `$` 绑定时加上。迁移期两套模型并存，评审时先确认项目用哪套，别把 `@Published` 和 `@Observable` 混在同一个类里。

## 决策顺序与常见坑

判断顺序：

1. 数据只属于本视图的局部值？是 → `@State`；
2. 要传给子视图读写？对方用 `@Binding`，本方传 `$value`；
3. 引用类型且需跨视图存活？创建方用 `@StateObject`（旧）或 `@State` + `@Observable`（新），接收方用 `@ObservedObject` / 普通属性；
4. 全局注入或系统环境？`@EnvironmentObject` / `@Environment`；
5. 跨启动或跨场景恢复？`@AppStorage` / `@SceneStorage`。

三个高频坑：`init` 里用 `query = ...` 初始化 `@State`；新建对象标成 `@ObservedObject` 导致重建丢状态；在 `View` 之外访问 `@State`。包装器依赖 SwiftUI 运行时存储，脱离视图环境读写没有意义。
