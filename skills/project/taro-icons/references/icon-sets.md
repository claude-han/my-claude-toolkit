# 图标库选择参考

## Remix Icon（默认推荐）

**npm 包**：`remixicon`
**安装**：`npm install remixicon`
**图标数量**：2800+
**许可证**：Apache 2.0（商用免费）
**官网预览**：https://remixicon.com
**GitHub**：https://github.com/Remix-Design/RemixIcon

### 特点

- 由 Remix Design 团队设计，风格中性简洁
- 2 种变体：line（线框）和 fill（填充），命名统一
- 视觉风格接近中国主流互联网产品
- SVG 文件统一 24×24 viewBox，使用 currentColor

### npm 包内 SVG 路径

```
node_modules/remixicon/icons/
├── Buildings/    (home-2-line.svg ...)
├── Business/     (calendar-line.svg, medal-line.svg ...)
├── Health/       (heart-line.svg, scales-3-line.svg, boxing-line.svg ...)
├── User/         (user-line.svg ...)
├── System/       (settings-3-line.svg, star-line.svg ...)
├── Arrows/       (arrow-left-line.svg ...)
├── Design/       (edit-line.svg ...)
├── Media/        (camera-line.svg, notification-3-line.svg ...)
└── ...（约 20+ 分类）
```

### 健身房小程序常用图标

| 用途 | icons.config.json 中的 file 值 |
|------|-------------------------------|
| 首页 | Buildings/home-2-line.svg |
| 日历/预约 | Business/calendar-line.svg |
| 用户/我的 | User/user-line.svg |
| 图表/数据 | Business/line-chart-line.svg |
| 哑铃/健身 | Health/boxing-line.svg |
| 体重秤 | Health/scales-3-line.svg |
| 身体扫描 | Health/body-scan-line.svg |
| 心率 | Health/heart-pulse-line.svg |
| 奖牌 | Business/medal-line.svg |
| 星星/评分 | System/star-line.svg |
| 编辑 | Design/edit-line.svg |
| 设置 | System/settings-3-line.svg |
| 通知 | Media/notification-3-line.svg |
| 搜索 | System/search-line.svg |
| 返回箭头 | Arrows/arrow-left-line.svg |
| 时钟 | System/time-line.svg |
| 添加 | System/add-line.svg |
| 删除 | System/delete-bin-line.svg |
| 收藏 | Health/heart-line.svg |
| 相机 | Media/camera-line.svg |

### 查找图标名

1. 在线搜索：https://remixicon.com
2. 本地浏览：`node_modules/remixicon/icons/` 按分类目录查看

---

## Material Icons（可选替代）

**npm 包**：`@material-design-icons/svg`
**安装**：`npm install @material-design-icons/svg`
**许可证**：Apache 2.0
**官网预览**：https://fonts.google.com/icons

### npm 包内 SVG 路径

```
node_modules/@material-design-icons/svg/
├── filled/     (home.svg ...)
├── outlined/   (home.svg ...)   ← 推荐使用这个变体
├── rounded/
├── sharp/
└── two_tone/
```

### 常用图标

| 用途 | icons.config.json 中的 file 值 |
|------|-------------------------------|
| 首页 | outlined/home.svg |
| 日历 | outlined/calendar_today.svg |
| 用户 | outlined/person.svg |
| 图表 | outlined/show_chart.svg |
| 健身 | outlined/fitness_center.svg |
| 体重 | outlined/monitor_weight.svg |
| 星星 | outlined/star_border.svg |
| 编辑 | outlined/edit.svg |
| 设置 | outlined/settings.svg |
| 通知 | outlined/notifications.svg |
| 搜索 | outlined/search.svg |

---

## 切换图标库

修改 `icons.config.json` 中的 `iconLib` 字段和 `icons[].file` 路径，然后重新运行全部脚本。建议在项目开始时确定图标库，中途切换成本较高。
