---
name: collect
description: 将当前项目的 skill/command/agent/rule 收集到 my-claude-toolkit 集中管理仓库
argument-hint: "[类型] [名称] — 如: skill taro-icons"
disable-model-invocation: true
---

# 收集到 Toolkit 仓库

将当前项目中的 Claude Code 扩展内容收集到集中管理仓库。

Toolkit 仓库路径：`~/Projects/my-claude-toolkit`

## 步骤

1. 解析参数 $ARGUMENTS，确定要收集的类型（skill/command/agent/rule）和名称
   - 如果未提供参数，列出当前项目 `.claude/` 下所有可收集的内容，让用户选择
2. 确认源文件存在于当前项目的 `.claude/<类型>/` 目录下
3. 询问用户：这是**全局**（所有项目通用）还是**项目级**（仅特定类型项目需要）？
4. 复制到 toolkit 仓库对应目录：
   - 全局 → `~/Projects/my-claude-toolkit/<类型>/global/<名称>`
   - 项目级 → `~/Projects/my-claude-toolkit/<类型>/project/<名称>`
5. 如果目标已存在，显示 diff 让用户确认是否覆盖

## 收集完成后

完成复制后，**必须**提醒用户：

> 已收集到 toolkit 仓库。是否需要：
> 1. 提交到 Git（git commit）
> 2. 同时推送到 GitHub（git commit + push）
> 3. 稍后手动处理

等待用户选择后执行对应操作。操作目标是 toolkit 仓库（`~/Projects/my-claude-toolkit`），不是当前项目。

如果用户选择了全局类型，额外提醒：
> 运行 `~/Projects/my-claude-toolkit/sync.sh` 可同步到本地 ~/.claude/
