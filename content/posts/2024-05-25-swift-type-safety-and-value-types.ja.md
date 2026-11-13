---
layout: post
title: "Swiftが型安全である理由：値の意味と所有権"
description: "Swiftの型安全性を具体的な規則に分け、値の意味とsome/anyのコストまで整理する。"
date: "2024-05-25"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "型システム"]
---

Objective-Cから移行したプロジェクトでは、最初にクラッシュするのは新しいSwiftコードではなく、`id`を渡し続ける古いインターフェースであることが多い。コンパイルは通るのに、辞書のキーが一つ足りないと`valueForKey:`で`NSUnknownKeyException`が出る。Swiftは、このような失敗点をできるだけコンパイル時へ移す。

## 何を早い段階で検出するのか

- 静的型検査：型が合わなければコンパイルに失敗する。
- 数値型の暗黙変換をしない：`Int`と`Double`は明示的に変換する。
- Optionalを明示する：`nil`はOptionalにしか入らず、`if let`、`guard let`、`??`で取り出す。
- 配列の範囲を検査する：不正なsubscriptは隣のメモリを読むのではなくtrapする。
- definite initialization：使う前に、すべての経路で初期化する。
- メモリへの排他的アクセス：同じ領域を重ねて変更・参照する操作を拒否する。

Objective-Cでは`id`はほぼ`objc_object *`で、メッセージは`objc_msgSend`で実行時にdispatchされる。`nil`へのメッセージは0や`nil`を静かに返し、KVCの文字列キーの間違いも実行時まで分からない。

## 値型、参照型、copy-on-write

`struct`と`enum`は値の意味を持ち、`class`は参照の意味を持つ。「値型は必ずstackに置かれる」という説明は単純すぎる。classのプロパティになったり、escapingクロージャにキャプチャされたり、existential containerに入ったりすれば、所有者とともにheapへ移ることがある。classのインスタンスはheapにあり、ARCで管理される。

標準ライブラリのコンテナは、値の意味とcopy-on-writeを組み合わせている。`Array`、`Dictionary`、`String`は読み取り中はheap上のbufferを共有し、書き込み前に一意性を確認して必要ならコピーする。独自のCOW型では`isKnownUniquelyReferenced`を使えるが、classインスタンスを`inout`で渡す必要がある。

```swift
final class Storage {
    var items: [Int]
    init(_ items: [Int]) { self.items = items }
}

struct IntStack {
    private var storage = Storage([])
    private mutating func ensureUnique() {
        if !isKnownUniquelyReferenced(&storage) {
            storage = Storage(storage.items)
        }
    }
    mutating func push(_ x: Int) {
        ensureUnique()
        storage.items.append(x)
    }
    var count: Int { storage.items.count }
}
```

`mutating`は、そのメソッドが値自身を変更することをシグネチャに記録する。コンパイラは`inout self`として扱い、排他性を検査する。

## enumをsum typeとして使う

associated valueを持つenumはsum typeである。`switch`は網羅的でなければならないので、caseを追加すると修正が必要な場所をコンパイラが示す。`CaseIterable`を自動合成できるのは、associated valueを持たないcaseだけだ。再帰enumには`indirect`が必要で、再帰部分をheap上のboxの後ろへ置く。

## `weak`と`unowned`

`weak`はOptionalの変数で、オブジェクトが解放されるとruntimeが参照を`nil`にする。`unowned`はOptionalではなく、解放後にアクセスするとtrapする。`unowned(unsafe)`はそのチェックまで外す。参照されるオブジェクトの寿命が参照側より必ず長いと分かる場合だけ`unowned`を使う。

## `some`、`any`、ジェネリック

- `some P`は、呼び出し側から具体型を隠すが、calleeが選んだ一つの型を保つ。静的dispatchとassociated typeの情報も残る。
- `any P`は具体型をexistential containerへ消去する。value bufferとwitness tableを持ち、呼び出しは動的dispatchになる。大きな値はheapへboxされることもある。
- `func f<T: P>(_ x: T)`は呼び出し側が具体型を選び、boxなしで特殊化できる。

実装を隠しつつ一つの具体型を保つなら`some`、異なる型の集合や実行時多態性なら`any`、呼び出し側に型を選ばせて性能も保つならジェネリックを使う。hot pathで`any`を使うと、間接呼び出しやheap allocationが増える。

普段のアプリコードでは、まずジェネリックか`some`を使い、本当に異種集合が必要な場合だけ`any`を選ぶ。
