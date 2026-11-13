---
layout: post
title: "关于TableViewCell的复用"
description: "Tutorial"
category: "iOS"
comments : true
tags: ["iOS", "开发", "UITableView"]
---

## 示例

```objc
static NSString * const kMainCellIdentifier = @"MainCell";

- (UITableViewCell *)tableView:(UITableView *)tableView
         cellForRowAtIndexPath:(NSIndexPath *)indexPath {

    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kMainCellIdentifier];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault
                                      reuseIdentifier:kMainCellIdentifier];
        // 复杂子视图在这里创建，只创建一次
    }

    // 每次复用都要重新赋值，不要在这里新建子视图
    cell.textLabel.text = self.items[indexPath.row];
    return cell;
}
```

## 原理

iOS 里 tableView 的列表单元是不断复用的，这样在移动设备上能保持较高的运行效率。Android 的列表控件也有类似机制，后面再说。

绘制列表时，假设屏幕能容纳 6 个 cell，而内存里此前没创建过 cell 对象，那么每个位置都要走一遍 2 处的创建流程。等列表往上滑、上层的 cell 移出屏幕，下层就会从内存里拿已经存在的 cell 对象来复用，不再新建。

这里有个容易踩的地方：如果 cell 里存在比较复杂的 view 结构，比如一个 button，那它的创建过程必须放在 2 后面，不能放在 3 后面。否则会出现叠层的 view——cell 是复用的，最初创建的那个 button 一直还在。

如果不同行的布局确实不同，就定义多个标识，按数据类型在 `cellForRowAtIndexPath:` 里分支选择，而不是按行号。

## 与 Android 对比

Android 的列表控件叫 ListView，单从名字上讲，Android 的定义更清楚一些。

它的复用机制跟 iOS 很像，通用做法是用 ViewHolder 缓存子 view 的引用，避免每次 `findViewById`。后来官方推 RecyclerView，ViewHolder 从「约定」变成了「强制」。这一点其实比当年的 iOS 更省心——iOS 这边漏写复用不会报错，只是悄悄变慢。
