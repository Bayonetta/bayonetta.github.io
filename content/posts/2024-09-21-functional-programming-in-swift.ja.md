---
layout: post
title: "Swiftの関数型構成要素とスレッドセーフなparallel map"
description: "filter、map、reduceから単語頻度を経て、スレッドセーフでないparallelMapを修正する。"
date: "2024-09-21"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "関数型プログラミング"]
---

何年か前、`parallelMap`を書いた。ローカルでは正常だったが、段階的リリース後に、結果の要素が時々足りなかったり、順序が変わったりした。ネットワーク層を二日調べて、ようやく`concurrentPerform`の複数の反復が同じ配列へ`append`していることに気づいた。この記事はその振り返りから始める。

## 標準ライブラリの構成要素

Swiftの高階関数の多くは、filter、map、reduceの組み合わせとして理解できる。

| 関数 | 構成要素 | シグネチャの要点 | 典型的な用途 |
| --- | --- | --- | --- |
| `filter` | 選択 | `(Element) throws -> Bool` | 条件に合う要素を残す |
| `map` | 写像 | `(Element) throws -> T` | 一対一の変換 |
| `flatMap` | 写像＋平坦化 | `(Element) throws -> Sequence` | 一段分平らにする |
| `compactMap` | 写像＋選択 | `(Element) throws -> T?` | `nil`を捨ててunwrapする |
| `reduce` | fold | `(Result, Element) throws -> Result` | 一つの値へ集約 |
| `reduce(into:)` | in-place fold | `(inout Result, Element)` | 可変コンテナへ集約 |
| `zip` | 組み合わせ | 二つのSequence | 並行走査、key-value生成 |
| `prefix(while:)` / `drop(while:)` | prefix選択 | predicate | 先頭を取る・捨てる |
| `first(where:)` / `allSatisfy` | 短絡選択 | predicate | 早期終了する検索 |
| `mapValues` / `compactMapValues` | value変換 | Dictionaryのvalueだけ | key構造を保つ |
| `joined()` | 平坦化 | SequenceのSequence | 連結 |
| `sorted(by:)` | 並べ替え | 比較クロージャ | 全体のソート |

`reduce`は各段階で新しい累積値を作るため、`acc + [x]`のようなコードは何度も割り当てを行う。`reduce(into:)`は累積器を`inout`で渡し、その場で追加する。

```swift
let grouped = words.reduce(into: [String: Int]()) { counts, word in
    counts[word, default: 0] += 1
}
```

## 単語頻度の集計

単語頻度を集計するなら、テキストを分割し、`reduce(into:)`で数え、頻度の降順でソートし、同数の場合は単語を二次キーにする。Dictionaryの走査順は未保証なので、二次キーを省くと出力やテストが揺れる。

数万語程度なら、命令型の`for`とDictionaryの加算のほうが速く、中間配列も少ないことがある。本当の性能要因は分割方法とソートだ。巨大なファイルでは`components(separatedBy:)`による中間配列を避け、`enumerateSubstrings(in:options:)`やチャンクのストリームを使う。

## `parallelMap`の何が間違っていたのか

次の実装は自然に見えるが危険だ。

```swift
extension Array {
    func parallelMap<T>(_ transform: (Element) -> T) -> [T] {
        let n = count
        if n == 0 { return [] }
        var result = ContiguousArray<T>()
        result.reserveCapacity(n)
        DispatchQueue.concurrentPerform(iterations: n) { i in
            result.append(transform(self[i]))
        }
        return Array(result)
    }
}
```

問題は三つある。第一に、`ContiguousArray`を複数スレッドから変更しているのでdata raceであり未定義動作だ。`reserveCapacity`は拡張の回数を減らすだけで、並行書き込みを安全にはしない。第二に、appendの順番はスケジューリング次第なので、入力順を保つ`map`の意味に反する。第三に、変換処理と共有状態への書き込みが混ざり、原因調査を難しくする。

## 三つの修正方法

**A. あらかじめ領域を確保し、各反復に専用のindexを与える。** `Array(unsafeUninitializedCapacity:)`を使い、各反復が一つのslotだけを初期化する。lockなしで順序を保てるが、全要素を正確に初期化しなければならない。Swift 6ではclosure、要素、結果の`Sendable`制約にも注意する。

**B. lockかserial queueでappendを保護する。** 正しくはなるが、書き込みが直列化され、順序も決定的にはならない。変換処理が非常に重く、結果への書き込みがごく小さい場合だけ意味がある。

**C. chunkに分割する。** `0..<n`をCPUコア数に近い連続区間へ分け、各タスクが自分の配列へ書き、最後にchunkを順番に連結する。

## 並行化が得になる条件

`concurrentPerform`にもスケジューリングコストがある。変換が純粋で、I/Oや共有状態を持たず、スケジューリングより十分重く、要素数も多いことを確認する。QoSの継承にも注意し、バックグラウンド処理でthread poolを埋めてUI応答を悪化させない。最後はInstrumentsやベンチマークで測り、感覚だけで決めない。

UIコードの多くでは不要だ。数百個のモデルをmapする処理は、並行化の管理コストより軽いことが多い。

## 関数型チェーンを使わない判断

クロージャに副作用があるなら`for...in`を使う。大きな中間配列を複数作るならチェーンをまとめるか`lazy`を使う。型を何度も読み戻さないと分からないほど長いチェーンは、名前付きの中間変数へ分ける。並行化は別の判断であり、`map`を使っているかどうかとは関係ない。
