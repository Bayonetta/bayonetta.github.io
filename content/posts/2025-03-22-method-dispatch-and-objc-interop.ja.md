---
layout: post
title: "メソッドdispatchとObjective-C相互運用"
description: "Swiftのdispatch方式、六つの修飾子、混在言語プロジェクトのheaderとmacroを整理する。"
date: "2025-03-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "runtime"]
---

メソッド呼び出しで重要なのは、コンパイラが呼び出し箇所で対象関数のアドレスを決められるかどうかだ。決められればdirect dispatch、できなければfunction tableかmessage dispatchを使う。この違いで、inline、swizzling、KVOによる観察が可能かどうかも変わる。

## 三つのdispatch方式

### Direct dispatch

コンパイラがアドレスを確定でき、呼び出しをinlineできる。値型のメソッド、`final`のclassやメソッド、WMOでoverrideがないと証明できる`private`や`fileprivate`、extensionで新しく追加したメンバーがこの方式になる。global functionとstatic methodも同じだ。

runtimeで実装を差し替える柔軟性は失うが、inline、devirtualization、constant foldingが可能になる。性能が重要な経路では値型と`final`を基本にする。

### Vtableとwitness table

override可能なclassのメソッドはvtableを使う。subclassはslotを差し替え、呼び出し時にそのslotから間接ジャンプする。プロトコル要求はwitness tableを使い、conforming typeごとに要求の実装アドレスを持つ。どちらも間接参照が一回増えるが、Objective-Cのmessage dispatchより軽く、解析しやすい。

`Array`のcopy-on-writeと、existentialのboxing・witness tableは別の話だ。前者は値の意味の最適化で、後者はdispatchの仕組みである。

### Message dispatch

`objc_msgSend`は`isa`、selector cache、method list、superclass chainをたどる。見つからなければmethod resolutionとforwardingへ進む。コストの代わりに、method swizzling、KVOのdynamic subclass、`respondsToSelector:`、categoryの注入、`performSelector:`が使える。

Swiftのメンバーがこの経路を通るのは、Objective-Cへ公開され、かつdynamicな場合、通常は`@objc dynamic`だ。`@objc`だけではselectorを持つthunkが生成されるだけで、Swiftからの呼び出しが必ず`objc_msgSend`になるわけではない。

## 修飾子の整理

- `final`：overrideを禁止し、direct dispatchとinlineを可能にする。
- `dynamic`：dynamic dispatchを強制し、KVOとswizzlingの前提になる。現代のSwiftでは`@objc`とは別の概念だ。
- `@objc`：宣言をObjective-C runtimeとgenerated headerへ公開する。visibilityを決めるが、dynamic dispatchは強制しない。
- `@nonobjc`：暗黙に公開されるメンバーを除外する。
- `@inline(__always)`と`@inline(never)`：optimizerへのhintであり、dispatchの修飾子ではない。
- `@objcMembers`：class、extension、subclassのObjective-C表現可能なメンバーをまとめて公開する。selectorが増え、衝突もしやすくなる。

`final @objc`では、Swift側からはdirect dispatchできる一方、Objective-C側からはselectorを通して呼べる。ただしKVOには`@objc dynamic`が必要だ。`final @objc`ではsetterが静的dispatchされ、KVOのdynamic subclassが捕捉できない。

## 純粋なSwift classは自動的に`NSObject`ではない

純粋なSwift classは、Objective-Cのdynamicな性質を自動では持たない。`NSObject`を継承せず、`@objc`メンバーもなければ、コンパイラはvtableかdirect dispatchを使う。method swizzlingは効かず、任意のselectorにも応答しない。

## 混在言語のheader

Swift側は`SWIFT_OBJC_BRIDGING_HEADER`で指定したbridging headerからObjective-C宣言を取り込む。Objective-C側は、`SWIFT_OBJC_INTERFACE_HEADER_NAME`で名前を決める生成済みの`ProductModuleName-Swift.h`をimportして、公開されたSwift型を使う。

Swift側の宣言は明示的に`@objc`または`@objcMembers`で公開する必要があり、generated headerに入るのはObjective-Cが表現できる型だけだ。`NS_SWIFT_NAME`は名前変更、`NS_SWIFT_UNAVAILABLE`は代替案付きの非公開化、`NS_REFINED_FOR_SWIFT`はSwift overlayで包むための低レベル形でのimportに使う。

問題が起きたら層を分けて調べる。KVOが反応しないなら`dynamic`が失われていないか、混在言語のsymbolが見つからないなら`@objc`とgenerated header、性能問題ならSILの呼び出しが`function_ref`か`objc_method`かを確認する。
