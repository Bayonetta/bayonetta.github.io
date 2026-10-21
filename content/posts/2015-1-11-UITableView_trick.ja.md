---
layout: post
title: "UITableViewでHeaderViewの停留を禁止する小技"
description: "チュートリアル"
category: "iOS"
comments: true
tags: [iOS, 开发，优化]
machineTranslated: true
---

UITableViewには標準の機能として、headerViewを設定すると、現在のSectionの子Cellが画面上方に現れている間、Section情報を示すために画面の上部に停留する、粘着性のあるような効果があります。

しかしアプリの設計上、上記の特性が不要で、かつtableViewの挙動をUICollectionViewで模倣したくない場合もあります。そのため、headerViewを停留させない解決策が必要になります。

## 方案1

`scrollViewDidScroll`を継承し、画面の縦方向のcontentOffsetを計算してheaderViewの移動を制御します。最終的に期待通りの結果を得ることができます。

```objc
- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGFloat sectionHeaderHeight = 40;
    if (scrollView.contentOffset.y<=sectionHeaderHeight&&scrollView.contentOffset.y>=0) {
        scrollView.contentInset = UIEdgeInsetsMake(-scrollView.contentOffset.y, 0, 0, 0);
    } else if (scrollView.contentOffset.y>=sectionHeaderHeight) {
        scrollView.contentInset = UIEdgeInsetsMake(-sectionHeaderHeight, 0, 0, 0);
    }
}
```

ただし、この方法には比較的大きな欠点があります。Section数が1つの場合、方案1はheaderViewの移動をそれなりに模倣できますが、Section数がさらに増えると状況はより複雑になり、方案1では目標をうまく達成できません。

## 方案2

テストにより、headerViewは現在のSectionにまだ画面上にcellがある場合にのみ停留することが分かりました。そこでこの点を利用し、元のレイアウトに空の内容を持つSectionを挿入すれば、巧みにheaderViewの停留を避けられます。

もちろん、footerViewも同じ方法で停留禁止の効果を得ることができます。
