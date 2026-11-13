---
layout: post
title: "TableViewCellの再利用について"
description: "チュートリアル"
category: "iOS"
comments: true
tags: ["iOS", "開発", "UITableView"]
machineTranslated: true
---

## 原理

iOSシステムでは、tableViewのリストセルはくり返し再利用されるため、モバイル端末でも比較的高い実行効率を保つことができます。Androidの端末でもこの再利用機構は一般的に使われており、詳細は後述します。

tableViewがリストセルを描画する際、画面に収まるcellの最大数を6と仮定します。この時点ではメモリ上にまだcellオブジェクトが作成されていないため、2の処理を順に実行して作成する必要があります。リストが上にスクロールし始めると、上のcellは消え、下のcellはメモリ上に既に存在するcellオブジェクトを再利用してリソースを節約します。

しかしcellの中にbuttonのような比較的複雑なview構造が含まれる場合、対応する作成処理は必ず2の後ろに置かなければならず、3の後ろに置くとviewが重なってしまいます。cellはくり返し再利用されるため、最初に作成されたbuttonが依然として存在するからです。

訂正：ここが元のノートの誤りです。`indexPath.row` から再利用識別子を組み立てると、行ごとに固有の識別子ができてしまい、`dequeueReusableCellWithIdentifier:` は再利用できるセルを永遠に見つけられません。`cell == nil` が毎回成立し、行ごとに新しいセルを確保することになります。小さなリストでは気づかず、データが増えてからスクロールが重くなり、メモリ使用量が右肩上がりになります。

再利用識別子が表すのは「セルの種類」であり、個々のセルではありません。同じレイアウトのセルはひとつの識別子を共有し、行ごとの差分は 3 の内容代入で埋めます。

```objc
static NSString * const kMainCellIdentifier = @"MainCell";

- (UITableViewCell *)tableView:(UITableView *)tableView
         cellForRowAtIndexPath:(NSIndexPath *)indexPath {

    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kMainCellIdentifier];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault
                                      reuseIdentifier:kMainCellIdentifier];
        // 複雑なサブビューはここで一度だけ生成する
    }

    // 再利用のたびに代入し直す。ここでサブビューを生成しない
    cell.textLabel.text = self.items[indexPath.row];
    return cell;
}
```

行ごとにレイアウトが本当に異なる場合は、識別子を複数定義し、`cellForRowAtIndexPath:` の中で行番号ではなくデータ型で分岐させます。

## Androidとの比較

Androidの古い`ListView`も行を再利用していた。`ViewHolder`に子Viewへの参照をキャッシュすることで、`findViewById`を何度も呼び出さずに済む。後に登場した`RecyclerView`では、ViewHolderがアダプターAPIの一部になった。目的はUIKitのセル再利用と同じで、コンテナを使い回し、表示するデータに合わせて内容を更新することだ。
