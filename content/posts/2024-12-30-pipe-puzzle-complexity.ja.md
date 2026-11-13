---
layout: post
title: "Pipe Puzzleの計算複雑性：オイラー閉路から3-Partitionへ"
description: "三つの接続モデル、1×n盤面の境界、3-Partition還元、frontier DPについてのノート。"
date: "2024-12-30"
category: "research"
comments: true
tags: ["アルゴリズム", "計算複雑性", "組合せパズル", "JAIST"]
---

Shirayama、Shigemura、Otachi、Miyazaki、Ueharaによる『On Computational Complexity of Pipe Puzzles』を読み直した。JigsawやEdge Matchingが主に局所的な一致を調べるのに対し、Pipe Puzzleには、source `s`からsink `t`まで接続し、盤面に孤立したlocal loopを作らないという大域的な条件がある。

## 接続モデルとカード

カードは回転できる単位正方形で、`I`（直線）、`L`（角）、`T`（三方向）、`+`（四方向）、`X`（接続しない交差）を使う。論文では次の三つの接続規則を扱う。

1. **Uniform:** 中央にある同じ太さの管口が向かい合えば接続する。
2. **Thickness:** 管口に種類があり、同じ太さだけが接続する。
3. **Height:** 管口の位置を`h ∈ [0, 1]`で表し、水平に接する二つの高さの和が1なら接続する。

盤面は`w × h`の矩形で、sourceとsinkは境界にある。カード数を`m`、セル数を`n = wh`とする。

## `1 × n`盤面の境界

すべてのカードを使う場合（`m = n`）、ThicknessとHeightモデルはいずれも線形時間で解ける。一行を埋める解では直線カードだけが使われる。Thicknessでは太さを頂点、カードを辺とみなし、sourceとsinkの種類を結ぶ補助辺を加える。得られた多重グラフが連結で、全頂点の次数が偶数、つまりEulerian cycleを持つことが解の条件になる。

Heightモデルでは二色の多重グラフになり、黒辺と赤辺の次数が各頂点で一致する交互Eulerian cycleを探す。どちらも線形時間で判定できる。

カードを余らせてもよい場合（`m > n`）、問題はNP完全になる。Cubic GraphのHamiltonian cycleから還元し、頂点を太さ、辺を直線カードに対応させる。カード列がグラフの各頂点をちょうど一度ずつ訪れるため、カードを選べるだけでEuler型の「全辺使用」がHamilton型の「全頂点一度」に変わる。

## 3-PartitionとFrame構成

盤面の高さが2以上になると、カードをすべて使う場合でもNP完全性が現れる。強NP完全な3-Partitionから還元する。Frameで長さ`B`のslotを作り、各数`aᵢ`を長さ`aᵢ`の小さなpipe gadgetに変換する。各slotをちょうど三つのgadgetで埋められることが、3-Partitionの解と同値になる。

高さ`k ≥ 3`の盤面では、分岐カードなしでも困難性が残る。`aᵢ' = 2aᵢ + 1`、`B' = 2B + 3`と拡大し、目標長を奇数にする。すると`I`と`L`だけのsnake-like pathが行を折り返しながらframeに入る。

## Frontierの動的計画法

Uniformモデルでは、盤面の高さ`h`を固定すると解ける。frontier DPはセルを順に走査し、未処理領域との境界にある`h + 1`本の開いた辺を状態として持つ。各辺は、空、`s`へ接続済み、または別のactive componentに属するというlabelを持つ。

同じ連結構造をcanonical renumberingでまとめる。異なるcomponentの端点が接続したらlabelを統合する。同じcomponentの端点同士が接続するとlocal loopになるので、別のfrontier端点が残っていない限り状態を捨てる。

論文の計算量は時間`O(h^{h+2} n^3)`、空間`O(h^{h+1} n^3)`。`h`が定数なら、これはFPTな多項式アルゴリズムである。

| 盤面 | モデル | カード条件 | 複雑性 |
| :--- | :--- | :--- | :--- |
| `1 × n` | Thickness / Height | 全カードを使用 | **P、O(n)** |
| `1 × n` | Thickness / Height | 余分なカードあり | **NP完全** |
| `2 × n/2` | Thickness / Height | `I`、`L`、`T` | **NP完全** |
| `k × n/k`、`k ≥ 3` | Thickness / Height | `I`、`L`のみ | **NP完全** |
| `w × h`、`h`固定 | Uniform | 全カードを使用 | **P / FPT** |

面白いのは、EulerとHamiltonの性質がカードの余りを許すだけで大きく変わることだ。前者が辺の次数の均衡なら、後者は頂点の完全な一回訪問になる。frontier DPは逆に、全体の連結性を小さな境界状態へ圧縮する。
