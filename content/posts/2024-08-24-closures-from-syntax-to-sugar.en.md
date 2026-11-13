---
layout: post
title: "Closures: from the full definition to sorted(by: >)"
description: "The levels of Swift closure shorthand, plus capture, escaping, and autoclosure semantics."
date: "2024-08-24"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Closures"]
---

Swift can express the same sort in seven or eight forms. I will move from the most explicit version to `sorted(by: >)`, then record the parts of capture and escaping that tend to cause trouble.

`sorted(by:)` takes a function of two elements returning `Bool` and returns a new array. `sort()` changes the array in place and returns `Void`.

## Eight levels of shorthand

The progression is: pass a named function; write a complete closure with parameter and return types; let context infer the types; omit `return` for a single expression; use `$0` and `$1`; pass the operator function `>`; move a trailing closure outside the parentheses; and, since Swift 5.3, use multiple trailing closures for APIs such as `UIView.animate`.

The compiler can infer types only when context is available. A closure assigned to an untyped variable, a `$0` inside a nested closure, or overloaded operators may require explicit annotations. Adding a type is clearer than stacking `as` casts.

## Capture and reference cycles

A closure captures constants and variables from its scope. A captured value type is placed in a mutable capture box, so later changes from outside can be visible inside the closure.

```swift
var counter = 0
let increment = { counter += 1 }
increment()
print(counter)   // 1
```

Reference types are captured strongly by default. If an object owns a closure and that closure captures `self`, the two form a cycle. A capture list breaks it:

```swift
network.load { [weak self] result in
    guard let self else { return }
    self.render(result)
}
```

`[weak self]` does not keep the object alive. `[unowned self]` avoids the reference count, but accessing the object after it is released traps, so it is suitable only when the closure cannot outlive `self`. A capture list can also freeze an initial value when the closure is defined.

## `@escaping` and explicit `self`

Closure parameters are non-escaping by default. The compiler can guarantee that they finish before the function returns and may keep them on the stack. Storing one in a property, sending it to an asynchronous queue, or passing it to another escaping parameter requires `@escaping`.

An escaping closure must write `self.` when it accesses instance state. This is a compile-time rule that also prompts a review for reference cycles.

## `@autoclosure`

`@autoclosure` wraps an expression in a no-argument closure. The caller writes an ordinary expression; the callee decides whether and when to evaluate it:

```swift
func logIfNeeded(_ message: @autoclosure () -> String, enabled: Bool) {
    if enabled { print(message()) }
}
logIfNeeded(expensiveDescription(), enabled: false)
```

The right-hand side of `??` and the failure message of `assert` and `precondition` use this idea. Combining `@autoclosure @escaping` means the closure is stored and evaluated later. It is limited to a no-argument, single-result parameter; overusing it can make a call look synchronous even though it has delayed side effects.

## A practical rule

The more shorthand you use, the more the reader must infer from context. For local sorting and filtering I usually use levels five through seven. For public APIs, nested closures, or closures with side effects, I keep parameter names and sometimes the type annotations.
