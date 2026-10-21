---
layout: post
title: "上質なiOS開発環境を構築する"
description: "チュートリアル"
category: "iOS"
comments: true
tags: ['iOS','Xcode','IDE']
machineTranslated: true
---

数ヶ月前、仕事の関係で主力の開発方向をAndroidからiOSに切り替えました。Eclipseや0.x時代のAndroid Studioがどれほど不作法で不安定で、肥大化していて不便だったかを味わっていたので、初めてXcodeを開いたときは、羊飼いの少年が初めて大都会に出会ったように、濃厚な幸福感と新鮮さが込み上げてきました。十分に上質なUI、華麗なインタラクション、トラックパッドと深く結びついた便利な操作、そのすべてが目頭を熱くさせました。

感慨に浸ったのは、MacでのXcodeの体験が際立っていることを説明したかったからです。最もよく使う生産プラットフォームとしてそれを使えるのは幸運なことです。しかし素のXcodeにはまだ不満な点が多いので、それをより完璧に仕上げることが第一歩です。

## Theme

githubには非常に多くの選択可能なテーマがあり、<a href="https://github.com/tursunovic/xcode-themes">xcode-themes</a>はその中でも比較的充実したコレクションです。

私が使っているのは<a href="https://github.com/brianmichel/solarized/tree/master/apple-xcode4-solarized">Solarized</a>。複数プラットフォーム対応の汎用テーマで、DarkとLightの2種類のスタイルを提供しています。

<figure class="half">
  <img src="/images/2014-3-13-1.png" alt=""/>
  <img src="/images/2014-3-13-2.png" alt=""/>
  <figcaption>初めて見たときから、もう救いがたく恋に落ちていました</figcaption>
</figure>

## Font

システムフォントの`Monaco`。私の唯一の選択です。以前はLinux/Windows下でずっと`YaHei Consolas Hybrid`を使っていました。Consolas + 微软雅黒の組み合わせはかつて私の感覚を完全に征服しましたが、Macでの表示効果は期待通りではありませんでした。

<figure>
  <img src="/images/2014-3-13-3.png" alt=""/>
  <figcaption>滑らかな角丸、もう胸が高鳴ります</figcaption>
</figure>

## Snippets

Code SnippetsはXcode version4から導入され、インターフェース全体の右下にあり、ショートカットキー cmd + ctrl + opt + 2 で呼び出せます。Code Snippetsはコードのテンプレートで、よくあるプログラミングパターンに対して、Xcodeはそれらのコードをテンプレートとして抽象化してCode Snippetsに格納しています。使うときはショートカットキーを打つだけで、テンプレートの内容をコードに流し込めます。

`<#`xxx`#>`と入力すると、囲った領域'xxx'が未記入状態になり、Snippetsの記入に非常に便利です。この用法はXcodeの至る所に見られます。

mattt氏の<a href="https://github.com/mattt/Xcode-Snippets">Xcode-Snippets</a>プロジェクトをお勧めします。日常開発で使う绝大部分のコード断片を含んでいます。

これはGithubのGistやDash付属のコード断片収集ツールを使うよりもずっと便利です。Xcodeと深く結びついているためショートカットキーを設定して快速補完でき、実に痛快です。

## Plugins

* 猫神 onevcat の <a href="https://github.com/onevcat/VVDocumenter-Xcode">VVDocumenter-Xcode</a>。star数は2000+に迫り、メソッド先頭のドキュメント説明の書式テンプレートを自動生成できます。トリガー方法は `///`

* <a href="https://github.com/omz/ColorSense-for-Xcode">ColorSense-for-Xcode</a>。色の設定を可視化します

* <a href="https://github.com/holtwick/HOStringSense-for-Xcode">HOStringSense-for-Xcode</a>。通常モードで文字列の長さを補助表示し、特殊文字の自動エスケープもできます

* <a href="https://github.com/stefanceriu/SCXodeMiniMap">SCXodeMiniMap</a>。SublimeTextのようなminimapを追加でき、とてもCoolです

* <a href="https://github.com/questbeat/Lin-Xcode5">Lin-Xcode5</a>。ローカライズ操作を直接索引・編集できます

* <a href="https://github.com/ksuther/KSImageNamed-Xcode">KSImageNamed-Xcode</a>。`Images.xcassets`下にアーカイブされた画像ファイルを自動索引・プレビューでき、非常に実用的です

* <a href="https://github.com/garnett/AutoresizeMask-for-Xcode">AutoresizeMask-for-Xcode</a>。`autoresizeMask`の設定を可視化します

* <a href="https://github.com/JugglerShu/XVim">XVim</a>。vim modeを完全に移植し、コマンド操作を好む人向けに`:build`、`:run`を追加しました。個人的にはMac下で完全に汎用のemacsテキスト編集モードを使う方が好きで、加えて合理的なキー配置のショートカットがあれば、開発を非常に便捷にできます。

プラグインのインストールパスは`~/Library/Application Support/Developer/Shared/Xcode/Plug-ins`です。各自の好みで自由に増減してください。

## Debugger

<a href="https://github.com/facebook/chisel">chisel</a>はFacebookのオープンソースツールで、XcodeのデバッガLLDBを強化します。

### インストール

```bash
$ ~/.lldbinit
...
command script import /path/to/fblldb.py
```

すべての設定ファイルはクラウドストレージに入れ、ユーザーのホームディレクトリにシンボリックリンクを作成することをお勧めします。そうすれば再インストールしても設定ファイルを失わず、手間が省けます。

### 追加されたカスタムコマンド

コマンド|説明
:---------------|:---------------
pviews                            |keyWindowに含まれるViewの記述情報を再帰的に出力します|
pvc                               |keyWindowに含まれるViewControolerの記述情報を再帰的に出力します|
visualize                         |Mac上のPreview.appを使ってUIImage、UIViewまたはCALayerを表示します|
fv                                |View階層ツリーから正規表現に一致するクラス名のビューを検索します|
fvc                               |ViewController階層ツリーから正規表現に一致するクラス名のビューを検索します|
show/hide                         |指定したViewまたはLayerを表示・非表示します。これ以上の処理をしなくても変化を確認できます|
mask/unmask                       |透明な矩形でViewまたはLayerを標示します|
border/unborder                   |可視な矩形でViewまたはLayerを標示します|
caflush                           |レンダラーを更新します（アニメーションがなければ実効は"repaint"と同等です）|
bmessage                          |クラスメソッドまたはインスタンスメソッドにシンボリックブレークポイントを設置します。クラスの継承を心配する必要はありません|
wivar                             |インスタンス変数にウォッチポイントを設定します|
presponder                        |指定したオブジェクトのresponderチェーンを出力します|
...                               |... まだまだあります|

## More:

* NSHipterの最新記事<a href="http://nshipster.com/xcode-plugins/">Xcode Plugins</a>がもっと凄いプラグインを紹介しています（NSHipterはどんどん退屈になっていきます。Mattt氏は本当に書くことがなくなったに違いありません）
* 唐巧は自身のオープンソースプロジェクト<a href="https://github.com/tangqiaoboy/xcode_tool">Xcode-tool</a>でSnippetsの自動インストールスクリプトを提供しています
