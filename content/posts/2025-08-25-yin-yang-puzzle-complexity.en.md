---
layout: post
title: "Yin-Yang puzzles: how local rules create global difficulty"
description: "Rules, CSP and SAT encodings, and connectivity constraints in Yin-Yang puzzles, with an exhaustive-check script."
date: "2025-09-06"
category: "research"
comments: true
tags: ["Algorithms", "Computational complexity", "Combinatorial puzzles", "Research"]
---

I recently found a paper whose topic is close to my research: *Yin-Yang Puzzles are NP-complete*. Pencil-and-paper puzzles often combine local rules with global connectivity. Yin-Yang puzzles are striking because the rules are so small—only black and white circles—yet global connectivity and a local `2 × 2` prohibition push grid partitioning to a complexity boundary.

## Two rules and their graph-theoretic duality

Some cells of an `m × n` grid are prefilled black or white. The remaining cells must be filled so that:

1. all black cells form one four-neighbor-connected component, and all white cells form one four-neighbor-connected component;
2. no `2 × 2` block is monochromatic.

Without the `2 × 2` rule, this is a completion problem for partitioning a rectangular grid graph into two induced connected subgraphs. With the rule, monochromatic cycles are excluded; under suitable boundary conditions the problem can be viewed as partitioning the grid into two induced trees.

## The reduction tool: TRVB and diagonal exclusion

The hardness reduction starts from Planar 4-Regular Tree-Residue Vertex Breaking (TRVB): given a planar 4-regular multigraph, choose vertices to break so that the remaining graph becomes exactly one connected tree.

The key local fact is a diagonal exclusion lemma: in any valid Yin-Yang solution, a `2 × 2` block cannot have alternating colors on its diagonals. If two diagonal black cells were connected around the outside, their black path would separate the two diagonal white cells and prevent the white component from being connected.

This lemma drives the propagation behavior of the later gadgets.

## Connected partition without the `2 × 2` rule

Black grid lines represent graph edges, while the background is prefilled white. A vertex gadget has four empty cells in a cross shape.

- Filling all four with white breaks the four black wires and connects the surrounding white faces: the TRVB vertex is broken.
- Filling all four with black joins the four wires at the center while leaving the white faces separated: the vertex remains unbroken.

After an orthogonal embedding and a `9 × 9` enlargement, a solution of the puzzle corresponds exactly to a tree residue of the TRVB instance.

## The `2 × 2` rule: two trees and a striped background

The background can no longer be all white, so the construction uses alternating black and white columns, with black and white tendrils extending from the edge wires. A larger `16 × 16` vertex gadget forces all its empty cells after the first choice. There are only two global states:

1. a broken vertex, where the black wire is cut and the white paths are joined;
2. an unbroken vertex, where black wires connect internally and white paths remain locally separated.

An exceptional cell connects the important black backbone to the top boundary. The construction ensures that the backbone is connected and acyclic exactly when all black cells are connected and acyclic, encoding the TRVB tree condition.

## Complexity overview

| Model | Constraints | Equivalent problem | Complexity |
| :--- | :--- | :--- | :--- |
| Yin-Yang without `2 × 2` | Black and white connectivity | Grid Graph Connected Partition Completion | **NP-complete** |
| Yin-Yang with `2 × 2` | Connectivity plus no monochromatic block | Grid Graph Tree Partition Completion | **NP-complete** |
| Multi-color extension | Global connectivity for `k ≥ 3` colors | `k`-Color Grid Graph Partition | **NP-complete** |

The paper leaves questions about sparse clues, triangular and hexagonal grids, and the complexity of finding another solution. The most interesting technique for me is the use of striped backgrounds and tendrils to encode topological wires inside a geometrically constrained grid. Very small rules are enough to carry an intricate NP-hard construction.
