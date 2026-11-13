---
layout: post
title: "An Agent-Driven iOS Workflow: Building a Feature with Claude Code"
description: "A practical iOS workflow with Claude Code for exploration, planning, subagents, testing, permissions, and human review."
date: "2026-11-03"
category: "iOS"
comments: true
tags: ["iOS", "Claude Code", "AI", "Agent"]
---

AI coding tools are no longer limited to completing a snippet. Claude Code can read a codebase, edit files, run commands, and connect to development tools. The important change is that it can participate in a complete task: understand the project, propose a plan, implement in slices, and finish with tests and review.

I still do not want to hand iOS development to a black-box agent. A more useful arrangement is to put the agent inside the project's existing engineering discipline. It explores and executes; I define the boundaries, inspect the diff, and verify behavior in the simulator and on real devices.

This article draws on the [Claude Code overview](https://code.claude.com/docs/en/overview), [common workflows](https://code.claude.com/docs/en/common-workflows), and [best practices](https://code.claude.com/docs/en/best-practices). The workflow below is my own practice, not an official Anthropic template for iOS projects.

## 1. Let the agent understand the project first

I do not start with “implement this screen.” I start Claude Code from the project root and ask it to answer a few questions:

```text
Do not modify files yet. Read the project structure, main targets, dependencies,
test targets, and existing development instructions.
Summarize the app architecture, data flow, important constraints, and the files
we need to inspect before implementing a new feature.
```

`CLAUDE.md` or `AGENTS.md` should contain durable project facts: how to build and test, which directories are protected, the local style, and which actions require approval. Claude Code's documentation explains that these files provide persistent context at the start of a session. They are still instructions for the model, not enforcement mechanisms. Rules that must never be violated belong in permission rules or hooks.

## 2. Turn the request into a checkable plan

I ask Claude Code for a plan before allowing edits:

```text
Break this request into small, independently verifiable steps.
For each step, name the files, behavior change, test strategy, and likely risks.
Do not edit files yet. Wait for my confirmation.
```

A good plan should reveal where data comes from, where state changes, how failures are handled, and what should remain untouched. Claude Code's common-workflow documentation treats planning before editing as a separate workflow because reviewing a plan is cheaper than finding direction inside a large diff.

## 3. Give different agents different context

Small tasks can stay in the main session. For work that requires a lot of reading, I use Claude Code subagents for focused work:

- One agent maps the existing navigation and state flow without editing.
- One agent checks test coverage and missing edge cases.
- One agent reviews concurrency, memory, and API availability.

According to the official documentation, subagents have independent context and tool access, then return their results to the main session. They are useful for research, code exploration, and review. File ownership still needs to be explicit so multiple agents do not edit the same file at once.

Claude Code also has Agent Teams, but they remain experimental as of this article's date, are disabled by default, and add coordination overhead. I would not enable them just to make a workflow look more agentic. For most iOS features, subagents plus Git worktrees are enough.

## 4. Implement vertical slices instead of generating the whole feature

I prefer one runnable path at a time:

1. Add the model and the smallest data source.
2. Connect the view model or state container.
3. Add minimal loading, success, and failure UI states.
4. Add unit tests and preview data immediately.
5. Handle animation, empty states, and accessibility details afterward.

After each slice, I ask Claude Code to run the project's existing formatter, build, and test commands. I name the commands and the expected evidence:

```text
After implementing this slice, run the project's existing formatting, build,
and test commands. If something fails, explain the cause before fixing it.
Do not delete tests or weaken assertions just to make the command pass.
List the exact commands you ran and their results when finished.
```

Claude Code's best-practices guide treats “give Claude a check to run” as a central recommendation. Tests turn “done” from a sentence in natural language into repeatable evidence.

## 5. Make boundaries explicit with permissions and hooks

Prompts express intent, but they cannot carry every safety rule. “Do not modify generated files” is only a request. If the rule has no exceptions, enforce it with permission denies, the sandbox, or a hook.

My default boundaries are:

- Reads and searches can run automatically.
- Business-code edits should leave a clear diff.
- Deleting files, changing dependencies or signatures, and running release commands require approval.
- `xcodebuild`, tests, and static checks can be allowlisted while keeping their output visible.
- A Stop hook checks formatting, compilation, and tests before a task can be considered complete.

Claude Code's [permissions documentation](https://code.claude.com/docs/en/permissions) supports fine-grained rules for tools and commands. [Hooks](https://code.claude.com/docs/en/hooks) provide deterministic checks before or after tool calls. The point is to turn “the model should remember” into “the tool checks every time.”

## 6. Validate iOS work at three levels

An agent can run commands, but it cannot replace judgment on a real device.

### Code level

Run Swift compilation, Swift Testing/XCTest, lint, and the project's static checks. Pay attention to error states, cancellation, repeated taps, empty data, and denied permissions.

### Engineering level

Review schemes, build configurations, deployment targets, signing, and new dependencies. A successful build on the agent's machine does not prove that CI, archiving, or older devices will work.

### Product level

Check startup, scrolling, keyboard behavior, dark mode, Dynamic Type, VoiceOver, offline behavior, and background recovery in the simulator and on a real device. An agent can prepare the checklist and record results, but people still judge touch, rhythm, and visual hierarchy.

## A prompt I would reuse

```text
You are a collaborating engineer in this iOS repository.

Rules:
1. Read relevant files and project instructions before making claims.
2. Propose a plan and wait for confirmation before editing.
3. Complete one verifiable vertical slice at a time.
4. Follow the existing architecture; do not add abstractions for hypothetical needs.
5. Run the specified formatting, build, and test commands after changes.
6. Do not delete tests, hard-code test inputs, or hide problems by disabling warnings.
7. Summarize changes, verification commands, unresolved risks, and device checks.
```

The prompt is not magic. It works because the repository also has a focused `CLAUDE.md`, runnable tests, and explicit permission boundaries. Anthropic's best-practices guide makes the same distinction: project-specific rules, checks, and protected constraints are worth preserving; facts the model can simply read from the code are not.

## Always inspect the diff

AI agents make a first draft cheaper, but they also make a large set of plausible-looking changes cheaper. My final action is not “Claude says it is done.” It is:

```text
Stop editing and perform a final review:
1. Check the original request item by item.
2. Inspect the complete diff and identify unnecessary changes.
3. List behavior that is not covered by tests.
4. List everything I must verify in the simulator or on a real device.
5. State every uncertainty explicitly; do not guess.
```

Agent-driven iOS development does not remove people from development. It moves their time from repetitive editing to problem definition, boundary design, and result verification. Claude Code is a strong engineering collaborator that can read code, run commands, and investigate in parallel. Whether the architecture is sound, the interaction feels right, and the feature deserves release still requires a person to own the decision.

### References

- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [Common workflows](https://code.claude.com/docs/en/common-workflows)
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)
- [Configure permissions](https://code.claude.com/docs/en/permissions)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
