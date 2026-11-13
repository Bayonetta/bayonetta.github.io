---
layout: post
title: "プロパティ、初期化、アクセス制御"
description: "Swiftのプロパティ、initializer、アクセス制御で間違えやすい規則を整理する。"
date: "2025-01-25"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "言語仕様"]
---

レビューで、`private(set)`を「ファイル内ならどこからでも書ける」という意味で使っているコードを見た。同じファイルの別の型から代入しようとしてコンパイルに失敗していた。毎日書くわけではない規則なので、実際に確認できる形で整理する。

## stored、computed、lazyプロパティ

computed propertyは値を保存しない。`get`で読み、`set`で書く。setterの暗黙の引数は`newValue`で、読み取り専用なら`get`も省略できる。

`lazy`は初回アクセスまで初期化を遅らせる。`var`でなければならず、observerは付けられず、初期化式から`self`を参照できる。ただしスレッドセーフではない。二つのスレッドが同時に初回アクセスすると、二度初期化される可能性がある。必要なら同期処理かone-time containerを使う。

```swift
lazy var formatter: DateFormatter = {
    let f = DateFormatter()
    f.dateStyle = .medium
    return f
}()
```

最後の`()`はクロージャをその場で呼び出し、戻り値を保存する。これを忘れると、プロパティ自体がクロージャになる。

## property observer

`willSet`と`didSet`は書き込みの前後に実行され、`newValue`と`oldValue`を使える。初期化中には実行されない。`willSet`ではまだ古い値、`didSet`では新しい値がプロパティに入っている。`didSet`内で同じプロパティへ代入してもobserverは再帰的には呼ばれない。observerと明示的な`get`/`set`は同時に使えない。

## `static`と`class`

`static`は型プロパティや型メソッドを宣言する。`class`はclassでだけ使え、subclassが`override`できる。したがって、classにおける`static`はおおむね`final class`に相当する。storedなtype propertyには初期値が必要だ。type propertyはlazyだが、一度だけ、スレッドセーフに初期化される。インスタンスの`lazy`とは違う。

## subscript

`subscript`で角括弧によるアクセスを提供できる。読み書き、オーバーロード、複数引数、ジェネリックにも対応する。独自Collectionを作るときは、`indices`をCollectionとして実装し、そのElementをCollectionの`Index`にする。これがないと標準の反復やsliceが使いにくい。

## `mutating`と`nonmutating`

値型のメソッドは、`mutating`を付けない限り`self`を変更できない。mutating methodは`var`に対してしか呼べず、`self`への代入は値全体の置き換えになる。`nonmutating set`をsubscriptに使えば、外側のstructが`let`でも参照先へ書き込める。enumのcase変更にも`mutating`が必要だが、classにはこの制約がない。

## 二段階初期化

classの初期化には二つの段階がある。第一段階では、subclassからsuperclassへ向かい、それぞれが自分のstored propertyを初期化する。`super.init`が戻った後、第二段階としてsuperclassからsubclassへ戻り、そこで初めて`self`、インスタンスメソッド、継承したプロパティを使える。

convenience initializerは、まず同じclassのdesignated initializerへ横方向にdelegateしなければならず、直接`super.init`を呼べない。これにより、subclassが初期化される前にsuperclassのメソッドが触れることを防ぐ。

## convenience initializerの継承

subclassがsuperclassのdesignated initializerをすべて実装した場合に限り、superclassのconvenience initializerをすべて継承する。任意の`override init`を一つ書くだけでは足りない。新しいstored propertyにデフォルト値があり、designated initializerを書かなければ、初期化器の連鎖全体を自動継承できる。

## `required`、failable initializer、`final`

`required init`はすべてのsubclassに実装を要求する。`init?`は失敗時に`nil`を返し、`init!`は使用時まで失敗を遅らせるので、なるべく避ける。failable initializerから通常のinitializerは呼べるが、逆方向ではOptionalの結果を処理しなければならない。

`final`はoverrideと継承を禁止し、直接dispatchやinlineを可能にすることがある。extensionから既存classのメンバーをoverrideすることはできない。メソッド、computed property、subscript、protocol conformanceは追加できるが、stored propertyは追加できない。

## getterより狭いsetterのアクセス範囲

```swift
public struct Session {
    public private(set) var token: String
    fileprivate(set) var retryCount = 0
}
```

`private(set)`の書き込み権限は宣言したscopeまでで、ファイル全体ではない。ファイル単位で書きたいなら`fileprivate(set)`を使う。変なコンパイルエラーに出会ったら、storageへの代入なのかobserverを通るのか、この`init`はdesignatedかconvenienceか、`super.init`はどの段階にあるかを確認する。
