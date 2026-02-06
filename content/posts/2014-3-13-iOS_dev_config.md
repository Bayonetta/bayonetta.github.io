---
layout: post
title: "配置优雅的iOS开发环境"
description: "Tutorial"
category: "iOS"
comments : true
tags: ['iOS','Xcode','IDE']
---

几个月前因为工作的关系，将主力开发方向由Android转到iOS，因为体会过Eclipse和0.x时代的Android Studio是如何的笨拙不稳定，如何的臃肿不便，以致初次打开Xcode，竟似牧羊少年初识大都会，随之泛起的是浓浓的幸福和新鲜感。足够优雅的ui，华丽的交互，与触摸板深度结合的便利操作，这一切的一切都直令眼角湿润。

感慨了不少，不过是想说明Xcode在Mac下的体验称的上是出类拔萃，能够将它作为最常使用的生产平台可以说是幸运的。但是原生的Xcode尚有很多不如人意的地方，所以将它打造的更加完美便是第一步。

## Theme

github上有非常多的可选主题，<a href="https://github.com/tursunovic/xcode-themes">xcode-themes</a>是其中比较全面的主题集合。

我使用的是<a href="https://github.com/brianmichel/solarized/tree/master/apple-xcode4-solarized">Solarized</a>，一款多平台下的通用主题，它提供Dark和Light两种不同样式。

<figure class="half">
	<img src="/images/2014-3-13-1.png" alt=""/>
	<img src="/images/2014-3-13-2.png" alt=""/>
	<figcaption>第一次见到，就已经无可救药的爱上她了</figcaption>
</figure>

## Font

系统字体`Monaco`，我的唯一选择。之前在Linux/Windows下一直使用`YaHei Consolas Hybrid`，Consolas + 微软雅黑的搭配曾经一度征服我的感官，但是Mac下的显示效果并不尽如人意。

<figure>
	<img src="/images/2014-3-13-3.png" alt=""/>
	<figcaption>顺滑的圆角，已然怦然心动</figcaption>
</figure>

## Snippets

Xcode从Version4开始引入Code Snippets，在整个界面的右下角，可以通过快捷键：cmd + ctrl + opt + 2 调出来。Code Snippets是一些代码的模版，对于一些常见的编程模式，Xcode都将这些代码抽象成模版放到Code Snippet中，使用的时候，只需要键入快捷键，就可以把模版的内容填到代码中。

输入`<#`xxx`#>`可以使圈中区域'xxx'变为待填充状态，在Snippets的填写中十分有用，这种用法在Xcode中到处可见。

推荐mattt大神的<a href="https://github.com/mattt/Xcode-Snippets">Xcode-Snippets</a>项目, 包含了常用开发中绝大部分代码片段。

这比用Github的Gist或者Dash自带的代码片段收集工具要方便很大，因为其与Xcode的深度绑定，可以设置快捷键进行快速补全，无比畅快。

## Plugins

* 猫神 onevcat 的 [VVDocumenter-Xcode](https://github.com/onevcat/VVDocumenter-Xcode)，star 数直逼 2000+，可以自动生成方法头部文档说明的格式范本，触发方式为 `///`

* [ColorSense-for-Xcode](https://github.com/omz/ColorSense-for-Xcode)，将颜色配置可视化

* [HOStringSense-for-Xcode](https://github.com/holtwick/HOStringSense-for-Xcode)，常规模式下辅助显示字符串长度，并可以自动对特殊字符进行自动转义

* [SCXodeMiniMap](https://github.com/stefanceriu/SCXcodeMiniMap)，可以加入类似SublimeText的minimap，非常Cool

* [Lin-Xcode5](href="https://github.com/questbeat/Lin-Xcode5">)，可以直接索引和编辑本地化操作

* [KSImageNamed-Xcode](https://github.com/ksuther/KSImageNamed-Xcode)，可以自动索引并预览归档在`Images.xcassets`下地图片文件，非常实用

* [AutoresizeMask-for-Xcode](https://github.com/garnett/AutoresizeMask-for-Xcode)，将`autoresizeMask`配置可视化

* [XVim](https://github.com/JugglerShu/XVim)，将vim mode完美移植，并加入`:build`, `:run`来满足命令控的需求，但个人更喜欢使用mac下完全通用的emacs文本编辑模式，再加上键位合理的快捷键，足以让开发变得异常便捷。


插件安装路径位于`~/Library/Application Support/Developer/Shared/Xcode/Plug-ins`，各位看官可以根据个人喜欢自由增删。

## Debugger

[chisel](https://github.com/facebook/chisel)是Facebook的开源工具，对Xcode的调试器LLDB进行增强。

### 安装

```bash

$ ~/.lldbinit
...
command script import /path/to/fblldb.py

```

建议把所有配置文件都放在云盘里，在用户根目录下建立软连接，这样就算重新装机也不会丢失配置文件，省去麻烦。

### 添加的自定义命令


命令|描述
:---------------|:---------------
pviews                            |递归打印keyWindow包含的View的描述信息|
pvc                               |递归打印keyWindow包含的ViewControoler的描述信息|
visualize                         |使用Mac上的Preview.app查看UIImage，UIView或者CALayer|
fv                                |在View层级表中查找类名符合正则表达式的视图|
fvc                               |在ViewController层级表中查找类d名符合正则表达式的视图|
show/hide                         |显示后隐藏给出的View或Layer。甚至不需要继续处理就能查看变化|
mask/unmask                       |使用透明矩形标示出View或者Layer|
border/unborder                   |使用可见矩形标示出View或者Layer|
caflush                           |刷新渲染器(如果没有动画实际效果等于“repaint”)|
bmessage                          |在类方法或实例方法上放置象征断点，不用担心类的继承|
wivar                             |在实例对象上设置观察点|
presponder                        |打印出给出对象的responder链|
...                               |... 还有更多|


## More:

 * NSHipter最新一期的文章[Xcode Plugins](http://nshipster.com/xcode-plugins/)介绍了更多更炫的插件(NSHipter越来越无聊了，估计Mattt大神真的是没东西可写了)
 * 唐巧在他的开源项目[Xcode-tool](https://github.com/tangqiaoboy/xcode_tool)中提供了Snippets的自动化安装脚本
