---
layout: post
title: "闭包：从完整定义到 sorted(by: >)"
description: "用同一个排序例子过一遍 Swift 闭包的简写层级，顺带记下捕获、逃逸与自动闭包的语义。"
date: "2024-08-24"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "闭包"]
---

同一个排序，Swift 能写出七八种样子。下面从最完整的写法一路省到 `sorted(by: >)`，顺便把捕获和逃逸几处容易出问题的地方记一下。

```swift
let courses = ["math", "physics", "chemical", "english", "biology",
               "art", "history", "politics", "geography"]
```

`sorted(by:)` 的签名是 `func sorted(by areInIncreasingOrder: (Element, Element) throws -> Bool) rethrows -> [Element]`，收一个「两元素、返回 Bool」的函数，返回新数组；`sort()` 是原地排序，返回 Void。

## 逐级省略的八个版本

**1. 独立函数**：先把函数传进去。

```swift
func backward(_ s1: String, _ s2: String) -> Bool {
    return s1 > s2
}
let reversed = courses.sorted(by: backward)
```

**2. 完整闭包表达式**：参数、返回类型全写，`in` 分隔参数与函数体。

```swift
let reversed = courses.sorted(by: { (s1: String, s2: String) -> Bool in
    return s1 > s2
})
```

**3. 类型交给上下文推断**：编译器已知 `areInIncreasingOrder` 的类型，类型注解、`->` 都能省。

```swift
let reversed = courses.sorted(by: { s1, s2 in return s1 > s2 })
```

**4. 单表达式隐式返回**：函数体只有一条表达式，`return` 可省。

```swift
let reversed = courses.sorted(by: { s1, s2 in s1 > s2 })
```

**5. 简写参数名**：按位置引用 `$0`、`$1`，参数列表和 `in` 一起消失。

```swift
let reversed = courses.sorted(by: { $0 > $1 })
```

**6. 运算符函数**：`>` 本身就是 `(String, String) -> Bool` 类型的函数值。

```swift
let reversed = courses.sorted(by: >)
```

**7. 尾随闭包**：闭包是最后一个实参时可移到括号外；只有一个实参时括号也能省。

```swift
let reversed = courses.sorted { $0 > $1 }
```

**8. 多尾随闭包**：Swift 5.3 起，有多个闭包实参时第一个可省标签。

```swift
UIView.animate(withDuration: 0.3) {
    view.alpha = 0
} completion: { _ in
    view.removeFromSuperview()
}
```

| 版本 | 省略了什么 | 编译器依据 |
| --- | --- | --- |
| 2 → 3 | 类型注解、`-> Bool` | 由 `sorted(by:)` 的形参类型反推 |
| 3 → 4 | `return` | 单表达式闭包隐式返回 |
| 4 → 5 | 参数列表与 `in` | 简写参数名按位置编号 |
| 5 → 6 | 整个闭包 | 运算符是普通函数值 |
| 6 → 7 | 括号与标签 | 尾随闭包语法 |

推断有前提。把闭包赋给无类型信息的变量、`$0` 出现在嵌套闭包里、或表达式里混用重载运算符时，编译器可能要求补回类型注解。补类型比堆 `as` 强转清楚。

## 捕获语义与循环引用

闭包捕获作用域里的常量和变量。值类型被捕获后放进可变的「捕获盒」，外部后续修改在闭包里可见，所以在闭包里读循环变量要留意时机。

```swift
var counter = 0
let increment = { counter += 1 }
increment()
print(counter)   // 1
```

引用类型默认强引用，对象持有闭包、闭包捕获 `self` 就成环。用捕获列表断开：

```swift
network.load { [weak self] result in
    guard let self else { return }
    self.render(result)
}
```

`[weak self]` 是弱引用；`[unowned self]` 不增加引用计数，对象释放后访问会崩，只适合闭包生命周期确定不长于 self 的情况。捕获列表还能带初始值，在定义时把值固定下来：

```swift
let handlers = (0..<3).map { i in { print(i) } }   // 每个闭包各自捕获当次的 i
```

## @escaping 与显式 self

函数形参里的闭包默认非逃逸，编译器保证它在函数返回前执行完，可以栈上分配、省掉 retain/release。一旦被存进属性、丢进异步队列或传给另一个逃逸参数，就得标 `@escaping`：

```swift
final class Store {
    private var pending: [() -> Void] = []
    func register(_ action: @escaping () -> Void) {
        pending.append(action)      // 存储即逃逸
    }
}
```

逃逸闭包里访问实例属性/方法必须显式写 `self.`。这是编译期强制的，顺带提醒你检查有没有成环。

## @autoclosure

`@autoclosure` 把表达式自动包成无参闭包，调用方写的是普通表达式，被调方拿到闭包，自己决定要不要、什么时候求值：

```swift
func logIfNeeded(_ message: @autoclosure () -> String, enabled: Bool) {
    if enabled { print(message()) }     // enabled 为 false 时连字符串都不构造
}
logIfNeeded(expensiveDescription(), enabled: false)
```

标准库里两处：`??` 的右操作数是 `@autoclosure`，`a ?? fallback()` 只在 `a` 为 nil 时调用 `fallback()`；`assert` / `precondition` 在 Release 下不构造失败信息。

和 `@escaping` 组合写 `@autoclosure @escaping`，表示闭包会被存起来稍后求值，捕获语义按逃逸处理。它只能用于无参、返回单值的形参；滥用会让调用点看着像同步表达式，实际带延迟副作用。

## 使用上的判断

省得越多，读者越依赖上下文才能看出这个闭包收什么、返回什么。局部的排序、过滤我一般用到第 5～7 级；跨模块 API、多层嵌套或带副作用的闭包，会保留参数名甚至类型注解。
