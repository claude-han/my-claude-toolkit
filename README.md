# My Claude Code Toolkit

我的 Claude Code 个人工具库，涵盖 Skills、Commands、Hooks、Agents 和 CLAUDE.md 模板。

## Claude Code 扩展体系速查

```
┌─────────────────────────────────────────────────────────┐
│                    每次对话都生效                          │
│  CLAUDE.md    项目记忆/规则，自动加载，确定性               │
│  Rules        模块化规则，按路径条件加载，确定性             │
│  Hooks        事件钩子，自动触发，确定性（100%执行）         │
├─────────────────────────────────────────────────────────┤
│                    按需生效                               │
│  Skills       领域知识包，Claude 自动判断何时使用           │
│  Commands     /斜杠命令，用户手动触发                      │
│  Agents       子代理，独立上下文窗口                       │
├─────────────────────────────────────────────────────────┤
│                    连接外部                               │
│  MCP          连接外部工具/API/数据库                      │
│  Plugins      打包分发（可包含以上所有内容）                │
└─────────────────────────────────────────────────────────┘
```

## 仓库结构

```
my-claude-toolkit/
├── README.md                 ← 你正在读的文件
├── sync.sh                   ← 同步 global/ 内容到 ~/.claude/
│
├── skills/                   ← 领域知识包（Claude 自动识别并按需加载）
│   ├── global/               ← 全局：sync.sh 自动同步到 ~/.claude/skills/
│   │   └── ...
│   ├── project/              ← 项目级：手动复制到特定项目的 .claude/skills/
│   │   └── taro-icons/       ← 示例：仅 Taro 项目需要
│   └── _template/            ← Skill 创建模板
│       └── SKILL.md
│
├── commands/                 ← 斜杠命令（用户通过 /命令名 触发）
│   ├── global/               ← 全局：sync.sh 自动同步
│   │   ├── review.md
│   │   └── daily.md
│   ├── project/              ← 项目级：手动复制
│   │   └── ...
│   └── _template.md          ← Command 创建模板
│
├── agents/                   ← 子代理（独立上下文，可并行执行）
│   ├── global/               ← 全局：sync.sh 自动同步
│   │   └── code-reviewer.md
│   ├── project/              ← 项目级：手动复制
│   │   └── ...
│   └── _template.md          ← Agent 创建模板
│
├── rules/                    ← 模块化规则（支持按路径条件加载）
│   ├── global/               ← 全局：sync.sh 自动同步到 ~/.claude/rules/
│   │   └── git-commit.md     ← Git 提交行为规则
│   ├── project/              ← 项目级：手动复制
│   │   └── ...
│   └── _template.md          ← Rule 创建模板
│
├── hooks/                    ← 事件钩子配置（确定性执行）
│   ├── README.md             ← Hooks 使用说明
│   ├── settings.json         ← 可复用的 hooks 配置片段
│   └── scripts/              ← Hook 触发的脚本
│       └── format-on-save.sh
│
├── claude-md/                ← CLAUDE.md 模板集合
│   ├── taro-miniapp.md       ← Taro 小程序项目模板
│   ├── general-frontend.md   ← 通用前端项目模板
│   └── _template.md          ← 通用模板
│
└── mcp/                      ← MCP 服务器配置参考
    └── README.md             ← 常用 MCP 配置说明
```

### Global vs Project 分类原则

| 类型 | 放在 `global/` | 放在 `project/` |
|------|----------------|-----------------|
| 判断标准 | 所有项目都可能用到 | 仅特定类型项目需要 |
| 同步方式 | `sync.sh` 自动同步到 `~/.claude/` | 手动复制到项目的 `.claude/` |
| 示例 | `/review`、`/daily` | `taro-icons`、框架特定命令 |

## 快速开始

### 首次安装

```bash
git clone https://github.com/你的用户名/my-claude-toolkit.git
cd my-claude-toolkit
./sync.sh
```

### 日常更新

```bash
cd my-claude-toolkit
git pull
./sync.sh
```

### 在新项目中使用

```bash
# 复制 CLAUDE.md 模板到项目
cp my-claude-toolkit/claude-md/taro-miniapp.md your-project/CLAUDE.md

# 安装项目级 skill 到特定项目
cp -r my-claude-toolkit/skills/project/taro-icons your-project/.claude/skills/

# 复制 hooks 配置
cp my-claude-toolkit/hooks/settings.json your-project/.claude/settings.json
```

## 各模块说明

### Skills — 领域知识包

Claude 根据任务上下文自动判断是否使用。适合封装可复用的专业流程。

- 存放位置：`~/.claude/skills/`（全局）或 `.claude/skills/`（项目级）
- 触发方式：Claude 自动识别，也可通过 `/skill-name` 手动触发
- 何时使用：有一套完整的工作流需要反复执行时

### Commands — 斜杠命令

用户通过输入 `/命令名` 主动触发，适合固定流程。

- 存放位置：`~/.claude/commands/`（全局）或 `.claude/commands/`（项目级）
- 触发方式：手动输入 `/review`、`/daily` 等
- 何时使用：你想确定性地执行某个固定流程时

### Rules — 模块化规则

CLAUDE.md 的模块化拆分，支持按文件路径条件加载，减少上下文噪音。

- 存放位置：`~/.claude/rules/`（全局）或 `.claude/rules/`（项目级）
- 触发方式：每次对话自动加载；带 `paths` frontmatter 的规则仅在匹配文件时加载
- 何时使用：规则较多需要拆分管理，或某些规则只针对特定文件类型

### Hooks — 事件钩子

绑定到 Claude Code 的生命周期事件上，100% 确定执行。

- 配置位置：`.claude/settings.json`
- 触发方式：特定事件发生时自动执行（如文件保存前、工具调用前）
- 何时使用：需要硬性保证某些规则时（如禁止在 main 分支编辑）

### Agents — 子代理

拥有独立上下文窗口的子任务执行者，不会污染主对话。

- 存放位置：`~/.claude/agents/` 或 `.claude/agents/`
- 触发方式：Claude 自动派生，或通过命令启动
- 何时使用：需要并行执行、独立记忆空间时

### CLAUDE.md — 项目记忆

每次对话自动加载的项目说明书。

- 存放位置：项目根目录 `CLAUDE.md`
- 触发方式：每次启动 Claude Code 自动读取
- 何时使用：所有项目都应该有一个

### MCP — 外部工具连接

让 Claude Code 连接数据库、API、第三方服务。

- 配置位置：`.mcp.json`
- 何时使用：需要 Claude 访问外部系统时

## 如何积累新内容

当你在开发中遇到"这个流程我以后还会用到"的时候：

1. 判断它属于哪种类型（skill / command / hook / agent / CLAUDE.md）
2. 在对应目录下创建文件
3. `git commit` + `git push`
4. 运行 `./sync.sh` 同步到本地

## 许可证

MIT
