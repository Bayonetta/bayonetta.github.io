---
layout: post
title: "Protocols, associated types, and protocol-oriented programming"
description: "Static dispatch in protocol extensions, small protocols, associatedtype, and the boundary of any."
date: "2025-02-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Protocols"]
---

The first time I hit the protocol-extension trap, I stared at it for a long time. `Greeter` had a default `casual()` implementation, `Polite` defined a method with the same name, and yet a value stored as `Greeter` still called the default. No warning, no error—just surprising behavior.

The reason is dispatch. This article records what a protocol can require, why extension-only members are statically dispatched, and where `any` stops being useful.

`Array` is a good example of composition: traversal, random access, range replacement, array literals, and textual description come from separate conformances to `Sequence`, `Collection`, `RandomAccessCollection`, `RangeReplaceableCollection`, `ExpressibleByArrayLiteral`, and `CustomStringConvertible`.

## What a protocol can require

Protocols can require instance and type properties, methods, initializers, subscripts, and mutating methods.

```swift
protocol Named {
    var name: String { get }
    var displayName: String { get set }
    static var kind: String { get }
    init(name: String)
    mutating func rename(to newName: String)
}
```

If a protocol requires `init`, a non-final class implementation must be `required`. A `get` requirement may be implemented with `get set`; a `get set` requirement cannot be implemented by a read-only property. Protocol composition uses `&`, and adding `AnyObject` excludes value types.

## `@objc optional` is not a default implementation

`@objc optional` belongs to Objective-C interoperability. It requires an `@objc` protocol and class conformances, then checks at runtime whether the method exists. Swift's alternative is a protocol extension with a default implementation, which is selected at compile time and has no runtime availability check. Mixing the two models makes behavior difficult to reason about.

## Why extension members are statically dispatched

Only requirements declared in the protocol body use a witness table. A method introduced only in an extension is selected from the call site's static type.

```swift
protocol Greeter {
    func official() -> String
}

extension Greeter {
    func official() -> String { "Hello" }
    func casual() -> String { "Hi" }
}

struct Polite: Greeter {
    func official() -> String { "Good day" }
    func casual() -> String { "How do you do" }
}

let p: Greeter = Polite()
p.official()    // "Good day"
p.casual()      // "Hi"
Polite().casual() // "How do you do"
```

If conforming types should customize a method, declare it in the protocol and leave only the default implementation in the extension. Extension-only methods are best used as algorithms built from protocol requirements.

## Protocols versus inheritance

Inheritance couples identity and capability, carries superclass state and behavior, is limited to one chain, and does not work for value types. Swift protocols split capabilities into small contracts that structs and enums can compose.

My rule is to name roles such as cacheable, serializable, displayable, and undoable, then define one small protocol per role. I use class inheritance only when types truly share state and lifetime, and keep the hierarchy shallow.

## Conditional conformance

An extension with `where` can give a generic type a conformance only when its element satisfies a condition:

```swift
protocol TextRepresentable { var text: String { get } }

extension Array: TextRepresentable where Element: TextRepresentable {
    var text: String { map(\.text).joined(separator: ", ") }
}
```

This is conditional conformance. A `where` on an ordinary method only restricts that method; it does not make the whole type conform.

## `associatedtype` and `any`

An `associatedtype` is a placeholder chosen by each conforming type. Swift 5.7 requires explicit `any` when a protocol with `Self` or associated types is used as a type. `any Container` erases the concrete item type into a box; generic code and `some` preserve it. Existentials add boxing and dispatch overhead, and many operations are unavailable when the associated type is unknown. Use `any` for genuinely heterogeneous storage; prefer generics or `some` elsewhere.

The dangerous part of static dispatch is that the compiler gives no warning. During review I specifically check whether a method in a protocol extension should have been declared in the protocol body.
