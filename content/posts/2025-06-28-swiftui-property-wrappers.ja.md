---
layout: post
title: "SwiftUIのpropertyWrapperファミリー"
description: "所有者という観点からState、Binding、StateObjectなどのwrapperと、よくある誤用を整理する。"
date: "2025-06-28"
category: "iOS"
comments: true
tags: ["iOS", "SwiftUI", "プロパティラッパー"]
---

以前、親viewが作ったmodelを`@ObservedObject`にしてしまった。親が更新されるたびに`Model()`が再生成され、カウンタが0に戻った。原因は所有権だった。`@ObservedObject`は監視するが、オブジェクトを所有しない。

## `propertyWrapper`の仕組み

`@propertyWrapper`を付けた型は`wrappedValue`を持つ。コンパイラはwrapperをbacking propertyとして保存し、見えるプロパティを`wrappedValue`へ転送する。`projectedValue`を用意すれば、`$name`で投影値へアクセスできる。

```swift
@propertyWrapper
struct Clamped {
    private var value: Int
    let range: ClosedRange<Int>
    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
    var projectedValue: Int { value }
    init(wrappedValue: Int, range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}
```

`init(wrappedValue:)`があると、初期値付きの宣言を使える。コンパイラは`_volume`のようなbacking propertyを作るので、initializer内でそれへ直接代入できる。

## 所有者の対応表

| Wrapper | 所有者 | 用途 |
| --- | --- | --- |
| `@State` | 現在のview | ローカルな値状態。通常`private` |
| `@Binding` | 外部 | 値状態への読み書き参照 |
| `@StateObject` | 現在のview | viewが生成・所有する`ObservableObject` |
| `@ObservedObject` | 外部 | 既存オブジェクトを所有せず監視 |
| `@EnvironmentObject` | 祖先view | 注入されたobservable object |
| `@Environment` | system/祖先 | environmentの値を読む |
| `@AppStorage` | UserDefaults | 起動をまたいで基本値を保存 |
| `@SceneStorage` | scene | sceneの基本状態を復元 |
| `@GestureState` | 現在のview | ジェスチャー中だけの一時状態 |
| `@FocusState` | 現在のview | 入力focus |
| `@Bindable` | 外部object | `@Observable`のプロパティをbinding化 |

`@State`はローカル状態を所有し、`$state`でBindingを作る。子viewは`@Binding`を受け、親は`$value`を渡す。`init`でStateを初期化するときは`_query = State(initialValue: value)`のようにbacking storageへ書く。

viewが`ObservableObject`を生成するなら`@StateObject`、外部から渡された既存objectなら`@ObservedObject`を使う。`@EnvironmentObject`は祖先から注入しなければruntimeでtrapする。`@Environment`は`dismiss`や`colorScheme`を読む。`@AppStorage`と`@SceneStorage`は小さな基本型向けで、大きなデータには使わない。

## Observation

`@Observable` macroは、`@Published`の変更をすべて通知する代わりに、viewが実際に読んだプロパティを追跡する。`@Observable` objectは`@State`で所有でき、`$` bindingが必要なときだけ`@Bindable`を付ける。移行中に同じmodelへ`@Published`とObservationを無計画に混ぜない。

## 選ぶ順番

まず誰が状態を所有するかを考える。view固有の値は`@State`、子viewへ渡す編集可能な値は`@Binding`、viewが作る参照objectは`@StateObject`または`@Observable`と`@State`、環境から注入するobjectは`@EnvironmentObject`、system値は`@Environment`、永続化する値は`@AppStorage`か`@SceneStorage`だ。

よくある誤りは、initializerで`_query = State(...)`ではなく`query = ...`と書くこと、新しく作ったobjectを`@ObservedObject`にすること、viewのruntime storageの外で`@State`を読むことだ。
