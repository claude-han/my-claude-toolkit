---
name: taro-icons
description: Automated icon integration for Taro WeChat mini-program projects using open-source npm icon libraries. Default icon set is Remix Icon, with Material Icons as an alternative. Covers two scenarios — (1) page-level icons using SVG-to-Base64 icon fonts, and (2) TabBar icons using auto-generated PNG images. Includes a visual preview step so users can review all icons before committing to the project. Use this skill whenever the user mentions icons, TabBar icons, mini-program icons, icon fonts, remixicon, material icons, iconify, or needs to add/configure/replace/preview icons in a Taro project. Also trigger when the user asks about icon management, icon selection, or icon integration in WeChat mini-programs. This skill enables fully automated icon workflows via a centralized config file — Claude Code can analyze which icons are needed, install them via npm, generate all assets, show a preview, and configure the project without any manual browser operations.
---

# Taro 小程序图标集成指南（自动化）

本 Skill 实现 Taro（React + NutUI）微信小程序项目中图标的全自动化集成。所有配置集中在一个 `icons.config.json` 文件中，包括图标清单、颜色定义、TabBar 配置。生成资源后会产出一个可视化预览页面，用户确认无误后再写入项目。

## 图标库选择

默认使用 **Remix Icon**，可选 **Material Icons**。详细对比见 `references/icon-sets.md`。

| 图标库 | npm 包 | 图标数 | 风格 |
|--------|--------|--------|------|
| **Remix Icon（默认）** | `remixicon` | 2800+ | 中性简洁，line/fill 两种变体 |
| Material Icons（可选） | `@material-design-icons/svg` | 2100+ | Google 风格，5 种变体 |

选择原则：如果用户没有明确偏好，使用 Remix Icon。

## 图标一致性原则（重要）

全站所有图标**必须**来自同一套图标库（默认 Remix Icon），确保风格统一。

**不使用 NutUI 自带的 Icon 组件。** NutUI 仅作为 UI 组件库使用（Button、Input、Popup、Navbar 等），所有图标统一通过 Remix Icon 渲染。具体做法：
- 凡是 NutUI 组件内部需要 icon 的地方，使用自定义 slot 传入 Remix Icon
- 不要在任何页面中 import 或使用 NutUI 的 `<Icon>` 组件
- 如果遇到 NutUI 组件默认渲染了自带图标，通过 CSS 隐藏或用 slot 覆盖

## 核心配置文件：icons.config.json

所有图标相关的配置集中在项目根目录的 `icons.config.json` 中。这是整个图标系统的**唯一数据源**，所有脚本都从这个文件读取配置。

```json
{
  "iconLib": "remixicon",
  "colors": {
    "inactive": "#999999",
    "active": "#E85D04"
  },
  "icons": [
    { "name": "home", "file": "Buildings/home-2-line.svg", "tags": ["tabbar"] },
    { "name": "calendar", "file": "Business/calendar-line.svg", "tags": ["tabbar"] },
    { "name": "user", "file": "User/user-line.svg", "tags": ["tabbar"] },
    { "name": "chart", "file": "Business/line-chart-line.svg", "tags": ["page"] },
    { "name": "star", "file": "System/star-line.svg", "tags": ["page"] }
  ],
  "tabbar": {
    "size": 81,
    "list": [
      { "icon": "home", "text": "首页", "pagePath": "pages/home/index" },
      { "icon": "calendar", "text": "预约", "pagePath": "pages/booking/index" },
      { "icon": "user", "text": "我的", "pagePath": "pages/profile/index" }
    ]
  }
}
```

**关键设计：**
- `colors` 读取品牌色，也可以直接从项目的 design tokens / CSS 变量中提取
- `icons[].tags` 标记图标用途：`tabbar`（会生成 PNG）、`page`（仅生成字体）
- `tabbar.list` 定义 TabBar 顺序和页面路径，自动写入 `app.config.ts`
- 新增或删除图标只需修改这个 JSON，然后重新运行脚本

## 自动化工作流（含预览步骤）

```
步骤 1. 创建 icons.config.json → 定义图标清单、颜色、TabBar 配置
步骤 2. npm install remixicon → 安装图标库
步骤 3. node scripts/extract-icons.js → 从 node_modules 提取 SVG
步骤 4. node scripts/generate-assets.js → SVG 转为 Base64 CSS + PNG
步骤 5. node scripts/generate-preview.js → 生成可视化预览页面 ✨
       ──── 用户在浏览器中打开预览页，检查所有图标 ────
       ──── 决定：✅ 确认 / 🔄 修改 config 后重新生成 ────
步骤 6. 确认后，配置 app.scss 引入 CSS + app.config.ts 配置 TabBar
```

**步骤 5 是关键新增环节**：生成一个独立的 HTML 预览页面，展示：
- 所有页面图标（名称、类名、不同尺寸预览）
- TabBar 图标（选中态/未选中态 PNG 并排对比）
- 当前配置的颜色方案
- 每个图标的使用代码片段

用户可以在浏览器中打开这个页面，直观地看到所有图标的效果，然后决定是否需要修改。

## 参考文件索引

| 需要做什么 | 阅读哪个文件 |
|-----------|------------|
| 了解图标库选择和图标名查找 | `references/icon-sets.md` |
| 了解页面图标集成细节 | `references/page-icons.md` |
| 了解 TabBar 图标细节 | `references/tabbar-icons.md` |

## 项目目录结构

```
project-root/
├── icons.config.json                 ← 图标配置（唯一数据源）
├── src/
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── svg/                  ← 提取的 SVG 源文件
│   │   │   └── iconfont.css          ← 生成的 Base64 字体样式
│   │   └── tabbar/
│   │       ├── home.png              ← 生成的 PNG（未选中态）
│   │       ├── home-active.png       ← 生成的 PNG（选中态）
│   │       └── ...
│   ├── components/
│   │   └── Icon/index.tsx            ← 封装的图标组件
│   ├── app.config.ts
│   └── app.scss
├── scripts/
│   ├── extract-icons.js              ← 步骤 3
│   ├── generate-assets.js            ← 步骤 4（合并了字体和 PNG 生成）
│   └── generate-preview.js           ← 步骤 5（生成预览页面）
└── preview/
    └── icons-preview.html            ← 预览页面（不进入构建）
```
