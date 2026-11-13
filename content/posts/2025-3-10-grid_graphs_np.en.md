---
layout: post
title: "Hamiltonian paths in grid graphs"
description: "Notes on the 1982 paper by Itai, Papadimitriou, and Szwarcfiter: bipartiteness, NP-completeness, and the stripping/splitting framework for rectangular grids."
date: "2024-12-30"
category: "research"
comments: true
tags: ["Algorithms", "Computational complexity", "Graph theory", "Research"]
---

While organizing papers on path planning and combinatorial optimization in grid graphs, I kept returning to the 1982 paper *Hamilton Paths in Grid Graphs* by Alon Itai, Christos H. Papadimitriou, and Jayme Luiz Szwarcfiter. I finally had time to go through the proof structure and reductions in full.

A grid graph is an induced subgraph of the infinite grid `G^{\infty}`, so it has a strict bipartite structure: the parity of a vertex is determined by the parity of the sum of its coordinates. Many chessboard and robot-coverage problems are, at their core, searches for a Hamiltonian path or cycle.

The paper shows a sharp complexity split. Hamiltonian path and cycle remain NP-complete for general planar grid graphs, but regular rectangular grid graphs admit elegant necessary-and-sufficient conditions and a linear construction algorithm.

## NP-completeness for general grid graphs

The paper reduces from the Hamiltonian-cycle problem for planar bipartite graphs of maximum degree three. A parity-preserving embedding maps the two vertex classes to even and odd grid vertices, and maps each original edge to a vertex-disjoint grid path.

The main gadgets are a 9-Cluster and a Tentacle. A 9-Cluster replaces an original vertex with a `3 × 3` block. No matter which corners are used for entry and exit, the block has a Hamiltonian path through all nine cells. A Tentacle is a narrow corridor that replaces an original edge. It has two relevant traversals: a cross path, representing an edge selected in the original Hamiltonian cycle, and a return path, representing an edge that is not selected.

Putting the clusters and tentacles together makes a Hamiltonian cycle in the original graph equivalent to one in the constructed grid graph. The paper therefore proves NP-completeness for Hamiltonian paths and cycles in grid graphs. The same construction also gives a direct NP-completeness proof for Euclidean TSP without relying on delicate floating-point distance calculations.

## Rectangular grids: color compatibility and forbidden configurations

When the graph is a rectangle `R(m, n)`, the complexity changes completely. Because the graph is bipartite, a Hamiltonian path must alternate colors.

- If `m × n` is even, the two color classes have equal size, so endpoints `s` and `t` must have different parity.
- If `m × n` is odd, one color has one extra vertex, so both endpoints must lie in the majority color.

Color compatibility is not sufficient. Three geometric configurations can still make the path impossible:

- **F1:** a `1 × n` rectangle where an endpoint is not a corner;
- **F2:** a `2 × n` rectangle where `s` and `t` form a non-boundary edge;
- **F3:** a `3 × even` rectangle whose endpoint positions create a separating obstruction.

An instance is **acceptable** exactly when it satisfies color compatibility and avoids F1–F3.

## Stripping, splitting, and prime problems

To prove that acceptability is sufficient, the paper uses a recursive reduction:

1. **Stripping:** remove a width-two strip from the boundary while keeping the remaining instance acceptable, then extend a path in the smaller rectangle.
2. **Splitting:** cut the rectangle along an edge into two smaller rectangles, solve the two acceptable subproblems, and join their paths.
3. **Prime problems:** handle the small instances that cannot be stripped or split. There are only finitely many of them; exhaustive inspection confirms that every acceptable prime instance has a Hamiltonian path.

The decision problem for a rectangular grid can therefore be solved in O(1) time after checking the conditions, while constructing the path takes optimal linear time O(mn).

## Complexity at a glance

| Graph type | Problem | Complexity | Main idea |
| :--- | :--- | :--- | :--- |
| General grid graph | Hamiltonian path/cycle | **NP-complete** | Parity-preserving embedding, 9-Clusters, and Tentacles |
| Rectangular subgrid graph | Hamiltonian path/cycle | **NP-complete** | Reduction through holes in the grid |
| Rectangular grid graph | Hamiltonian-path decision | **P, O(1)** | Color compatibility plus F1–F3 |
| Rectangular grid graph | Hamiltonian-path construction | **P, O(mn)** | Recursive stripping and splitting |

The strongest impression from the paper is how much geometry changes complexity. Arbitrary holes can encode NP-complete gadgets, while the symmetry of a solid rectangle reduces the global search to local stripping and splitting.

The authors leave an open problem for hole-free non-rectangular grid graphs: if both `G` and `G^{\infty} - G` are connected, does Hamiltonian-cycle recognition have a polynomial-time algorithm? That question connects this old paper to later work on robot coverage and grid path planning.
