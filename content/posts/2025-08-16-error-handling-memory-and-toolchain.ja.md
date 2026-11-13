---
layout: post
title: "エラー処理、メモリ管理、依存関係管理"
description: "throws/defer、weakとunownedの選択、三つの依存関係管理ツールの違いを整理する。"
date: "2025-08-16"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "エンジニアリング"]
---

このあたりのバグは、境界を守れていないことが多い。`try?`がエラーを消し、`defer`を遅すぎる位置に書き、クロージャが`self`を強参照する。一つずつは難しくないが、組み合わさると見落としやすい。

## エラー処理の流れ

Swiftでは`Error`でエラーを表し、関数、メソッド、initializerに`throws`を付けられる。呼び出し側は`do-catch`、`try?`、`try!`、または上位への伝播を選ぶ。

`try?`は失敗を`nil`に変え、原因を失う。ログや分岐が必要なら`do-catch`か`Result`を使う。`try!`は、同梱リソースのように失敗がプログラムのバグである場合だけにする。`rethrows`は、引数のクロージャがthrowしたときだけ自分もthrowするという意味だ。`init?`は生成できないことだけを表し、理由を持たせるなら`throws`を使う。`Result`はエラーを値として保存し、非同期境界を越えて渡すときに便利だ。

ユーザー向けの文言には`LocalizedError.errorDescription`を使う。Objective-Cとの境界では`NSError`のdomainとcodeを使う。

## `defer`はscopeの終了時に実行される

`defer`は、通常の`return`、`throw`、`break`、早期の`guard`終了を含め、現在のscopeを抜けるときに実行される。複数あれば後入れ先出しで動く。実行がその行まで到達して初めて登録されるため、guardの後に書いたdeferは早期終了を保護しない。defer内でreturnやthrowを行い、制御フローを変えてはいけない。

lock/unlock、ファイルやDB接続のclose、graphics context、begin/endの対になる処理に向いている。

## `weak`と`unowned`

どちらも強参照を作らない。`weak`はOptionalの`var`で、対象が解放されると`nil`になる。`unowned`は非Optionalにもできるが、対象の解放後にアクセスするとtrapする。参照される対象が必ず参照側より長生きするという不変条件があるときだけ`unowned`を使う。`unowned(unsafe)`は安全チェックまで外すので、通常のアプリコードには置かない。

よくある循環参照は、クロージャを保持するobjectが`self`をcaptureする場合、Timerやblock通知がtargetを保持する場合、delegateがstrongな場合、クロージャを保持するobjectを中間変数経由でcaptureする場合だ。`[weak self]`、`[unowned self]`、具体的な値のcapture listで切る。診断にはMemory Graph DebuggerやInstrumentsのLeaksを使う。async closureは循環でなくても一時的に`self`を保持し、メモリ使用量を押し上げることがある。

## 依存関係管理

| | CocoaPods | Carthage | Swift Package Manager |
| --- | --- | --- | --- |
| projectへの影響 | 大きい。projectを書き換えworkspaceを生成 | 小さい。frameworkを生成 | 小さい。Xcodeに統合 |
| lock file | `Podfile.lock` | `Cartfile.resolved` | `Package.resolved` |
| 主なコスト | project衝突と更新時の落とし穴 | 手作業とscript | 混在言語とresourceの歴史的制限 |
| よく使う場面 | 既存の大きなecosystem | prebuilt framework | 新規projectの標準 |

CocoaPodsはworkspaceを生成してsourceを組み込む。Carthageは侵入性が低いが、framework、search path、copy-frameworks scriptの設定が必要だ。Swift Package Managerは`Package.swift`でproducts、targets、version ruleを宣言し、閉源frameworkは`binaryTarget`で扱う。移行時には古いlibrary、resource bundle、混在言語のmodule mapを確認する。

新規projectではSPMを選ぶ。既存projectでは新しい依存をSPMで追加し、Podsを少しずつ移行することが多い。

混在言語でも同じ境界がある。bridging headerはObjective-CをSwiftへ取り込み、`ProductModuleName-Swift.h`は明示的に`@objc`で公開したSwift宣言をObjective-Cへ渡す。`NS_SWIFT_NAME`、`NS_SWIFT_UNAVAILABLE`、`NS_REFINED_FOR_SWIFT`でimport後のAPIを調整できる。
