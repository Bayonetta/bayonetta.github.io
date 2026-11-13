---
layout: post
title: "AsyncDisplayKit学习笔记"
description: "AsyncDisplayKit 的 node 生命周期、布局引擎与踩坑记录。"
category: "iOS"
comments: true
tags: [AsyncDisplayKit, Facebook, iOS, 开发]
---

补充一句背景：AsyncDisplayKit 在 2018 年改名为 Texture，下面的 API 名称都是 2017 年的写法。核心概念没变，但具体接口以现在的文档为准。

## 介绍

AsyncDisplayKit 的核心概念是 node。`ASDisplayNode` 是基于 UIView 或 CALayer 的抽象，看头文件也能大致看出来，它把 view 与 layer 相关属性整合到了一起。

- `layerBacked` 可以设置成直接用 layer 构成 node，默认是一个 `_ASDisplayView` 的内部类对应 node。
- 拥有自己的 layout 引擎，思路类似 CSS，不支持 Auto Layout。

### ASDisplayNode

**init**

- 任何线程调用。
- touch 事件或手势绑定不要在这里做，放到 `didLoad` 里。

**didLoad**

- 主线程调用。
- 可以做任何 UI 相关操作和初始化。

**layoutSpecThatFits**

- 任何线程调用。
- 计算布局的主要方法。
- 不可进行任何 UI 相关操作，不能创建其他 node，也不需要调用 super。
- 官方建议不要缓存 layout，尽量每次都重算。

**layout**

- 主线程调用。
- 类似 `viewWillLayoutSubviews`，需要调 super，才会进行自身和 subnode 的布局运算。
- 适合设置 hidden、背景色这类 UI 基本信息，但不包含布局设置。
- 如果要操作 UIView 对象，可以在 layout 里设 frame；尽量用 `initWithViewBlock` 方法，把它放到后台线程。
- 官方举过一个例子：collectionNode 设成全屏，适合在 layout 方法里调用。

```objc
subnode.frame = self.bounds;
```

### ASViewController

UIViewController 的子类，都是主线程操作。

**init**

- 不要访问 `self.view` 或 `self.node.view`，那会强迫视图过早初始化，容易引出问题。
- 自带 `initWithNode` 方法初始化，它管理 node 的方式和 view 类似。

**loadView**

- 官方建议不要用这个方法，因为确实没什么用。
- 在这里不要自行改变 `self.view` 对应的视图对象，因为调 super 会把它设到 `node.view` 上。

**viewDidLoad**

- 不要写任何布局逻辑。

**viewWillLayoutSubviews**

- 与 node 的 layout 方法一起调用。
- 会在 node 的 bounds 发生变化时调用（旋转、分屏、键盘弹出都算），子 node 变化时也会。
- 官方建议把布局逻辑写在这里，指那些不强依赖 size 的代码。

**viewWillAppear / viewDidDisappear**

- 适合统计用户行为 log。
- 适合做 Controller 的动画操作。

## 用法

- Layout Specs
- Layout Element Properties
  - ASStackLayoutElement Properties
  - ASAbsoluteLayoutElement Properties
  - ASLayoutElement Properties
- 尺寸支持多种赋值方式：

```objc

// dimension returned is relative (%)
ASDimensionMake(@"50%");  
ASDimensionMakeWithFraction(0.5);

// dimension returned in points
ASDimensionMake(@"70pt")
ASDimensionMake(70);      
ASDimensionMakeWithPoints(70);

```

- Batch Fetching API：官方提供的方法，用来做预加载，实现无限滚动。

```objc
-tableNode:willBeginBatchFetchWithContext:
-collectionNode:willBeginBatchFetchWithContext:
```

- `ASDisplayNode` 是一切 node 的始祖类。
- 更新布局记得调 `setNeedsLayout`。
- `automaticallyManagesSubnodes` 可以自动管理子 node，不用再手动 `addSubnode`。
- `inverted` 可以翻转 tableNode、collectionNode 的 NSIndexPath，最下方的 cellNode 变成 `NSIndexPath(0, 0)`，做聊天类 App 会方便很多。
- `imageModificationBlock` 是 imageNode 的 block，可以做后期处理，比如圆角裁剪。
- `shouldRasterizeDescendants` 做子树光栅化，类似 VVebo 的效果：一个点内的所有 node 层级都会绘制到一个 layer 上。
- `neverShowPlaceholders` 会同步绘制 cellNode，主线程会锁住，直到界面绘制完成。
- 自定义 `ASViewController` 或 `ASDisplayNode` 的子类时要细心，两者区别很微妙。
- ASImageNode、ASButtonNode、ASTextNode 同为 ASControlNode 的子类，可以直接用 `addTarget(self, action: "handleXXX", forControlEvents: .TouchUpInside)` 加点击响应，避免走 `addGesture`。
- ASImageNode 是 UIImageView 的极佳替代品：它在后台线程把 UIImage 渲染好，再回主线程呈现，FPS 提升很明显。
  - 本地图像可以直接把 UIImage 实例赋给 `ASImageNode.image`。
  - 网络图像应该用 ASNetworkImageNode，并给它指定一个 ImageManager 管理网络请求与图像缓存。
- `hitTestSlop` 属性可以扩大点击响应区域。
- `enableHitTestDebug`：ADK 提供不少 debug 功能，这个是测响应区域的，可响应区域会变成绿色。

## FAQ

**常见错误**

- 禁止在 `-init:` 方法里访问 `node.view`。
- 确保在 node block 外部访问 data source。
- viewBlock 注意避免循环引用。

**常见概念误区**

- 「ASCellNode 不会复用」——会复用。它不走 reuse identifier 那套，但 cell 实例确实会被回收重排。
- LayoutSpec 不是只在初始化时算一次，每次 layout 被调用都会执行。
- AsyncDisplayKit 有自己的布局 API，用法和系统 API 差别很大，别按 Auto Layout 的思路硬套。

**常见性能问题场景**

- 避免使用 `cornerRadius` 属性，同理还有 `shadowPath`、`border`、`mask`。
- ASDK 不支持 Auto Layout。
- ASDisplayNode 的指针会保持 alive。据说系统里当 layer 被添加到 UIView 的 super layer 之后也会一直保留，即使 layer 的 delegate 是 weak。

**Corner Rounding**

官网有一篇圆角的分析和优化文章，具体看文档。
