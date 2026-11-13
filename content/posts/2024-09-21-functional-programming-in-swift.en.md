---
layout: post
title: "Functional building blocks and thread-safe parallel map"
description: "From filter/map/reduce to word frequencies, then a correction for a non-thread-safe parallelMap."
date: "2024-09-21"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Functional programming"]
---

Years ago I wrote a `parallelMap` that worked locally. In a gradual rollout, the result occasionally had missing elements or a different order. I spent two days looking at the network layer before noticing that several `concurrentPerform` iterations were appending to one array. This article starts with that postmortem.

## The standard-library building blocks

Most higher-order code in Swift is a combination of filter, map, and reduce.

| Function | Building block | Main signature | Typical use |
| --- | --- | --- | --- |
| `filter` | Selection | `(Element) throws -> Bool` | Keep matching elements |
| `map` | Mapping | `(Element) throws -> T` | One-to-one transformation |
| `flatMap` | Map + flatten | `(Element) throws -> Sequence` | Flatten one level |
| `compactMap` | Map + selection | `(Element) throws -> T?` | Drop and unwrap `nil` |
| `reduce` | Fold | `(Result, Element) throws -> Result` | Aggregate to one value |
| `reduce(into:)` | In-place fold | `(inout Result, Element)` | Aggregate into a mutable container |
| `zip` | Combination | Two sequences | Parallel traversal and key-value pairs |
| `prefix(while:)` / `drop(while:)` | Prefix selection | Predicate | Take or discard a prefix |
| `first(where:)` / `allSatisfy` | Short-circuit selection | Predicate | Early-exit queries |
| `mapValues` / `compactMapValues` | Value mapping | Dictionary values only | Preserve keys |
| `joined()` | Flattening | A sequence of sequences | Concatenate |
| `sorted(by:)` | Reordering | Comparison closure | Full sort |

`reduce` produces a new accumulator at every step, so `acc + [x]` can allocate repeatedly. `reduce(into:)` passes the accumulator as `inout` and appends in place:

```swift
let grouped = words.reduce(into: [String: Int]()) { counts, word in
    counts[word, default: 0] += 1
}
```

## Word frequencies

For a word-frequency table, split the text, count with `reduce(into:)`, sort by descending frequency, and use the word as a deterministic secondary key. Dictionary iteration is unordered, so omitting the secondary key makes tests and output drift.

For a few tens of thousands of words, an imperative loop is often faster and avoids an intermediate array. The real performance factors are tokenization and sorting. `components(separatedBy:)` creates an intermediate array; for very large files, use `enumerateSubstrings(in:options:)` or stream chunks instead.

## What was wrong with `parallelMap`

The tempting implementation is:

```swift
extension Array {
    func parallelMap<T>(_ transform: (Element) -> T) -> [T] {
        let n = count
        if n == 0 { return [] }
        var result = ContiguousArray<T>()
        result.reserveCapacity(n)
        DispatchQueue.concurrentPerform(iterations: n) { i in
            result.append(transform(self[i]))
        }
        return Array(result)
    }
}
```

It has three problems. First, `ContiguousArray` is mutated concurrently, which is a data race and undefined behavior. `reserveCapacity` prevents some reallocations but does not make writes safe. Second, append order follows scheduling rather than input order, violating `map` semantics. Third, mixing the transform and the shared write makes diagnosis harder.

## Three fixes

**A. Preallocate and give every iteration its own index.** Use `Array(unsafeUninitializedCapacity:)` and initialize exactly one slot per iteration. This preserves order without a lock, but requires careful initialization and, under Swift 6, `Sendable` constraints on the closure, elements, and result.

**B. Protect append with a lock or serial queue.** This is correct, but the write becomes serialized and order is still nondeterministic. It is useful only when the transform is much more expensive than writing the result.

**C. Partition into chunks.** Divide `0..<n` into ranges roughly matching the number of CPU cores. Each task writes to a private local array, and the main task concatenates chunks in order.

## When parallelism pays

`concurrentPerform` has scheduling overhead. Before parallelizing, check that the transform is pure, has no I/O or shared state, costs substantially more than scheduling, and runs over enough elements. Watch QoS inheritance so a background task does not flood the pool with work that harms UI responsiveness. Finally, measure with Instruments or a benchmark rather than relying on intuition.

Most UI code does not benefit. Mapping a few hundred model objects is usually cheaper than the parallel scheduling overhead.

## When not to use a functional chain

Use `for...in` when the closure has side effects. Fuse a chain or add `lazy` when it creates several large intermediate arrays. Split a chain into named variables when readers must repeatedly reconstruct its types. Parallelization is a separate decision; it is not determined by whether the code uses `map`.
