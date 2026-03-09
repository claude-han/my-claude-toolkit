/**
 * generate-assets.js
 * 统一生成页面图标（Base64 Icon Font CSS）和 TabBar 图标（PNG）
 *
 * 用法：node scripts/generate-assets.js [--font-only] [--png-only]
 * 配置：读取项目根目录的 icons.config.json
 *
 * 依赖：
 *   npm install svgtofont sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 读取配置
// ============================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'icons.config.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('错误: 未找到 icons.config.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// 解析颜色配置（支持从 design tokens 读取）
function resolveColors() {
  let { inactive, active } = config.colors;

  if (config.colors.fromDesignTokens) {
    // 尝试从常见位置读取 design tokens
    const tokenPaths = [
      path.join(PROJECT_ROOT, 'src/styles/variables.scss'),
      path.join(PROJECT_ROOT, 'src/app.scss'),
      path.join(PROJECT_ROOT, 'src/styles/tokens.css'),
      path.join(PROJECT_ROOT, 'design-tokens.md'),
    ];

    for (const tokenPath of tokenPaths) {
      if (fs.existsSync(tokenPath)) {
        const content = fs.readFileSync(tokenPath, 'utf-8');
        // 匹配 --primary: #XXXXXX 或 $primary: #XXXXXX
        const primaryMatch = content.match(/--primary\s*:\s*(#[0-9a-fA-F]{3,8})/);
        const scssMatch = content.match(/\$primary\s*:\s*(#[0-9a-fA-F]{3,8})/);

        if (primaryMatch) {
          active = primaryMatch[1];
          console.log(`从 ${path.basename(tokenPath)} 读取品牌色: ${active}`);
          break;
        } else if (scssMatch) {
          active = scssMatch[1];
          console.log(`从 ${path.basename(tokenPath)} 读取品牌色: ${active}`);
          break;
        }
      }
    }
  }

  return { inactive, active };
}

// ============================================================
// 路径常量
// ============================================================

const SVG_DIR = path.join(PROJECT_ROOT, 'src/assets/icons/svg');
const CSS_OUTPUT = path.join(PROJECT_ROOT, 'src/assets/icons/iconfont.css');
const TABBAR_OUTPUT_DIR = path.join(PROJECT_ROOT, 'src/assets/tabbar');
const TEMP_DIR = path.join(PROJECT_ROOT, '.icon-build-temp');

// ============================================================
// Icon Font 生成（Base64 CSS）
// ============================================================

async function generateIconFont() {
  const svgtofont = require('svgtofont');

  console.log('\n═══ 生成 Icon Font CSS ═══\n');

  const svgFiles = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));
  if (svgFiles.length === 0) {
    console.error('错误: SVG 目录为空，请先运行 extract-icons.js');
    return false;
  }

  console.log(`处理 ${svgFiles.length} 个 SVG 图标...`);

  // 清理临时目录
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  try {
    await svgtofont({
      src: SVG_DIR,
      dist: TEMP_DIR,
      fontName: 'app-icons',
      classNamePrefix: 'icon',
      css: true,
      startUnicode: 0xea01,
      svgicons2svgfont: { fontHeight: 1024, normalize: true },
      typescript: false,
      symbol: false,
    });

    // TTF → Base64
    const ttfPath = path.join(TEMP_DIR, 'app-icons.ttf');
    if (!fs.existsSync(ttfPath)) {
      console.error('错误: 字体文件生成失败');
      return false;
    }

    const ttfBuffer = fs.readFileSync(ttfPath);
    const base64 = ttfBuffer.toString('base64');

    // 读取生成的 CSS 并替换为 Base64
    const cssPath = path.join(TEMP_DIR, 'app-icons.css');
    let css = fs.readFileSync(cssPath, 'utf-8');

    css = css.replace(
      /@font-face\s*\{[^}]*\}/,
      `@font-face {
  font-family: "app-icons";
  src: url("data:font/truetype;base64,${base64}") format("truetype");
}`
    );

    // 确保有 .iconfont 基础类
    if (!css.includes('.iconfont')) {
      css = css.replace(
        /(@font-face\s*\{[^}]*\})/,
        `$1

.iconfont {
  font-family: "app-icons" !important;
  font-style: normal;
  font-size: inherit;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
      );
    }

    // 写入最终 CSS
    const outputDir = path.dirname(CSS_OUTPUT);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(CSS_OUTPUT, css, 'utf-8');

    console.log(`✅ iconfont.css 生成成功 (${(ttfBuffer.length / 1024).toFixed(1)} KB)`);
    console.log(`   路径: ${CSS_OUTPUT}`);
    return true;
  } finally {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
  }
}

// ============================================================
// TabBar PNG 生成（通用，从 config 读取）
// ============================================================

async function generateTabBarPngs() {
  const sharp = require('sharp');
  const colors = resolveColors();

  console.log('\n═══ 生成 TabBar PNG ═══\n');
  console.log(`未选中色: ${colors.inactive}`);
  console.log(`选中色:   ${colors.active}`);
  console.log(`尺寸:     ${config.tabbar.size}×${config.tabbar.size}px\n`);

  // 从 config.tabbar.list 动态读取需要生成的图标（不再硬编码）
  const tabbarIcons = config.tabbar.list.map(item => ({
    name: item.icon,
    svg: `${item.icon}.svg`,
  }));

  if (!fs.existsSync(TABBAR_OUTPUT_DIR)) {
    fs.mkdirSync(TABBAR_OUTPUT_DIR, { recursive: true });
  }

  let success = 0;
  for (const icon of tabbarIcons) {
    const svgPath = path.join(SVG_DIR, icon.svg);

    if (!fs.existsSync(svgPath)) {
      console.error(`⚠️  SVG 未找到: ${icon.svg}`);
      continue;
    }

    try {
      // 未选中态
      await svgToPng(sharp, svgPath, path.join(TABBAR_OUTPUT_DIR, `${icon.name}.png`),
        colors.inactive, config.tabbar.size);
      console.log(`✅  ${icon.name}.png (${colors.inactive})`);

      // 选中态
      await svgToPng(sharp, svgPath, path.join(TABBAR_OUTPUT_DIR, `${icon.name}-active.png`),
        colors.active, config.tabbar.size);
      console.log(`✅  ${icon.name}-active.png (${colors.active})`);

      success++;
    } catch (err) {
      console.error(`❌  ${icon.name} 失败:`, err.message);
    }
  }

  // 文件大小检查
  console.log('\n文件大小（微信要求 ≤ 40KB）:');
  const files = fs.readdirSync(TABBAR_OUTPUT_DIR).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const stats = fs.statSync(path.join(TABBAR_OUTPUT_DIR, file));
    const kb = (stats.size / 1024).toFixed(1);
    const ok = stats.size <= 40960 ? '✅' : '⚠️ 超 40KB!';
    console.log(`   ${ok} ${file}: ${kb} KB`);
  }

  console.log(`\n生成完成: ${success}/${tabbarIcons.length} 组`);
  return success > 0;
}

/**
 * SVG → PNG 通用转换函数
 * @param {sharp} sharp - sharp 模块
 * @param {string} svgPath - 源 SVG 路径
 * @param {string} outputPath - 输出 PNG 路径
 * @param {string} color - 目标颜色（如 #E85D04）
 * @param {number} size - 输出尺寸（正方形）
 */
async function svgToPng(sharp, svgPath, outputPath, color, size) {
  let svg = fs.readFileSync(svgPath, 'utf-8');

  // 替换颜色
  svg = svg
    .replace(/currentColor/g, color)
    .replace(/fill="(?!none")[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="(?!none")[^"]*"/g, `stroke="${color}"`);

  if (!svg.includes(`fill="${color}"`)) {
    svg = svg.replace('<svg', `<svg fill="${color}"`);
  }

  // 统一宽高
  svg = svg.replace(/\s+width="[^"]*"/, '').replace(/\s+height="[^"]*"/, '');
  svg = svg.replace('<svg', `<svg width="${size}" height="${size}"`);

  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(outputPath);
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const fontOnly = args.includes('--font-only');
  const pngOnly = args.includes('--png-only');

  if (!fs.existsSync(SVG_DIR) || fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg')).length === 0) {
    console.error('错误: SVG 目录为空，请先运行: node scripts/extract-icons.js');
    process.exit(1);
  }

  let fontOk = true;
  let pngOk = true;

  if (!pngOnly) fontOk = await generateIconFont();
  if (!fontOnly) pngOk = await generateTabBarPngs();

  console.log('\n═══ 总结 ═══');
  if (!pngOnly) console.log(`Icon Font CSS: ${fontOk ? '✅ 成功' : '❌ 失败'}`);
  if (!fontOnly) console.log(`TabBar PNG:    ${pngOk ? '✅ 成功' : '❌ 失败'}`);
  console.log('\n下一步: node scripts/generate-preview.js → 预览所有图标');
}

main().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});
