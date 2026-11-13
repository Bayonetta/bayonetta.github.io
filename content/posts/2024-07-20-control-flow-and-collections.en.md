---
layout: post
title: "Control flow, Sequence, and how Array.sort works"
description: "A second pass over control flow and collection protocols, including pattern matching, iteration semantics, and the boundaries of sorting."
date: "2024-07-20"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Collections"]
---

I found an old loop that used `return` inside `forEach`. The author expected it to stop the loop, but it only returned from that one closure call. Bugs like this do not produce a compiler error, crash, or necessarily a failing test. I went back over these boundaries in control flow and collections.

The three easiest rules to remember incorrectly are: `return` inside `forEach` exits only the closure, `enumerated()` gives a counter rather than an index, and `sort()` never promises stability.

## `switch` does not fall through by default

Swift exits a `case` automatically. To fall through, write `fallthrough` explicitly, but remember that it jumps directly into the next statement body without checking the next case's condition.

```swift
let value = 5
switch value {
case 1...3:
    print("low")
case 4...6:
    print("mid")
    fallthrough
case 7:
    print("this runs even when value is not 7")
default:
    break
}
```

The output is `mid`, followed by the second message. `value` is 5, but the body of `case 7` still runs. `fallthrough` is a control-flow jump, not another pattern match. It also cannot jump into a case that introduces a new `let` binding.

Ranges, tuples, enum associated values, and `where` clauses can all participate in matching. Enums also receive exhaustiveness checking, so adding a case makes every incomplete `switch` fail to compile.

## Label nested loops

`break` normally exits only the innermost loop. A label lets the code leave an outer loop:

```swift
outer: for row in matrix {
    for cell in row {
        guard cell.isValid else { break outer }
        process(cell)
    }
}
```

`continue outer` works the same way, and labels also work with `while` and `repeat...while`.

## Ways to traverse an array

| Form | Result | Important difference |
| --- | --- | --- |
| `for x in a` | Elements | The usual form, using the `Sequence` iterator |
| `a.makeIterator()` | Manual `next()` calls | Can advance across functions or loops |
| `for i in a.indices` | Real index values | Also correct for `ArraySlice` |
| `a.enumerated()` | A counter starting at 0 | `offset` is an `Int`, not an index |
| `a.forEach { ... }` | Elements | `return` exits only the closure |

`enumerated()` starts its offset at zero, while an `ArraySlice` may start at another index. Using the offset to subscript a slice can therefore produce the wrong element or trap. When both the index and element are needed, use `zip(a.indices, a)`.

The `return` in `forEach` is closer to `continue` than `break`; it cannot use `break outer` to stop the surrounding traversal.

## `Sequence` versus `Collection`

`Sequence` only requires an `IteratorProtocol` iterator whose `next()` returns `Element?`. It does not promise repeatable traversal or even a finite sequence. What happens when `makeIterator()` is called a second time depends on the implementation.

`Collection` adds repeatable, non-destructive traversal, `startIndex` and `endIndex`, subscripting, `indices`, and `count`. `count` is not necessarily O(1); only `RandomAccessCollection` constrains index movement and distance to O(1).

`underestimatedCount` is a lower bound supplied by an iterator. `Array(sequence)` uses it for `reserveCapacity`, which can avoid repeated growth.

```swift
struct Countdown: Sequence, IteratorProtocol {
    var current: Int
    mutating func next() -> Int? {
        guard current > 0 else { return nil }
        defer { current -= 1 }
        return current
    }
}
for n in Countdown(current: 3) { print(n) }   // 3 2 1
```

When one type conforms to both protocols, `makeIterator()` defaults to returning `self`, so this example is single-use. Reusable traversal requires a separate iterator type.

## The strategy behind `sort`

The old note described quicksort, insertion sort below a small threshold, and heapsort after recursion became too deep. That is the classic introsort shape: insertion sort is cheap for small or nearly sorted ranges, quicksort handles the average case in place, and heapsort prevents a bad pivot from degrading to O(n²).

The implementation and thresholds change across Swift versions, so a number such as “20” should not become a business assumption. The API also does not promise that `sort()` is stable. If equal elements must retain their original order, add the original offset as a secondary key:

```swift
let stable = items
    .enumerated()
    .sorted {
        if $0.element.score != $1.element.score {
            return $0.element.score > $1.element.score
        }
        return $0.offset < $1.offset
    }
    .map(\.element)
```

## The cost of `Set` and `Dictionary`

Both rely on `Hashable`. Swift uses randomized hash seeds and an open-addressed hash table. Lookup and insertion are O(1) on average and O(n) in the worst case; iteration order is not guaranteed.

| Operation | `Array` | `Set` | `Dictionary` |
| --- | --- | --- | --- |
| Find an element | O(n) | O(1) average | O(1) average by key |
| Append at the end | O(1) amortized | O(1) average | — |
| Preserve insertion order | Yes | No | No |
| Remove duplicates | No | Yes | Keys are unique |
| Layout | Contiguous | Hash buckets | Hash buckets |

For a custom dictionary key, `==` and `hash(into:)` must agree: equal values must have equal hashes, but equal hashes do not imply equality. Mutating an object while it is inside a hash table also invalidates its hash.

These four boundaries—`forEach`'s `return`, the offset from `enumerated()`, sort stability, and one-shot `Sequence` traversal—have all caused real bugs in code I have seen.
