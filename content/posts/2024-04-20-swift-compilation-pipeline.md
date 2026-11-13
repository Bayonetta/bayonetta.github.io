---
layout: post
title: "Swift 编译管线与 swiftc 常用命令"
description: "从 Parse 到链接过一遍 Swift 编译管线，附上排查时常用的 swiftc 命令。"
date: "2024-04-20"
category: "iOS"
comments: true
tags: ["iOS","Swift","编译原理"]
---

有个泛型函数在 Release 下死活没被特化。我把 `-emit-silgen` 和 `-emit-sil` 各导出一份 SIL 并排 diff，才确认是调用点被当成不透明类型传了出去，特化根本没发生。为了以后不再靠猜，把整条管线又过了一遍。

```text
.swift 源码
  → Parse（词法与语法分析）→ AST
  → Sema（名称绑定、类型检查、约束求解）
  → SILGen → Raw SIL
  → SIL 规范化与优化 → Canonical SIL
  → IRGen → LLVM IR
  → LLVM 优化与后端 → 目标文件
  → 链接 → 可执行文件
```

括号里是 Swift 仓库中对应的目录：

- Parse（`lib/Parse`）：字符流转成 token，生成 AST，此时还没有类型信息。
- Sema（`lib/Sema`）：名称绑定、类型检查、约束求解。`var x = 1` 在这一步被推断成 `Int`，隐式转换、`inout`、可访问性、可用性检查也在这里补上。类型错误基本都从这儿报出来。
- SILGen（`lib/SILGen`）：把类型检查后的 AST 降级成 SIL，同时插入 ARC 与所有权指令。
- Raw SIL：SILGen 的未优化产物，`alloc_stack`、`retain` / `release` 这些细节都还留着。
- Canonical SIL 与优化（`lib/SILOptimizer`）：跑优化 pass，做泛型特化、去虚拟化、内联、ARC 优化、所有权 SSA 规范化。
- IRGen（`lib/IRGen`）：SIL 降到 LLVM IR。Swift 的类型、ARC、泛型、派发语义在这一步被拍平成指针、整数和函数调用。
- LLVM 优化与后端：指令优化、寄存器分配、指令选择，产出目标文件。
- 链接：合并目标文件、标准库、运行时和系统框架，符号解析与死代码剥离都在这一层。

## 中间为什么要插一层 SIL

AST 直接降到 LLVM IR 装不下 Swift 的语义。SIL 是 SSA 形式：值以 `%0`、`%1` 编号且只赋值一次，控制流切成 `bb0`、`bb1` 这样的基本块，类型标成 `$Int` 这类小写 SIL 类型。

更麻烦的是，很多信息到 LLVM IR 就已经丢了，而且不可逆：ARC 的 `retain` / `release` 与所有权约定（`owned`、`guaranteed`）、泛型特化前的 `apply` 和 witness table、类与协议方法的动态派发、去虚拟化要用的类型信息。LLVM 只看得见扁平的 C 级表示，既判断不出一个 Swift 数组是不是写时复制，也判断不出某次协议调用能不能静态派发。Swift 特有的优化只能在 SIL 层做完。

## 常用命令

- `-dump-ast`：类型检查后的 AST，含推断出的隐式类型。
- `-emit-silgen`：Raw SIL，未优化，看 SILGen 产物与 ARC 插入。
- `-emit-sil`：Canonical SIL，配合 `-O` 看优化后形态，确认特化与去虚拟化。
- `-emit-ir`：LLVM IR，查类型布局、调用约定、符号 mangling。
- `-emit-bc`：LLVM bitcode，用于 LTO 与跨模块链接优化。
- `-emit-assembly`：汇编，核对指令选择与寄存器分配。
- `-emit-object`：只产出目标文件，不链接。
- `-o`：指定输出路径；不带 `emit` 参数时默认走到链接。
- `-Onone` / `-O`：优化级别，另有 `-Osize`、`-Ounchecked`，排查时先固定级别再对比。
- `-whole-module-optimization`：整个模块作为一个编译单元，开启跨文件优化。

```bash
# 类型检查后的 AST
swiftc -dump-ast main.swift > ast.txt

# Raw SIL 与 Canonical SIL
swiftc -emit-silgen -Onone main.swift -o raw.sil
swiftc -emit-sil -O main.swift -o canonical.sil

# LLVM IR / bitcode / 汇编 / 目标文件
swiftc -emit-ir -O main.swift -o main.ll
swiftc -emit-bc -O main.swift -o main.bc
swiftc -emit-assembly -O main.swift -o main.s
swiftc -emit-object -O main.swift -o main.o

# 全模块优化并链接成可执行文件
swiftc -O -whole-module-optimization main.swift other.swift -o app

# 核对本机 swiftc 实际支持的参数
swiftc -help | grep emit
```

`-emit-silgen` 是优化前，`-emit-sil` 是跑过 pass 之后。优化级别直接改 SIL 的样子：`-Onone` 下 `retain` / `release` 大片保留，`-O` 下同一个函数往往被内联、成对的引用计数操作被消掉、泛型调用被特化。两份并排 diff，优化有没有生效一眼就能看出来。

增量编译另有 `-incremental`、`-primary-file`、`-emit-module` 与 `-emit-module-path`。`-primary-file` 只让主文件被完整类型检查并生成 SIL，其余文件只导入已有的 `.swiftmodule`。Xcode 日志里同一个文件出现好几次，就是分批指定了不同主文件，不是重复编译。

## 一段 SIL 节选

对 `func addOne(_ x: Int) -> Int` 的摘录（节选示意）：

```text
// 节选 / 示意：addOne 的 Canonical SIL
sil hidden @$s4main6addOneyS2iF : $@convention(thin) (Int) -> Int {
bb0(%0 : $Int):
  %1 = integer_literal $Builtin.Int64, 1
  %2 = struct_extract %0 : $Int, #Int._value
  %3 = builtin "sadd_with_overflow_Int64"(%2 : $Builtin.Int64,
                                          %1 : $Builtin.Int64,
                                          $Builtin.Int1 false) : $(Builtin.Int64, Builtin.Int1)
  %4 = tuple_extract %3 : $(Builtin.Int64, Builtin.Int1), 0
  %5 = struct $Int (%4 : $Builtin.Int64)
  return %5 : $Int
}
```

`bb0(%0 : $Int)` 是唯一的基本块，`%0` 是 SSA 入参。`struct_extract` 取出 `Builtin.Int64`，`builtin` 调带溢出检查的加法，`tuple_extract` 取元组第 0 个元素，`struct` 包回 `Int`，`return` 结束基本块。中间值只赋值一次，这就是 SSA。

整数运算的溢出检查还在，`-Ounchecked` 才可能去掉。Raw SIL 里能看到 `owned` / `guaranteed` 和 `strong_retain` / `strong_release`，到 LLVM IR 里只剩一个函数调用。

## WMO 与增量编译

| 维度 | 增量编译（逐文件） | WMO 全模块优化 |
| --- | --- | --- |
| 编译单位 | 单个文件 | 整个模块 |
| 优化空间 | 仅文件内 | 跨文件内联、泛型特化、去虚拟化 |
| 全量构建耗时 | 较低 | 更高，内存与 CPU 峰值明显 |
| 单文件改动 | 只重编该文件 | 常需重编整个模块 |
| 适用阶段 | Debug 与日常迭代 | Release 与发版 |

日常迭代关掉 WMO，发版再打开。Debug 配置里误开 `-whole-module-optimization` 是最难受的一种，改一行等全量编译。

## 混编是怎么接进来的

Swift 调 Objective-C 靠 `lib/ClangImporter`。命令行用 `-import-objc-header` 指定桥接头，Xcode 里对应 `SWIFT_OBJC_BRIDGING_HEADER`，importer 把桥接头包装成一个 Clang module。

映射规则记几条就够：`NSString` 到 `String`、`NSArray` 到 `Array`、`NSDictionary` 到 `Dictionary`；`nonnull` / `nullable` 决定导入后是不是 Optional；`NS_SWIFT_NAME` 负责重命名，`objc` 属性控制暴露方式。框架侧靠 `module.modulemap` 声明模块边界，必要时用 `-Xcc` 把参数透传给 Clang。

反方向由 generated header 完成。`SWIFT_OBJC_INTERFACE_HEADER_NAME` 指定的那个头文件（形如 `ProductModuleName-Swift.h`），让 Objective-C 能调到 Swift 类。混编里类型对不上，八成是 nullability 标注或者模块映射没写对，不是 Swift 侧的语法问题。

参数随版本变，动手前跑一次 `swiftc -help`。
