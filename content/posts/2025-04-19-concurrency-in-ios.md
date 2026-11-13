---
layout: post
title: "GCD、锁、RunLoop 与线程安全数组"
description: "从 DispatchTime 讲到锁和 RunLoop，再逐条拆一段写错的线程安全数组。"
date: "2025-04-19"
category: "iOS"
comments: true
tags: ["iOS","并发","GCD"]
---

线上崩过一次，崩溃栈指向一个自己写的「线程安全数组」——多线程 `append` 之后 `EXC_BAD_ACCESS`。事后把那段代码逐行拆开，发现错的地方不止一处：队列选错了，barrier 拼错了，空数组还直接 `removeLast()`。

这篇从那次复盘写起，前面几节是把相关的基础重新捋了一遍：时基、锁、调度方案、RunLoop，最后回到那段代码。

## 先分清两种时基

`DispatchTime` 和 `DispatchWallTime` 都是 GCD 的 deadline 类型，区别在基准。

`DispatchTime` 是相对时钟，接 `mach_absolute_time` 一类的单调时基，只增不减，设备休眠时不往前走，改系统时间、NTP 校时都不影响它。它适合表达「从现在起经过多久」。

`DispatchWallTime` 是墙上时钟，接日历时间与 `gettimeofday` 一类的时基，休眠照样计时，改时间或校时会跳变。它适合表达「到哪个绝对时刻」。

所以超时控制、重试退避、动画节拍、延迟执行都用 `DispatchTime`；闹钟、日历提醒、预约到某个具体时间点触发用 `DispatchWallTime`。GCD 给了成对入口：`asyncAfter(deadline:)` / `asyncAfter(wallDeadline:)`，`DispatchSourceTimer` 的 `schedule(deadline:)` / `schedule(wallDeadline:)`，`DispatchSemaphore` 与 `DispatchGroup` 的 `wait(timeout:)` / `wait(wallTimeout:)`。

用错时基的症状很好认：睡一觉醒来定时任务没按时触发，或者改了系统时间之后定时器开始乱跑。

```swift
let queue = DispatchQueue(label: "timer.demo")

// 相对时钟：从现在起 2 秒，系统休眠不计时
queue.asyncAfter(deadline: .now() + .seconds(2)) {
    print("相对时钟：2 秒后")
}

// 墙上时钟：按绝对时间推进，受系统时间调整影响
queue.asyncAfter(wallDeadline: .now() + .seconds(2)) {
    print("墙上时钟：2 秒后")
}

// 重复定时用 DispatchSourceTimer，不依赖 RunLoop
let timer = DispatchSource.makeTimerSource(queue: queue)
timer.schedule(deadline: .now(), repeating: .seconds(1))
timer.setEventHandler { print("tick") }
timer.activate()
```

`Timer` 跑在主线程 RunLoop 上，`DispatchSourceTimer` 不依赖 RunLoop，所以滚动导致的 mode 切换只影响前者。

## 锁：从自旋到 os_unfair_lock

自旋锁是忙等：线程不挂起，反复用原子操作测锁状态，持锁期间占满一个 CPU 核心。临界区极短时它比「睡眠再唤醒」快，问题出在优先级反转——高优先级线程自旋等一个低优先级线程持有的锁，低优先级线程拿不到时间片去释放，高优先级线程就一直空转。

这就是 `OSSpinLock` 在 iOS 10 与 macOS 10.12 被 Apple 弃用的原因。替代者 `os_unfair_lock` 把等待者交给内核阻塞，而不是让它自旋，所以不再有忙等导致的优先级反转。名字里的 unfair 指的是不保证先来先服务，别误读成不安全。

临界区的准则就四条：短，只放真正需要互斥的那几行；不做系统调用、I/O、锁内再等另一把锁这类可能阻塞的操作；不嵌套其它锁，避免死锁；尽量让竞争发生在相近优先级的线程之间。锁内也别调可能回调外部代码的接口。

```swift
import os

final class Counter {
    private var lock = os_unfair_lock()
    private var value = 0

    func increment() {
        os_unfair_lock_lock(&lock)
        defer { os_unfair_lock_unlock(&lock) }
        value += 1
    }
}
```

这里的 `defer` 保证不管中间是 `return` 还是 `throw`，解锁一定执行。

## @synchronized 到底是什么

`@synchronized` 是 Objective-C 的语言结构，不是 Swift 语法。编译器把 `@synchronized(obj) { ... }` 展开成一对 `objc_sync_enter` / `objc_sync_exit`，并用 `@try` / `@finally` 保证抛异常时也解锁。

运行时为每个被当作锁的对象地址维护一条 `SyncData` 记录，里面有互斥量、持有线程和递归计数，按地址哈希到全局表，所以同一线程重复进入是可重入的。代价是哈希查表、全局表竞争、递归计数维护，比 `os_unfair_lock` 慢一个量级。而且任意对象都能当锁，很容易埋下「锁的不是同一个对象」的隐患。

```objc
// @synchronized：编译器展开，同一线程递归可重入
- (void)append:(id)item {
    @synchronized(self) {
        [_storage addObject:item];
    }
}
```

Swift 侧通常用 `NSLock`、`NSRecursiveLock`、`os_unfair_lock`，或者直接调 `objc_sync_enter` / `objc_sync_exit`。

## 三种调度方案

| 维度 | GCD（`DispatchQueue`） | `OperationQueue` | `Thread` |
| --- | --- | --- | --- |
| 任务封装 | 闭包 / `DispatchWorkItem` | `Operation` 子类或 `BlockOperation` | `Thread` 子类或闭包入口 |
| 依赖关系 | 无原生依赖，靠 `DispatchGroup` 手搭 | `addDependency(_:)` 原生支持 | 无 |
| 取消 | `DispatchWorkItem.cancel()` 仅做标记，执行中的任务停不下来 | `cancel()`，需配合检查 `isCancelled` | 无原生取消，需自定义标志 |
| 优先级 | `qos` 与 `DispatchQoS` | `qualityOfService`、`queuePriority` | `threadPriority`，已弱化 |
| 最大并发数 | 无直接设置项，需自己用信号量限流 | `maxConcurrentOperationCount` | 自行管理 |
| 状态观察 | 无 | `isReady` / `isExecuting` / `isFinished` / `isCancelled`，KVO 可见 | 需自己维护 |
| 适用场景 | 轻量异步、一次性任务、串行隔离、定时器 | 有依赖、要取消、需要暂停恢复的批处理 | 需要长期常驻、自己管 RunLoop 的线程 |

判断标准很直接。没有依赖、没有取消需求，就别上 `OperationQueue`，一个 `DispatchQueue` 更轻。一旦出现「B 必须等 A 完成」「用户退出页面要把整批任务停掉」「同时最多跑 3 个」，`OperationQueue` 省下的手写同步代码远多于它带来的开销。`Thread` 只在确实需要常驻线程时用。

## RunLoop 的 mode 与主线程保活

一个 RunLoop 同一时刻只跑一个 mode，切换之后只处理注册在该 mode 下的 source、timer 和 observer。

`source0` 是非基于端口的事件，需要手动 `CFRunLoopSourceSignal` 再 `CFRunLoopWakeUp`；`source1` 基于 mach port，由内核事件唤醒；timer 由 `CFRunLoopTimer` 支撑；observer 是 `CFRunLoopObserver`，可以在 `kCFRunLoopBeforeWaiting` 这类时机挂钩子。

主线程的 RunLoop 由 `UIApplicationMain` 自动启动并保活，App 无事件时休眠、有事件时唤醒。子线程的 RunLoop 默认不启动，想做常驻线程得自己加 port 或 source。

两个高频坑都跟 mode 有关。

一是 `Timer` 默认只注册在 default mode。滚动 `UIScrollView` 时主 RunLoop 切到 tracking mode，default mode 下的定时器就不再被处理，表现是一滚动倒计时就停。修法两条：加到 common modes，也就是 `RunLoop.main.add(timer, forMode: .common)`；或者换成不依赖 RunLoop 的 `DispatchSourceTimer`。注意 common modes 是一组 mode 的集合，不是单一 mode。

二是自动释放池。它靠 observer 在每次循环入口创建、`BeforeWaiting` 前释放并重建、`Exit` 时释放，`autorelease` 对象通常在一次循环结束时被 drain。子线程上的长循环必须自己用 `autoreleasepool` 分段包住。

## 那段数组错在哪

下面这段想用 barrier 做读写分离，读多写少，思路是对的，实现把常见的错基本凑齐了。

```swift
final class BrokenArray<Element> {
    private var storage: [Element] = []
    // 缺陷 A：用了全局并发队列
    private let queue = DispatchQueue.global(qos: .utility)

    func append(_ value: Element) {
        // 缺陷 B：flags 拼写错误
        queue.async(flags: .barriers) {
            self.storage.append(value)
        }
    }

    @discardableResult
    func removeLast() -> Element? {
        var removed: Element?
        // 缺陷 C：写操作没加 barrier，并发队列下会与读操作产生数据竞争
        // 缺陷 D：这个 return 只从闭包返回，没利用 sync 的返回值
        queue.sync {
            // 缺陷 E：空数组调用直接崩溃
            removed = self.storage.removeLast()
            return removed
        }
        return removed
    }

    var count: Int {
        var n = 0
        queue.sync {
            // 缺陷 F：没有用 sync 的表达式返回值
            n = self.storage.count
        }
        return n
    }
}
```

把这几个问题拆开看：

1. **编译期直接报错**：`queue.async(flags: .barriers)` 里的 `.barriers` 拼错了，正确的是 `.barrier`。
2. **barrier 用错了队列**：就算拼写改对，`DispatchQueue.global()` 是全局并发队列，Apple 文档明确说明 barrier 标志对全局队列不起作用。必须自己建 `DispatchQueue(label: ..., attributes: .concurrent)`，否则 `append` 退化成普通的并发写，多线程同时写数组，轻则丢数据，重则 `EXC_BAD_ACCESS`。
3. **`removeLast` 既是写操作，又忘了防空**：这是最容易忽略的坑。第一，`removeLast()` 会修改数组，是写操作，但在并发队列里它居然用普通的 `queue.sync` 调用，没加 `.barrier`！结果就是它会和别的读任务同时跑，照样产生数据竞争。要同步拿到删除的返回值，必须调 `queue.sync(flags: .barrier)`。第二，标准库的 `removeLast()` 在空数组上会直接 `fatal error`，线程安全容器不该把这种防御留给调用方，应该用 `guard` 判空或者调 `popLast()`。
4. **闭包里的 `return` 不是外层函数的 `return`**：`queue.sync` 支持泛型返回值 `rethrows -> T`。这里靠外层的 `var removed` 和 `var n` 把值倒出来不仅啰嗦，一旦不小心改成了 `async`，函数就会在赋值前返回未定义的值。直接把 `queue.sync` 表达式当返回值最稳妥。

改完后的代码：

```swift
final class ThreadSafeArray<Element> {
    private var storage: [Element] = []
    private let queue = DispatchQueue(
        label: "com.zhaoshuai.threadSafeArray",
        attributes: .concurrent
    )

    var count: Int {
        return queue.sync { self.storage.count }
    }

    var isEmpty: Bool {
        return queue.sync { self.storage.isEmpty }
    }

    func append(_ value: Element) {
        queue.async(flags: .barrier) {
            self.storage.append(value)
        }
    }

    func append(contentsOf values: [Element]) {
        queue.async(flags: .barrier) {
            self.storage.append(contentsOf: values)
        }
    }

    @discardableResult
    func removeLast() -> Element? {
        return queue.sync(flags: .barrier) { () -> Element? in
            guard !self.storage.isEmpty else { return nil }
            return self.storage.removeLast()
        }
    }

    func last() -> Element? {
        return queue.sync { self.storage.last }
    }

    subscript(index: Int) -> Element? {
        return queue.sync { () -> Element? in
            guard self.storage.indices.contains(index) else { return nil }
            return self.storage[index]
        }
    }
}
```

改动很明确：自建并发队列让 barrier 生效、写操作（包括 `append` 和同步修改的 `removeLast`）统一走 barrier、读操作统一走 `queue.sync` 表达式返回、所有下标和删除操作补上边界检查。`removeLast` 里写 `queue.sync(flags: .barrier)` 能保证在独占排他的同时同步拿到被删除的元素。

## 为什么是并发队列加 barrier

读用 `sync` 并发执行，互不阻塞；写用 `async(flags: .barrier)` 要求队列在它执行期间独占。barrier 任务会等此前提交的读全部完成，执行期间不允许其它任务并行，完成后后续读才继续——这就是标准的多读单写。

写用 `async` 不阻塞调用线程，读用 `sync` 立即拿返回值。如果写也改成 `sync`，从同一队列内部再提交就会死锁。

复杂度上，容器没改变底层操作的量级：`append` 摊还 `O(1)`，`removeLast`、`count`、`last` 和下标都是 `O(1)`，多出来的只有一次队列调度。真正的瓶颈是 barrier 把写期间的并发度压到 1，所以读多写少时收益最大，写密集时吞吐受限于单写。

还有个实际坑：每次 `sync` 读都会阻塞当前调用线程，主线程上循环做几千次同步读会明显卡。正确做法是一次 `sync` 取快照，再拿到线程外遍历。

替代方案看场景：读写都要互斥就套 `NSLock`；想保留多读用 `pthread_rwlock_t`；新代码更推荐 `actor`，编译器保证隔离，等待用 `await` 挂起而不是占住线程。

## 老模式与 actor 的对应

| 传统模式 | Swift Concurrency 对应 | 关键差异 |
| --- | --- | --- |
| Serial Thread Confinement（状态只在一处串行访问） | `actor` | 编译器强制隔离，`await` 挂起而非阻塞线程，`Sendable` 检查跨边界数据 |
| Master-Worker（分发后聚合） | `TaskGroup` / `async let` | 结构化生命周期，取消自动向子任务传播 |
| Pipeline（阶段串联） | `AsyncStream` 配合多个 `Task` | 阶段间用异步序列传递，缓冲策略可控 |
| Promise/Future（回调结果可组合） | `Task` / `async let` / `withCheckedThrowingContinuation` | 值与取消语义内建，旧回调 API 可桥接 |

```swift
actor ArrayStore<Element> {
    private var storage: [Element] = []

    func append(_ value: Element) { storage.append(value) }

    @discardableResult
    func removeLast() -> Element? {
        guard !storage.isEmpty else { return nil }
        return storage.removeLast()
    }

    var count: Int { storage.count }
}

let store = ArrayStore<Int>()
Task {
    await store.append(1)
    let n = await store.count
    print(n)
}
```

新代码别再手搓 `DispatchSemaphore` 做等待。`semaphore.wait()` 会占住一个 GCD 工作线程不放，而 GCD 的线程池有上限，等待链一长就容易线程饥饿甚至线程爆炸。`DispatchGroup` 和手写同步原语在新项目里都该让位给结构化并发。

具体 API 签名与可用版本，以本机 SDK 和官方文档为准。
