---
layout: post
title: "TableViewCellの再利用について"
description: "チュートリアル"
category: "iOS"
comments: true
tags: ["iOS", "开发", "UITableView"]
machineTranslated: true
---

## 例

UItableViewCellを作成する際は、次のような方法でインスタンス化すべきです。

```objc
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {

    NSString *CMainCell = [NSString stringWithFormat:@"Cell%d",indexPath.row];     //  0

    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CMainCell];      //   1
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault  reuseIdentifier: CMainCell];    //  2

        ...
    }

    // Adjust cell content
    cell.textLabel.text = @"XXX";    //  3

    ...

    return cell;
}
```

## 原理

iOSシステムでは、tableViewのリストセルはくり返し再利用されるため、モバイル端末でも比較的高い実行効率を保つことができます。Androidの端末でもこの再利用機構は一般的に使われており、詳細は後述します。

tableViewがリストセルを描画する際、画面に収まるcellの最大数を6と仮定します。この時点ではメモリ上にまだcellオブジェクトが作成されていないため、2の処理を順に実行して作成する必要があります。リストが上にスクロールし始めると、上のcellは消え、下のcellはメモリ上に既に存在するcellオブジェクトを再利用してリソースを節約します。

しかしcellの中にbuttonのような比較的複雑なview構造が含まれる場合、対応する作成処理は必ず2の後ろに置かなければならず、3の後ろに置くとviewが重なってしまいます。cellはくり返し再利用されるため、最初に作成されたbuttonが依然として存在するからです。

では各cellの内容をカスタマイズしたい場合、cellを一意に識別する必要があります。それが`dequeueReusableCellWithIdentifier:CMainCell`の役割です。一意のインデックスによってcellオブジェクトを取得し、それに対してカスタマイズを行います。

## Androidとの比較

Androidではリストコントロールはlistviewと呼ばれ、名前だけから見てもAndroidの定義の方が明確で正確です。

Androidのリストセルの再利用はiOSと非常によく似ており、一般的な做法はviewholderを作成してcellのキャッシュを構築し、各cellにtagを設定して一意に識別することです。
