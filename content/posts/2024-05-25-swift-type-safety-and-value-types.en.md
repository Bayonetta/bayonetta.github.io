---
layout: post
title: "Why Swift is type-safe: value semantics and ownership"
description: "A practical breakdown of Swift's type-safety rules, value semantics, and the cost of some and any."
date: "2024-05-25"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Type system"]
---

In projects migrated from Objective-C, the first crashes often come from old interfaces that still pass `id` everywhere. The compiler stays quiet until a dictionary is missing a key and `valueForKey:` throws `NSUnknownKeyException`. Swift's main contribution is to move as many of those failure points as possible into compile time.

## What gets moved earlier

- Static type checking: incompatible types fail compilation.
- No implicit numeric conversion: `Int` and `Double` need an explicit conversion.
- Explicit optionals: `nil` exists only in an Optional, and unwrapping uses `if let`, `guard let`, or `??`.
- Array bounds checks: an invalid subscript traps instead of reading adjacent memory.
- Definite initialization: every path must assign a value before use.
- Exclusive memory access: overlapping modification and access are rejected.

In Objective-C, `id` is essentially `objc_object *`, messages are dispatched by `objc_msgSend`, sending a message to `nil` silently returns zero or `nil`, and KVC uses string keys that fail only at runtime.

## Value types, reference types, and copy-on-write

`struct` and `enum` have value semantics; `class` has reference semantics. “Value types always live on the stack” is too simple. A value can be stored inside a class, captured by an escaping closure, or placed in an existential container and therefore move to the heap with its owner. Class instances live on the heap and are managed by ARC.

Standard-library containers combine value semantics with copy-on-write. `Array`, `Dictionary`, and `String` share a heap buffer while reading and copy it before a write if the buffer is not unique. `isKnownUniquelyReferenced` exposes the uniqueness check for custom COW types, but it works with class instances and must receive an `inout` argument.

```swift
final class Storage {
    var items: [Int]
    init(_ items: [Int]) { self.items = items }
}

struct IntStack {
    private var storage = Storage([])
    private mutating func ensureUnique() {
        if !isKnownUniquelyReferenced(&storage) {
            storage = Storage(storage.items)
        }
    }
    mutating func push(_ x: Int) {
        ensureUnique()
        storage.items.append(x)
    }
    var count: Int { storage.items.count }
}
```

`mutating` records that a method changes the value. The compiler treats this as an `inout self` access and applies exclusivity checks.

## Enums as sum types

An enum with associated values is a sum type. A `switch` must be exhaustive, so adding a case points to every place that needs updating. `CaseIterable` can be synthesized only when cases have no associated values. Recursive enums need `indirect`, which stores the recursive part behind a heap box.

## `weak` and `unowned`

`weak` is an optional variable. When the object is released, the runtime clears the reference through the weak side table. `unowned` is non-optional and traps after the object is gone; `unowned(unsafe)` removes even that check. Use `unowned` only when the referenced object is guaranteed to outlive the reference, such as a strictly ordered parent-child relationship.

## `some`, `any`, and generics

- `some P` hides one concrete type chosen by the callee. It keeps static dispatch and associated-type information.
- `any P` erases the concrete type into an existential container with a value buffer and witness table. Calls use dynamic dispatch, and large values may require heap boxing.
- `func f<T: P>(_ x: T)` lets the caller choose a concrete type and can be specialized without boxing.

Use `some` when the implementation should be hidden but remain one concrete type, `any` for heterogeneous collections and runtime polymorphism, and generics when the caller should choose the type and performance matters. Putting `any` on a hot path adds an indirect call and potentially heap allocation.

In ordinary application code I start with generics or `some`, and use `any` only when I actually need heterogeneity.
