---
layout: post
title: "GCD、lock、RunLoopとスレッドセーフな配列"
description: "DispatchTimeからlockとRunLoopまで確認し、壊れたスレッドセーフ配列を一行ずつ分解する。"
date: "2025-04-19"
category: "iOS"
comments: true
tags: ["iOS", "並行性", "GCD"]
---

以前、自分で書いた「スレッドセーフな配列」が本番でクラッシュした。複数スレッドから`append`した後に`EXC_BAD_ACCESS`が出た。調べると、queueの選択、barrier flagの綴り、空配列への`removeLast()`など、間違いが一つではなかった。この記事はその振り返りで、時刻、lock、スケジューリング、RunLoopから配列へ戻ってくる。

## 二つの時刻

`DispatchTime`は単調増加する時計を基準にし、経過時間、timeout、retry backoff、アニメーション、遅延処理に向いている。端末のsleep中には進まず、システム時刻の修正にも影響されない。

`DispatchWallTime`は暦の時刻に従う。sleep中も進み、システム時刻の変更で飛ぶことがあるため、アラーム、カレンダー、絶対時刻の予約に向く。GCDには`asyncAfter(deadline:)`と`asyncAfter(wallDeadline:)`のような対になるAPIがある。

`Timer`はRunLoopに依存するが、`DispatchSourceTimer`は依存しない。default modeだけに登録したTimerは、scroll viewがmain RunLoopをtracking modeへ切り替えたとき一時停止することがある。

## lockと`os_unfair_lock`

spin lockはbusy waitを行うため、優先度逆転を起こす。高優先度のスレッドが回り続け、低優先度の所有者がlockを解放する時間を得られないからだ。これがAppleが`OSSpinLock`をdeprecatedにした理由である。`os_unfair_lock`は待機者をkernelでblockする。「unfair」はFIFOを保証しないという意味で、安全でないという意味ではない。

critical sectionは短くし、I/Oやblockする可能性のある処理、lockの入れ子、外部callbackを避ける。`defer`を使えばreturnやthrowがあってもunlockできる。

`@synchronized`はObjective-Cの構文で、`objc_sync_enter`と`objc_sync_exit`へ展開される。同じthreadではreentrantだが、runtimeのhash table処理などのコストがある。Swiftでは通常、`NSLock`、`NSRecursiveLock`、`os_unfair_lock`、またはactorを使う。

## schedulerの選び方

軽い非同期処理、serial isolation、timerには`DispatchQueue`。依存関係、cancel、pause、同時実行数の制限が必要なら`OperationQueue`。自分でRunLoopを管理する常駐スレッドが本当に必要な場合だけ`Thread`を使う。

## RunLoop modeとmain thread

RunLoopは一度に一つのmodeだけを処理する。別modeに登録したsource、timer、observerは切り替え中に処理されない。main threadのRunLoopは`UIApplicationMain`が起動・維持するが、子スレッドのRunLoopは自動では起動しない。

autorelease poolもRunLoopの周回に合わせて作成・解放される。子スレッドの長いloopでは、自分で`autoreleasepool`の境界を作る。

## 配列の何が間違っていたのか

元の実装はglobal concurrent queueを使い、`.barriers`と綴り、`removeLast`の書き込みにbarrierを付けず、空配列で`removeLast()`を呼んでいた。barrierが効くのは、`.concurrent`属性を付けて自分で作ったqueue上だけで、global queueでは意味を持たない。

修正版の形は次の通りだ。

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

読み取りは通常のsyncで並行実行でき、書き込みはbarrierで排他的に行う。変更しながら値を返す操作には同期barrierが必要だ。subscriptや削除には範囲チェックも必要になる。

`append`の償却、`removeLast`、`count`、`last`の計算量はO(1)のままだが、queueのコストが加わる。読み取りが多い場合に向き、main threadで何千回も同期読み取りをするとUIを止めるため、一度snapshotを取ってqueueの外で走査する。

新しいコードではactorのほうが明確なことが多い。compilerが隔離を保証し、`await`でthreadを占有せずsuspendできる。手作りの`DispatchSemaphore`や`DispatchGroup`による待機は、構造化並行性へ置き換えるのがよい。
