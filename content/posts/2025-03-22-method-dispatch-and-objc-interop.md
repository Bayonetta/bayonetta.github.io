---
layout: post
title: "方法派发与 Objective-C 互操作"
description: "拆解 Swift 的三种派发、六个修饰符，以及混编时两个头文件和三个 NS 宏各管什么。"
date: "2025-03-22"
category: "iOS"
comments: true
tags: ["iOS","Swift","运行时"]
---

写下一行方法调用，CPU 到底跳去哪里，判断标准只有一条：编译器在调用点能不能确定目标函数的地址。能确定就是直接派发，不能确定就看它走函数表还是走消息。

这个判断决定了三件事：能不能内联、能不能被 swizzling、能不能被 KVO 观察。混编里那些「明明写了却不起作用」的问题，九成能从这儿找到解释。

## 三种派发

### 直接派发

编译器把函数地址写死在调用点，优化后直接内联，运行时没有任何查找开销。能确定地址的有四类：值类型（`struct`、`enum`）的方法；`final` 的类和方法；`private` / `fileprivate`（开 WMO 时编译器能证明模块内没有别的覆写者，推断成 final）；`extension` 新增的方法。

前三类都能证明没有覆写者。扩展成员不能进 vtable，因为类在主文件编译时已经定型、扩展可能来自另一个模块，只能静态派发——这也是扩展里写不出 `override` 的根本原因。全局函数和静态方法也归这类。

代价是运行时没法替换实现，换来的是内联、去虚拟化、常量折叠这些 SIL 优化。性能敏感的路径优先值类型和 `final`，`-emit-sil` 里能看到 `function_ref`。

### 函数表派发

`class` 的可覆写方法走 vtable，子类覆写就是替换表项，调用时按固定槽位间接跳转。

协议走另一张 witness table：每个遵循类型为协议的每条要求记一张实现地址表，泛型约束或 existential 调用时按偏移取值。两者都是一次索引加一次间接调用，比消息派发便宜，比直接派发多一次内存访问，编译器通常也没法跨表内联。

顺带提一句容易混的：`Array` 的写时复制是值语义优化，协议 existential 的装箱和 witness table 是派发机制，两件事。

### 消息派发

`objc_msgSend` 拿着 `self` 和 selector，沿 isa 查方法缓存、方法列表，再沿父类链上溯，找不到才进 `resolveInstanceMethod:` 和消息转发流程。单次成本最高，换来的是 Objective-C 全套动态能力：method swizzling、KVO 依赖的 isa-swizzling 动态子类、`respondsToSelector:`、category 运行时注入方法、`performSelector:` 这类延迟绑定。

Swift 成员走这条路，条件是既暴露给 ObjC 运行时、又保持动态，也就是 `@objc dynamic`。单独一个 `@objc` 只保证生成 selector 可见的 thunk，不保证调用一定走消息派发，`final @objc` 就是反例。

## 速查表

| 声明形态 | 派发方式 | 能否内联 | 能否 swizzling / KVO |
| --- | --- | --- | --- |
| 值类型方法、`final`、`private`（WMO 下）、`extension` 新增成员 | 直接派发 | 能 | 不能 |
| `class` 的可覆写方法 | vtable 函数表 | 去虚拟化后可以 | 不能 |
| 协议要求 / existential | witness table | 泛型特化后可以 | 不能 |
| `@objc dynamic` / `NSObject` 子类中被暴露的动态成员 | `objc_msgSend` 消息派发 | 不能 | 能 |
| `final @objc` | Swift 侧直接派发，ObjC 侧消息派发 | Swift 侧能 | selector 可响应，KVO 失效 |

表只是速查。真要判定，看 `-emit-sil` 里调用点落的是 `function_ref`（直接）、`class_method` 或 `witness_method`（表），还是 `objc_method`（消息）。

## 六个修饰符

- `final`：禁止覆写。加在类上等于给所有成员上隐式 final，编译器由此允许直接派发与内联。

- `dynamic`：强制动态派发，禁止去虚拟化或内联，是 KVO 和 swizzling 的前提。Swift 4 之前 `dynamic` 隐含 `@objc`，之后两者拆开，要暴露给 ObjC 得显式写。现在 `dynamic` 单独用在纯 Swift 成员上，是 Swift 层的动态间接调用，不是消息派发，具体形态以 SIL 为准。

- `@objc`：把声明暴露给 ObjC 运行时，生成 selector 和 thunk，出现在 `-Swift.h` 里。只能加在 `NSObject` 子类的成员、`@objc` 协议或 `@objc` 枚举上；泛型、结构体、带关联值的枚举、元组得先转成 ObjC 可表示的类型。它只管可见性，不管动态。

- `@nonobjc`：把本来会隐式暴露的成员排除掉。典型场景是在 `@objcMembers` 类里放行一个不想被 KVO、swizzling 命中，或者会撞父类 selector 的成员。

- `@inline`：不是派发修饰符，是给 SIL 优化器的提示。`@inline(__always)` 要求尽量内联，`@inline(never)` 禁止内联，用来拆冷热路径或者让 benchmark 的函数边界稳定。它是提示不是命令，跨模块内联还得看 WMO 与 `@inlinable` 有没有暴露函数体。

- `@objcMembers`：加在类上，让该类、它的 extension 以及子类里所有 ObjC 可表示的成员隐式带上 `@objc`。代价是暴露面变大、selector 变多、generated header 变胖，也更容易撞上父类同名 selector。

## `final @objc` 特殊在哪

两个修饰语作用在两条通道上。`final` 说不许覆写、可以静态派发，`@objc` 说要生成 selector。

从 Swift 直接调 `obj.stable()`，编译器知道它 final，直接派发甚至内联，根本不经过 `objc_msgSend`；从 ObjC 侧用 `[obj stable]` 或者 `performSelector:` 调用，经 thunk 进消息派发，selector 正常响应。

KVO 依赖 `dynamic`。`final @objc` 没带 `dynamic`，编译器把观察属性的 setter 静态派发掉，isa-swizzling 生成的动态子类拦不住赋值，观察回调不会触发。想让属性既能 KVO 又尽量少暴露，正确组合是 `@objc dynamic`，不是 `final @objc`。

几种形态放一起，可直接编译：

```swift
import Foundation

// 值类型：直接派发
struct Point {
    var x: Int
    func distanceSquared() -> Int { x * x }
}

// class 的可覆写方法走 vtable，final 成员走直接派发
class Base {
    func describe() -> String { "base" }
    final func id() -> String { "fixed" }
}

// 扩展新增成员不能进 vtable，只能静态派发
extension Base {
    func extra() -> String { "extra" }
}

// @objcMembers 让成员隐式暴露；@nonobjc 单独排除
@objcMembers
class Model: NSObject {
    dynamic var title: String = ""              // 隐式 @objc + dynamic，KVO 可用
    func plain() -> String { "plain" }         // 隐式 @objc
    @nonobjc func helper() {}                  // 从隐式暴露里排除
    final func stable() -> String { "stable" } // final + 隐式 @objc
}

let model = Model()
_ = model.stable()   // Swift 侧可静态派发
_ = model.helper()   // 未暴露给 ObjC

// KVO 依赖 @objc dynamic
let token = model.observe(\.title, options: [.new]) { _, change in
    print(change.newValue ?? "")
}
token.invalidate()
```

## 纯 Swift 类并不天然是 NSObject

Swift 源码里能看到 `SwiftObject`、`_SwiftNativeNSObject` 这类跟互操作相关的根类与基类实现。纯 Swift 类不是天然继承 `NSObject` 的，运行时给它准备了自己的根类；只有继承 `NSObject`、被 `@objc` 暴露，或者需要跟 Foundation 交互时，才接上 isa、消息派发那一套。

**并非所有 Swift 类都具备 ObjC 的动态特性。** 不继承 `NSObject`、也没有 `@objc` 成员的纯 Swift 类，编译器会尽量用 vtable 甚至直接派发，对它做 method swizzling 没有效果，它也不会响应任意 selector。

## 灵活性的代价

method swizzling 的本质是 `class_getInstanceMethod` 取到两个 `Method`，再用 `method_exchangeImplementations` 交换 `IMP`。它只在调用经 `objc_msgSend` 按 selector 查表时才生效；纯 Swift 的 vtable 方法不经过 selector，交换碰不到它。

KVO 同理。注册观察时运行时挂一个 isa-swizzling 的动态子类并覆写 setter，一旦 setter 被静态派发，这条链就断了。

```objc
#import <objc/runtime.h>

@implementation UIViewController (Tracking)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class cls = [self class];
        SEL a = @selector(viewDidAppear:);
        SEL b = @selector(tracking_viewDidAppear:);
        Method original = class_getInstanceMethod(cls, a);
        Method swizzled = class_getInstanceMethod(cls, b);
        method_exchangeImplementations(original, swizzled);
    });
}

- (void)tracking_viewDidAppear:(BOOL)animated {
    [self tracking_viewDidAppear:animated];  // 交换后这里调用的是原实现
    NSLog(@"%@ appeared", NSStringFromClass([self class]));
}

@end
```

直接派发让内联和去虚拟化成立，函数表派发保住继承与协议多态，消息派发把实现替换、观察和延迟绑定留到运行时。选哪种，就看这个成员要不要被覆写、要不要被 ObjC 观察或替换。

## 混编：两个头文件、三个宏

Swift 调 ObjC 走 bridging header，Xcode 里对应 `SWIFT_OBJC_BRIDGING_HEADER`：把要用的 ObjC 头文件用 `#import` 收进去，Clang importer 包装成一个 module，Swift 侧直接 import。

反方向由编译器生成的 `ProductModuleName-Swift.h`（简称 `-Swift.h`，路径由 `SWIFT_OBJC_INTERFACE_HEADER_NAME` 控制）完成，ObjC 文件 `#import "ProductModuleName-Swift.h"` 之后就能用 Swift 类型。关键约束是 Swift 侧必须显式 `@objc` 或 `@objcMembers`，默认不暴露；也只有 ObjC 能表示的类型才进得了 generated header。

三个宏都写在 ObjC 头文件里，由 Clang importer 读取，用来微调导入后的 Swift 长什么样：

- `NS_SWIFT_NAME`：重命名导入后的 Swift 名字，可以把 `+fooWithID:` 这类工厂方法改成 `init(identifier:)`。

- `NS_SWIFT_UNAVAILABLE`：让某个 ObjC API 在 Swift 侧不可见，调用直接编译报错，并在参数里给出替代建议。

- `NS_REFINED_FOR_SWIFT`：把 API 以带 `__` 前缀的原始形态导入 Swift，方便在同一个 framework 的 Swift overlay 里用更符合 Swift 习惯的包装重新导出，原接口仍可调用。

```objc
#import <Foundation/Foundation.h>

@interface Account : NSObject
- (instancetype)initWithIdentifier:(NSString *)identifier
    NS_SWIFT_NAME(init(identifier:));
@end

void LegacyResetCache(void)
    NS_SWIFT_UNAVAILABLE("改用 CacheStore.reset()");

@interface Session : NSObject
- (void)resumeWithCompletion:(void (^)(BOOL ok))completion
    NS_REFINED_FOR_SWIFT;
@end
```

关于继承方向：Objective-C **无法继承纯 Swift 类**（即不继承自 `NSObject` 的根类），也无法继承带泛型的 Swift 类。只有当 Swift 类本身继承自某个 Objective-C 类（如 `NSObject`）并暴露给运行时，生成的 `-Swift.h` 才会带出声明供 ObjC 子类化。但工程上极度不推荐「父类写 Swift、子类写 ObjC」：头文件循环引用极容易把构建搞崩（ObjC 引用 `-Swift.h`，Swift 桥接头又需要 ObjC 声明），两套初始化语义和生命周期也容易对不齐。遇到这种需求，宁可抽协议或用组合，别在混编里跨语言继承。

反方向就很顺：Swift 类可以自然继承 `NSObject` 或任何导入的 ObjC 类，并在 Swift 侧重写它的方法。

出问题时按层查：界面没刷新，先想 KVO 的 `dynamic` 是不是被 `final` 吃掉了；混编报找不到符号，先查 `@objc` 有没有暴露、`-Swift.h` 有没有生成；性能热点先看 SIL 里调用是 `function_ref` 还是 `objc_method`。具体 API 名称与可用版本，以本机 SDK 和官方文档为准。
