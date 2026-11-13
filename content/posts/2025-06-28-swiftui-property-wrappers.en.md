---
layout: post
title: "SwiftUI's property-wrapper family"
description: "A guide to State, Binding, StateObject, and the other wrappers by ownership, with common mistakes."
date: "2025-06-28"
category: "iOS"
comments: true
tags: ["iOS", "SwiftUI", "Property wrappers"]
---

I once marked a model created by a parent view as `@ObservedObject`. Every refresh reconstructed `Model()` and reset the counter. The underlying mistake was ownership: `@ObservedObject` observes an object but does not own it.

## How `propertyWrapper` works

A property wrapper is a type marked `@propertyWrapper` with a `wrappedValue`. The compiler stores the wrapper in a backing property, forwards the visible property to `wrappedValue`, and optionally exposes `projectedValue` through `$name`.

```swift
@propertyWrapper
struct Clamped {
    private var value: Int
    let range: ClosedRange<Int>
    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
    var projectedValue: Int { value }
    init(wrappedValue: Int, range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}
```

`init(wrappedValue:)` supports a default-value declaration. The compiler creates a backing property such as `_volume`; assigning that backing property directly inside an initializer is valid.

## Ownership map

| Wrapper | Owner | Use |
| --- | --- | --- |
| `@State` | Current view | Local value state; usually `private` |
| `@Binding` | External owner | Read/write reference to value state |
| `@StateObject` | Current view | An `ObservableObject` the view creates and owns |
| `@ObservedObject` | External owner | Observe an existing object without owning it |
| `@EnvironmentObject` | Ancestor view | Injected observable object |
| `@Environment` | System or ancestor | Read an environment value |
| `@AppStorage` | UserDefaults | Persist primitive values across launches |
| `@SceneStorage` | Scene | Restore primitive scene state |
| `@GestureState` | Current view | Temporary gesture state that resets |
| `@FocusState` | Current view | Input focus |
| `@Bindable` | External object | Bind properties of an `@Observable` object |

`@State` owns local value state and produces a `Binding` through `$state`. A child receives `@Binding` and the parent passes `$value`. Initialize a State property in `init` through its backing storage, for example `_query = State(initialValue: value)`.

Use `@StateObject` when the view creates an `ObservableObject`; use `@ObservedObject` when a parent supplies it. `@EnvironmentObject` must be injected by an ancestor, or the app traps at runtime. `@Environment` reads values such as `dismiss` and `colorScheme`. `@AppStorage` and `@SceneStorage` are for small primitive or raw-representable values, not large data.

## Observation

The `@Observable` macro tracks properties a view actually reads, rather than publishing every `@Published` change. An `@Observable` object can be owned with `@State`; use `@Bindable` only when a `$` binding is needed. During migration, do not mix `@Published` and Observation casually in the same model.

## A decision order

Ask who owns the state. Local value state belongs in `@State`; a child editor receives `@Binding`; a newly created reference object uses `@StateObject` or `@State` with `@Observable`; an injected global object uses `@EnvironmentObject`; system values use `@Environment`; persisted values use `@AppStorage` or `@SceneStorage`.

The common mistakes are assigning `query = ...` instead of `_query = State(...)` in an initializer, constructing a new object as `@ObservedObject`, and reading `@State` outside a view's runtime storage.
