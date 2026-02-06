---
layout: post
title: "NSFileManager实例化方式"
description: "Tutorial"
category: "iOS"
comments : true
tags: ["iOS", "NSFileManager", "Develop"]
---

对于NSFileManager的使用，一直以来我都是用`[NSFileManager defaultManager]`来获取单例的形式来进行相关操作。

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

引用Apple Developer在overview关于NSFileManager实例化的相关说明：

>
The methods of the shared NSFileManager object can be called from multiple threads safely. However, if you use a delegate to receive notifications about the status of move, copy, remove, and link operations, you should create a unique instance of the file manager object, assign your delegate to that object, and use that file manager to initiate your operations.

共享单例是可以在多线程下安全调用的。但是，如果你使用delegate来接受有关移动，复制，删除和链接操作的nitification时，应该创建一个唯一实例，将delegate和它绑定，并使用该实例来开始你的操作。

>
In iOS and Mac OS X v 10.5 and later you should consider using [[NSFileManager alloc] init] rather than the singleton method defaultManager. Instances ofNSFileManager are considered thread-safe when created using [[NSFileManager alloc] init].


所以，`[NSFileManager defaultManager]`获得的共享单例并不是线程安全的，官方推荐的做法时通过`[[NSFileManager alloc]init]`来实例化。

```objc

NSFileManager *fileManager = [[NSFileManager alloc] init];

if ([fileManager fileExistsAtPath:sourceFile]) {

  NSError *error = nil;
  if (![fileManager copyItemAtPath:sourceFile
                            toPath:destFile
                             error:&error]) {
    // Deal with error
  }
}

// [fileManager release]; //ARC不需要手动释放


```

----
More:

* Apple Developer Docs：[NSFileManager Class Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/nsfilemanager_Class/Reference/Reference.html)
* Blog： [NSFileManager defaultManager Is Not Thread Safe](http://useyourloaf.com/blog/2011/06/12/nsfilemanager-defaultmanager-is-not-thread-safe.html)
