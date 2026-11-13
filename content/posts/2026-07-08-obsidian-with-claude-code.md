---
layout: post
title: "Obsidian × Claude Code：把纯文本笔记变成可检索的知识库"
description: "记 Obsidian vault 的目录约定、元数据规范与断链检查脚本。"
date: "2026-07-08"
category: "tools"
comments: true
tags: ["AI","工具链","Obsidian"]
---

笔记攒到几百篇之后，真正的问题不是「写不下」，是「找不回来」。搜关键词能搜到，但搜出来的东西彼此不连着；想让模型帮忙整理，又得先把内容从某个格式里导出一次。

换成纯文本 vault 之后这两件事一起解决了。这篇记的是目录怎么分、元数据怎么定、脚本怎么写，以及哪些整理能交给模型、哪些必须自己动手。

## 本地优先不是情怀，是工程约束

vault 里全是 Markdown 明文，`rg`、`sed`、`git`、Python 和编码助手都能直接处理，没有导出格式转换这一步。`git init` 之后每次整理都有 diff，误删能 `git restore`；换编辑器、换系统、换掉整个工具链，数据不动。代价是没有服务端索引，检索和结构一致性得自己用脚本补。

## vault 的目录约定

目录分层如下：

```text
vault/
├── inbox/        未分拣的原始片段，允许格式不齐
├── notes/        已定稿的单篇笔记，一文一文件
├── topics/       主题索引页，主要承载双链与导航
├── sources/      论文、字幕、网页摘录的原文存档
├── daily/        按日期的流水记录
└── _meta/        模板、脚本、导出产物，Obsidian 可忽略此目录
```

`inbox` 里的文件不写进任何双链，分拣只做单向流动。文件名即标题，全局唯一，不带空格以外的特殊字符。`sources` 与 `notes` 分开，原文与自己的转述不混在一起，喂给模型时能区分材料和结论。

## YAML frontmatter 元数据规范

结构化靠 frontmatter，字段要少、类型要稳、能被脚本解析：

```yaml
---
title: "双链一致性检查"
created: 2026-05-02
updated: 2026-05-08
status: evergreen
type: note
tags:
  - obsidian
  - tooling
aliases:
  - 断链检查
related:
  - "[[vault 目录约定]]"
---
```

规范：`status` 只取 `inbox`、`draft`、`evergreen` 三个值，脚本靠它筛选；`type` 取 `note`、`topic`、`source`、`daily`，决定处理方式；`created` 和 `updated` 用 `YYYY-MM-DD`，不要混用带时区的写法；`aliases` 吸收同义词和旧标题，供重命名时做兼容；`related` 放显式双链，和正文里的行内双链分开管理。具体 YAML 语法以 Obsidian 与所用解析器的官方文档为准。

## 用 CLI 做批量整理

先看几个检索与重命名操作：

```bash
#!/usr/bin/env bash
set -euo pipefail

VAULT="vault"

# 1) 列出所有含双链的笔记，先看规模再动手
rg -n '\[\[' "$VAULT" --glob '*.md' | head -40

# 2) 按 status 挑出待分拣的草稿
rg -l '^status: inbox' "$VAULT" --glob '*.md'

# 3) 把 inbox 下已定稿的文件归入 notes
mkdir -p "$VAULT/notes"
for f in "$VAULT"/inbox/*.md; do
  [ -e "$f" ] || continue
  mv "$f" "$VAULT/notes/$(basename "$f")"
done
```

双链一致性检查：Obsidian 的双链写作 `[[标题]]`，也支持 `[[标题|别名]]` 和 `[[标题#小节]]`。重命名之后最容易留下指向旧标题的断链。下面这个脚本只依赖标准库，扫描全部 Markdown 文件，把指向不存在文件名的链接列出来：

```python
import re
from pathlib import Path

VAULT = Path("vault")
LINK = re.compile(r"\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]")

def main() -> None:
    notes = {p.stem: p for p in VAULT.rglob("*.md")}
    broken: dict[str, list[str]] = {}
    for stem, path in notes.items():
        for raw in LINK.findall(path.read_text(encoding="utf-8")):
            target = raw.strip()
            if target and target not in notes:
                broken.setdefault(stem, []).append(target)
    for stem, targets in sorted(broken.items()):
        for t in targets:
            print(f"{stem}.md -> [[{t}]]")
    print(f"共 {len(notes)} 篇，{sum(len(v) for v in broken.values())} 处断链")

if __name__ == "__main__":
    main()
```

脚本用文件主干名做键，**命名冲突会直接导致误判**：两个同名文件放在不同目录时，字典只留最后一个，另一个的链接可能被算作断链。解法从约定上消除冲突：文件名全局唯一；确实需要同名时，双链里带上相对路径，并在脚本里改用完整路径做键。

把检查接进 `git` 的提交前流程即可，不必做成常驻服务：改动前后各跑一次，断链数不增加才提交。

## 双链与标签的取舍

概念之间的关系用双链，可枚举的分类维度用标签；不要用标签模拟命名空间，例如 `project/ai/blog` 这种层级标签，检索时既难写正则又容易和双链重复。删除某条元数据后希望另一篇笔记自动感知到变化，就用双链；只是想筛出一批文件做批量处理，用标签。命名冲突还靠 `aliases` 兜底：旧标题留在别名里，重命名时先批量把双链指向新标题，再跑一次上面的脚本确认零断链，最后才删别名。

## 喂给模型时的上下文裁剪

裁剪分三段：先检索、再截取、最后拼装。先用 `rg` 按关键词或标签命中候选文件；然后只读这些文件的 frontmatter 和与关键词相邻的若干行，不读整篇正文；最后按任务说明、相关片段、明确的问题、输出格式拼装。对于 `sources` 里的长原文，只取命中段落及其前后各一小段，并标注来源文件名，让回答能回溯到具体文件。**进去的每一段都应该能被回答引用**，做不到就别放进去。

## 自动化的边界与人工复核

适合交给模型的：补 `status`、`type` 等元数据、按模板生成摘要、把 `inbox` 片段草拟成 `notes`、按命名规则批量重命名、给出断链修复建议。这些动作产物可 diff、可回滚、错了不损失语义。

必须人工复核的：合并两篇笔记、删除内容、改写结论、调整 `related` 的语义指向、任何涉及这句话到底是什么意思的判断。防线是 Git：所有自动整理在独立分支或工作树里跑，逐 diff 审阅后合并；`_meta` 下的脚本产物不直接覆盖 `notes`。

## 与博客内容管线的关系

博客源文件放在 `content/posts` 目录下，文件名即 slug，同样是一篇 Markdown 加一段 YAML frontmatter，同样可以 Git 版本化，从笔记到文章不需要格式转换。

流程是：`sources` 存原始材料，`notes` 写成 `evergreen` 结论，准备公开时在 vault 里标 `status: draft`，补上 `date`、`category`、`tags` 和一句话摘要，再落到博客目录成为一篇文章；静态导出之后，`out` 目录就是最终产物。反过来，文章发布后收到的修正回到 vault 里更新 `updated` 字段，避免两边结论分叉。具体的导入导出字段映射以各工具当前版本的官方文档为准。
