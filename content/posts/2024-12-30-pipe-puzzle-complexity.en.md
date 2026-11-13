---
layout: post
title: "The computational complexity of Pipe Puzzle"
description: "Notes on three connection models, the one-dimensional boundary, 3-Partition reductions, and frontier dynamic programming."
date: "2024-12-30"
category: "research"
comments: true
tags: ["Algorithms", "Computational complexity", "Combinatorial puzzles", "JAIST"]
---

I recently worked through *On Computational Complexity of Pipe Puzzles* by Shirayama, Shigemura, Otachi, Miyazaki, and Uehara. Jigsaw and edge-matching puzzles mostly test local consistency. Pipe Puzzle adds a global requirement: a source `s` must connect to a sink `t`, and no isolated local loop may appear anywhere on the board.

## Connection models and cards

The cards are rotatable unit squares. The basic pieces are `I` (straight), `L` (corner), `T` (three-way), `+` (four-way), and `X` (crossing without connection). The paper studies three connection rules:

1. **Uniform:** centered pipes of equal thickness connect whenever their openings face each other.
2. **Thickness:** openings have types, and only equal thicknesses connect.
3. **Height:** an opening has an offset `h ∈ [0, 1]`; two horizontal edges connect when their offsets sum to one.

The board is a `w × h` rectangle with source and sink on the boundary. There are `m` cards and `n = wh` cells.

## The `1 × n` boundary

When every card is used (`m = n`), the Thickness and Height models are solvable in linear time. A full one-row solution uses only straight cards. In the Thickness model, treat thicknesses as vertices and each card as an edge. Add an auxiliary edge between the source and sink types. The puzzle is solvable exactly when the resulting multigraph has an Eulerian cycle: it is connected and every vertex has even degree.

In the Height model, the same idea becomes a two-colored multigraph. A solution corresponds to an alternating Eulerian cycle, with the black and red degrees balanced at every vertex. Both checks are linear.

If cards may remain unused (`m > n`), the problem becomes NP-complete. A reduction from Hamiltonian cycle in cubic graphs uses vertices as thicknesses and graph edges as straight cards. Selecting a row of cards then visits every graph vertex exactly once. Allowing a choice of cards changes an Euler-style “use every edge” problem into a Hamilton-style “visit every vertex once” problem.

## 3-Partition and frame constructions

For boards of height at least two, even using every card can be NP-complete. The reductions start from strongly NP-complete 3-Partition. A frame creates slots of length `B`, and each number `aᵢ` becomes a small pipe gadget of length `aᵢ`. Filling every slot exactly with three gadgets is equivalent to solving the 3-Partition instance.

The result remains hard on height `k ≥ 3` boards without branching cards. The construction scales the numbers as `aᵢ' = 2aᵢ + 1` and `B' = 2B + 3`, making the target lengths odd. A snake-like path made only of `I` and `L` cards can then turn through the rows and fit the frame without `T` or `+` pieces.

## Frontier dynamic programming

The Uniform model becomes tractable when the board height `h` is fixed. A frontier DP scans the board cell by cell. The frontier contains `h + 1` open edges, each labeled as empty, connected to `s`, or belonging to another active component.

Canonical relabeling keeps equivalent connectivity states together. When two frontier ends from different components meet, their labels merge. When ends from the same component meet, a local loop has formed and the state is rejected unless an allowed branching card proves that the component remains connected to another frontier edge.

The paper gives a running time of `O(h^{h+2} n^3)` and space `O(h^{h+1} n^3)`. For constant `h`, this is a fixed-parameter tractable polynomial algorithm.

| Board | Model | Card condition | Complexity |
| :--- | :--- | :--- | :--- |
| `1 × n` | Thickness / Height | All cards used | **P, O(n)** |
| `1 × n` | Thickness / Height | Extra cards allowed | **NP-complete** |
| `2 × n/2` | Thickness / Height | `I`, `L`, `T` | **NP-complete** |
| `k × n/k`, `k ≥ 3` | Thickness / Height | Only `I`, `L` | **NP-complete** |
| `w × h`, fixed `h` | Uniform | All cards used | **P / FPT** |

The useful lesson is how close Eulerian and Hamiltonian behavior can be: allowing spare cards changes edge balancing into exact vertex coverage. The frontier DP is the complementary technique for global connectivity—compress the topology into a small boundary state.
