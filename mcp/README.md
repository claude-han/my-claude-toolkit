# MCP 服务器配置参考

MCP（Model Context Protocol）让 Claude Code 连接外部工具、API 和数据源。

## 配置方式

MCP 有两种配置方式：

### 1. 本地 MCP 服务器

在项目或全局配置文件中定义，Claude Code 会启动本地进程。

**配置文件位置：**
- 项目级：`<项目>/.mcp.json`
- 全局（Claude Desktop）：`~/Library/Application Support/Claude/claude_desktop_config.json`

**格式：**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/mcp-server"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

### 2. 云端集成（Claude.ai）

在 Claude.ai 设置中启用，无需本地配置。如 Notion、Google Calendar、Gmail 等。
这些集成会出现为 `mcp__claude_ai_<service>__` 前缀的工具。

## 我的常用 MCP 服务

| 服务 | 类型 | 用途 | 配置参考 |
|------|------|------|----------|
| context7 | 云端集成 | 查询最新库文档和代码示例 | Claude.ai 设置中启用 |
| notion | 云端集成 | 读写 Notion 页面和数据库 | Claude.ai 设置中启用 |
| firecrawl | 本地服务 | 网页抓取和内容提取 | npx firecrawl-mcp |
| pencil | 本地服务 | 设计编辑器（VS Code 扩展） | 随 VS Code 扩展安装 |

## 常用 MCP 服务推荐

### 开发类
- **context7** — 查询最新文档，避免使用过时 API
- **firecrawl** — 抓取网页内容用于分析

### 生产力类
- **notion** — 直接操作 Notion 工作区
- **Google Calendar / Gmail** — 日程和邮件管理

### 设计类
- **pencil** — 在 VS Code 中进行 UI 设计

## 注意事项

- `.mcp.json` 可能包含 API 密钥，**不要提交到公开仓库**
- 本仓库中的配置文件使用占位符替代真实密钥
- 云端集成（context7、notion 等）无需本地配置文件
