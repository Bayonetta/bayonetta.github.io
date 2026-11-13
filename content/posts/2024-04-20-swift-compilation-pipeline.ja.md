---
layout: post
title: "Swiftのコンパイルパイプラインとswiftcの実用的なコマンド"
description: "ParseからリンクまでのSwiftコンパイルパイプラインと、調査で使うswiftcのコマンド。"
date: "2024-04-20"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "コンパイラ"]
---

あるジェネリック関数が、Releaseビルドでどうしても特殊化されなかった。`-emit-silgen`と`-emit-sil`でSILを一つずつ出力し、横に並べてdiffを取った。呼び出し箇所がopaque typeとして渡されていて、特殊化が発生していなかった。次から推測で済ませないために、コンパイルパイプライン全体をもう一度確認した。

```text
.swiftソース
  → Parse（字句・構文解析）→ AST
  → Sema（名前解決、型検査、制約解決）
  → SILGen → Raw SIL
  → SILの正規化と最適化 → Canonical SIL
  → IRGen → LLVM IR
  → LLVM最適化とバックエンド → オブジェクトファイル
  → リンク → 実行ファイル
```

Swiftリポジトリの対応するディレクトリは次の通りだ。

- Parse（`lib/Parse`）は文字列をtokenに変換し、ASTを作る。この時点では型情報はまだない。
- Sema（`lib/Sema`）は名前解決、型検査、制約解決を行う。`var x = 1`が`Int`と推論されるのもここで、暗黙変換、`inout`、アクセス制御、availabilityの確認も含まれる。
- SILGen（`lib/SILGen`）は型検査済みのASTをSILへ下げ、ARCと所有権の命令を挿入する。
- Raw SILは最適化前の成果物で、`alloc_stack`や`retain` / `release`がまだ残っている。
- Canonical SILと`lib/SILOptimizer`では、ジェネリック特殊化、脱仮想化、インライン化、ARC最適化、所有権SSAの正規化が行われる。
- IRGen（`lib/IRGen`）はSILをLLVM IRへ下げ、Swiftの型、ARC、ジェネリック、dispatchをポインタ、整数、関数呼び出しへ変換する。
- LLVMとバックエンドは命令最適化、レジスタ割り当て、命令選択を行い、オブジェクトファイルを出力する。
- リンカーはオブジェクトファイル、標準ライブラリ、ランタイム、システムフレームワークを結合し、シンボル解決と不要コードの削除も行う。

## なぜ途中にSILが必要なのか

ASTを直接LLVM IRへ下げるだけでは、Swiftの意味を載せきれない。SILはSSA形式で、`%0`や`%1`のような値は一度だけ代入され、制御フローは`bb0`のような基本ブロックに分けられ、型は`$Int`のようなSIL型で表される。

ARCの`retain` / `release`、`owned`や`guaranteed`といった所有権規約、ジェネリック特殊化前の`apply`とwitness table、クラスやプロトコルの動的dispatch、脱仮想化に必要な型情報は、LLVM IRまで待つと失われる。LLVMに見えるのは平坦なC風の表現だけだ。Swiftの配列がcopy-on-writeか、プロトコル呼び出しを静的dispatchできるかも分からない。Swift固有の最適化はSILの段階で行う必要がある。

## 覚えておきたいコマンド

- `-dump-ast`：型検査後のAST。推論された暗黙の型も含む。
- `-emit-silgen`：最適化前のRaw SIL。
- `-emit-sil`：Canonical SIL。`-O`と組み合わせて特殊化や脱仮想化を見る。
- `-emit-ir`：型のレイアウト、呼び出し規約、シンボルmanglingを見るLLVM IR。
- `-emit-bc`：LTOやモジュール間最適化に使うLLVM bitcode。
- `-emit-assembly`：アセンブリを出力する。
- `-emit-object`：リンクせず、オブジェクトファイルだけを出力する。
- `-o`：出力先。`emit`指定がなければリンクまで進む。
- `-Onone` / `-O`：最適化レベル。比較前にレベルを固定する。
- `-whole-module-optimization`：モジュール全体を一つの単位として最適化する。

`-emit-silgen`は最適化前、`-emit-sil`はpass実行後だ。`-Onone`では多くの`retain` / `release`が残り、`-O`では関数がインライン化され、参照カウント操作が消え、ジェネリック呼び出しが特殊化されることがある。二つをdiffすれば、最適化が効いたか見分けやすい。

増分コンパイルでは`-incremental`、`-primary-file`、`-emit-module`、`-emit-module-path`も使う。`-primary-file`は主ファイルだけを完全に型検査し、他のファイルは既存の`.swiftmodule`を読み込む。Xcodeのログに同じファイルが複数回出るのは、異なるprimary fileとして分割されているだけで、必ずしも重複コンパイルではない。

## WMOと増分コンパイル

| 観点 | 増分コンパイル | Whole-module optimization |
| --- | --- | --- |
| 単位 | 一つのファイル | モジュール全体 |
| 最適化 | ファイル内 | ファイルをまたぐインライン化・特殊化 |
| 全量ビルド | 比較的軽い | CPUとメモリのピークが高い |
| 一ファイルの変更 | そのファイルだけ再ビルド | モジュール全体を再ビルドすることがある |
| 向く場面 | Debugと日常の反復 | Releaseと出荷 |

日常の反復ではWMOを切り、Releaseで有効にする。Debugで`-whole-module-optimization`を誤って有効にすると、一行の変更で全量コンパイルになりつらい。

## Objective-Cとの相互運用

Swiftは`lib/ClangImporter`を通じてObjective-Cを取り込む。コマンドラインでは`-import-objc-header`でブリッジヘッダーを指定し、Xcodeでは`SWIFT_OBJC_BRIDGING_HEADER`に対応する。importerはヘッダーをClang moduleとして包む。

覚えておけばよい対応は、`NSString`から`String`、`NSArray`から`Array`、`NSDictionary`から`Dictionary`だ。`nonnull`と`nullable`はimport後にOptionalになるかを決め、`NS_SWIFT_NAME`は名前を変更し、`objc`属性は公開方法を制御する。フレームワークは`module.modulemap`でモジュール境界を宣言し、必要なら`-Xcc`でClangに引数を渡す。

逆方向はgenerated headerが担当する。`SWIFT_OBJC_INTERFACE_HEADER_NAME`で指定する、通常は`ProductModuleName-Swift.h`というヘッダーによって、Objective-CからSwiftのクラスを呼び出せる。混在言語の型が合わないとき、原因はSwiftの構文より、nullabilityの注釈かモジュールマッピングであることが多い。

コンパイラの引数はバージョンで変わるので、使う前に一度`swiftc -help`を実行する。
