---
layout: post
title: "UITableView如何禁止HeaderView停留的小技巧"
description: "Tutorial"
category: "iOS"
comments : true
tags: [iOS, 开发，优化]
---


UITableView提供了一个自带技能，若设置headerView，会在当前Section存在子Cell出现在屏幕上方时，停留在屏幕顶端以提示Section信息，类似黏性的效果。


但有时在应用设计时不需要如上的特性，而又不想使用UICollectionView来模拟tableView的行为。因此，我们需要可使headerView不再停留的解决方案。

## 方案一

继承`scrollViewDidScroll`，通过计算屏幕竖直方向的contentOffset来控制headerView的移动，最终可以达到预期目标。

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


但这种方式存在比较大的缺陷，在section数量为1时，方案一可以较好的模拟headerView的移动，但在section数量更多时，会使情况变的更加复杂，方案一并不能很好的达成目标。


## 方案二

经过测试发现，headView只会在当前section仍然有cell处于屏幕上方时才会发生停留。
所以，可以利用这一点，在原始布局中插入空内容的section，可以巧妙的避免headView的停留。

当然，footerView也同样可以通过上述方式达到禁止停留的效果,
