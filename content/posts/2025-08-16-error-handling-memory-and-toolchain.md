---
layout: post
title: "错误处理、内存管理与依赖管理"
description: "记 throws / defer、weak 与 unowned 的取舍，还有三种依赖管理工具的差别。"
date: "2025-08-16"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "工程化"]
---

整理工程笔记时发现，出问题的代码大多不是逻辑写错，而是几个边界没守住：错误被 `try?` 吞掉、`defer` 写在了 `guard` 后面、闭包把 `self` 强引用住。这几件事各自都不难，混在一起就很容易漏。

下面按错误处理、内存管理、依赖管理三块记。

## 错误处理的完整链条

Swift 用 `Error` 标记错误类型，函数、方法、初始化器可标 `throws`；调用方必须显式处理：`do-catch`、`try?`、`try!` 或向上抛。

```swift
enum ParseError: LocalizedError {
    case malformed(line: Int)
    var errorDescription: String? {
        switch self {
        case .malformed(let line): return "第 \(line) 行格式错误"
        }
    }
}

func parse(_ text: String) throws -> [Record] {
    guard !text.isEmpty else { throw ParseError.malformed(line: 0) }
    // ...
    return []
}
```

几个容易混淆的点：

- `try?` 把结果包成 Optional，失败得 `nil`，但**错误原因同时丢失**；需要日志或分支处理时用 `do-catch` 或 `Result`。
- `try!` 只在失败即编程错误的场合使用（如解析随 App 打包的、必然合法的资源）。
- `rethrows` 表示函数自身不抛错，仅当传入的闭包抛错时才抛；`map`、`filter` 的标准库签名都用了它。
- 初始化器抛错时返回 `nil` 语义由 `init?` 表达，两者不要混用：`throws` 能携带原因，`init?` 只表达无法构造。
- `Result<Success, Failure: Error>` 适合把错误当成值存储、跨异步边界传递，配合 `Result { try ... }` 构造器与 `get()` 使用。

`Error` 只要求能抛出，`localizedDescription` 在纯 Swift 错误上给通用字符串；实现 `LocalizedError` 的 `errorDescription` 才有面向用户的文案。跨 Objective-C 边界用 `NSError` 的 domain / code。

## defer：作用域退出前执行

`defer` 注册的代码块在**当前作用域退出时**执行，早于函数返回值的传递，无论退出路径是正常 `return`、`throw`、`break` 还是提前 `guard`：

```swift
func handle(_ path: String) throws {
    let handle = open(path)
    defer { close(handle) }          // 所有退出路径都会执行

    lock.lock()
    defer { lock.unlock() }

    guard isValid(handle) else { throw ParseError.malformed(line: 0) }
    try process(handle)
}
```

三条规则：

1. 多个 `defer` 按**后进先出**执行（栈序），因此上例先解锁、再关闭句柄；
2. `defer` 可写在函数任意位置，但只有执行流真正经过它时才被注册，写在 `guard` 之后的 `defer` 在提前返回时不会生效；
3. 不要在 `defer` 里 `return`、`throw` 或改变控制流。

`defer` 让资源获取和释放写在相邻两行，不用像 `finally` 那样把清理堆到函数尾。常见用法：成对加锁解锁、关闭文件/数据库连接、`UIGraphicsBeginImageContext` 与 `EndImageContext` 配对、`begin/endUpdates` 配对。

## weak 与 unowned 的取舍

两者都不增加引用计数，区别在于对象释放后的行为：

| | `weak` | `unowned` |
| --- | --- | --- |
| 类型 | 必须 Optional、只能用于 var | 可非 Optional |
| 对象释放后 | 自动置 nil | 仍指向已释放内存，访问即崩溃 |
| 运行时开销 | 需要弱引用表维护 | 略低 |
| 适用 | 生命周期可能更长的引用 | 生命周期确定不长于对方的引用 |

默认选 `weak`。`unowned` 只应在被引用的对象一定先于引用方存活、有明确不变量时使用（例如视图与其持有的、闭包捕获的配对对象），否则那点性能收益换来的是野指针崩溃。`unowned(unsafe)` 更危险，把内存安全完全交还给开发者，普通业务代码不应出现。

## 循环引用的四个高频场景

```swift
// 1. 对象持有闭包，闭包捕获 self
class Controller {
    var onFinish: (() -> Void)?
    func setup() {
        onFinish = { [weak self] in self?.reload() }
    }
}

// 2. Timer / NotificationCenter 对 target 的强引用
//    Timer 由 RunLoop 持有，需在 deinit 或 viewDidDisappear 中 invalidate
//    基于 selector 的通知观察者自 iOS 9 起会自动解注册，基于 block 的仍需手动移除

// 3. delegate 未声明 weak
protocol TaskDelegate: AnyObject { func taskDidFinish() }
class Task {
    weak var delegate: TaskDelegate?
}

// 4. 闭包捕获了「持有该闭包的对象」的中间变量
```

修正手段是捕获列表：`[weak self]`、`[unowned self]`，或捕获具体值 `[model]` 缩短引用链。诊断用 Xcode Memory Graph Debugger 看环，或用 Instruments 的 Leaks；`deinit` 里打日志只能确认没释放，不能定位环。

`DispatchQueue.async` 的闭包会临时强引用 `self`，队列里堆积大量任务时对象释放会被推迟；这不是循环引用，但同样造成内存峰值，需要时用 `[weak self]`。

## 依赖管理：三种方案的取舍

| | CocoaPods | Carthage | Swift Package Manager |
| --- | --- | --- | --- |
| 侵入性 | 高：改写工程、生成 `.xcworkspace` | 低：只产出 framework | 低：Xcode 原生集成 |
| 集成方式 | 源码编译进 workspace | 手动拖入 framework | `Package.swift` 或 Xcode 的 Package Dependencies |
| 版本锁定 | `Podfile.lock` | `Cartfile.resolved` | `Package.resolved` |
| 构建产物缓存 | 每次 clean 后重编 | 预编译二进制，编译快 | Xcode 管理缓存 |
| 生态 | 最全、老库覆盖好 | 需作者支持 framework | 官方首选，新库优先支持 |
| 主要代价 | 工程文件冲突、pod 更新易踩坑 | 配置繁琐、需脚本 | 混编与资源 bundle 的历史限制 |

Carthage 的配置步骤最能说明非侵入：执行 `carthage update --platform iOS` 后得到 `Carthage/Build/iOS` 下的 framework，在 Build Settings 里添加 Framework Search Paths，把 framework 拖进 Linked Frameworks and Binaries，再添加一个 Run Script 阶段执行 `/usr/local/bin/carthage copy-frameworks`，并把每个 framework 路径填进 Input Files（用于绕过 App Store 对模拟器切片与 dSYM 的校验问题）。步骤多，但工程结构不被改写。

SPM 通过 `Package.swift` 声明 products / targets / dependencies，Xcode 内可按版本规则（upToNextMajor、exact、branch、commit）解析；二进制 target 用 `binaryTarget` 支持闭源 framework。迁移约束：某些老库只提供 CocoaPods 支持、资源 bundle 取路径方式不同、混编 target 的模块图要重新梳理。新项目默认选 SPM，老项目通常新增依赖走 SPM、存量 Pods 逐步迁移。

## 常用库与它们的定位

按解决的问题归类：

| 库 | 解决什么 | 备注 |
| --- | --- | --- |
| Alamofire | URLSession 之上的网络层封装 | 链式请求、响应序列化、拦截器 |
| SwiftyJSON | JSON 的容错访问 | 笔记里记成 SwiftJSON；`Codable` 普及后新项目多用原生方案 |
| R.swift | 资源标识符强类型化 | 需在 Xcode 增加生成脚本与输入文件路径 |
| MonkeyKing | 社交平台分享/登录 | 统一各平台 SDK 的调用入口 |
| Kingfisher | 图片下载与缓存 | 内存 + 磁盘两级缓存 |
| SnapKit | Auto Layout DSL | 用代码描述约束 |
| Dollar | 函数式工具集合 | Swift 标准库已覆盖大部分能力，新项目常不再需要 |

混编补一句：桥接文件（bridging header）让 Objective-C 头文件在 Swift 可见，反向依赖生成的 `-Swift.h` 且需要显式 `@objc` 暴露成员；`NS_SWIFT_NAME`、`NS_SWIFT_UNAVAILABLE`、`NS_REFINED_FOR_SWIFT` 用来调整导入后的名字与可见性。
