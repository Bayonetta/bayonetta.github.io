---
layout: post
title: "Claude Code in a real engineering workflow"
description: "How I organize CLAUDE.md, manage context and permissions, and review AI-generated changes."
date: "2026-06-10"
category: "tools"
comments: true
tags: ["AI", "Tooling", "Claude Code"]
---

The first time I asked a model to change this blog, it also “optimized” `next.config.js` because that was supposedly “more modern”. The build passed and the site started, but static export behavior had changed.

After that I stopped treating it as an autocomplete tool. A fast collaborator that makes mistakes and occasionally makes its own decisions needs three things inside an engineering workflow: a specification, bounded permissions, and review of every diff. This is how I set those pieces up.

## `CLAUDE.md` is a specification, not a prompt collection

I keep `CLAUDE.md` at the repository root and version it with the project. It has six parts: project conventions, build and test commands, directory responsibilities, explicit prohibitions, code style, and commit and review rules.

Project conventions state the language, runtime, package manager, and artifact shape. Since this blog is statically exported, I explicitly say not to introduce dependencies that require a server runtime. Commands should be complete and copyable, not “run the tests”. The directory section describes boundaries, especially which directories are normally read-only. Prohibitions should be concrete: do not rewrite existing posts in bulk; do not add a dependency without explaining why in the plan. Style rules should be mechanically checkable, such as strict mode, no `any`, and a commit-message format.

Here is a shortened example; replace the commands with the real scripts in your repository:

```text
# Project conventions
- Language: blog posts use Simplified Chinese; code comments use English.
- Runtime: Node.js 20 LTS, pnpm, and pnpm-lock.yaml.
- Artifact: static export to out; no server-runtime dependencies.

# Build and test commands
- Install: pnpm install --frozen-lockfile
- Local preview: pnpm dev
- Type check: pnpm exec tsc --noEmit
- Content check: pnpm check:content
- Build: pnpm build
- Unit tests: pnpm test -- --run

# Directory layout
- content/posts          post sources, one post per slug
- src/app                App Router pages
- src/components         reusable components
- scripts                one-off maintenance scripts, reviewed before adding

# Explicit prohibitions
- Do not rewrite existing posts in content/posts in bulk
- Do not add dependencies without explaining the reason in the plan
- Do not change date or slug parsing in src/lib unless the task asks for it
- Do not commit .env files or secrets
- Do not modify the lockfile

# Style and commits
- TypeScript strict mode; no any
- Use function components and existing style tokens
- Use Chinese commit messages; one commit, one change
```

## Context management and compaction

Split a large task into sessions. At the end of each phase, restate the constraints that must not change. Before editing, ask the model to list the files it will read and modify. Use `@path/to/file` references to provide only relevant context instead of feeding it the whole repository. When the conversation becomes too long, compact it or start a fresh session; important constraints belong in files, not only in memory.

Signs of context overload are contradictions, old approaches reappearing, and an ever-growing change set. When those appear, stop and restate the specification.

## Planning and incremental confirmation

Large changes deserve a plan first: which files will change, how many phases there are, and the risk of each phase. Then execute one phase, run its checks, inspect the result, and continue. A plan can still be wrong, so check that its scripts, paths, and assumptions actually exist.

## Permission boundaries

Use the smallest permission set possible. Reading is different from writing; deleting files, accessing the network, and pushing Git changes should be explicit actions. Keep secrets in environment variables, never in prompts or the repository. Put experiments in a branch or worktree, then review the diff before merging.

## Custom commands, hooks, and subagents

Custom commands are useful for fixed, repeatable workflows. Hooks are for mechanical checks that must happen regardless of the model's judgment, such as formatting or validation before a commit. Subagents fit independent tasks whose context can remain isolated, such as reviewing two unrelated modules in parallel.

Do not force a judgment-heavy change into a command, a human decision into a hook, or a shared discussion into a subagent. The repository's actual boundaries matter more than the label.

## Turn instructions into verifiable specifications

A useful instruction includes four things: inputs, outputs, constraints, and acceptance criteria. “Add date validation” is incomplete. A better task says which frontmatter to read, where the existing validator lives, what files may change, what dependency versions are allowed, and which commands prove success.

## Put generated work into the engineering process

The order matters. Start with a test or a concrete acceptance check. Make small changes and keep commits focused. Review configuration, dependencies, deleted lines, and new branches before spending time on cosmetic code details. Do not mix a content rewrite with a dependency upgrade or a project-wide refactor.

## Common failure modes

The recurring problems are hallucinated APIs, quiet configuration changes, context overload, and overconfident rewrites. The defenses are straightforward: require official sources when an API is uncertain, prohibit unrelated configuration changes, work in phases, and limit each change set.

## Traceability

Every AI-assisted change should answer four questions: who gave the instruction, which specification it followed, which checks were run, and who reviewed the diff. The first three can live in `CLAUDE.md`, a plan, tests, and the command output. The last one belongs in the review history. Adding an `AI-assisted` marker to a commit is optional, but preserving the trail is not.
