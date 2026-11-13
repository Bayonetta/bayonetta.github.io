---
layout: post
title: "Method dispatch and Objective-C interoperability"
description: "Swift's dispatch mechanisms, six modifiers, and the headers and macros involved in mixed-language projects."
date: "2025-03-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Runtime"]
---

For a method call, the decisive question is whether the compiler can know the target address at the call site. If it can, the call is direct. Otherwise it uses a function table or message dispatch. That choice determines whether a method can be inlined, swizzled, or observed by KVO.

## Three dispatch mechanisms

### Direct dispatch

The compiler can embed the address and often inline the call. This applies to value-type methods, `final` classes and methods, `private` or `fileprivate` methods when whole-module analysis proves there are no overrides, and members newly added in extensions. Global functions and static methods also use this style.

Direct dispatch prevents runtime replacement, but enables inlining, devirtualization, and constant folding. Value types and `final` are good defaults for performance-sensitive code.

### Vtable and witness-table dispatch

Overridable class methods use a vtable. A subclass replaces a slot, and the call jumps indirectly through that slot. Protocol requirements use a witness table: each conforming type supplies an implementation address for every requirement. Both cost an indirect lookup, but are cheaper and more analyzable than Objective-C message dispatch.

Copy-on-write for `Array` is unrelated to existential boxing and witness tables; one is a value-semantics optimization and the other is a dispatch mechanism.

### Message dispatch

`objc_msgSend` follows `isa`, the selector cache, method lists, and the superclass chain. If no implementation is found, the runtime enters method resolution and forwarding. The cost buys Objective-C's dynamic features: method swizzling, KVO's dynamic subclasses, `respondsToSelector:`, category injection, and `performSelector:`.

Swift members take this path when they are both exposed to Objective-C and dynamic, normally `@objc dynamic`. `@objc` alone creates a visible selector thunk but does not force every Swift call through `objc_msgSend`.

## Modifier guide

- `final` prevents overriding and can enable direct dispatch and inlining.
- `dynamic` forces dynamic dispatch and is required for KVO and swizzling. In modern Swift it is separate from `@objc`.
- `@objc` exposes a declaration to the Objective-C runtime and generated header. It controls visibility, not dynamic dispatch.
- `@nonobjc` excludes a declaration that would otherwise be exposed, often inside an `@objcMembers` class.
- `@inline(__always)` and `@inline(never)` are optimizer hints, not dispatch modifiers.
- `@objcMembers` exposes all Objective-C-representable members of a class, its extensions, and subclasses. It enlarges the selector surface and increases collision risk.

`final @objc` is special: Swift can call the final member directly, while Objective-C can still call its selector through a thunk. KVO still requires `@objc dynamic`; `final @objc` does not work because a statically dispatched setter cannot be intercepted by KVO's dynamic subclass.

## Pure Swift classes are not automatically `NSObject`

A pure Swift class does not automatically have Objective-C's dynamic behavior. Without `NSObject` inheritance or `@objc` members, the compiler uses vtable or direct dispatch where possible. Swizzling it has no effect, and it does not respond to arbitrary selectors.

## Mixed-language headers

Swift uses the bridging header, configured by `SWIFT_OBJC_BRIDGING_HEADER`, to import Objective-C declarations. Objective-C imports the generated `ProductModuleName-Swift.h`, whose name is controlled by `SWIFT_OBJC_INTERFACE_HEADER_NAME`, to use exposed Swift types.

The Swift declarations must be explicitly `@objc` or `@objcMembers`, and only Objective-C-representable types appear in the generated header. `NS_SWIFT_NAME` renames an imported API, `NS_SWIFT_UNAVAILABLE` hides it with a replacement message, and `NS_REFINED_FOR_SWIFT` imports a lower-level form intended to be wrapped by a Swift overlay.

When debugging, check the layer first: a KVO callback that never fires may have lost `dynamic`; a missing mixed-language symbol may lack `@objc` or the generated header; a performance issue can be identified in SIL by whether the call is `function_ref` or `objc_method`.
