---
layout: post
title: "Obsidian × Claude Code: turning plain-text notes into a searchable knowledge base"
description: "Directory conventions, metadata rules, and a broken-link checker for an Obsidian vault."
date: "2026-07-08"
category: "tools"
comments: true
tags: ["AI", "Tooling", "Obsidian"]
---

After a few hundred notes, the real problem is not writing more. It is finding something again. Keyword search can find individual notes, but the results are not connected. Asking a model to organize them also usually means exporting everything from its original format first.

Moving to a plain-text vault solved both problems. This article records the directory layout, metadata rules, scripts, and the boundary between work I can delegate to a model and work I still need to do myself.

## Local-first is an engineering constraint

The vault contains ordinary Markdown files, so `rg`, `sed`, `git`, Python, and a coding assistant can process them directly. There is no export step. After `git init`, every cleanup has a diff and accidental deletion can be recovered with `git restore`. Editors, operating systems, and even the whole toolchain can change without moving the data. The trade-off is that there is no server-side index; search and structural consistency need scripts.

## A directory convention

```text
vault/
├── inbox/        unsorted fragments; formatting may be incomplete
├── notes/        finished single-note files
├── topics/       topic indexes, links, and navigation
├── sources/      papers, transcripts, and web excerpts
├── daily/        dated logs
└── _meta/        templates, scripts, and export artifacts
```

Files in `inbox` do not participate in backlinks. Sorting is one-way. Filenames are titles, globally unique, and contain no special characters beyond spaces. `sources` and `notes` stay separate so original material is not mixed with my own paraphrase. That distinction matters when material is passed to a model.

## YAML frontmatter rules

Keep the schema small, stable, and easy for scripts to parse:

```yaml
---
title: "Broken-link check"
created: 2026-05-02
updated: 2026-05-08
status: evergreen
type: note
tags:
  - obsidian
  - tooling
aliases:
  - Link check
related:
  - "[[Vault layout]]"
---
```

Use only `inbox`, `draft`, and `evergreen` for `status`; use `note`, `topic`, `source`, and `daily` for `type`. Keep `created` and `updated` in `YYYY-MM-DD` format. Use `aliases` for old titles during a rename, and keep explicit related-note links separate from inline links.

## Batch cleanup with a CLI

Start by checking the scale before changing anything:

```bash
#!/usr/bin/env bash
set -euo pipefail

VAULT="vault"

rg -n '\[\[' "$VAULT" --glob '*.md' | head -40
rg -l '^status: inbox' "$VAULT" --glob '*.md'

mkdir -p "$VAULT/notes"
for f in "$VAULT"/inbox/*.md; do
  [ -e "$f" ] || continue
  mv "$f" "$VAULT/notes/$(basename "$f")"
done
```

Obsidian links use `[[Title]]`, and can include an alias or section such as `[[Title|Alias]]` and `[[Title#Section]]`. Renaming a note is where stale links appear. A small standard-library script can scan every Markdown file and report targets that do not exist. It should be treated as a report, not as permission to rewrite links automatically.

One caveat: using the file stem as the dictionary key misclassifies two files with the same name in different directories. The simplest fix is to make filenames globally unique. If duplicate names are necessary, use relative paths in links and use full paths as keys in the script.

Run the check before and after a cleanup, and only commit when the number of broken links has not increased.

## Links versus tags

Use links for relationships between concepts and tags for enumerable categories. Do not use hierarchical tags such as `project/ai/blog` as a replacement for a namespace; they are difficult to search and often duplicate links. If deleting metadata should notify another note, use a link. If the goal is to select a group of files for batch processing, use a tag.

`aliases` are a safety net for renames: leave the old title in place, update links in bulk, run the checker until it reports zero broken links, and only then remove the alias.

## Trim context before giving it to a model

The sequence is search, slice, and assemble. Use `rg` to find candidate files by keyword or tag. Read only the frontmatter and the lines near the match instead of the entire note. Assemble the task, relevant excerpts, explicit question, and output format at the end. For long material in `sources`, keep the matching passage and a small amount of surrounding context, and include the source filename so the result can be traced back.

Every included passage should be something the answer can cite. If it cannot be traced, it probably does not belong in the context.

## Automation has a boundary

Good model tasks include filling metadata, drafting summaries, turning `inbox` fragments into `notes`, renaming files according to a rule, and suggesting broken-link repairs. These outputs are diffable and reversible.

Keep these decisions manual: merging notes, deleting content, changing conclusions, changing the meaning of a `related` link, and anything that depends on what a sentence actually means. Use Git as the safety net. Run automated cleanup in a branch or worktree, review the diff, and do not let generated artifacts in `_meta` overwrite notes directly.

## Relationship to the blog pipeline

The blog sources in `content/posts` use the same shape: Markdown, frontmatter, and a filename as the slug. The flow is `sources` for raw material, `notes` for evergreen conclusions, and a draft status before a note becomes a public post. Add `date`, `category`, `tags`, and a short description, then move it into the blog directory. After publishing, feed corrections back into the vault by updating `updated`, so the two copies do not quietly diverge.
