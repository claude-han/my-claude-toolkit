# TabBar 图标：SVG → PNG 自动生成

## 为什么 TabBar 必须用 PNG

微信小程序原生 TabBar 只接受本地图片路径（PNG/JPEG），不支持 Icon Font、SVG 或网络图片。

## 图标规格

| 项目 | 要求 |
|------|------|
| 格式 | PNG |
| 尺寸 | 81 × 81 px（可在 config 中修改） |
| 文件大小 | 每个 ≤ 40KB |
| 背景 | 透明 |
| 每个 Tab | 2 张（选中态 + 未选中态） |

## 在 icons.config.json 中配置

TabBar 图标由两处配置共同决定：

### 1. icons 数组中标记 tabbar 标签

确保 TabBar 用到的图标在 `icons` 数组中存在，且 `tags` 包含 `"tabbar"`：

```json
{ "name": "home", "file": "Buildings/home-2-line.svg", "tags": ["tabbar", "page"] }
```

### 2. tabbar 对象定义顺序和页面

```json
"tabbar": {
  "size": 81,
  "backgroundColor": "#FFFFFF",
  "borderStyle": "white",
  "list": [
    { "icon": "home", "text": "首页", "pagePath": "pages/home/index" },
    { "icon": "calendar", "text": "预约", "pagePath": "pages/booking/index" },
    { "icon": "user", "text": "我的", "pagePath": "pages/profile/index" }
  ]
}
```

**要修改 TabBar 图标，只需修改这两处，然后重新运行脚本。** 不需要改任何 JS 代码。

### 3. 颜色配置

```json
"colors": {
  "inactive": "#999999",
  "active": "#E85D04"
}
```

- `inactive`：未选中态 PNG 的颜色
- `active`：选中态 PNG 的颜色（品牌色）
- 如果 `fromDesignTokens: true`，脚本会尝试从项目的 CSS 变量中读取 `--primary` 作为 active 颜色

## 生成流程

```bash
# 1. 提取 SVG（包括 TabBar 图标）
node scripts/extract-icons.js

# 2. 生成所有资源（CSS + PNG）
node scripts/generate-assets.js

# 也可以只生成 PNG
node scripts/generate-assets.js --png-only

# 3. 预览确认
node scripts/generate-preview.js
# → 在浏览器中打开 preview/icons-preview.html 检查 TabBar 效果
```

## 配置 app.config.ts

预览确认后，将 TabBar 配置写入 `app.config.ts`。路径和配置项可以从 `icons.config.json` 推导：

```typescript
export default defineAppConfig({
  pages: [
    "pages/home/index",
    "pages/booking/index",
    "pages/profile/index",
  ],
  tabBar: {
    color: "#999999",           // 对应 config.colors.inactive
    selectedColor: "#E85D04",   // 对应 config.colors.active
    backgroundColor: "#FFFFFF", // 对应 config.tabbar.backgroundColor
    borderStyle: "white",       // 对应 config.tabbar.borderStyle
    list: [
      // 每项对应 config.tabbar.list 中的条目
      {
        pagePath: "pages/home/index",
        text: "首页",
        iconPath: "assets/tabbar/home.png",
        selectedIconPath: "assets/tabbar/home-active.png",
      },
      {
        pagePath: "pages/booking/index",
        text: "预约",
        iconPath: "assets/tabbar/calendar.png",
        selectedIconPath: "assets/tabbar/calendar-active.png",
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/tabbar/user.png",
        selectedIconPath: "assets/tabbar/user-active.png",
      },
    ],
  },
});
```

**命名规则**：`iconPath` 固定为 `assets/tabbar/{icon}.png`，`selectedIconPath` 为 `assets/tabbar/{icon}-active.png`，其中 `{icon}` 是 `config.tabbar.list[].icon` 的值。

## 常见问题

### 图标不显示
- 检查 `pagePath` 不带前导 `/` 和 `.tsx` 后缀
- 检查 `iconPath` 大小写
- 确认 `dist/assets/tabbar/` 下有 PNG 文件

### 图标模糊
- 确认 `config.tabbar.size` 是 81
- SVG 源文件的 viewBox 应为 24×24

### 更换图标
1. 修改 `icons.config.json` 的 `tabbar.list` 和对应的 `icons` 条目
2. 运行 `extract-icons.js` → `generate-assets.js` → `generate-preview.js`
3. 确认后更新 `app.config.ts`

### 更换品牌色
修改 `icons.config.json` 的 `colors.active`，重新运行 `generate-assets.js` 即可全部更新。

### sharp 安装失败
备选方案：
- `svg2png-wasm`（纯 WASM，无系统依赖）：`npm install svg2png-wasm --save-dev`
- Inkscape CLI（如已安装）：`inkscape input.svg --export-type=png --export-width=81`
