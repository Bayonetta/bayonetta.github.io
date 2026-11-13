---
layout: post
title: "Error handling, memory management, and dependency management"
description: "Notes on throws/defer, weak versus unowned, and the trade-offs between three dependency managers."
date: "2025-08-16"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Engineering"]
---

The difficult bugs in this area usually come from crossing a boundary: `try?` silently discards an error, `defer` is registered too late, or a closure keeps `self` alive. Each rule is simple on its own; together they are easy to miss.

## The error-handling chain

Swift marks errors with `Error`, and functions, methods, and initializers can be `throws`. Callers must choose `do-catch`, `try?`, `try!`, or propagation.

`try?` turns failure into `nil` and loses the reason, so use `do-catch` or `Result` when logging or branching matters. `try!` is appropriate only when failure is a programming error, such as parsing a bundled resource known to be valid. `rethrows` means only an argument closure can throw. `init?` expresses that construction failed without carrying a reason, while `throws` can carry one. `Result` is useful when an error must be stored or passed across an asynchronous boundary.

`LocalizedError.errorDescription` supplies user-facing text. Across an Objective-C boundary, use `NSError` domains and codes.

## `defer` runs on scope exit

`defer` executes when the current scope exits—on `return`, `throw`, `break`, or an early `guard` return. Multiple blocks run last-in, first-out. A `defer` is registered only when execution reaches it, so putting it after a guard does not protect the early path. Do not change control flow from inside `defer`.

It is useful for paired lock/unlock, closing files and database connections, ending graphics contexts, and balancing `begin`/`end` calls.

## `weak` versus `unowned`

Both avoid a strong reference. `weak` must be an optional `var` and becomes `nil` when the object is released. `unowned` can be non-optional but traps after the object disappears. Use `unowned` only when a lifetime invariant guarantees that the referenced object outlives the reference. `unowned(unsafe)` gives up the safety check and should not appear in ordinary application code.

Common cycles include an object owning a closure that captures `self`, a timer or block-based notification retaining its target, a strong delegate, and a closure capturing an intermediate object that owns the closure. Use capture lists such as `[weak self]`, `[unowned self]`, or capture a specific value. Diagnose with Memory Graph Debugger or Instruments Leaks. An async closure can temporarily retain `self` and raise memory usage even when there is no cycle.

## Dependency managers

| | CocoaPods | Carthage | Swift Package Manager |
| --- | --- | --- | --- |
| Project impact | High; rewrites project and creates a workspace | Low; produces frameworks | Low; integrated by Xcode |
| Lock file | `Podfile.lock` | `Cartfile.resolved` | `Package.resolved` |
| Main cost | Project conflicts and fragile updates | Manual setup and scripts | Historical mixed-language and resource limitations |
| Typical choice | Legacy ecosystem | Prebuilt frameworks | Default for new projects |

CocoaPods compiles sources into a generated workspace. Carthage is less invasive but requires adding frameworks, search paths, and a copy-frameworks script. Swift Package Manager declares products, targets, and version rules in `Package.swift`; binary frameworks use `binaryTarget`. Migration still requires checking old libraries, resource bundles, and mixed-language module maps.

For a new project I choose SPM. In a legacy project I usually add new dependencies with SPM and migrate existing Pods gradually.

The same boundary applies to mixed-language code: a bridging header imports Objective-C into Swift, while `ProductModuleName-Swift.h` exposes explicitly `@objc` Swift declarations to Objective-C. `NS_SWIFT_NAME`, `NS_SWIFT_UNAVAILABLE`, and `NS_REFINED_FOR_SWIFT` adjust the imported API.
