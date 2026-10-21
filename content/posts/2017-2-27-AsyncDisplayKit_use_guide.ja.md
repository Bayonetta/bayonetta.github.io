---
layout: post
title: "AsyncDisplayKit学習ノート"
description: "チュートリアル"
category: "iOS"
comments: true
tags: [AsyncDisplayKit, Facebook, iOS, 开发]
machineTranslated: true
---

# 紹介

AsyncDisplayKitの核心概念はnodeです。`ASDisplayNode`はUIViewまたはCALayerをベースにした抽象概念で、対応するヘッダファイルを見ても基本的に分かるとおり、Viewとlayer関連のプロパティをすべて一つに統合しています。

* `layerBacked`でlayerで直接nodeを構成するように設定できます。デフォルトではNodeに対応する_ASDisplayViewの内部クラスです

* 独自のlayoutエンジンを持ち、CSSに似ています。Auto Layoutには非対応です

#### ASDisplayNode

* init

  * 任意のスレッドから呼べます
  * touchイベントやジェスチャーのバインドはここでは行わず、didLoadに入れてください

* didLoad

  * メインスレッドで呼ばれます
  * UI関連の操作や初期化を自由に行えます

* layoutSpecThatFits

  * 任意のスレッドから呼べます
  * レイアウト計算の主要メソッドです
  * UI関連の操作や他のNodeの作成は行えず、superの呼び出しも不要です
  * また公式はlayoutをCacheしないよう推奨しており、可能な限り毎回再計算してください

* layout

  * メインスレッドで呼ばれます
  * viewWillLayoutSubviewsにやや似ており、superメソッドを呼び出す必要があります。これにより自身とsubnodesのレイアウト計算が行われます
  * hiddenや背景色など、UIの基本的な情報設定に適していますが、レイアウト設定は含みません
  * UIView関連のオブジェクトを設定する必要がある場合、layout内でframeを設定できますが、できるだけinitWithViewBlockメソッドを使い、バックグラウンドプロセスに移すことをお勧めします
  * 公式が挙げた使用例では、colletionNodeの全画面設定はlayoutメソッド内で行うのが適切です

      subnode.frame = self.bounds;

#### ASViewController

UIViewControllerのサブクラスで、すべてメインスレッド操作です

* init

  * self.viewやself.node.viewにはアクセスしないでください。ビューが早すぎるタイミングで初期化されることを強制し、問題を引き起こすおそれがあります
  * `initWithNode`メソッドが付属しており、nodeの管理方法はviewと同様です

* loadView

    * このメソッドは使わないよう公式が推奨しています。まったく役に立たないためです
    * ここでself.viewの対応するビューオブジェクトを自分で変更しないでください。superメソッドを呼ぶとnode.viewに設定されるためです

* viewDidLoad

  * レイアウトロジックは書かないでください

* viewWillLayoutSubviews

  * nodeのlayoutメソッドと一緒に呼ばれます
  * nodeのboundsの変化（回転、分割画面、キーボード表示を含む）時、および子nodeが変更された時にも呼ばれます
  * レイアウトロジックはここに書くよう公式が推奨しています（sizeに強く依存しないコード）

* viewWillAppear / viewDidDisappear

  * ユーザー行動のログ収集に適しています

  * Controllerのアニメーション操作に適しています

# 使い方

* Layout Specs

* Layout Element Properties

  * ASStackLayoutElement Properties
  * ASAbsoluteLayoutElement Properties
  * ASLayoutElement Properties

* 複数の代入方法に対応

```objc
// dimension returned is relative (%)
ASDimensionMake(@"50%");
ASDimensionMakeWithFraction(0.5);

// dimension returned in points
ASDimensionMake(@"70pt")
ASDimensionMake(70);
ASDimensionMakeWithPoints(70);
```

* Batch Fetching API

  プリロード用の公式メソッドで、無限スクロール機能を実現します

```objc
-tableNode:willBeginBatchFetchWithContext:
-collectionNode:willBeginBatchFetchWithContext:
```

* `ASDisplayNode`はすべてのNodeの始祖クラスです。

* レイアウトを更新する際は、setNeedsLayoutを呼び出すのを忘れないでください

* `automaticallyManagesSubnodes`メソッドで子nodeを自動管理できるため、手動でaddSubNodeする必要はありません

* `inverted`でtableNode、collectionNode全体のNSIndexPathを反転でき、一番下のcellNodeがNSIndexPath(0, 0)になります。例えばチャット系のアプリでは非常に便利です

* `imageModificationBlock`はImageNodeのblockで、角丸の切り抜きなどの後処理を行えます

* `shouldRasterizeDescendants`はサブツリーのラスタライズです。VVeboのような効果を意味し、1点内のすべてのnode階層が1つのlayer上に描画されます

* `neverShowPlaceholders`はcellNodeを同期描画します。メインスレッドはインターフェースの描画が完了するまでロックされます

* カスタムの`ASViewController`または`ASDisplayNode`のサブクラスを作る際は注意が必要です。両者の違いは非常に微妙です

* ASImageNode、ASButtonNode、ASTextNodeはともにASControlNodeのサブクラスで、`addTarget(self, action: "handleXXX", forControlEvents: .TouchUpInside)`を直接使ってクリック応答イベントを追加でき、addGestureなどの方法を避けられます

* ASImageNodeはUIImageViewの優れた代替品です。ASImageNodeはバックグラウンドスレッドでUIImageをレンダリングし、その後メインスレッドで画像を提示します。したがってASImageNodeはFPSを大幅に向上させられます。

  ローカル画像の場合、UIImageインスタンスを直接ASImageNode.imageに代入できます。

  ネットワーク画像の場合、ASNetworkImageNodeを使うべきで、同時にASNetworkImageNodeにImageManagerを指定して、ネットワークリクエスト、画像キャッシュなどの操作を管理させる必要があります。

* hitTestSlopプロパティでクリック応答領域を拡大できます

* enableHitTestDebug

  ADKは多くのdebug機能を提供しており、これは応答領域をテストするものです。応答可能領域は緑色になります

# FAQ

* よくあるエラー

  * `-init:`メソッド内でnode.viewにアクセスするのは禁止です
  * node blockの外部でdata sourceにアクセスするようにしてください
  * viewBlocksは循環参照を避けてください

* よくある概念の誤解

  * ASCellNodeは再利用されません
  * LayoutSpecsはlayoutが呼ばれるたびに実行されます
  * AsyncDisplayKitは強力な独自レイアウトAPIを持ち、使い方はシステムのAPIと大きく異なります

* よくある性能問題のシナリオ
  * `cornerRadius`プロパティ（および`shadowPath`、`border`、`mask`）の使用は避けてください
  * ASDKはAuto Layoutに非対応です
  * ASDisplayNodeのポインタはaliveが保たれます（システムでも、layerがUIViewのsuper layerに追加された後は、layerのdelegateがweakに設定されていても保持され続けると言われています）

* Corner Rounding

  公式サイトに角丸の分析と最適化に関する記事があります。詳細はドキュメントをご覧ください
