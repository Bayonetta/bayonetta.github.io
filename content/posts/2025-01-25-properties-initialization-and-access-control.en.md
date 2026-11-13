---
layout: post
title: "Properties, initialization, and access control"
description: "The Swift rules around properties, initializers, and access control that are easy to remember incorrectly."
date: "2025-01-25"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Language details"]
---

During a review I saw `private(set)` used as if it meant “writable anywhere in this file”. Another type in the same file tried to assign to it and failed to compile. These rules are easy to forget when you do not write them every day, so I collected the behaviors that can be checked directly.

## Stored, computed, and lazy properties

A computed property stores no value. `get` reads it and `set` writes it; the setter's implicit parameter is `newValue`. A read-only property can omit `get`.

`lazy` delays initialization until the first access. It must be a `var`, cannot have observers, and its initializer can refer to `self`. It is not thread-safe: two threads can perform the first initialization at the same time. Add synchronization or use a one-time container when necessary.

```swift
lazy var formatter: DateFormatter = {
    let f = DateFormatter()
    f.dateStyle = .medium
    return f
}()
```

The final `()` invokes the closure immediately and stores its result. Without it, the property itself is a closure.

## Property observers

`willSet` and `didSet` run before and after a write and expose `newValue` and `oldValue`. They do not run during initialization. In `willSet`, the property still contains the old value; in `didSet`, it contains the new value. Assigning to the same property inside `didSet` does not recursively trigger the observer. Observers cannot be combined with an explicit `get`/`set`.

## `static` and `class`

`static` declares a type property or method. `class` is available only on classes and permits subclass overriding, so a `static` class member is roughly a `final class` member. Stored type properties need a default value. Type properties are lazy but initialized once in a thread-safe way; this differs from an instance `lazy` property.

## Subscripts

`subscript` gives a type bracket syntax. It can be readable, writable, overloaded, multi-parameter, and generic. Custom collections must provide `indices` as a `Collection` whose element is the collection's `Index`; otherwise standard iteration and slicing conveniences are unavailable.

## `mutating` and `nonmutating`

Value-type methods cannot change `self` unless marked `mutating`. A mutating method can be called only on a `var`, and assigning to `self` replaces the whole value. `nonmutating set` can let a subscript write through a reference while the enclosing struct is a `let`. Enum case changes also require `mutating`; classes do not have these restrictions because their methods can change referenced properties.

## Two-phase initialization

Class initialization has two phases. First, each class initializes the stored properties it introduces, moving from subclass to superclass. After `super.init` returns, the second phase proceeds from superclass back to subclass, and only then may the initializer use `self`, instance methods, or inherited properties.

Convenience initializers must first delegate horizontally to a designated initializer in the same class and cannot call `super.init` directly. These checks prevent a superclass method from observing a subclass before its properties are initialized.

## Inheriting convenience initializers

A subclass inherits all of a superclass's convenience initializers only when it implements all of the superclass's designated initializers—either explicitly or through automatic inheritance. Writing one arbitrary `override init` is not enough. If a subclass adds no stored properties without defaults and writes no designated initializer, it can inherit the full chain.

## `required`, failable initializers, and `final`

`required init` obliges every subclass to provide an implementation. `init?` returns `nil` on failure; `init!` delays the failure until use and is best avoided. A failable initializer can call a non-failable one, but the reverse must explicitly handle the optional result.

`final` prevents overriding and subclassing and can enable direct dispatch and inlining. An extension cannot override an existing class member. It can add methods, computed properties, subscripts, and protocol conformances, but not stored properties.

## A setter can be less visible than its getter

```swift
public struct Session {
    public private(set) var token: String
    fileprivate(set) var retryCount = 0
}
```

`private(set)` limits writes to the declaration's scope, not the entire file. Use `fileprivate(set)` for file-level writes. When a compiler error looks strange, ask whether the assignment targets storage or an observer, and whether the initializer is designated or convenience and where `super.init` occurs.
