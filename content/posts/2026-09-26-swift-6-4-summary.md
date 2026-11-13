---
layout: post
title: "Swift 6.4 发布后的新增总结：从语言细节到日常工程"
description: "Swift 6.4 发布后，整理几个真正会影响 iOS 与跨平台 Swift 开发的变化。"
date: "2026-09-26"
category: "iOS"
comments: true
tags: ["Swift", "iOS", "WWDC"]
---

WWDC26 之后，我原本以为 Swift 6 的变化已经差不多定型。等 Swift 6.4 在 2026 年 9 月 15 日正式发布后，才发现这一代 Swift 的重点并不只是增加几个语法糖，而是把编译、并发、测试和跨平台工具链一起往前推了一步。本文的时间点放在 Swift 6.4 发布之后，避免把 WWDC26 的预告和正式版本混在一起。

官方发布说明可以参考 [Swift 6.4 Released](https://www.swift.org/blog/swift-6.4-released/)，Apple 的 [WWDC26 Swift 指南](https://developer.apple.com/wwdc26/guides/swift/)也列出了对应的语言与工具链变化。

## 最先能感受到的几个变化

### 1. `some`、`any` 和可用性判断更顺手

Swift 6.4 允许更自然地书写可选的 `some` 和 `any` 类型，例如把原来的 `(some Protocol)?` 写成 `some Protocol?`。Apple 平台判断也可以使用 `anyAppleOS`，跨 iOS、macOS 等系统写条件编译或可用性代码时，不必重复列出每个平台。

这类变化不算惊天动地，却很适合出现在公共 API 和平台适配层里：代码短了一点，括号和重复条件少了一点，阅读时也更接近原本想表达的意思。

### 2. `defer` 可以等待异步清理

Swift 6.4 支持在 `defer` 中调用异步代码。对于文件句柄、临时资源和需要异步刷新的统计信息，这比手动在每个返回路径上补一遍清理逻辑更稳妥。

```swift
func processFile(at url: URL) async throws {
    let handle = try FileHandle(forReadingFrom: url)

    defer {
        await withTaskCancellationShield {
            await flushMetrics(for: url)
            try? handle.close()
        }
    }

    try await processContents(of: handle)
}
```

需要注意的是，清理逻辑本身也会受到任务取消影响。Swift 6.4 提供 `withTaskCancellationShield`，可以把必须完成的收尾工作放在取消保护中。这个 API 不应该到处使用，只适合真正不能半途停止的清理步骤。

### 3. `@diagnose` 让警告策略靠近代码

以前我们通常在 Xcode Build Settings 里控制警告。Swift 6.4 增加了 `@diagnose`，可以在源码中表达某些诊断信息应该被抑制，或者应该升级为错误。它适合处理局部、经过讨论的例外，不适合拿来把整个项目的警告静音。

### 4. `Subprocess` 从试验包走向稳定版本

Swift 6.2 引入的 `Subprocess` 在 Swift 6.4 达到 1.0。需要从 Swift 工具中调用外部程序、读取标准输出，或处理持续输出的场景，现在有了跨平台且基于 Swift Concurrency 的正式方案：

```swift
let result = try await Subprocess.run(
    .name("xcodebuild"),
    arguments: ["-scheme", "Demo", "test"],
    output: .string(limit: 4096)
)
print(result.standardOutput)
```

它更适合命令行工具、构建脚本和自动化服务。iOS 应用本身不能因为有了这个包就随意执行本地命令，平台沙盒和应用分发规则仍然有效。

## 测试和调试也在一起变好

Swift Testing 现在可以更平滑地和 XCTest 混用：可以在 Swift Testing 中使用 `XCTAssert`，也可以在 XCTest 中使用 `#expect`。`swift test`还支持重复运行测试用例，失败信息和附件也更容易用于远程 CI 的诊断。对正在迁移旧测试的项目来说，这比一次性重写全部测试现实得多。

并发调试仍然是 Swift 6 系列的重点。任务命名、LLDB 对异步调用栈的跟踪，以及 Instruments 中对任务的识别，都在减少“代码明明没错，但我不知道它现在跑在哪里”的时间。调试体验的提升，往往比某个新语法更快影响日常效率。

## 工具链的变化比语法更值得关注

Swift 6.4 让 Swift Build 成为 Swift Package Manager 的默认构建系统，目标是让 Linux、macOS 和 Windows 上的包构建方式更一致。`Subprocess` 达到稳定版本，Swift 的 C++ 互操作也继续扩展，`Span` 可以和 C++20 的 `std::span` 直接衔接。对于 iOS 应用开发者来说，这些变化未必马上需要改业务代码，但会影响共享包、命令行工具和 CI 的设计。

官方发布说明还提到，Swift 在 WebAssembly、Embedded Swift 和 Swift/Java 互操作方面继续扩展。我的判断是：这些方向值得关注，但不应该因为“支持了”就立即把成熟的 iOS 代码迁移过去。先用一个边界清晰的小包验证构建、调试和发布链路，成本更可控。

## 我会怎么升级现有项目

我不会因为 Swift 6.4 发布就立刻修改所有代码，而是按下面的顺序推进：

1. 先在 CI 中固定 Xcode、Swift 和 SDK 版本，记录干净构建、增量构建与测试时间。
2. 在独立分支开启 Swift 6.4，先处理编译器真正指出的问题。
3. 优先尝试 Swift Testing 与 XCTest 的渐进式互操作，不先做测试框架大迁移。
4. 只在确实需要异步清理的地方使用 `defer` 和取消保护。
5. 对公共库、命令行工具和 CI 再评估 `Subprocess`、`Span` 与新的跨平台构建能力。
6. 在真实设备和发布配置下重新跑一遍测试，确认语言升级没有把问题推迟到归档阶段。

Swift 6.4 给我的感觉是“把基础设施磨得更顺”。它没有要求开发者重新学习一套语言，而是让并发、测试、构建和跨平台这几条已经存在的路线更完整。对 iOS 项目来说，最好的升级方式仍然是小步、可回滚、每一步都有构建和测试结果。

### 参考资料

- [Swift 6.4 Released](https://www.swift.org/blog/swift-6.4-released/)
- [What’s new in Swift — Apple Developer](https://developer.apple.com/wwdc26/guides/swift/)
- [Swift updates — Apple Developer Documentation](https://developer.apple.com/documentation/updates/swift)
- [Xcode 27 Release Notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-27-release-notes)
