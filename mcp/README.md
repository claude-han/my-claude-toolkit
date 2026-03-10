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

| 服务 | 类型 | 范围 | 用途 | 配置参考 |
|------|------|------|------|----------|
| context7 | 云端集成 | 全局 | 查询最新库文档和代码示例 | Claude.ai 设置中启用 |
| notion | 云端集成 | 全局 | 读写 Notion 页面和数据库 | Claude.ai 设置中启用 |
| firecrawl | 本地服务 | 全局 | 网页抓取和内容提取 | npx firecrawl-mcp |
| pencil | 本地服务 | 全局 | 设计编辑器（VS Code 扩展） | 随 VS Code 扩展安装 |
| weapp-dev | 本地服务 | 项目级 | 微信小程序开发者工具自动化 | 见下方安装命令 |

## 常用 MCP 服务推荐

### 开发类
- **context7** — 查询最新文档，避免使用过时 API
- **firecrawl** — 抓取网页内容用于分析

### 生产力类
- **notion** — 直接操作 Notion 工作区
- **Google Calendar / Gmail** — 日程和邮件管理

### 设计类
- **pencil** — 在 VS Code 中进行 UI 设计

### 小程序开发类
- **weapp-dev** — 通过 miniprogram-automator 自动化微信开发者工具，可以理解为微信小程序版的 Playwright

## weapp-dev-mcp 详细配置

### 前置要求
- 已安装**微信开发者工具**，支持命令行访问
- 本地安装 **Node.js 18+** 和 npm
- 有可以在开发者工具中打开的**小程序项目**

### 安装命令（项目级）

```bash
claude mcp add-json weapp-dev '{"type":"stdio","command":"npx","args":["-y","-p","@modelcontextprotocol/sdk@1.17.2","-p","fastmcp@3.23.0","-p","@yfme/weapp-dev-mcp","weapp-dev-mcp"],"env":{"WEAPP_WS_ENDPOINT":"ws://localhost:9420"}}'
```

> 必须锁定 `@modelcontextprotocol/sdk@1.17.2` 与 `fastmcp@3.23.0` 的版本，否则会报 "Server does not support completions" 错误。

### 启动微信开发者工具

**1. 开启安全设置**：微信开发者工具 → 设置 → 安全设置 → 服务端口 → 开启 "HTTP 调试" 和 "自动化测试"

**2. 命令行启动 WebSocket 服务**：

macOS/Linux:
```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli auto --project /path/to/your/project --auto-port 9420
```

Windows:
```bash
"C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" auto --project C:\path\to\your\project --auto-port 9420
```

### 可用工具

#### 应用工具
| 工具 | 用途 |
|------|------|
| `mp_ensureConnection` | 确保自动化会话就绪（建议首先调用） |
| `mp_navigate` | 小程序内导航（navigateTo / switchTab / reLaunch 等） |
| `mp_screenshot` | 捕获屏幕截图 |
| `mp_callWx` | 调用微信 API（如 `wx.showToast`） |
| `mp_getLogs` | 获取控制台日志 |

#### 页面工具
| 工具 | 用途 |
|------|------|
| `page_getElement` | 通过选择器获取元素 |
| `page_waitElement` | 等待元素出现 |
| `page_getData` | 获取页面数据对象 |
| `page_setData` | 更新页面数据 |
| `page_callMethod` | 调用页面实例方法 |

#### 元素工具
| 工具 | 用途 |
|------|------|
| `element_tap` | 点击 WXML 元素 |
| `element_input` | 向 input/textarea 输入文本 |
| `element_callMethod` | 调用自定义组件方法（需 ID 选择器） |
| `element_getData / setData` | 获取/设置组件渲染数据 |
| `element_getSize / getWxml` | 获取元素大小/WXML |

### 使用技巧

1. **推荐首先调用 `mp_ensureConnection`** 验证连接
2. 导航时始终使用**绝对路径**（以 `/` 开头），如 `/pages/mine/mine`
3. **tabBar 页面用 `switchTab`**，普通页面用 `navigateTo`
4. 操作自定义组件时，必须使用 **ID 选择器**（如 `#my-component`），并通过 `innerSelector` 参数定位内部元素
5. `page_waitElement` 不适用于自定义组件内部元素，需用 `page_waitTimeout` 配合轮询

## 注意事项

- `.mcp.json` 可能包含 API 密钥，**不要提交到公开仓库**
- 本仓库中的配置文件使用占位符替代真实密钥
- 云端集成（context7、notion 等）无需本地配置文件
