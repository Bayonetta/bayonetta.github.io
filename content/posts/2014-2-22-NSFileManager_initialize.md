---
layout: post
title: "NSFileManager实例化方式"
description: "defaultManager 到底安不安全，以及什么时候必须用 alloc/init。"
category: "iOS"
comments : true
tags: ["iOS", "NSFileManager", "开发"]
---

对于 NSFileManager 的使用，一直以来我都是用 `[NSFileManager defaultManager]` 来获取单例，再进行相关操作。

```objc

NSFileManager *fileManager = [NSFileManager defaultManager];

if ([fileManager fileExistsAtPath:sourceFile]) {

  NSError *error = nil;
  if (![fileManager copyItemAtPath:sourceFile
                            toPath:destFile
                             error:&error]) {
    // Deal with error
  }
}

```

后来查文档时看到一段说明，当时理解偏了，这里把原文和正确的读法都记一下。

## 文档原文

> The methods of the shared NSFileManager object can be called from multiple threads safely. However, if you use a delegate to receive notifications about the status of move, copy, remove, and link operations, you should create a unique instance of the file manager object, assign your delegate to that object, and use that file manager to initiate your operations.

意思是：共享单例的方法可以在多线程下安全调用。但如果你用 delegate 来接收移动、复制、删除和链接操作的状态通知，就应该创建一个独立实例，把 delegate 绑到它上面，并用这个实例发起操作。

> In iOS and Mac OS X v 10.5 and later you should consider using [[NSFileManager alloc] init] rather than the singleton method defaultManager. Instances of NSFileManager are considered thread-safe when created using [[NSFileManager alloc] init].

这段是更早版本的文档措辞，说的是「可以考虑用 alloc/init 代替 defaultManager」。

## 正确的结论

两段话放在一起，很容易读成「defaultManager 不是线程安全的」，我当年就是这么读的。这是错的。

准确的说法是：**`defaultManager` 的方法本身线程安全**，多线程同时调 `fileExistsAtPath:`、`copyItemAtPath:` 这类方法没有问题。真正需要独立实例的只有一种情况——你要挂 delegate 收操作通知。因为 delegate 是实例级的属性，共享单例上挂 delegate，多个调用方会互相覆盖，通知也就发给了错误的对象。

所以修法不是「一律别用 defaultManager」，而是：

```objc
// 普通文件操作：单例即可，线程安全
NSFileManager *fm = [NSFileManager defaultManager];

// 需要接收操作状态通知：用独立实例，delegate 才不会互相干扰
NSFileManager *delegated = [[NSFileManager alloc] init];
delegated.delegate = self;
[delegated copyItemAtPath:sourceFile toPath:destFile error:&error];
```

`[[NSFileManager alloc] init]` 创建的实例同样是线程安全的，这一点文档写得很清楚。两种写法都不需要手动 release——ARC 会管。

顺带一提，现在做文件操作更推荐 `NSFileManager` 的 URL 版本 API（`copyItemAtURL:toURL:error:`），路径版本在沙盒和符号链接的场景下更容易出意外。

----
More:

* Apple Developer Docs：[NSFileManager Class Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/nsfilemanager_Class/Reference/Reference.html)
* Blog： [NSFileManager defaultManager Is Not Thread Safe](http://useyourloaf.com/blog/2011/06/12/nsfilemanager-defaultmanager-is-not-thread-safe.html)
