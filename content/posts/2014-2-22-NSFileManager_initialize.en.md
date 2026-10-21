---
layout: post
title: "How to instantiate NSFileManager"
description: "Tutorial"
category: "iOS"
comments: true
tags: ["iOS", "NSFileManager", "Develop"]
machineTranslated: true
---

As for the use of NSFileManager, I have always used the singleton obtained with `[NSFileManager defaultManager]` to perform related operations.

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

Here is Apple's note on Developer about instantiating NSFileManager:

> The methods of the shared NSFileManager object can be called from multiple threads safely. However, if you use a delegate to receive notifications about the status of move, copy, remove, and link operations, you should create a unique instance of the file manager object, assign your delegate to that object, and use that file manager to initiate your operations.

The shared singleton can safely be called from multiple threads. However, if you use a delegate to receive notifications about move, copy, remove and link operations, you should create a unique instance, bind the delegate to that instance, and use that instance to initiate your operations.

> In iOS and Mac OS X v 10.5 and later you should consider using [[NSFileManager alloc] init] rather than the singleton method defaultManager. Instances of NSFileManager are considered thread-safe when created using [[NSFileManager alloc] init].

Therefore the shared singleton obtained with `[NSFileManager defaultManager]` is not thread-safe. The officially recommended approach is to instantiate with `[[NSFileManager alloc] init]`.

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

// [fileManager release]; // no manual release needed under ARC
```

----
More:

* Apple Developer Docs: [NSFileManager Class Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/nsfilemanager_Class/Reference/Reference.html)
* Blog: [NSFileManager defaultManager Is Not Thread Safe](http://useyourloaf.com/blog/2011/06/12/nsfilemanager-defaultmanager-is-not-thread-safe.html)
