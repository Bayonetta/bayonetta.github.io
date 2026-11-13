---
layout: post
title: "プロトコル、associated type、プロトコル指向プログラミング"
description: "プロトコルextensionの静的dispatch、小さなプロトコル、associatedtypeとanyの境界を整理する。"
date: "2025-02-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "プロトコル"]
---

プロトコルextensionの落とし穴を初めて踏んだとき、しばらく原因が分からなかった。`Greeter`に`casual()`のデフォルト実装を置き、`Polite`にも同名メソッドを書いたのに、`Greeter`型の変数へ入れるとデフォルト実装が呼ばれた。警告もエラーもなく、動作だけが違った。

原因はdispatch方式にある。プロトコルが要求できるもの、extensionのメンバーがなぜ静的dispatchになるのか、`any`の境界をまとめる。

`Array`はよい例だ。走査、ランダムアクセス、範囲置換、配列リテラル、文字列表現は、`Sequence`、`Collection`、`RandomAccessCollection`、`RangeReplaceableCollection`、`ExpressibleByArrayLiteral`、`CustomStringConvertible`への別々のconformanceを組み合わせている。

## プロトコルが要求できるもの

インスタンス・型プロパティ、メソッド、initializer、subscript、mutating methodを要求できる。

```swift
protocol Named {
    var name: String { get }
    var displayName: String { get set }
    static var kind: String { get }
    init(name: String)
    mutating func rename(to newName: String)
}
```

`init`を要求するプロトコルをclassが実装するとき、`final`でなければ`required`が必要だ。`get`要求は`get set`で実装できるが、`get set`要求をread-only propertyで実装することはできない。`&`でプロトコルを合成でき、`AnyObject`を加えると値型を除外できる。

## `@objc optional`とデフォルト実装は別物

`@objc optional`はObjective-C相互運用の機能で、`@objc`プロトコルとclassのconformanceが必要だ。メソッドの有無をruntimeで調べる。Swift側では、プロトコルextensionにデフォルト実装を書く方法がある。こちらはコンパイル時に決まり、runtimeの検査はない。二つを混ぜると挙動を推測しにくくなる。

## extensionのメンバーが静的dispatchになる理由

プロトコル本体で宣言された要求だけがwitness tableを使う。extensionにしか存在しないメソッドは、呼び出し箇所の静的型で決まる。

```swift
protocol Greeter { func official() -> String }
extension Greeter {
    func official() -> String { "Hello" }
    func casual() -> String { "Hi" }
}
struct Polite: Greeter {
    func official() -> String { "Good day" }
    func casual() -> String { "How do you do" }
}
let p: Greeter = Polite()
p.official()     // "Good day"
p.casual()       // "Hi"
Polite().casual() // "How do you do"
```

conforming typeが上書きできるようにしたいメソッドはプロトコル本体に宣言し、extensionにはデフォルト実装だけを置く。extensionだけのメソッドは、要求を組み合わせた共通アルゴリズムに向いている。

## 継承との違い

継承は「何であるか」と「何ができるか」を結び付け、親の状態と挙動を引き継ぐ。単一継承の制限があり、値型も参加できない。Swiftのプロトコルは能力を小さな契約へ分け、structやenumでも組み合わせられる。

私は、cache可能、serialize可能、表示可能、undo可能といった役割を先に列挙し、役割ごとに小さなプロトコルを作る。状態とライフサイクルを本当に共有する場合だけclass継承を使い、階層は浅く保つ。

## 条件付きconformance

`where`付きextensionで、要素が条件を満たすときだけジェネリック型へconformanceを与えられる。

```swift
protocol TextRepresentable { var text: String { get } }
extension Array: TextRepresentable where Element: TextRepresentable {
    var text: String { map(\.text).joined(separator: ", ") }
}
```

これがconditional conformanceだ。通常のメソッドに`where`を書くのはそのメソッドを制限するだけで、型全体のconformanceにはならない。

## `associatedtype`と`any`

`associatedtype`はconforming typeごとに決まるプレースホルダーだ。Swift 5.7以降、`Self`やassociated typeを持つプロトコルを型として使うには`any`を明示する。`any Container`は具体的なItem型をboxへ消去するが、ジェネリックと`some`は具体型を保つ。existentialにはboxingとdispatchのコストがあり、associated typeが未知だと使えない操作も多い。本当に異種の値を一つの配列に入れたい場合だけ`any`を使い、それ以外はジェネリックか`some`を優先する。

静的dispatchの厄介さは、コンパイラが警告を出さないことだ。レビューでは、プロトコルextensionのメソッドに、プロトコル本体へ移すべきものが紛れていないかを確認する。
