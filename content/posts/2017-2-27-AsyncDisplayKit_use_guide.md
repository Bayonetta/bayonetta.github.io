---
layout: post
title: "AsyncDisplayKit学习笔记"
description: "Tutorial"
category: "iOS"
comments: true
tags: [AsyncDisplayKit, Facebook, iOS, 开发]
---



# 介绍

AsyncDisplayKit的核心概念就是node。`ASDisplayNode	`是一个基于UIView或CALayer的抽象概念，通过看对应的头文件也能基本看出来，它把View与layer相关属性都整合到一起了。

* `layerBacked`可以设置成直接用layer构成node，默认是一个_ASDisplayView的一个内部类对应Node

* 拥有自己的layout引擎，类似CSS，不支持Auto Layout


#### ASDisplayNode

* init

	* 任何线程调用
	* touch事件或者手势绑定不要在这里执行，放到didLoad里面

* didLoad
	
	* 主线程调用
	* 可以进行任何UI相关操作和初始化
	
* layoutSpecThatFits

	* 任何线程调用 
	* 计算布局的主要方法
	* 不可进行任何UI相关操作和其他Node的创建，也不需要进行Super调用
	* 另外官方建议不要Cache layout，尽量每次都重算。
	
	
* layout

	* 主线程调用
	* 比较类似viewWillLayoutSubviews，需要调用super方法，以致进行自身和subnodes的布局运算
	* 适合进行hidden或者背景色等UI基本信息设置，但不包含布局设置
	* 如果要设置UIView相关对象，可以在layout中设置frame，尽量使用initWithViewBlock方法，放到后台进程
	* 官方举了个使用例子，colletionNode设置全屏适合在layout方法中调用
	
			subnode.frame = self.bounds;


	
#### ASViewController

UIViewController的子类，都是主线程操作

* init

	* 不要访问self.view或者self.node.view，这样会强迫视图被过早初始化，以免引发问题。
	* 自带`initWithNode`方法初始化，其自身管理node的方法和view类似
	
* loadView

    * 官方建议不使用此方法，因为实在没用。
    * 在这里不要自行改变self.view的对应视图对象，因为调用super方法会设置到node.view上
   

* viewDidLoad

 	* 不要写任何布局逻辑

* viewWillLayoutSubviews

	* 与node的layout方法一起调用
	* 会在node的bounds行为（包括旋转、分屏、键盘弹出）改变时调用，也包括子node被改变时
	* 官方建议把布局逻辑写在这里（不强依赖于size的代码）
	
* viewWillAppear / viewDidDisappear

	* 适合统计用户行为log
	* 适合进行Controller的动画操作
	
	
	
# 用法

* Layout Specs 

* Layout Element Properties

	* ASStackLayoutElement Properties
	* ASAbsoluteLayoutElement Properties
	* ASLayoutElement Properties
	
* 支持多种赋值

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

	官方提供方法用做预加载，实现无限滚动功能

```objc
-tableNode:willBeginBatchFetchWithContext:
-collectionNode:willBeginBatchFetchWithContext:
```

* `ASDisplayNode`是一切Node的始祖类。

* 更新布局，记得调用setNeedsLayout

* `automaticallyManagesSubnodes`方法可以自动管理子node，不用再手动addSubNode


* `inverted`可以翻转整个tableNode、CollectionNode的NSIndexPath，最下方的cellNode变成NSIndexPath(0, 0), 比如聊天类的app会方便很多

* `imageModificationBlock`是ImageNode的block，可以做一个后期处理，比如圆角裁剪等

* `shouldRasterizeDescendants` 子树光栅化，意味着类似VVebo的效果，一个点内的所有node层级都会绘制到一个layer上

* `neverShowPlaceholders`同步绘制cellNode，主线程会锁死，知道界面完成绘制

* 自定义`ASViewController`或者`ASDisplayNode`的子类时要细心，因为它们的区别很微妙。

* ASImageNode、ASButtonNode、ASTextNode 同为 ASControlNode 子类，可以直接使用 `addTarget(self, action: "handleXXX", forControlEvents: .TouchUpInside)` 为它们添加点击响应事件，而避免使用addGesture等方法。

* ASImageNode 是 UIImageView 的极佳替代品，ASImageNode 会在后台线程渲染好 UIImage ，然后再在主线程中呈现图像。 因此，ASImageNode可以极大地提升FPS数值。
	
			如果是本地图像，你可以直接将一个 UIImage 实例赋值到 ASImageNode.image 中。
			
			如果是网络图像，你应该使用 ASNetworkImageNode， 同时你需要为 ASNetworkImageNode 指定一个 ImageManager 用于管理网络请求、图像缓存等操作。
	
	
* hitTestSlop属性可以扩大点击响应区域

* enableHitTestDebug 

	ADK提供很多debug功能，这个是测试相应区域的，可响应区域会变成绿色


# FAQ	

* 常见错误

	* 禁止在`-init:`方法访问node.view
	* 确保在node block外部访问data source
	* viewBlocks避免循环引用
	
* 常见概念误区

	* ASCellNode不会复用
	* LayoutSpecs会在每次layout被调用时执行
	* AsyncDisplayKit有自己的强大布局API，用法上和系统的API又很大区别
	
	
* 常见性能问题场景
	* 避免使用`cornerRadius`属性（以及`shadowPath`，`border`, `mask`）
	* ASDK不支持Auto Layout
	* ASDisplayNode的指针会保持alive（据说系统中当layer被添加到UIView的super layer上后，也会一直保留，即使layer的delegate被置为weak）


* Corner Rounding

	官网有一篇圆角的分析和优化文章，具体可以看文档


