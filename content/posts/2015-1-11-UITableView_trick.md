---
layout: post
title: "UITableView如何禁止HeaderView停留的小技巧"
description: "Tutorial"
category: "iOS"
comments : true
tags: ["iOS", "开发", "UITableView"]
---

UITableView 自带一个行为：设置了 headerView 之后，只要当前 section 还有 cell 在屏幕上方，header 就会停在顶端，提示当前 section 的信息，类似黏性效果。

但有些设计不想要这个特性，又不想为此换成 UICollectionView 去模拟 tableView。那就得想办法让 headerView 不停留。

## 方案一：用 contentInset 顶回去

实现 `scrollViewDidScroll` 代理方法，按竖直方向的 contentOffset 去抵消 header 的停留：

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

这个办法缺陷不小。section 数量为 1 时还能凑合，数量一多就乱了——contentInset 是整个 scrollView 级别的属性，它不知道现在是哪个 section 的 header 在停，只能按一个固定的 `sectionHeaderHeight` 去压。而且 inset 一改，滚动范围和回弹行为跟着变，底部的 footer 也可能被一起顶掉。

## 方案二：插空 section

实测下来，headerView 只在「当前 section 还有 cell 位于屏幕上方」的时候才会停留。

那就利用这一点：在原始布局里插入内容为空的 section，让 header 提前「用完」自己的 section，停留自然就不发生了。footerView 同理。

这个办法不动 scrollView 的属性，副作用小，代价是数据源要多维护一层空 section 的映射，`numberOfSections` 和 `numberOfRowsInSection` 里得把索引换算清楚。section 数量固定的话，我更倾向这个。
