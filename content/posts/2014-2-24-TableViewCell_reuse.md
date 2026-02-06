---
layout: post
title: "关于TableViewCell的复用"
description: "Tutorial"
category: "iOS"
comments : true
tags: ["iOS", "开发", "UITableView"]
---


## 示例

在创建UItableViewCell时，应该采用如下方式进行实例化。

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

在ios系统中，tableView的列表单元是不断复用的，这样可以在移动设备上可以保持较高的运行效率，所以采用android系统的移动设备上复用机制也很常用，这个后面再说。

在tableview进行列表单元的绘制时，假设屏幕可容纳的cell的最大数量为6，由于此时内存中此前没有创建过cell对象，所有需要执行2处操作来依次创建，当列表开始向上滑动，上层cell消失，下层cell会利用内存中已存在的cell对象来进行资源复用。

但是如果cell中存在比较复杂的view结构，比如一个button，而相应的创建过程一定要放在2后面，而不能放在3后面，否则会出现叠层的view，因为cell是不断复用的，最初创建的button依然存在。

那么，如果我们想要定制每个cell的内容，需要对cell进行唯一标识，也就是`dequeueReusableCellWithIdentifier:CMainCell`的作用，
通过唯一的索引来得到cell对象进行相应的定制。

## 与android对比

在android中列表控件叫做listview，单纯从名字上来讲，android的定义更为清晰准确。

andorid的列表单元复用与ios非常类似，通用做法是创建viewholder来建立cell的缓存，并为每个cell设置tag进行唯一标识。
