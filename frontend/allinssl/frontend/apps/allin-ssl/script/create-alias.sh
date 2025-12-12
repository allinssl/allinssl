#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# src 目录
SRC_DIR="$PROJECT_ROOT/src"
# tmp 目录
TMP_DIR="$PROJECT_ROOT/.temp"

# 临时文件
TEMP_PATHS_FILE="$TMP_DIR/tsconfig_paths.json"
TEMP_ALIAS_FILE="$TMP_DIR/vite_alias.js"

# 清理函数
cleanup() {
    echo "清理临时文件..."
    rm -rf "$TMP_DIR"
}

# 错误处理
handle_error() {
    echo "错误: $1"
    cleanup
    exit 1
}

# 注册清理函数
trap cleanup EXIT

# 检查并创建 tmp 目录
if [ ! -d "$TMP_DIR" ]; then
    echo "创建临时目录: $TMP_DIR"
    mkdir -p "$TMP_DIR" || handle_error "无法创建临时目录"
fi

# 初始化临时文件
echo "{" > "$TEMP_PATHS_FILE"
echo "import path from 'path'" > "$TEMP_ALIAS_FILE"
echo "export default {" >> "$TEMP_ALIAS_FILE"

# 处理 views 目录下的第一层目录
if [ -d "$SRC_DIR/views" ]; then
    echo "处理 views 目录..."
    # 确保没有尾随逗号的最后一个条目
    view_dirs=()
    while IFS= read -r dir; do
        if [ -d "$dir" ]; then
            dir_name=$(basename "$dir")
            view_dirs+=("$dir_name")
        fi
    done < <(find "$SRC_DIR/views" -mindepth 1 -maxdepth 1 -type d)

    # 处理 views 子目录
    total=${#view_dirs[@]}
    for ((i=0; i<total; i++)); do
        dir_name=${view_dirs[$i]}
        echo "  \"@$dir_name/*\": [\"./src/views/$dir_name/*\"]" >> "$TEMP_PATHS_FILE"
        echo "  '@$dir_name': path.resolve(__dirname, 'src/views/$dir_name')," >> "$TEMP_ALIAS_FILE"
        # 如果不是最后一个元素，添加逗号
        if [ $i -lt $((total-1)) ]; then
            echo "," >> "$TEMP_PATHS_FILE"
        fi
    done
fi

# 处理 src 目录下的所有目录
echo "处理 src 目录下的其他目录..."
src_dirs=()
while IFS= read -r dir; do
    if [ -d "$dir" ] && [ "$(basename "$dir")" != "views" ]; then
        dir_name=$(basename "$dir")
        src_dirs+=("$dir_name")
    fi
done < <(find "$SRC_DIR" -mindepth 1 -maxdepth 1 -type d)

# 如果之前有 views 目录的条目，添加逗号
if [ ${#view_dirs[@]} -gt 0 ] && [ ${#src_dirs[@]} -gt 0 ]; then
    echo "," >> "$TEMP_PATHS_FILE"
fi

# 处理其他目录
total=${#src_dirs[@]}
for ((i=0; i<total; i++)); do
    dir_name=${src_dirs[$i]}
    echo "  \"@$dir_name/*\": [\"./src/$dir_name/*\"]" >> "$TEMP_PATHS_FILE"
    echo "  '@$dir_name': path.resolve(__dirname, 'src/$dir_name')," >> "$TEMP_ALIAS_FILE"
    # 如果不是最后一个元素，添加逗号
    if [ $i -lt $((total-1)) ]; then
        echo "," >> "$TEMP_PATHS_FILE"
    fi
done

# 添加根路径（确保添加逗号如果之前有其他条目）
if [ ${#view_dirs[@]} -gt 0 ] || [ ${#src_dirs[@]} -gt 0 ]; then
    echo "," >> "$TEMP_PATHS_FILE"
fi
echo "  \"@/*\": [\"./src/*\"]" >> "$TEMP_PATHS_FILE"
echo "}" >> "$TEMP_PATHS_FILE"

# 添加根路径到 alias 配置
echo "  '@': path.resolve(__dirname, 'src')" >> "$TEMP_ALIAS_FILE"
echo "}" >> "$TEMP_ALIAS_FILE"

# 更新 tsconfig.app.json
echo "更新 tsconfig.app.json..."
TSCONFIG="$PROJECT_ROOT/tsconfig.app.json"
if [ -f "$TSCONFIG" ]; then
    # 创建临时文件
    TSCONFIG_TMP="${TSCONFIG}.tmp"
    
    # 使用 jq 处理 JSON（如果可用）
    if command -v jq >/dev/null 2>&1; then
        jq --arg paths "$(cat "$TEMP_PATHS_FILE")" '.compilerOptions.paths = $paths' "$TSCONFIG" > "$TSCONFIG_TMP" \
        && mv "$TSCONFIG_TMP" "$TSCONFIG" \
        || handle_error "更新 tsconfig.app.json 失败"
    else
        # 回退到 sed 方案
        sed -e '/"paths":/,/}/c\    "paths": '"$(cat "$TEMP_PATHS_FILE")"',' "$TSCONFIG" > "$TSCONFIG_TMP" \
        && mv "$TSCONFIG_TMP" "$TSCONFIG" \
        || handle_error "更新 tsconfig.app.json 失败"
    fi
    echo "tsconfig.app.json 更新成功"
else
    handle_error "找不到 tsconfig.app.json 文件"
fi

# 更新 vite.config.ts
echo "更新 vite.config.ts..."
VITE_CONFIG="$PROJECT_ROOT/vite.config.ts"
if [ -f "$VITE_CONFIG" ]; then
    VITE_CONFIG_TMP="${VITE_CONFIG}.tmp"
    
    # 使用 sed 更新 alias 配置
    sed -e '/resolve: {/,/}/c\  resolve: {\n    alias: '"$(cat "$TEMP_ALIAS_FILE")"'\n  },' "$VITE_CONFIG" > "$VITE_CONFIG_TMP" \
    && mv "$VITE_CONFIG_TMP" "$VITE_CONFIG" \
    || handle_error "更新 vite.config.ts 失败"
    
    echo "vite.config.ts 更新成功"
else
    handle_error "找不到 vite.config.ts 文件"
fi

echo "路径别名配置更新完成！"
