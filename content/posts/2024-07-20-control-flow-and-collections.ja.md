---
layout: post
title: "制御フロー、Sequence、そしてArray.sortの実装"
description: "制御フローとコレクションプロトコルを読み直し、パターンマッチング、反復の意味、ソートの境界を整理する。"
date: "2024-07-20"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "コレクション"]
---

古いコードを読んでいたら、`forEach`の中で`return`しているループがあった。書いた人はループ全体を終了するつもりだったようだが、実際にはそのクロージャ呼び出しから戻るだけだ。この種のバグはコンパイルエラーにもクラッシュにもならず、テストも通ることがある。そこで、制御フローとコレクションの境界をもう一度整理した。

特に取り違えやすいのは三つ。`forEach`内の`return`はクロージャだけを抜けること、`enumerated()`が返すのはindexではなくカウンタであること、そして`sort()`が安定ソートを保証していないことだ。

## `switch`は暗黙にfallthroughしない

Swiftの`switch`はcaseの実行後に自動で終了する。次のcaseへ進むには`fallthrough`を明示する。ただし、これは次のcaseの条件をもう一度判定するのではなく、次の文の本体へ直接ジャンプする。

```swift
let value = 5
switch value {
case 1...3:
    print("low")
case 4...6:
    print("mid")
    fallthrough
case 7:
    print("valueが7でなくても実行される")
default:
    break
}
```

出力は`mid`の後に二つ目のメッセージになる。`value`は5なのに、`case 7`の本体も実行される。`fallthrough`は制御フローのジャンプであり、再度のパターンマッチではない。次のcaseで新しい`let`束縛を導入する場合はコンパイルエラーになる。

範囲、タプル、enumのassociated value、`where`もマッチングに使える。enumは網羅性チェックも受けるので、caseを追加すると未処理の`switch`がコンパイルエラーになる。

## ネストしたループにラベルを付ける

`break`は通常、最も内側のループだけを抜ける。ラベルを付けると外側のループまで抜けられる。

```swift
outer: for row in matrix {
    for cell in row {
        guard cell.isValid else { break outer }
        process(cell)
    }
}
```

`continue outer`も同じように使える。`while`や`repeat...while`にもラベルを付けられる。

## 配列を走査する書き方

| 書き方 | 得られるもの | 重要な違い |
| --- | --- | --- |
| `for x in a` | 要素 | 一般的な書き方。`Sequence`のiteratorを使う |
| `a.makeIterator()` | 手動の`next()` | 関数やループをまたいで進められる |
| `for i in a.indices` | 実際のindex | `ArraySlice`にも正しい |
| `a.enumerated()` | 0から始まるカウンタ | `offset`は`Int`でありindexではない |
| `a.forEach { ... }` | 要素 | `return`はクロージャだけを抜ける |

`enumerated()`のoffsetは0から始まるが、`ArraySlice`の開始indexは0とは限らない。offsetをsliceのsubscriptに使うと、間違った要素を取ったりtrapしたりする。indexと要素を同時に扱うなら`zip(a.indices, a)`を使う。

`forEach`の`return`は`continue`に近く、`break`ではない。外側の走査全体を止めることもできない。

## `Sequence`と`Collection`の違い

`Sequence`が要求するのは、`next()`が`Element?`を返す`IteratorProtocol`のiteratorだけだ。何度も走査できることも、有限であることも保証しない。`makeIterator()`を二度呼んだときの挙動は実装次第になる。

`Collection`は、繰り返し可能で破壊的でない走査、`startIndex`と`endIndex`、subscript、`indices`、`count`を追加で保証する。ただし`count`が必ずO(1)とは限らない。indexの移動と距離計算をO(1)に制約するのは`RandomAccessCollection`だ。

`underestimatedCount`はiteratorが返す「少なくともこのくらい」という下限で、`Array(sequence)`が`reserveCapacity`に使う。これにより、何度も拡張するコストを減らせる。

## `sort`の戦略

古いメモには、クイックソート、小さい範囲では挿入ソート、再帰が深くなればヒープソートへ切り替えると書いていた。これはintrosortの典型的な構造だ。小さな範囲では挿入ソート、通常はクイックソート、悪いpivotによるO(n²)化を防ぐためにヒープソートを使う。

実装や閾値はSwiftのバージョンで変わるため、「20」のような数値を業務上の前提にしてはいけない。また、`sort()`は安定ソートを保証しない。同じ値の元の順番を保ちたいなら、元のoffsetを二次キーにする。

```swift
let stable = items
    .enumerated()
    .sorted {
        if $0.element.score != $1.element.score {
            return $0.element.score > $1.element.score
        }
        return $0.offset < $1.offset
    }
    .map(\.element)
```

## `Set`と`Dictionary`のコスト

どちらも`Hashable`を前提にする。Swiftはランダム化されたhash seedとオープンアドレス方式のハッシュテーブルを使う。検索と挿入は平均O(1)、最悪O(n)で、反復順序は保証されない。

カスタム型をDictionaryのキーにするなら、`==`と`hash(into:)`の整合性が必要だ。等しい値は必ず同じhashを持たなければならないが、同じhashだからといって等しいとは限らない。ハッシュテーブルに入っているオブジェクトを変更すると、hashが無効になる。

`forEach`の`return`、`enumerated()`のoffset、ソートの安定性、`Sequence`の一度きりの走査。この四つの境界は、私が実際に見たコードでもバグの原因になっていた。
