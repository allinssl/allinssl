#!/bin/bash

# ===================================================
# 文件操作脚本 - file-operations.sh
# 用于处理文件同步、路径处理和目录结构管理
# ===================================================

# 颜色定义
if [[ -t 1 ]]; then  # 检查是否在终端中运行
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    MAGENTA=$(tput setaf 5)
    CYAN=$(tput setaf 6)
    BOLD=$(tput bold)
    DIM=$(tput dim)
    NC=$(tput sgr0)  # No Color
else
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    MAGENTA=""
    CYAN=""
    BOLD=""
    DIM=""
    NC=""
fi

# 工具函数
log_info() {
    printf "%s%s[INFO]%s %s\n" "${BOLD}" "${GREEN}" "${NC}" "$1"
}

log_debug() {
    if [[ "$DEBUG_MODE" == "true" ]]; then
        printf "%s%s[DEBUG]%s %s\n" "${BOLD}" "${MAGENTA}" "${NC}" "$1"
    fi
}

log_warn() {
    printf "%s%s[WARN]%s %s\n" "${BOLD}" "${YELLOW}" "${NC}" "$1"
}

log_error() {
    printf "%s%s[ERROR]%s %s\n" "${BOLD}" "${RED}" "${NC}" "$1"
}

# 显示分隔线
show_separator() {
    printf "%s%s%s\n" "${DIM}" "──────────────────────────────────────────" "${NC}"
}

# 显示标题
show_title() {
    printf "\n%s%s%s%s\n\n" "${BOLD}" "${CYAN}" "$1" "${NC}"
}

# 显示进度条
show_progress() {
    local current=$1
    local total=$2
    local width=30
    local percentage=$((current * 100 / total))
    local completed=$((width * current / total))
    local remaining=$((width - completed))
    
    printf "\r%s%s[%s%s%s] %d%%" \
        "${BOLD}" "${CYAN}" \
        "$(printf '%*s' "$completed" | tr ' ' '●')" \
        "$(printf '%*s' "$remaining" | tr ' ' '○')" \
        "${NC}" \
        "$percentage"
}

# 初始化同步目录结构
init_sync_dirs() {
    if [[ -z "$PROJECT_ROOT" ]]; then
        log_error "项目根目录未初始化"
        return 1
    fi
    
    # 创建同步配置目录
    SYNC_DIR="$PROJECT_ROOT/.sync"
    if [[ ! -d "$SYNC_DIR" ]]; then
        mkdir -p "$SYNC_DIR" || {
            log_error "创建同步配置目录失败: $SYNC_DIR"
            return 1
        }
        log_info "已创建同步配置目录: $SYNC_DIR"
    fi
    
    # 创建 Git 仓库目录
    GIT_DIR="$PROJECT_ROOT/.git-sync"
    if [[ ! -d "$GIT_DIR" ]]; then
        mkdir -p "$GIT_DIR" || {
            log_error "创建 Git 仓库目录失败: $GIT_DIR"
            return 1
        }
        log_info "已创建 Git 仓库目录: $GIT_DIR"
    fi
    
    # 初始化历史记录文件
    HISTORY_FILE="$SYNC_DIR/history"
    if [[ ! -f "$HISTORY_FILE" ]]; then
        touch "$HISTORY_FILE" || {
            log_error "创建历史记录文件失败: $HISTORY_FILE"
            return 1
        }
        log_info "已创建历史记录文件: $HISTORY_FILE"
    fi
    
    # 初始化插件目录
    PLUGINS_DIR="$SYNC_DIR/plugins"
    if [[ ! -d "$PLUGINS_DIR" ]]; then
        mkdir -p "$PLUGINS_DIR" || {
            log_error "创建插件目录失败: $PLUGINS_DIR"
            return 1
        }
        log_info "已创建插件目录: $PLUGINS_DIR"
    fi
    
    # 初始化同步配置文件
    SYNC_CONFIG_FILE="$SYNC_DIR/sync-config.yaml"
    if [[ ! -f "$SYNC_CONFIG_FILE" ]]; then
        cat > "$SYNC_CONFIG_FILE" << EOF
# 工具配置
config:
  parallel_build: false  # 是否并行编译
  dry_run: false  # 是否干运行

# 工作区配置
workspaces:
  # 示例配置
  # app-name:
  #   sync_mappings:
  #     - source:
  #         git_url: "https://github.com/user/repo.git"
  #         branch: "main"
  #       target:
  #         sync_dir: "dist"  # 要同步的目录
  #         git_dir: "dist"   # Git 仓库中的目标目录
EOF
        log_info "已创建同步配置文件: $SYNC_CONFIG_FILE"
    fi
    
    return 0
}

# 查找项目根目录
find_project_root() {
    local current_dir="$PWD"
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/pnpm-workspace.yaml" ]]; then
            PROJECT_ROOT="$current_dir"
            log_info "找到项目根目录: $PROJECT_ROOT"
            # 在找到根目录后，初始化相关路径
            SYNC_DIR="$PROJECT_ROOT/.sync"
            GIT_DIR="$PROJECT_ROOT/.git-sync"
            SYNC_CONFIG_FILE="$SYNC_DIR/sync-config.yaml"
            HISTORY_FILE="$SYNC_DIR/history"
            PLUGINS_DIR="$SYNC_DIR/plugins"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done
    log_error "未找到项目根目录"
    return 1
}

# 检查并创建工作区配置目录
check_workspace_config_dir() {
    # 检查工作区配置目录是否存在
    if [[ ! -d "$WORKSPACE_CONFIG_DIR" ]]; then
        log_info "工作区配置目录不存在，正在创建..."
        mkdir -p "$WORKSPACE_CONFIG_DIR" || {
            log_error "创建工作区配置目录失败: $WORKSPACE_CONFIG_DIR"
            return 1
        }
        log_info "已创建工作区配置目录: $WORKSPACE_CONFIG_DIR"
        
        # 创建 .gitignore 文件
        cat > "$WORKSPACE_CONFIG_DIR/.gitignore" << EOF
# 忽略所有文件
*
# 不忽略 .gitignore
!.gitignore
EOF
        log_info "已创建 .gitignore 文件"
        
        # 创建 README.md 文件
        cat > "$WORKSPACE_CONFIG_DIR/README.md" << EOF
# 工作区配置目录

此目录用于存储各个工作区的同步配置信息。

## 配置文件格式

每个工作区对应一个 YAML 配置文件，命名格式为 \`{workspace}.yaml\`。

### 配置示例

\`\`\`yaml
# 工作区同步配置
workspace: "app-name"
sync_mappings:
  - source:
      git_url: "https://github.com/user/repo.git"
      branch: "main"
    target:
      sync_dir: "dist"  # 要同步的目录
      git_dir: "dist"   # Git 仓库中的目标目录
\`\`\`

## 注意事项

1. 此目录不应被 Git 追踪
2. 配置文件包含敏感信息，请妥善保管
3. 建议定期备份配置文件
EOF
        log_info "已创建 README.md 文件"
    fi
    
    # 检查目录权限
    if [[ ! -w "$WORKSPACE_CONFIG_DIR" ]]; then
        log_error "工作区配置目录没有写入权限: $WORKSPACE_CONFIG_DIR"
        return 1
    fi
    
    return 0
}

# 同步文件操作函数
sync_files() {
    local source_path="$PROJECT_ROOT/$SELECTED_WORKSPACE"
    local dist_path="$source_path/dist"
    
    # 检查源目录
    if [[ ! -d "$dist_path" ]]; then
        log_error "源目录不存在: $dist_path"
        return 1
    fi
    
    # 询问是否同步项目结构
    read -p "是否同步项目结构？(y/n): " sync_structure
    if [[ "$sync_structure" == "y" ]]; then
        # 同步项目结构
        log_info "开始同步项目结构..."
        
        # 创建临时目录
        local temp_dir=$(mktemp -d)
        
        # 复制项目结构
        find "$source_path" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" | while IFS= read -r file; do
            local rel_path="${file#$source_path/}"
            local target_path="$temp_dir/$rel_path"
            mkdir -p "$(dirname "$target_path")"
            cp "$file" "$target_path"
        done
        
        # 移动临时目录内容到目标目录
        cp -r "$temp_dir"/* "$TARGET_GIT_DIR/"
        rm -rf "$temp_dir"
    fi
    
    # 同步编译结果
    log_info "开始同步编译结果..."
    if [[ "$OS" == "windows" ]]; then
        # Windows 路径处理
        local target_dist="${TARGET_GIT_DIR}\\dist"
        if [[ -d "$target_dist" ]]; then
            rm -rf "$target_dist"
        fi
        cp -r "$dist_path" "$target_dist"
    else
        # Unix 路径处理
        local target_dist="$TARGET_GIT_DIR/dist"
        if [[ -d "$target_dist" ]]; then
            rm -rf "$target_dist"
        fi
        cp -r "$dist_path" "$target_dist"
    fi
    
    log_info "文件同步完成"
    return 0
}

# 同步所有源码文件
sync_all_source_files() {
    local files=("$@")
    local total=${#files[@]}
    local current=0
    
    for target_dir in "${TARGET_GIT_DIRS[@]}"; do
        log_info "开始同步到: $target_dir"
        for file in "${files[@]}"; do
            local rel_path="${file#$PROJECT_ROOT/$SELECTED_WORKSPACE/}"
            local target_path="$target_dir/$rel_path"
            mkdir -p "$(dirname "$target_path")"
            cp "$file" "$target_path"
            ((current++))
            show_progress "$current" "$total"
        done
        printf "\n"
    done
    
    log_info "源码同步完成"
    return 0
}

# 仅同步配置文件
sync_config_files() {
    local files=("$@")
    local config_files=()
    
    for file in "${files[@]}"; do
        if [[ "$file" =~ \.(json|yaml|yml|config\.js|config\.ts)$ ]]; then
            config_files+=("$file")
        fi
    done
    
    if [[ ${#config_files[@]} -eq 0 ]]; then
        log_error "未找到配置文件"
        return 1
    fi
    
    sync_all_source_files "${config_files[@]}"
}

# 仅同步源代码
sync_source_files() {
    local files=("$@")
    local source_files=()
    
    for file in "${files[@]}"; do
        if [[ "$file" =~ \.(js|ts|jsx|tsx|vue|css|scss|less)$ ]]; then
            source_files+=("$file")
        fi
    done
    
    if [[ ${#source_files[@]} -eq 0 ]]; then
        log_error "未找到源代码文件"
        return 1
    fi
    
    sync_all_source_files "${source_files[@]}"
}

# 记录操作历史
record_history() {
    if [[ -z "$HISTORY_FILE" ]]; then
        log_error "历史记录文件未初始化，请确保已找到项目根目录"
        return 1
    fi
    
    local operation="$1" # 操作
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S') # 时间戳
    echo "$timestamp|$operation" >> "$HISTORY_FILE" # 写入历史记录文件
    
    # 保持历史记录在最大限制内
    if [[ -f "$HISTORY_FILE" ]]; then
        tail -n "$MAX_HISTORY" "$HISTORY_FILE" > "${HISTORY_FILE}.tmp"
        mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
    fi
}

# 显示操作历史
show_history() {
    if [[ -z "$HISTORY_FILE" ]]; then
        log_error "历史记录文件未初始化，请确保已找到项目根目录"
        return 1
    fi
    
    if [[ -f "$HISTORY_FILE" ]]; then
        log_info "最近的操作历史:"
        while IFS='|' read -r timestamp operation; do
            echo "$timestamp - $operation"
        done < "$HISTORY_FILE"
    else
        log_info "暂无操作历史"
    fi
}

# 同步源码
sync_source_code() {
    local workspace_path="$PROJECT_ROOT/$SELECTED_WORKSPACE"
    local source_files=()
    
    # 收集需要同步的源码文件
    for file in $(find "$workspace_path" -type f); do
        if [[ ! "$file" =~ /(node_modules|dist|\.git)/ ]]; then
            source_files+=("$file")
        fi
    done
    
    if [[ ${#source_files[@]} -eq 0 ]]; then
        log_error "未找到需要同步的源码文件"
        return 1
    fi
    
    # 显示同步选项
    show_title "同步源码选项"
    printf "%s%s%s\n" "${DIM}" "选择要同步的内容" "${NC}"
    show_separator
    
    local sync_options=(
        "同步所有源码文件"
        "仅同步配置文件"
        "仅同步源代码"
        "自定义同步"
    )
    
    local selected_index=0
    local max_index=$((${#sync_options[@]}-1))
    local padding=2
    
    while true; do
        clear
        # 显示选项列表
        show_title "同步源码选项"
        printf "%s%s%s\n" "${DIM}" "选择要同步的内容" "${NC}"
        show_separator
        
        for i in "${!sync_options[@]}"; do
            if [[ $i -eq $selected_index ]]; then
                printf "%s%s%s%*s%s%s%s\n" \
                    "${BOLD}" "${CYAN}" "❯" \
                    "$padding" "" \
                    "${GREEN}" "${sync_options[$i]}" "${NC}"
            else
                printf "%*s%s%s%s\n" \
                    "$((padding + 1))" "" \
                    "${DIM}" "${sync_options[$i]}" "${NC}"
            fi
        done
        
        show_separator
        
        # 读取用户输入
        local key_pressed=""
        local key
        read -r -n 1 key
        
        # 获取ASCII码用于调试（针对回车键）
        if [[ -z "$key" ]]; then
            [[ "$DEBUG_MODE" == "true" ]] && printf "空字符，可能是回车键\n"
            key_pressed="ENTER"
        else
            [[ "$DEBUG_MODE" == "true" ]] && printf "按键ASCII码: %d\n" "'$key"
        fi
        
        # 处理按键
        case "$key" in
            $'\x1b')  # ESC 序列
                read -r -n 2 key
                case "$key" in
                    "[A")  # 上箭头
                        if [[ $selected_index -gt 0 ]]; then
                            selected_index=$((selected_index-1))
                        else
                            # 循环到最后一项
                            selected_index=$max_index
                        fi
                        ;;
                    "[B")  # 下箭头
                        if [[ $selected_index -lt $max_index ]]; then
                            selected_index=$((selected_index+1))
                        else
                            # 循环到第一项
                            selected_index=0
                        fi
                        ;;
                esac
                ;;
            "")  # 回车
                case $selected_index in
                    0)  # 同步所有源码文件
                        sync_all_source_files "${source_files[@]}"
                        ;;
                    1)  # 仅同步配置文件
                        sync_config_files "${source_files[@]}"
                        ;;
                    2)  # 仅同步源代码
                        sync_source_files "${source_files[@]}"
                        ;;
                    3)  # 自定义同步
                        sync_custom_files "${source_files[@]}"
                        ;;
                esac
                return $?
                ;;
            "q")  # 退出
                log_error "操作已取消"
                return 1
                ;;
        esac
    done
}

# 自定义同步文件选择
sync_custom_files() {
    local files=("$@")
    local selected_files=()
    local selected_indices=()
    local cursor_index=0
    local max_index=$((${#files[@]}-1))
    local padding=2
    
    while true; do
        clear
        show_title "选择要同步的文件"
        printf "%s%s%s\n" "${DIM}" "使用数字键1选中/0取消，回车确认，q 退出" "${NC}"
        show_separator
        
        # 显示文件列表
        for i in "${!files[@]}"; do
            local is_selected=false
            # 检查当前文件是否已被选中
            for idx in "${selected_indices[@]}"; do
                if [[ $i -eq $idx ]]; then
                    is_selected=true
                    break
                fi
            done
            
            if [[ $i -eq $cursor_index ]]; then
                # 当前光标位置
                if [[ "$is_selected" == "true" ]]; then
                    printf "%s%s%s%*s%s%s%s\n" \
                        "${BOLD}" "${CYAN}" "❯" \
                        "$padding" "" \
                        "${GREEN}" "[✓] ${files[$i]#$PROJECT_ROOT/}" "${NC}"
                else
                    printf "%s%s%s%*s%s%s%s\n" \
                        "${BOLD}" "${CYAN}" "❯" \
                        "$padding" "" \
                        "${DIM}" "[ ] ${files[$i]#$PROJECT_ROOT/}" "${NC}"
                fi
            else
                # 非光标位置
                if [[ "$is_selected" == "true" ]]; then
                    printf "%*s%s%s%s\n" \
                        "$((padding + 1))" "" \
                        "${GREEN}" "[✓] ${files[$i]#$PROJECT_ROOT/}" "${NC}"
                else
                    printf "%*s%s%s%s\n" \
                        "$((padding + 1))" "" \
                        "${DIM}" "[ ] ${files[$i]#$PROJECT_ROOT/}" "${NC}"
                fi
            fi
        done
        
        show_separator
        
        # 显示操作提示
        printf "\n%s%s使用上下箭头选择，数字键1选中/0取消，回车确认，q键退出%s\n" \
            "${BOLD}" "${CYAN}" "${NC}"
        
        # 读取用户输入 - 统一处理方式
        local key_pressed=""
        local key
        read -r -n 1 key
        
        # 获取ASCII码用于调试
        if [[ -z "$key" ]]; then
            [[ "$DEBUG_MODE" == "true" ]] && printf "空字符，可能是回车键\n"
            key_pressed="ENTER"  # 空字符通常是回车键
        elif [[ "$key" == "1" ]]; then
            printf "检测到数字键1，执行选中操作\n"  # 始终输出，不依赖DEBUG_MODE
            key_pressed="SELECT"  # 选中
        elif [[ "$key" == "0" ]]; then
            printf "检测到数字键0，执行取消选中操作\n"  # 始终输出，不依赖DEBUG_MODE
            key_pressed="DESELECT"  # 取消选中
        else
            [[ "$DEBUG_MODE" == "true" ]] && printf "按键ASCII码: %d\n" "'$key"
            
            # 处理其他按键
            case "$key" in
                $'\x1b')  # ESC 序列，包括方向键
                    read -r -n 2 seq
                    [[ "$DEBUG_MODE" == "true" ]] && printf "ESC序列: %s\n" "$seq"
                    case "$seq" in
                        "[A") key_pressed="UP" ;;    # 上箭头
                        "[B") key_pressed="DOWN" ;;  # 下箭头
                        *) key_pressed="ESC" ;;      # 其他ESC序列
                    esac
                    ;;
                "q"|"Q")  # q键退出
                    key_pressed="QUIT"
                    ;;
                *)  # 其他按键忽略
                    key_pressed="OTHER"
                    ;;
            esac
        fi
        
        # 调试信息
        [[ "$DEBUG_MODE" == "true" ]] && log_debug "按键被解析为: $key_pressed"
        
        # 处理操作
        case "$key_pressed" in
            "UP")  # 上箭头
                if [[ $cursor_index -gt 0 ]]; then
                    cursor_index=$((cursor_index-1))
                else
                    # 如果已经是第一项，跳到最后一项
                    cursor_index=$max_index
                fi
                ;;
            "DOWN")  # 下箭头
                if [[ $cursor_index -lt $max_index ]]; then
                    cursor_index=$((cursor_index+1))
                else
                    # 如果已经是最后一项，回到第一项
                    cursor_index=0
                fi
                ;;
            "SELECT")  # 数字键1 - 选中当前项
                printf "处理SELECT操作 - 选中当前项: ${cursor_index}\n"
                # 检查当前索引是否已在选中列表中
                local found=false
                for idx in "${selected_indices[@]}"; do
                    if [[ $idx -eq $cursor_index ]]; then
                        found=true
                        break
                    fi
                done
                
                # 如果未选中，则添加到选中列表
                if [[ "$found" == "false" ]]; then
                    selected_indices+=($cursor_index)
                    printf "已添加索引 ${cursor_index} 到选中列表\n"
                    # 对选中项排序
                    if [[ ${#selected_indices[@]} -gt 0 ]]; then
                        IFS=$'\n' 
                        selected_indices=($(sort -n <<<"${selected_indices[*]}"))
                        unset IFS
                    fi
                else
                    printf "索引 ${cursor_index} 已在选中列表中\n"
                fi
                ;;
            "DESELECT")  # 数字键0 - 取消选中当前项
                printf "处理DESELECT操作 - 取消选中当前项: ${cursor_index}\n"
                # 检查当前索引是否已在选中列表中
                local found=false
                local new_indices=()
                
                # 创建新数组，排除当前索引
                for idx in "${selected_indices[@]}"; do
                    if [[ $idx -ne $cursor_index ]]; then
                        new_indices+=($idx)
                    else
                        found=true  # 标记找到了要删除的索引
                    fi
                done
                
                # 只有在找到并删除了索引的情况下才更新选中列表
                if [[ "$found" == "true" ]]; then
                    selected_indices=("${new_indices[@]}")
                    printf "已从选中列表中移除索引 ${cursor_index}\n"
                else
                    printf "索引 ${cursor_index} 不在选中列表中\n"
                fi
                ;;
            "ENTER")  # 回车 - 确认选择
                if [[ ${#selected_indices[@]} -eq 0 ]]; then
                    log_error "请至少选择一个文件"
                    sleep 2  # 暂停显示错误信息
                    continue
                fi
                
                # 重建选中文件列表
                selected_files=()
                for idx in "${selected_indices[@]}"; do
                    selected_files+=("${files[$idx]}")
                done
                
                sync_all_source_files "${selected_files[@]}"
                return $?
                ;;
            "QUIT")  # 退出
                log_error "操作已取消"
                return 1
                ;;
        esac
    done
}

# 导出函数
export -f log_info
export -f log_debug
export -f log_warn
export -f log_error
export -f show_separator
export -f show_title
export -f show_progress
export -f init_sync_dirs
export -f find_project_root
export -f check_workspace_config_dir
export -f sync_files
export -f sync_all_source_files
export -f sync_config_files
export -f sync_source_files
export -f record_history
export -f show_history
export -f sync_source_code
export -f sync_custom_files 