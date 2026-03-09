/**
 * generate-preview.js
 * 生成图标预览 HTML 页面，让用户在浏览器中查看所有图标效果后再决定是否修改
 *
 * 用法：node scripts/generate-preview.js
 * 输出：preview/icons-preview.html
 *
 * 预览页面包含：
 * - 所有页面图标（不同尺寸 + 类名 + 使用代码）
 * - TabBar 图标（选中/未选中 PNG 对比）
 * - 当前颜色配置
 * - 修改指引
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'icons.config.json');
const SVG_DIR = path.join(PROJECT_ROOT, 'src/assets/icons/svg');
const CSS_PATH = path.join(PROJECT_ROOT, 'src/assets/icons/iconfont.css');
const TABBAR_DIR = path.join(PROJECT_ROOT, 'src/assets/tabbar');
const PREVIEW_DIR = path.join(PROJECT_ROOT, 'preview');
const PREVIEW_OUTPUT = path.join(PREVIEW_DIR, 'icons-preview.html');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('错误: 未找到 icons.config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// ============================================================
// 收集数据
// ============================================================

// 读取 iconfont CSS（如果存在）
let iconfontCSS = '';
if (fs.existsSync(CSS_PATH)) {
  iconfontCSS = fs.readFileSync(CSS_PATH, 'utf-8');
}

// 读取 TabBar PNG 并转为 Base64 内联（这样预览页面是完全独立的单文件）
function pngToBase64(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

// 读取 SVG 内容用于内联预览
function readSvg(name) {
  const svgPath = path.join(SVG_DIR, `${name}.svg`);
  if (!fs.existsSync(svgPath)) return null;
  return fs.readFileSync(svgPath, 'utf-8');
}

// ============================================================
// 生成 HTML
// ============================================================

function generateHTML() {
  const { inactive, active } = config.colors;
  const allIcons = config.icons || [];
  const tabbarList = config.tabbar?.list || [];

  // 分类
  const pageIcons = allIcons.filter(i => i.tags?.includes('page'));
  const tabbarIcons = tabbarList.map(item => {
    const inactivePng = pngToBase64(path.join(TABBAR_DIR, `${item.icon}.png`));
    const activePng = pngToBase64(path.join(TABBAR_DIR, `${item.icon}-active.png`));
    return { ...item, inactivePng, activePng };
  });

  // 为每个图标准备 SVG（用于内联渲染，不依赖字体文件）
  const iconSvgs = {};
  for (const icon of allIcons) {
    iconSvgs[icon.name] = readSvg(icon.name);
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>图标预览 — ${config.iconLib}</title>
  <style>
    ${iconfontCSS}

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
      background: #F7F8FA;
      color: #1A202C;
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #718096; font-size: 14px; margin-bottom: 32px; }

    /* 颜色配置卡片 */
    .color-config {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      gap: 32px;
      align-items: center;
    }
    .color-swatch {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .swatch {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
    }
    .color-label { font-size: 13px; color: #718096; }
    .color-value { font-size: 14px; font-weight: 600; font-family: monospace; }

    /* 区块标题 */
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 32px 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title .count {
      font-size: 13px;
      color: #718096;
      font-weight: 400;
    }

    /* TabBar 预览 */
    .tabbar-preview {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }
    .tabbar-mock {
      display: flex;
      justify-content: space-around;
      align-items: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      margin-top: 16px;
    }
    .tabbar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .tabbar-item img { width: 27px; height: 27px; }
    .tabbar-item .tab-text { font-size: 11px; }
    .tabbar-item .tab-text.inactive { color: ${inactive}; }
    .tabbar-item .tab-text.active { color: ${active}; }

    .tabbar-detail {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .tabbar-card {
      background: #F7F8FA;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .tabbar-card .icon-pair {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin: 12px 0;
    }
    .tabbar-card .icon-pair img { width: 40px; height: 40px; }
    .tabbar-card .icon-pair .label { font-size: 11px; color: #718096; margin-top: 4px; }
    .tabbar-card .icon-name { font-size: 13px; font-weight: 600; }
    .tabbar-card .file-info { font-size: 11px; color: #999; margin-top: 4px; }

    /* 页面图标网格 */
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .icon-card {
      background: #fff;
      border-radius: 12px;
      padding: 16px 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    .icon-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transform: translateY(-2px);
    }
    .icon-card .icon-display {
      font-size: 32px;
      color: #1A202C;
      margin-bottom: 8px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-card .icon-display svg {
      width: 32px;
      height: 32px;
    }
    .icon-card .icon-name {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      word-break: break-all;
    }
    .icon-card .icon-class {
      font-size: 11px;
      color: #718096;
      font-family: monospace;
    }
    .icon-card .copied-tip {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #38A169;
      color: #fff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .icon-card .copied-tip.show { opacity: 1; }

    /* 不同尺寸预览 */
    .size-preview {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }
    .size-row {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 8px 0;
      border-bottom: 1px solid #F0F0F0;
    }
    .size-row:last-child { border-bottom: none; }
    .size-label { font-size: 13px; color: #718096; width: 60px; }
    .size-row .icons { display: flex; gap: 16px; align-items: center; }
    .size-row .icons svg { color: #1A202C; }

    /* 操作指引 */
    .guide {
      background: #EBF5FF;
      border-radius: 12px;
      padding: 20px;
      margin-top: 32px;
      font-size: 14px;
      line-height: 1.8;
    }
    .guide h3 { font-size: 16px; margin-bottom: 8px; color: #1A365D; }
    .guide code {
      background: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      font-family: monospace;
    }
  </style>
</head>
<body>

<h1>📋 图标预览</h1>
<p class="subtitle">图标库: ${config.iconLib} · 共 ${allIcons.length} 个图标 · 生成时间: ${new Date().toLocaleString('zh-CN')}</p>

<!-- 颜色配置 -->
<div class="color-config">
  <div class="color-swatch">
    <div class="swatch" style="background: ${active};"></div>
    <div>
      <div class="color-label">选中色 (active)</div>
      <div class="color-value">${active}</div>
    </div>
  </div>
  <div class="color-swatch">
    <div class="swatch" style="background: ${inactive};"></div>
    <div>
      <div class="color-label">未选中色 (inactive)</div>
      <div class="color-value">${inactive}</div>
    </div>
  </div>
</div>

<!-- TabBar 预览 -->
<div class="section-title">📱 TabBar 预览 <span class="count">${tabbarIcons.length} 个</span></div>
<div class="tabbar-preview">
  <p style="font-size:13px;color:#718096;margin-bottom:8px;">模拟效果（选中第一个 Tab）：</p>

  <!-- 模拟 TabBar 条 -->
  <div class="tabbar-mock">
    ${tabbarIcons.map((item, i) => `
    <div class="tabbar-item">
      <img src="${i === 0 ? (item.activePng || '') : (item.inactivePng || '')}" alt="${item.icon}">
      <span class="tab-text ${i === 0 ? 'active' : 'inactive'}">${item.text}</span>
    </div>`).join('')}
  </div>

  <!-- 逐个对比 -->
  <div class="tabbar-detail">
    ${tabbarIcons.map(item => `
    <div class="tabbar-card">
      <div class="icon-name">${item.icon}</div>
      <div class="icon-pair">
        <div>
          ${item.inactivePng ? `<img src="${item.inactivePng}" alt="inactive">` : '<span style="color:red">缺失</span>'}
          <div class="label">未选中</div>
        </div>
        <div>
          ${item.activePng ? `<img src="${item.activePng}" alt="active">` : '<span style="color:red">缺失</span>'}
          <div class="label">选中</div>
        </div>
      </div>
      <div class="file-info">${item.icon}.png / ${item.icon}-active.png</div>
      <div class="file-info">${config.tabbar.size}×${config.tabbar.size}px</div>
    </div>`).join('')}
  </div>
</div>

<!-- 不同尺寸预览 -->
<div class="section-title">📏 尺寸对比</div>
<div class="size-preview">
  ${[16, 20, 24, 32, 48].map(size => `
  <div class="size-row">
    <span class="size-label">${size}px</span>
    <div class="icons">
      ${allIcons.slice(0, 8).map(icon => {
        const svg = iconSvgs[icon.name];
        if (!svg) return '';
        const colored = svg
          .replace(/currentColor/g, '#1A202C')
          .replace(/width="[^"]*"/, `width="${size}"`)
          .replace(/height="[^"]*"/, `height="${size}"`);
        return colored;
      }).join('')}
    </div>
  </div>`).join('')}
</div>

<!-- 全部页面图标 -->
<div class="section-title">🎨 全部图标 <span class="count">${allIcons.length} 个 · 点击卡片复制类名</span></div>
<div class="icon-grid">
  ${allIcons.map(icon => {
    const svg = iconSvgs[icon.name];
    const displaySvg = svg
      ? svg.replace(/currentColor/g, '#1A202C')
           .replace(/width="[^"]*"/, 'width="32"')
           .replace(/height="[^"]*"/, 'height="32"')
      : '<span style="color:red;font-size:12px">SVG 缺失</span>';
    const tags = (icon.tags || []).join(' ');
    return `
  <div class="icon-card" onclick="copyClass('icon-${icon.name}', this)">
    <div class="icon-display">${displaySvg}</div>
    <div class="icon-name">${icon.name}</div>
    <div class="icon-class">.icon-${icon.name}</div>
    <div class="copied-tip">已复制</div>
  </div>`;
  }).join('')}
</div>

<!-- 使用代码参考 -->
<div class="section-title">💻 使用代码</div>
<div class="size-preview" style="font-family:monospace; font-size:13px; line-height:2;">
  &lt;Text className="iconfont icon-home" /&gt;<br>
  &lt;Text className="iconfont icon-calendar" /&gt;<br>
  &lt;Icon name="home" size={24} color="#E85D04" /&gt;　← 封装组件方式
</div>

<!-- 操作指引 -->
<div class="guide">
  <h3>✏️ 如何修改？</h3>
  <p>1. 修改图标：编辑 <code>icons.config.json</code> 中的 <code>icons</code> 数组，添加或删除条目</p>
  <p>2. 修改颜色：编辑 <code>icons.config.json</code> 中的 <code>colors.active</code> 和 <code>colors.inactive</code></p>
  <p>3. 修改 TabBar：编辑 <code>icons.config.json</code> 中的 <code>tabbar.list</code> 数组</p>
  <p>4. 修改后重新运行：</p>
  <p style="padding-left:16px;">
    <code>node scripts/extract-icons.js</code><br>
    <code>node scripts/generate-assets.js</code><br>
    <code>node scripts/generate-preview.js</code>
  </p>
  <p>5. 确认无误后，将 CSS 引入 app.scss，将 TabBar 配置写入 app.config.ts</p>
</div>

<script>
function copyClass(className, el) {
  navigator.clipboard.writeText(className).then(() => {
    const tip = el.querySelector('.copied-tip');
    tip.classList.add('show');
    setTimeout(() => tip.classList.remove('show'), 1000);
  });
}
</script>

</body>
</html>`;

  return html;
}

// ============================================================
// 主函数
// ============================================================

function main() {
  if (!fs.existsSync(PREVIEW_DIR)) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  }

  const html = generateHTML();
  fs.writeFileSync(PREVIEW_OUTPUT, html, 'utf-8');

  console.log('✅ 预览页面已生成!');
  console.log(`   路径: ${PREVIEW_OUTPUT}`);
  console.log('');
  console.log('请在浏览器中打开此文件查看所有图标效果。');
  console.log('确认后，将图标资源配置到项目中。');
  console.log('如需修改，请编辑 icons.config.json 后重新运行脚本。');
}

main();
