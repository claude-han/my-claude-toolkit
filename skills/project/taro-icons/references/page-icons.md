# 页面内图标：SVG → Base64 Icon Font

## 流程

```
icons.config.json（定义图标清单）
        ↓
node scripts/extract-icons.js（提取 SVG）
        ↓
node scripts/generate-assets.js（SVG → Base64 CSS）
        ↓
node scripts/generate-preview.js（生成预览页面）
        ↓ 用户确认
app.scss 引入 → 页面中使用
```

## 在 icons.config.json 中配置图标

每个图标是 `icons` 数组中的一个对象：

```json
{ "name": "chart", "file": "Business/line-chart-line.svg", "tags": ["page"] }
```

- `name`：项目中使用的名称，会成为 CSS 类名 `.icon-chart`
- `file`：在 npm 包中的相对路径（见 `references/icon-sets.md`）
- `tags`：`["page"]` 表示只生成字体，`["tabbar", "page"]` 表示同时生成 PNG

新增图标只需在数组中添加一行，然后重新运行三个脚本。

## 安装依赖

```bash
npm install remixicon                # 图标库
npm install svgtofont --save-dev     # 字体生成工具
```

## 引入项目

生成的 CSS 文件在 `src/assets/icons/iconfont.css`，在全局样式中引入：

```scss
/* src/app.scss */
@import "./assets/icons/iconfont.css";
```

## 在页面中使用

### 方式一：直接用 className

```jsx
import { Text } from "@tarojs/components";

<Text className="iconfont icon-home" />
<Text className="iconfont icon-calendar" />
```

### 方式二：封装 Icon 组件（推荐）

```tsx
// src/components/Icon/index.tsx
import { Text } from "@tarojs/components";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function Icon({ name, size = 16, color, className = "" }: IconProps) {
  return (
    <Text
      className={`iconfont icon-${name} ${className}`}
      style={{ fontSize: `${size}px`, color: color || "inherit" }}
    />
  );
}
```

使用：

```jsx
import Icon from "@/components/Icon";

<Icon name="home" size={24} color="#E85D04" />
<Icon name="star" size={16} color="#38A169" />
```

### 在 NutUI 组件中使用（slot 替换）

NutUI 的 Navbar、Cell 等组件支持 slot 自定义图标：

```jsx
import { NavBar } from "@nutui/nutui-react-taro";
import Icon from "@/components/Icon";

<NavBar
  left={<Icon name="arrow-left" size={20} />}
  title="页面标题"
/>
```

## 常见问题

### 图标显示为方块
- 确认 `app.scss` 中 `@import` 路径正确
- Taro 中必须用 `<Text>` 组件，不能用 `<i>` 或 `<span>`
- 确认 className 同时包含 `iconfont` 和 `icon-xxx`

### 图标颜色不对
- Icon Font 使用 `currentColor`，默认继承父元素文字颜色
- 通过 CSS `color` 属性或组件 `color` prop 修改

### 新增图标后不生效
- 每次修改 `icons.config.json` 后，需要依次运行三个脚本
- 确认新图标的 `file` 路径在 npm 包中存在

### 关于 NutUI Icon
- 项目中**不使用** NutUI 的 `<Icon>` 组件，所有图标统一用 Remix Icon
- 本方案使用 `app-icons` 作为 font-family，与 NutUI 其他组件无冲突
