---
layout: post
title: "Substring, ranges, and operators: the design behind Swift syntax sugar"
description: "From Substring's shared storage to Range, operators, and where clauses."
date: "2024-06-22"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Syntax"]
---

I once cached `prefix(30)` as the title for every row in a list. A log file of several dozen megabytes was reduced to short titles, but memory never fell. The reason was simple: `Substring` does not copy. It shares the original string's buffer.

## Shared storage and the Substring trap

`prefix`, `suffix`, and range subscripting return `Substring`, not `String`. A substring stores start and end `String.Index` values and shares the character buffer, so taking a prefix is constant-time. The cost is a strong reference to the entire original buffer. If a substring is kept in a property, dictionary, or cache, the original string remains alive. Use `String(sub)` when the value needs to live independently.

`String.Index` is valid only for the `String` and substrings derived from that string. An index from one string cannot be used on another. Store an integer offset across an API boundary and rebuild the index with `index(_:offsetBy:)` when needed.

## `StringProtocol`

The standard library uses `StringProtocol` for capabilities shared by `String` and `Substring`. String utilities should usually accept the protocol instead of forcing callers to materialize a `String` and pay for a copy.

```swift
import Foundation

func head<S: StringProtocol>(_ s: S) -> Character? {
    s.first
}

func lineCount(_ s: some StringProtocol) -> Int {
    s.split(separator: "\n").count
}
```

`StringProtocol` has `Self` and associated-type requirements, so it cannot be used directly as an ordinary stored property type. Use generics or `some`; `some StringProtocol` remains opaque and does not add existential boxing.

## Why integer subscripting is unavailable

`String` is a collection of extended grapheme clusters. One visible character may contain several Unicode scalars, so `s[2]` cannot be defined as a constant-width operation. Indexing uses `String.Index`, and `count` must walk the grapheme clusters in O(n).

The `utf8`, `utf16`, and `unicodeScalars` views have more predictable units. The `Character` view must identify grapheme boundaries, which costs more. `String.Index` is `Comparable` but not `Strideable`; Swift makes the variable cost explicit through `index(_:offsetBy:)`.

## `??` and `@autoclosure`

The nil-coalescing operator is right-associative and returns the first non-`nil` value. Its right-hand side is wrapped in `@autoclosure`, so it is evaluated only when the left side is `nil`.

```swift
let a: Int? = nil
let b: Int? = nil
let c: Int? = 42
let value = a ?? b ?? c ?? 0   // 42
```

`Optional.map` transforms a value while retaining one Optional layer; `flatMap` flattens a nested Optional.

## Range only requires `Comparable`

`Range` requires `Bound: Comparable`, not a numeric type. A range such as `"a"..."z"` is valid and means a lexicographic interval. `ClosedRange` includes both ends, `Range` excludes its upper bound, and `PartialRangeFrom` has only a lower bound.

`RangeExpression` lets these forms work in `switch` cases through the `~=` operator. `contains` is a constant-time comparison for integer random-access bounds; for strings it is still only a lexicographic comparison, not enumeration of every value in between.

## Custom operators

Declare an operator before implementing it. Infix operators also need a precedence group with associativity and relative precedence. Unicode symbols such as `⊕` are legal, but custom operators are globally visible by default, so duplicate declarations collide. Reuse standard precedence groups where possible.

## `stride` and floating-point error

`stride(from:to:by:)` excludes its upper bound; `stride(from:through:by:)` includes it. Floating-point steps are risky because values such as `0.1` are not exactly representable in binary, and repeated addition can accumulate error. For ticks, animation frames, and progress bars, use integer steps and scale afterward:

```swift
let ticks = stride(from: 0, through: 10, by: 1).map { Double($0) / 10.0 }
```

## Variadic parameters and `where`

`Int...` is an array inside the function. A function can have only one variadic parameter, it cannot be `inout`, and Swift has no splat syntax for passing an existing array to a variadic function. Add an overload accepting `[Int]` when necessary.

`where` appears in a fixed set of places: generic constraints, constrained extensions, `for-in` filters, `switch`/`catch` patterns, and associated-type constraints. It is a constraint clause, not a general-purpose expression modifier.
