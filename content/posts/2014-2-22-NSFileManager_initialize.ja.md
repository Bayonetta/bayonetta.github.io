---
layout: post
title: "NSFileManagerのインスタンス化の方法"
description: "チュートリアル"
category: "iOS"
comments: true
tags: ["iOS", "NSFileManager", "Develop"]
machineTranslated: true
---

NSFileManagerの使用にあたって、私はずっと`[NSFileManager defaultManager]`でシングルトンを取得する形で関連操作を行ってきました。

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

Apple Developerのoverviewにある、NSFileManagerのインスタンス化に関する説明を引用します：

> The methods of the shared NSFileManager object can be called from multiple threads safely. However, if you use a delegate to receive notifications about the status of move, copy, remove, and link operations, you should create a unique instance of the file manager object, assign your delegate to that object, and use that file manager to initiate your operations.

共有シングルトンは複数スレッドから安全に呼び出せます。しかし、移動・コピー・削除・リンク操作の状況通知をdelegateで受け取る場合は、ファイルマネージャーのユニークなインスタンスを作成し、そのインスタンスにdelegateを割り当て、そのインスタンスで操作を開始すべきです。

> In iOS and Mac OS X v 10.5 and later you should consider using [[NSFileManager alloc] init] rather than the singleton method defaultManager. Instances of NSFileManager are considered thread-safe when created using [[NSFileManager alloc] init].

したがって、`[NSFileManager defaultManager]`で得られる共有シングルトンはスレッドセーフではありません。公式が推奨する方法は`[[NSFileManager alloc] init]`でインスタンス化することです。

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

// [fileManager release]; // ARCでは手動解放は不要
```

----
More:

* Apple Developer Docs: [NSFileManager Class Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/Foundation/Classes/nsfilemanager_Class/Reference/Reference.html)
* Blog: [NSFileManager defaultManager Is Not Thread Safe](http://useyourloaf.com/blog/2011/06/12/nsfilemanager-defaultmanager-is-not-thread-safe.html)
