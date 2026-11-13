---
layout: post
title: "GCD, locks, RunLoop, and a thread-safe array"
description: "From DispatchTime to locks and RunLoop, then a line-by-line review of a broken thread-safe array."
date: "2025-04-19"
category: "iOS"
comments: true
tags: ["iOS", "Concurrency", "GCD"]
---

I once saw a production crash in a “thread-safe array” I had written. The stack pointed to `EXC_BAD_ACCESS` after concurrent `append` calls. The queue was wrong, the barrier flag was misspelled, and an empty array was passed to `removeLast()`. This article is the postmortem: clocks, locks, scheduling, RunLoop, and finally the array.

## Two clocks

`DispatchTime` is based on a monotonic clock and is appropriate for elapsed durations, timeouts, retry backoff, animation cadence, and delayed work. It does not advance while the device sleeps and is not affected by wall-clock corrections.

`DispatchWallTime` follows calendar time. It continues during sleep and can jump when the system clock changes, so it is appropriate for alarms, calendar events, and a specific absolute time. GCD exposes matching APIs such as `asyncAfter(deadline:)` and `asyncAfter(wallDeadline:)`.

`Timer` depends on a RunLoop; `DispatchSourceTimer` does not. A timer registered only in the default mode can pause while a scroll view switches the main RunLoop to tracking mode.

## Locks and `os_unfair_lock`

A spin lock busy-waits and can cause priority inversion: a high-priority thread spins while a low-priority owner cannot get CPU time to release the lock. This is why Apple deprecated `OSSpinLock`. `os_unfair_lock` blocks waiters in the kernel instead. “Unfair” means it does not promise FIFO order, not that it is unsafe.

Keep critical sections short, avoid I/O and calls that can block, do not nest locks, and avoid callbacks into unknown code while holding a lock. `defer` ensures a lock is released on every return or throw.

`@synchronized` is an Objective-C construct. The compiler turns it into `objc_sync_enter` and `objc_sync_exit` with exception-safe cleanup. It is reentrant for the same thread but has hash-table and runtime overhead. Swift code usually uses `NSLock`, `NSRecursiveLock`, `os_unfair_lock`, or an actor.

## Choosing a scheduler

Use `DispatchQueue` for lightweight asynchronous work, serial isolation, and timers. Use `OperationQueue` when you need dependencies, cancellation, pausing, or a concurrency limit. Use `Thread` only for a genuinely long-lived thread whose RunLoop you manage yourself.

## RunLoop modes and the main thread

A RunLoop handles one mode at a time. Sources, timers, and observers registered in other modes are ignored during the switch. The main thread's RunLoop is started and kept alive by `UIApplicationMain`; a child thread's RunLoop does not start automatically.

The main RunLoop also creates and drains autorelease pools around iterations. A long-running child-thread loop should add its own `autoreleasepool` boundaries.

## What was wrong with the array

The original implementation used a global concurrent queue, `.barriers` instead of `.barrier`, a non-barrier write in `removeLast`, and `removeLast()` on an empty array. A barrier is effective only on a private concurrent queue created with `.concurrent`; it has no barrier semantics on a global queue.

The corrected shape is:

```swift
final class ThreadSafeArray<Element> {
    private var storage: [Element] = []
    private let queue = DispatchQueue(
        label: "com.zhaoshuai.threadSafeArray",
        attributes: .concurrent
    )

    var count: Int { queue.sync { storage.count } }
    var isEmpty: Bool { queue.sync { storage.isEmpty } }

    func append(_ value: Element) {
        queue.async(flags: .barrier) { self.storage.append(value) }
    }

    @discardableResult
    func removeLast() -> Element? {
        queue.sync(flags: .barrier) {
            guard !storage.isEmpty else { return nil }
            return storage.removeLast()
        }
    }

    func last() -> Element? { queue.sync { storage.last } }
}
```

Reads use ordinary synchronous access and can run together. Writes use a barrier and run exclusively. A synchronous barrier is required for a mutating operation that must return its result. Every indexed access and removal still needs bounds checking.

The container remains O(1) for append amortization, `removeLast`, `count`, and `last`; the synchronization overhead is extra. It works best for read-heavy workloads. Repeated synchronous reads on the main thread can still block the UI, so take one snapshot and iterate outside the queue.

For new code, an `actor` is often clearer. It gives compiler-enforced isolation and suspends at `await` instead of occupying a thread with a semaphore wait. Structured concurrency should usually replace hand-written `DispatchSemaphore` and `DispatchGroup` waiting.
