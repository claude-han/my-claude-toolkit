#!/bin/bash
# sync.sh — 将仓库中的内容同步到本地 ~/.claude/ 目录
#
# 用法：./sync.sh [--dry-run]
#   --dry-run  只显示会做什么，不实际执行

set -e

CLAUDE_DIR="$HOME/.claude"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DRY_RUN=false

if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🔍 预览模式（不会实际修改文件）"
  echo ""
fi

sync_dir() {
  local src="$1"
  local dest="$2"
  local label="$3"

  if [ ! -d "$src" ]; then
    return
  fi

  # 统计要同步的项目（排除 _ 开头的模板文件/目录）
  local count=0
  for item in "$src"/*/; do
    [ -d "$item" ] || continue
    local name=$(basename "$item")
    [[ "$name" == _* ]] && continue
    count=$((count + 1))
  done

  # 也统计 .md 文件（用于 commands）
  for item in "$src"/*.md; do
    [ -f "$item" ] || continue
    local name=$(basename "$item")
    [[ "$name" == _* ]] && continue
    [[ "$name" == "README.md" ]] && continue
    count=$((count + 1))
  done

  if [ $count -eq 0 ]; then
    return
  fi

  echo "📦 $label ($count 项)"

  # 同步文件夹（skills、agents）
  for item in "$src"/*/; do
    [ -d "$item" ] || continue
    local name=$(basename "$item")
    [[ "$name" == _* ]] && continue

    if [ "$DRY_RUN" = true ]; then
      echo "   → $name (预览)"
    else
      mkdir -p "$dest"
      rm -rf "$dest/$name"
      cp -r "$item" "$dest/$name"
      echo "   ✅ $name"
    fi
  done

  # 同步 .md 文件（commands）
  for item in "$src"/*.md; do
    [ -f "$item" ] || continue
    local name=$(basename "$item")
    [[ "$name" == _* ]] && continue
    [[ "$name" == "README.md" ]] && continue

    if [ "$DRY_RUN" = true ]; then
      echo "   → $name (预览)"
    else
      mkdir -p "$dest"
      cp "$item" "$dest/$name"
      echo "   ✅ $name"
    fi
  done

  echo ""
}

echo ""
echo "═══════════════════════════════════════"
echo "  Claude Code Toolkit 同步"
echo "═══════════════════════════════════════"
echo ""
echo "源:   $REPO_DIR"
echo "目标: $CLAUDE_DIR"
echo ""

# 同步各个模块
sync_dir "$REPO_DIR/skills"   "$CLAUDE_DIR/skills"   "Skills（领域知识包）"
sync_dir "$REPO_DIR/commands" "$CLAUDE_DIR/commands" "Commands（斜杠命令）"
sync_dir "$REPO_DIR/agents"   "$CLAUDE_DIR/agents"   "Agents（子代理）"

# Hooks 需要特殊处理（合并而非覆盖）
if [ -f "$REPO_DIR/hooks/settings.json" ]; then
  echo "⚙️  Hooks 配置"
  echo "   ⚠️  hooks/settings.json 需要手动合并到项目的 .claude/settings.json"
  echo "   参考: $REPO_DIR/hooks/README.md"
  echo ""
fi

echo "═══════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
  echo "  预览完成（未修改任何文件）"
  echo "  去掉 --dry-run 参数执行实际同步"
else
  echo "  ✅ 同步完成！"
fi
echo "═══════════════════════════════════════"
echo ""

# 显示当前已安装的内容
if [ "$DRY_RUN" = false ]; then
  echo "当前已安装:"
  [ -d "$CLAUDE_DIR/skills" ] && echo "  Skills:   $(ls -1d "$CLAUDE_DIR/skills"/*/ 2>/dev/null | wc -l | tr -d ' ') 个"
  [ -d "$CLAUDE_DIR/commands" ] && echo "  Commands: $(ls -1 "$CLAUDE_DIR/commands"/*.md 2>/dev/null | wc -l | tr -d ' ') 个"
  [ -d "$CLAUDE_DIR/agents" ] && echo "  Agents:   $(ls -1 "$CLAUDE_DIR/agents"/*.md 2>/dev/null | wc -l | tr -d ' ') 个"
  echo ""
fi
