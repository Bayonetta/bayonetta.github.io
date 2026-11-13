---
layout: post
title: "The Swift compilation pipeline and useful swiftc commands"
description: "A pass through the Swift pipeline from parsing to linking, with commands useful for investigation."
date: "2024-04-20"
category: "iOS"
comments: true
tags: ["iOS", "Swift", "Compiler"]
---

A generic function stubbornly refused to specialize in Release. I exported one SIL file with `-emit-silgen` and another with `-emit-sil`, then compared them side by side. The call site had been passed out as an opaque type, so specialization never happened. I went through the whole pipeline again so I would not have to guess next time.

```text
.swift source
  → Parse (lexing and parsing) → AST
  → Sema (name binding, type checking, constraint solving)
  → SILGen → Raw SIL
  → SIL normalization and optimization → Canonical SIL
  → IRGen → LLVM IR
  → LLVM optimization and backend → object file
  → linking → executable
```

The corresponding Swift repository directories are:

- Parse (`lib/Parse`) turns characters into tokens and builds the AST; type information does not exist yet.
- Sema (`lib/Sema`) performs name binding, type checking, and constraint solving. `var x = 1` becomes `Int` here, along with implicit conversions, `inout`, access control, and availability checks.
- SILGen (`lib/SILGen`) lowers the checked AST to SIL and inserts ARC and ownership instructions.
- Raw SIL is the unoptimized result. Details such as `alloc_stack` and `retain` / `release` are still visible.
- Canonical SIL and `lib/SILOptimizer` run specialization, devirtualization, inlining, ARC optimization, and ownership-SSA normalization.
- IRGen (`lib/IRGen`) lowers SIL to LLVM IR, flattening Swift types, ARC, generics, and dispatch into pointers, integers, and calls.
- LLVM and its backend optimize instructions, allocate registers, select instructions, and emit the object file.
- The linker combines object files, the standard library, the runtime, and system frameworks; symbol resolution and dead-code stripping happen here.

## Why SIL exists

AST cannot carry all of Swift's semantics directly into LLVM IR. SIL is in SSA form: values such as `%0` and `%1` are assigned once, control flow is split into basic blocks such as `bb0`, and types are represented as SIL types such as `$Int`.

Important information would be lost by waiting until LLVM: ARC operations and ownership conventions (`owned`, `guaranteed`), generic applications and witness tables, dynamic class and protocol dispatch, and the type information needed for devirtualization. LLVM sees a flattened C-like representation. It cannot tell whether a Swift array uses copy-on-write or whether a protocol call can be statically dispatched. Swift-specific optimization therefore has to happen in SIL.

## Commands worth remembering

- `-dump-ast`: the type-checked AST, including inferred implicit types.
- `-emit-silgen`: Raw SIL before optimization.
- `-emit-sil`: Canonical SIL; combine with `-O` to inspect specialization and devirtualization.
- `-emit-ir`: LLVM IR for type layout, calling conventions, and symbol mangling.
- `-emit-bc`: LLVM bitcode for LTO and cross-module optimization.
- `-emit-assembly`: assembly output.
- `-emit-object`: an object file without linking.
- `-o`: output path; without an `emit` option, compilation proceeds to linking.
- `-Onone` / `-O`: optimization levels; fix the level before comparing output.
- `-whole-module-optimization`: compile the module as one unit for cross-file optimization.

`-emit-silgen` is before optimization, while `-emit-sil` is after passes have run. With `-Onone`, many `retain` and `release` operations remain. With `-O`, functions may be inlined, reference-count operations removed, and generic calls specialized. A side-by-side diff makes the result visible.

Incremental builds also use `-incremental`, `-primary-file`, `-emit-module`, and `-emit-module-path`. `-primary-file` fully type-checks and emits SIL only for the primary file; other files import an existing `.swiftmodule`. If the same file appears several times in an Xcode log, it is usually being compiled as different primary files, not compiled redundantly.

## WMO and incremental compilation

| Dimension | Incremental, file by file | Whole-module optimization |
| --- | --- | --- |
| Unit | One file | The whole module |
| Optimization | Within a file | Cross-file inlining and specialization |
| Full build | Usually cheaper | More CPU and memory |
| One-file change | Rebuild that file | Often rebuild the module |
| Best fit | Debug and iteration | Release and shipping |

Keep WMO off for daily iteration and enable it for Release. Accidentally enabling `-whole-module-optimization` in Debug is painful: one line can trigger a full build.

## Objective-C interop

Swift imports Objective-C through `lib/ClangImporter`. On the command line, `-import-objc-header` selects a bridging header; in Xcode the setting is `SWIFT_OBJC_BRIDGING_HEADER`. The importer wraps that header as a Clang module.

The useful mappings are `NSString` to `String`, `NSArray` to `Array`, and `NSDictionary` to `Dictionary`. `nonnull` and `nullable` decide whether an imported value is optional. `NS_SWIFT_NAME` renames declarations, while `objc` controls exposure. Frameworks declare module boundaries with `module.modulemap`, and `-Xcc` forwards arguments to Clang when necessary.

The reverse direction uses a generated header. The header named by `SWIFT_OBJC_INTERFACE_HEADER_NAME`, usually `ProductModuleName-Swift.h`, lets Objective-C call Swift classes. When a mixed-language type does not line up, the problem is usually nullability or module mapping, not Swift syntax.

Compiler flags change across versions, so I run `swiftc -help` before relying on one.
