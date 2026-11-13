---
layout: post
title: "Swift 6.4リリース後の新機能まとめ：言語仕様から日常の開発まで"
description: "Swift 6.4でiOSとクロスプラットフォーム開発に影響する変更を実務目線で整理する。"
date: "2026-09-26"
category: "iOS"
comments: true
tags: ["Swift", "iOS", "WWDC"]
---

WWDC26の後、Swift 6の方向性はほぼ固まったと思っていた。ところが2026年9月15日にSwift 6.4が正式リリースされ、今回の世代が新しい構文だけを追加しているわけではないと分かった。コンパイラ、並行処理、テスト、クロスプラットフォームのツールチェーンが、まとめて一歩前に進んでいる。WWDC26のプレビューと正式版を混同しないよう、この記事はリリース後の時点で整理している。

一次資料として、公式の[Swift 6.4リリース記事](https://www.swift.org/blog/swift-6.4-released/)とAppleの[WWDC26 Swiftガイド](https://developer.apple.com/wwdc26/guides/swift/)を参照した。

## まず実感しやすい変更

### 1. `some`、`any`、可用性判定が少し自然になった

Swift 6.4では、オプショナルな`some`と`any`型をより自然に書ける。`(some Protocol)?`は`some Protocol?`と書けるようになった。また、Appleプラットフォームにまたがる可用性判定では`anyAppleOS`を使えるため、iOSやmacOSなどを一つずつ列挙する場面を減らせる。

大きな変更ではないが、公開APIやプラットフォーム対応層では効いてくる。括弧と重複した条件が減り、コードの意図も読み取りやすくなる。

### 2. `defer`で非同期の後片付けを待てる

Swift 6.4では`defer`の中で非同期処理を呼び出せる。ファイルハンドル、仮のリソース、非同期で送信するメトリクスなどを、すべてのreturn経路に重複して書かずに済む。

```swift
func processFile(at url: URL) async throws {
    let handle = try FileHandle(forReadingFrom: url)

    defer {
        await withTaskCancellationShield {
            await flushMetrics(for: url)
            try? handle.close()
        }
    }

    try await processContents(of: handle)
}
```

ただし、タスクがキャンセルされると後片付けも影響を受ける。必ず完了させたい処理には`withTaskCancellationShield`を使えるが、すべての後片付けを保護すればよいわけではない。本当に中断できない処理に限定したい。

### 3. `@diagnose`で警告の方針をコードの近くに書ける

これまで警告の扱いは、主にXcodeのBuild Settingsで管理していた。Swift 6.4では`@diagnose`によって、特定の診断を抑制するか、エラーに昇格するかをソースコードから表現できる。レビュー済みの局所的な例外には向いているが、プロジェクト全体の警告を無効にするための機能ではない。

### 4. `Subprocess`が安定版になった

Swift 6.2で0.1として導入された`Subprocess`が、Swift 6.4で1.0になった。Swift製のツールから外部プログラムを起動し、標準出力を読み、ストリーミング処理を扱える、Swift Concurrencyベースのクロスプラットフォームパッケージだ。

```swift
let result = try await Subprocess.run(
    .name("xcodebuild"),
    arguments: ["-scheme", "Demo", "test"],
    output: .string(limit: 4096)
)
print(result.standardOutput)
```

コマンドラインツール、ビルドスクリプト、自動化サービスには向いている。ただし、このパッケージが存在するからといって、iOSアプリが任意のローカルコマンドを実行できるわけではない。サンドボックスと配布ルールはこれまでどおり適用される。

## テストとデバッグも一緒に改善される

Swift TestingとXCTestは、より段階的に併用できるようになった。Swift Testingの中で`XCTAssert`を使い、XCTestの中で`#expect`を使える。`swift test`ではテストケースの反復実行もでき、失敗情報や添付ファイルはリモートCIの診断に役立つ。既存プロジェクトのテストを一度に全部書き換えるより、現実的な移行ルートだと思う。

並行処理のデバッグもSwift 6世代の重要なテーマだ。タスク名、非同期呼び出しをまたぐLLDBの追跡、Instrumentsでのタスク識別がそろい、「このコードはいまどこで動いているのか」と悩む時間を減らしてくれる。新しい構文より、こうしたツールの改善のほうが日々の効率には早く効くことも多い。

## 構文よりツールチェーンに注目したい

Swift 6.4ではSwift Package ManagerのデフォルトビルドシステムがSwift Buildになり、Linux、macOS、Windowsでパッケージをより一貫してビルドする方向に進んだ。`Subprocess`が安定版になり、Swift/C++相互運用も拡張され、`Span`とC++20の`std::span`を直接つなげられる。iOSアプリの業務コードをすぐ変更する必要はなくても、共有パッケージ、CLI、CIの設計には影響する。

WebAssembly、Embedded Swift、Swift/Java相互運用も引き続き進んでいる。ただ、「対応したから」という理由だけで成熟したiOSコードを移行するのはおすすめしない。まずは境界の明確な小さなパッケージで、ビルド、デバッグ、リリースまでのコストを確認したい。

## 既存プロジェクトならこう進める

Swift 6.4が出たからといって、いきなり全コードを書き換えることはしない。次の順番で進める。

1. CIでXcode、Swift、SDKのバージョンを固定し、クリーンビルド、増分ビルド、テストの時間を記録する。
2. 独立したブランチでSwift 6.4を有効にし、まずコンパイラが実際に指摘した問題を直す。
3. テストフレームワーク全体を移行する前に、Swift TestingとXCTestの段階的な相互運用を試す。
4. 非同期の`defer`とキャンセル保護は、本当に必要な後片付けにだけ使う。
5. 共有ライブラリ、CLI、CIについて`Subprocess`、`Span`、クロスプラットフォームビルドを再評価する。
6. 実機とリリース構成で一通り実行し、問題をアーカイブ時まで先送りしない。

Swift 6.4は、土台を丁寧に磨いたリリースという印象だ。新しい言語を覚え直すことを求めるのではなく、並行処理、テスト、ビルド、クロスプラットフォーム開発という既存の道をより完成に近づけている。iOSプロジェクトでは、これまでどおり小さく、戻せる単位で、各段階にビルドとテストの結果を残しながら更新するのが安全だ。

### 参考資料

- [Swift 6.4 Released](https://www.swift.org/blog/swift-6.4-released/)
- [What’s new in Swift — Apple Developer](https://developer.apple.com/wwdc26/guides/swift/)
- [Swift updates — Apple Developer Documentation](https://developer.apple.com/documentation/updates/swift)
- [Xcode 27 Release Notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-27-release-notes)
