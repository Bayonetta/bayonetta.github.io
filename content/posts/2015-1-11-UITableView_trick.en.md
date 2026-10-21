---
layout: post
title: "A trick for stopping UITableView HeaderView from sticking"
description: "Tutorial"
category: "iOS"
comments: true
tags: [iOS, 开发，优化]
machineTranslated: true
---

UITableView comes with a built-in behaviour: if you set a headerView, while cells of the current section are visible above it, the headerView stays pinned at the top of the screen to indicate section information — a sticky effect, essentially.

But sometimes this behaviour is not needed in an application's design, and yet you do not want to use UICollectionView to emulate a table view. So we need a solution that makes the headerView stop sticking.

## Solution 1

Subclass `scrollViewDidScroll` and control the movement of the headerView by calculating contentOffset in the vertical direction on screen. This ultimately achieves the expected result.

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

However, this approach has a fairly large drawback. With a single section, solution 1 emulates the movement of the headerView reasonably well, but with more sections the situation becomes considerably more complex, and solution 1 does not achieve the goal very well.

## Solution 2

Testing revealed that the headerView only sticks while the current section still has cells on screen. So you can exploit this by inserting a section with empty content into the original layout, neatly avoiding the headerView sticking.

Of course, the footerView can likewise be prevented from sticking using the same approach.
