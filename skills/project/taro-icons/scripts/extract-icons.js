/**
 * extract-icons.js
 * 从 npm 安装的图标库中提取项目需要的 SVG 文件
 *
 * 用法：node scripts/extract-icons.js
 * 配置：读取项目根目录的 icons.config.json
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 读取配置
// ============================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'icons.config.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src/assets/icons/svg');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('错误: 未找到 icons.config.json');
  console.error('请在项目根目录创建该文件，参考 scripts/icons.config.template.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// ============================================================
// 确定图标库源路径
// ============================================================

function getSourceDir(iconLib) {
  const dirs = {
    remixicon: path.join(PROJECT_ROOT, 'node_modules/remixicon/icons'),
    material: path.join(PROJECT_ROOT, 'node_modules/@material-design-icons/svg'),
  };

  const dir = dirs[iconLib];
  if (!dir) {
    console.error(`错误: 不支持的图标库 "${iconLib}"，支持: remixicon, material`);
    process.exit(1);
  }

  if (!fs.existsSync(dir)) {
    const pkg = iconLib === 'remixicon' ? 'remixicon' : '@material-design-icons/svg';
    console.error(`错误: 图标库未安装，请先运行: npm install ${pkg}`);
    process.exit(1);
  }

  return dir;
}

// ============================================================
// 执行提取
// ============================================================

function main() {
  const sourceDir = getSourceDir(config.iconLib);
  const icons = config.icons;

  if (!icons || icons.length === 0) {
    console.error('错误: icons.config.json 中 icons 数组为空');
    process.exit(1);
  }

  // 创建输出目录
  if (fs.existsSync(OUTPUT_DIR)) {
    // 清空旧文件
    const oldFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.svg'));
    oldFiles.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`图标库: ${config.iconLib}`);
  console.log(`提取 ${icons.length} 个图标...\n`);

  let success = 0;
  let fail = 0;

  for (const icon of icons) {
    const srcPath = path.join(sourceDir, icon.file);
    const destPath = path.join(OUTPUT_DIR, `${icon.name}.svg`);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  未找到: ${icon.file} → ${icon.name}`);
      fail++;
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
    const tags = icon.tags ? icon.tags.join(', ') : 'page';
    console.log(`✅  ${icon.name}.svg ← ${icon.file}  [${tags}]`);
    success++;
  }

  console.log(`\n提取完成: ${success} 成功, ${fail} 失败`);
  console.log(`输出目录: ${OUTPUT_DIR}`);
}

main();
