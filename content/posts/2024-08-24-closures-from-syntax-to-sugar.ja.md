---
layout: post
title: "クロージャ：完全な定義からsorted(by: >)まで"
description: "Swiftのクロージャ省略記法を順に確認し、キャプチャ、escaping、autoclosureの意味を整理する。"
date: "2024-08-24"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "クロージャ"]
---

Swiftでは、同じソートを七、八通りの書き方で表現できる。最も完全な書き方から`sorted(by: >)`まで省略していき、その途中でキャプチャとescapingの注意点も整理する。

`sorted(by:)`は二つの要素を受け取り`Bool`を返す関数を受け、新しい配列を返す。`sort()`は配列をその場で変更し、戻り値は`Void`だ。

## 省略の八段階

順番は、名前付き関数を渡す、引数と戻り値の型を明示した完全なクロージャを書く、コンテキストから型を推論させる、単一式なら`return`を省く、`$0`と`$1`を使う、演算子関数`>`を渡す、末尾クロージャを括弧の外へ出す、複数のクロージャ引数には複数末尾クロージャを使う、となる。Swift 5.3以降は`UIView.animate`のようなAPIでも最後の形が使える。

推論にはコンテキストが必要だ。型のない変数へ代入する場合、ネストしたクロージャの中で`$0`を使う場合、オーバーロードされた演算子を混ぜる場合は、型注釈を戻す必要があることがある。`as`による強制変換を重ねるより、型を一つ書くほうが明確だ。

## キャプチャと循環参照

クロージャはスコープ内の定数と変数をキャプチャする。値型をキャプチャすると変更可能なcapture boxに入るため、外側で後から変更した値がクロージャから見えることがある。

```swift
var counter = 0
let increment = { counter += 1 }
increment()
print(counter)   // 1
```

参照型はデフォルトで強参照される。オブジェクトがクロージャを保持し、そのクロージャが`self`をキャプチャすると循環参照になる。capture listで切る。

```swift
network.load { [weak self] result in
    guard let self else { return }
    self.render(result)
}
```

`[weak self]`はオブジェクトの寿命を延ばさない。`[unowned self]`は参照カウントを増やさないが、解放後にアクセスするとtrapする。クロージャが`self`より長生きしないと分かる場合だけ使う。capture listには、定義時点の値を固定する初期値も書ける。

## `@escaping`と明示的な`self`

クロージャ引数はデフォルトでnon-escapingだ。関数が戻る前に実行し終わることをコンパイラが保証でき、スタックに置ける場合もある。プロパティに保存したり、非同期キューへ渡したり、別のescaping引数へ渡したりする場合は`@escaping`が必要になる。

escapingクロージャの中でインスタンスの状態へアクセスするときは`self.`を明示する。これはコンパイル時のルールであり、循環参照の有無を見直すきっかけにもなる。

## `@autoclosure`

`@autoclosure`は式を引数なしのクロージャへ自動的に包む。呼び出し側は普通の式を書き、呼び出された側が評価するか、いつ評価するかを決める。

```swift
func logIfNeeded(_ message: @autoclosure () -> String, enabled: Bool) {
    if enabled { print(message()) }
}
logIfNeeded(expensiveDescription(), enabled: false)
```

`??`の右辺、`assert`や`precondition`の失敗メッセージにもこの考え方が使われる。`@autoclosure @escaping`と組み合わせると、クロージャを保存して後で評価する意味になる。引数なしで一つの値を返すパラメータに限られ、使いすぎると、実際には遅延した副作用がある呼び出しを同期的な式に見せてしまう。

## 実際の判断

省略するほど、読者はコンテキストから多くを推測しなければならない。ローカルなソートやfilterなら、私は5〜7段階目をよく使う。公開API、ネストが深いクロージャ、副作用を持つクロージャでは、引数名や型注釈を残す。
