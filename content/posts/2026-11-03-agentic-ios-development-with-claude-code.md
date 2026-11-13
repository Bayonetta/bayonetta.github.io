---
layout: post
title: "AI Agent 驱动的 iOS 开发流程：我会怎样用 Claude Code 做一个功能"
description: "以 Claude Code 为主工具，把需求拆解、代码探索、并行代理、测试和人工验收串成一条可控的 iOS 开发流程。"
date: "2026-11-03"
category: "iOS"
comments: true
tags: ["iOS", "Claude Code", "AI", "Agent"]
---

AI 编码工具已经不只是“帮我补一段代码”。以 Claude Code 为例，它可以读取代码库、修改文件、执行命令，并连接开发工具。真正改变工作方式的地方，是它开始参与一个完整任务：先理解工程，再提出方案，接着分段实现，最后用测试和代码审查收尾。

但我不想把 iOS 开发交给一个黑盒 Agent。更实际的做法，是把 Agent 放进已有的工程纪律里：它负责探索和执行，人负责定义边界、审查差异、在模拟器和真机上确认行为。

本文参考了 [Claude Code 官方概览](https://code.claude.com/docs/en/overview)、[常见工作流](https://code.claude.com/docs/en/common-workflows) 和 [最佳实践](https://code.claude.com/docs/en/best-practices)。文中流程是我的实践整理，不是 Anthropic 对 iOS 项目的官方模板。

## 第一步：先让 Agent 读懂项目

我不会一上来就说“实现这个页面”。先从项目根目录启动 Claude Code，让它回答几个问题：

```text
先不要修改文件。请阅读项目结构、主要 target、依赖、测试目标和现有开发说明。
总结这个 App 的架构、数据流、关键约束，以及完成一个新功能前需要确认的文件。
```

项目里的 `CLAUDE.md` 或 `AGENTS.md` 用来放长期有效的事实：如何构建、测试命令是什么、哪些目录不能改、代码风格是什么、哪些操作必须先征得同意。Claude Code 官方文档说明，这些文件会在会话开始时提供持久上下文；但它们仍然是给模型读取的说明，不是强制执行机制。真正不能违反的规则，应该交给权限规则或 Hook。

## 第二步：把需求变成可检查的计划

我会要求 Claude Code 先只输出计划，不写代码：

```text
请把这个需求拆成可以独立验证的小步骤。
每一步写明：要改的文件、行为变化、测试方式、可能的风险。
先不要编辑文件，等我确认计划。
```

计划不能只写“修改 ViewModel、补测试”。好的计划应该能让人看出数据从哪里来、状态在哪一层变化、失败时怎么处理，以及哪些部分不应该碰。官方的常见工作流也把“先计划再编辑”列为独立流程，因为先看方案比事后从一大堆 diff 里找方向便宜得多。

## 第三步：让不同 Agent 处理不同的上下文

小任务直接在主会话完成即可。遇到需要大量阅读的任务，我会把它交给 Claude Code 的 subagent，例如：

- 一个 Agent 只负责梳理现有导航和状态流，不改文件。
- 一个 Agent 只负责检查测试覆盖和缺失的边界条件。
- 一个 Agent 只负责审查并发、内存和 API 可用性。

官方文档中，subagent拥有独立的上下文和工具权限，结果再返回主会话；它适合研究、代码探索和审查这类会产生大量中间信息的工作。文件编辑则要划清范围，避免多个 Agent 同时改同一个文件。

Claude Code 还有 Agent Teams，但截至本文日期仍是实验功能，默认关闭，并且会增加协调成本。除非任务确实需要多个独立角色互相讨论，我不会为了“看起来很 Agent”就打开它。一般的 iOS 功能，subagent 加 Git worktree 已经够用。

## 第四步：按垂直切片实现，而不是一次生成整个功能

我更倾向于让 Claude Code 一次完成一条能跑通的路径：

1. 先加模型和最小数据源。
2. 再接 ViewModel 或状态容器。
3. 加一个最小 UI 状态：加载、成功、失败。
4. 立刻补单元测试和预览数据。
5. 最后再处理动画、空状态和无障碍细节。

每完成一片，就让 Agent 执行项目已有的格式化、编译和测试命令。不要只说“检查一下”，而是明确告诉它要跑什么：

```text
实现这一小步后，请运行项目已有的格式化、编译和测试命令。
如果失败，先解释失败原因，再修复；不要通过删除测试或放宽断言来让命令变绿。
完成后列出实际运行过的命令和结果。
```

Claude Code 的最佳实践把“给 Agent 一个可以运行的检查”作为核心建议。测试不是为了让 Agent 看起来完成了，而是把“完成”的定义从一句自然语言变成可重复的证据。

## 第五步：用权限和 Hooks 把边界写死

Prompt 适合表达意图，不能承担所有安全约束。例如“不要修改生成文件”只是请求；如果这条规则真的不能例外，就应该使用权限拒绝规则、沙盒或 Hook。

我的基本边界会是：

- 读取和搜索可以自动进行。
- 修改业务代码前保留清晰的 diff。
- 删除、改依赖、改签名、执行发布命令必须人工确认。
- `xcodebuild`、测试和静态检查可以加入允许列表，但仍保留输出。
- Stop Hook 检查格式化、编译和测试结果，未通过就不能把任务标成完成。

Claude Code 的[权限文档](https://code.claude.com/docs/en/permissions)支持按工具和命令配置细粒度规则；[Hooks 文档](https://code.claude.com/docs/en/hooks)则可以在工具调用前后执行确定性的检查。这样做的意义是把“模型应该记住”变成“工具每次都会检查”。

## 第六步：把 iOS 的验证分成三层

Agent 可以运行命令，但它不能替代真实设备上的判断。我会分三层验收：

### 代码层

让 Claude Code 运行 Swift 编译、Swift Testing/XCTest、lint 和必要的静态检查。重点看是否真的覆盖了错误状态、取消、重复点击、空数据和权限拒绝。

### 工程层

检查 Xcode scheme、构建配置、最低系统版本、签名设置和新增依赖。尤其不要因为 Agent 在当前机器上编译成功，就默认 CI、归档和旧设备也没有问题。

### 产品层

在模拟器和真机上看启动、滚动、键盘、深色模式、动态字体、VoiceOver、网络断开和后台恢复。让 Agent 可以准备测试清单和记录，但最终的触感、节奏和视觉层级仍由人判断。

## 一个我会反复使用的主提示词

```text
你是这个 iOS 仓库的协作开发者。

工作规则：
1. 先阅读相关文件和项目说明，不要猜测未打开的代码。
2. 先给出计划，等确认后再编辑。
3. 每次只完成一个可验证的垂直切片。
4. 遵守现有架构，不为一次性需求增加无必要的抽象。
5. 修改后运行指定的格式化、编译和测试命令。
6. 不删除测试、不硬编码测试输入、不用关闭警告来掩盖问题。
7. 最终总结改动、验证命令、未解决风险和需要我在设备上确认的项目。
```

这段提示词本身并不神奇。它真正起作用，是因为项目里还有清晰的 `CLAUDE.md`、可运行的测试和明确的权限边界。Anthropic 的最佳实践也强调：模型能从代码里看到的事实不需要反复写，项目特有的规则、检查和不能触碰的约束才值得沉淀下来。

## 最后仍然要看 Diff

AI Agent 让“写出第一版”变便宜了，也让“生成一堆看似合理的改动”变容易了。我的结束动作不会是“Claude 说完成了”，而是：

```text
请停止修改，只做最终审查：
1. 对照原始需求逐条检查；
2. 查看完整 diff，指出不必要的改动；
3. 列出没有被测试覆盖的行为；
4. 列出我必须在模拟器或真机上确认的事项；
5. 如果有任何不确定，请明确写出来，不要猜测。
```

Agent 驱动的 iOS 开发不是让人退出开发流程，而是把人的时间从重复编辑转移到问题定义、边界设计和结果验收。Claude Code 适合做一个能读代码、能跑命令、能并行调查的工程协作者；至于架构是否合理、交互是否舒服、这个功能是否真的值得发布，最后仍然需要人负责。

### 参考资料

- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [Common workflows](https://code.claude.com/docs/en/common-workflows)
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)
- [Configure permissions](https://code.claude.com/docs/en/permissions)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
