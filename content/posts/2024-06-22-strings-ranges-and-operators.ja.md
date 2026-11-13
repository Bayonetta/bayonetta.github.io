---
layout: post
title: "Substring、範囲、演算子：Swiftの構文糖の設計"
description: "Substringの共有メモリからRange、演算子、whereまでを整理する。"
date: "2024-06-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "構文"]
---

以前、リストの各行のタイトルを節約するため、`prefix(30)`の結果をそのままキャッシュした。数十MBのログを読み込み、短いタイトルだけを残したのに、メモリが下がらなかった。理由は単純で、`Substring`はコピーせず、元の文字列のbufferを共有するからだ。

## Substringの共有と落とし穴

`prefix`、`suffix`、範囲subscriptは`String`ではなく`Substring`を返す。開始と終了の`String.Index`だけを持ち、文字bufferを共有するので、prefixの切り出しは定数時間で済む。一方で、元のbuffer全体への強参照を保持する。プロパティ、辞書、キャッシュに長期間保存するなら、元の巨大な`String`も解放されない。独立して保持したいときは`String(sub)`に変換する。

`String.Index`は、それを作った`String`と、その文字列から派生したSubstringでしか有効ではない。別の文字列へ使ってはいけない。APIをまたいで位置を保存するなら、整数offsetを保存し、必要な場所で`index(_:offsetBy:)`を使って再構築するほうが安全だ。

## `StringProtocol`

標準ライブラリは、`String`と`Substring`の共通機能を`StringProtocol`として抽出している。文字列ユーティリティの引数を`String`に固定すると、呼び出し側は毎回`String(sub)`を作り、余分なコピーを支払うことになる。

```swift
import Foundation

func head<S: StringProtocol>(_ s: S) -> Character? {
    s.first
}

func lineCount(_ s: some StringProtocol) -> Int {
    s.split(separator: "\n").count
}
```

`StringProtocol`は`Self`とassociated typeを要求するので、通常の保存プロパティの型として直接使えない。ジェネリックか`some`を使う。`some StringProtocol`はopaque typeのままで、existentialのboxingは発生しない。

## なぜ整数subscriptが使えないのか

`String`はextended grapheme clusterの集合だ。一つの見た目の文字が複数のUnicode scalarから構成されることがあるため、`s[2]`を固定幅の操作として定義できない。`String.Index`でアクセスし、`count`もgrapheme clusterをたどるのでO(n)になる。

`utf8`、`utf16`、`unicodeScalars`のviewは、より一定の単位を持つ。一方、`Character`はgraphemeの境界を判定する必要があり、高コストだ。`String.Index`は`Comparable`だが`Strideable`ではない。可変長のコストを`index(_:offsetBy:)`として明示させる設計になっている。

## `??`と`@autoclosure`

Nil-coalescing演算子は右結合で、最初の非`nil`値を返す。右辺は`@autoclosure`で包まれるため、左辺が`nil`のときだけ評価される。

```swift
let a: Int? = nil
let b: Int? = nil
let c: Int? = 42
let value = a ?? b ?? c ?? 0   // 42
```

`Optional.map`はOptionalの層を一つ保ったまま値を変換し、`flatMap`はネストしたOptionalを平らにする。

## Rangeが要求するのはComparable

`Range`が要求するのは数値型ではなく`Bound: Comparable`だ。`"a"..."z"`も有効で、辞書順の範囲を表す。`ClosedRange`は両端を含み、`Range`は上限を含まず、`PartialRangeFrom`は下限だけを持つ。

`RangeExpression`と`~=`により、これらの範囲を`switch`のcaseで使える。整数のrandom-accessな境界なら`contains`は定数時間の比較だが、Stringの場合も辞書順の比較に過ぎず、中間の値を列挙するわけではない。

## カスタム演算子

演算子は先に宣言してから実装する。中置演算子にはprecedence groupも必要で、結合方向と優先順位を定める。`⊕`のようなUnicode記号は使えるが、カスタム演算子はデフォルトでglobalに見えるため、重複宣言は衝突する。可能なら標準ライブラリのprecedence groupを再利用する。

## `stride`と浮動小数点誤差

`stride(from:to:by:)`は上限を含まず、`stride(from:through:by:)`は上限を含む。`0.1`のような値は二進数で正確に表現できず、繰り返し加算すると誤差が蓄積する。目盛り、アニメーションのフレーム、進捗表示では整数で進め、最後にscaleする。

```swift
let ticks = stride(from: 0, through: 10, by: 1).map { Double($0) / 10.0 }
```

## 可変長引数と`where`

`Int...`は関数内では配列になる。一つの関数に置ける可変長引数は一つだけで、`inout`にもできない。また、既存の配列を可変長引数へ展開するsplat構文はない。必要なら`[Int]`を受け取るオーバーロードを用意する。

`where`は、ジェネリック制約、制約付きextension、`for-in`のフィルタ、`switch`・`catch`のパターン、associated typeの制約など、決まった場所で使う制約句だ。
