---
name: collect
description: 将当前项目的 skill/command/agent/rule/mcp 收集到 my-claude-toolkit 集中管理仓库
argument-hint: "[类型] [名称] — 如: skill taro-icons, mcp firecrawl"
disable-model-invocation: true
---

# 收集到 Toolkit 仓库

将当前项目中的 Claude Code 扩展内容收集到集中管理仓库。

Toolkit 仓库路径：`~/Projects/my-claude-toolkit`

## 支持的类型

- **skill** — 源：`.claude/skills/`
- **command** — 源：`.claude/commands/`
- **agent** — 源：`.claude/agents/`
- **rule** — 源：`.claude/rules/`
- **mcp** — 源：当前项目 `.mcp.json` 或 `~/Library/Application Support/Claude/claude_desktop_config.json`

## 步骤

1. 解析参数 $ARGUMENTS，确定要收集的类型和名称
   - 如果未提供参数，列出当前项目 `.claude/` 下所有可收集的内容及 MCP 配置，让用户选择

2. **skill/command/agent/rule 类型：**
   a. 确认源文件存在于当前项目的 `.claude/<类型>/` 目录下
   b. 询问用户：这是**全局**还是**项目级**？
   c. 复制到 toolkit 仓库对应目录：
      - 全局 → `~/Projects/my-claude-toolkit/<类型>/global/<名称>`
      - 项目级 → `~/Projects/my-claude-toolkit/<类型>/project/<名称>`
   d. 如果目标已存在，显示 diff 让用户确认是否覆盖

3. **mcp 类型：**
   a. 读取 MCP 配置源（优先当前项目 `.mcp.json`，也检查 Claude Desktop 全局配置）
   b. 如果指定了名称，提取该 MCP 服务的配置；否则列出所有可用 MCP 服务让用户选择
   c. 将该 MCP 服务信息追加到 `~/Projects/my-claude-toolkit/mcp/README.md` 的「我的常用 MCP 服务」表格中
   d. 信息包括：服务名、类型（本地服务/云端集成）、用途简述、配置参考
   e. **重要：** 如果配置中包含 API 密钥等敏感信息，用 `<your-api-key>` 占位符替代，不要写入真实密钥
   f. 如果该服务已在表格中，提示用户是否更新

## 收集完成后

完成收集后，**必须**提醒用户：

> 已收集到 toolkit 仓库。是否需要：
> 1. 提交到 Git（git commit）
> 2. 同时推送到 GitHub（git commit + push）
> 3. 稍后手动处理

等待用户选择后执行对应操作。操作目标是 toolkit 仓库（`~/Projects/my-claude-toolkit`），不是当前项目。

如果用户选择了全局类型（skill/command/agent/rule），额外提醒：
> 运行 `~/Projects/my-claude-toolkit/sync.sh` 可同步到本地 ~/.claude/
