#!/bin/bash

# ===================================================
# Git 操作脚本 - git-operations.sh
# 用于处理 Git 仓库管理、同步和提交相关功能
# ===================================================

# 依赖文件操作脚本的函数
source "$(dirname "$0")/file-operations.sh"

# Git 操作模块
prepare_git_repo() {
    local git_url="$1"
    local branch="$2"
    local alias="$3"
    local target_dir="$GIT_DIR/${alias:-$(basename "$git_url" .git)}"
    
    # 检查目标目录是否存在
    if [[ ! -d "$target_dir" ]]; then
        log_info "目标目录不存在，尝试克隆仓库"
        if ! git clone "$git_url" "$target_dir"; then
            log_error "克隆仓库失败"
            return 1
        fi
    fi
    
    # 切换到目标目录
    cd "$target_dir" || {
        log_error "无法切换到目标目录"
        return 1
    }
    
    # 检查是否是 Git 仓库
    if [[ ! -d ".git" ]]; then
        log_error "目标目录不是有效的 Git 仓库"
        return 1
    }
    
    # 清理未提交的更改
    if [[ -n "$(git status --porcelain)" ]]; then
        log_warn "发现未提交的更改，正在清理..."
        git reset --hard HEAD
        git clean -fd
    fi
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    if ! git pull; then
        log_error "拉取代码失败"
        return 1
    fi
    
    # 切换到指定分支
    if [[ -n "$branch" ]]; then
        log_info "切换到分支: $branch"
        if ! git checkout "$branch"; then
            log_error "切换分支失败"
            return 1
        fi
    fi
    
    log_info "Git 仓库准备完成"
    return 0
}

# 获取源项目的最新提交信息
get_source_commit_info() {
    cd "$PROJECT_ROOT" || return 1
    local commit_hash=$(git rev-parse HEAD)
    local commit_msg=$(git log -1 --pretty=%B)
    echo "$commit_hash|$commit_msg"
}

# 提交更改
commit_changes() {
    local commit_info
    commit_info=$(get_source_commit_info) || {
        log_error "获取源项目提交信息失败"
        return 1
    }
    
    local commit_hash=$(echo "$commit_info" | cut -d'|' -f1)
    local commit_msg=$(echo "$commit_info" | cut -d'|' -f2)
    
    # 添加所有更改
    git add .
    
    # 提交更改
    if git commit -m "sync: $commit_msg (from $commit_hash)"; then
        log_info "提交成功"
        return 0
    else
        log_error "提交失败"
        return 1
    fi
}

# 推送更改到远程仓库
push_changes() {
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    # 检查是否有远程仓库
    if ! git remote | grep -q origin; then
        log_error "未找到远程仓库 origin"
        return 1
    fi
    
    # 推送到远程仓库
    log_info "正在推送更改到远程仓库..."
    if git push origin "$current_branch"; then
        log_info "推送成功"
        return 0
    else
        log_error "推送失败"
        return 1
    fi
}

# 选择 Git 项目目录
select_git_dirs() {
    local git_dirs=()
    local selected_indices=()
    local SYNC_MAPPINGS=()
    
    # 检查配置文件是否存在
    if [[ ! -f "$SYNC_CONFIG_FILE" ]]; then
        log_error "配置文件不存在: $SYNC_CONFIG_FILE"
        return 1
    fi
    
    # 检查是否安装了 yq
    if ! command -v yq &> /dev/null; then
        log_error "未安装 yq，无法读取配置文件"
        return 1
    fi
    
    # 检查工作区是否存在
    if ! yq e ".workspaces.$SELECTED_WORKSPACE" "$SYNC_CONFIG_FILE" &> /dev/null; then
        log_error "工作区 $SELECTED_WORKSPACE 不存在于配置文件中"
        return 1
    fi
    
    # 获取工作区的所有 Git 仓库配置
    local count
    count=$(yq e ".workspaces.$SELECTED_WORKSPACE.sync_mappings | length" "$SYNC_CONFIG_FILE")
    
    if [[ $count -eq 0 ]]; then
        log_error "工作区 $SELECTED_WORKSPACE 未配置任何 Git 仓库"
        return 1
    fi
    
    # 构建显示列表和映射信息
    local all_mappings=()
    for ((i=0; i<count; i++)); do
        local git_url
        local branch
        local alias
        local sync_dir
        local git_dir
        
        git_url=$(yq e ".workspaces.$SELECTED_WORKSPACE.sync_mappings[$i].source.git_url" "$SYNC_CONFIG_FILE")
        branch=$(yq e ".workspaces.$SELECTED_WORKSPACE.sync_mappings[$i].source.branch" "$SYNC_CONFIG_FILE")
        alias=$(yq e ".workspaces.$SELECTED_WORKSPACE.sync_mappings[$i].source.alias" "$SYNC_CONFIG_FILE")
        sync_dir=$(yq e ".workspaces.$SELECTED_WORKSPACE.sync_mappings[$i].target.sync_dir" "$SYNC_CONFIG_FILE")
        git_dir=$(yq e ".workspaces.$SELECTED_WORKSPACE.sync_mappings[$i].target.git_dir" "$SYNC_CONFIG_FILE")
        
        if [[ -n "$git_url" ]]; then
            # 格式化显示信息
            local display_name
            if [[ -n "$alias" ]]; then
                display_name="[$alias] $git_url ($branch) -> $sync_dir:$git_dir"
            else
                display_name="$git_url ($branch) -> $sync_dir:$git_dir"
            fi
            git_dirs+=("$display_name")
            # 存储完整映射信息，稍后使用
            all_mappings+=("$git_url|$branch|$sync_dir|$git_dir|$alias")
        fi
    done
    
    # 默认全选
    for i in "${!git_dirs[@]}"; do
        selected_indices+=($i)
    done
    
    local cursor_index=0
    local max_index=$((${#git_dirs[@]}-1))
    
    # 设置当前步骤
    CURRENT_STEP=2
    
    # 主循环 - 处理用户输入并更新选择
    while true; do
        # 显示步骤状态
        show_steps
        
        # 显示菜单标题
        printf "%s%s选择目标 Git 仓库%s\n\n" "${BOLD}" "${CYAN}" "${NC}"
        
        # 显示Git仓库列表
        for i in "${!git_dirs[@]}"; do
            # 检查当前索引是否已在选中列表中
            local is_selected=false
            for idx in "${selected_indices[@]}"; do
                if [[ $i -eq $idx ]]; then
                    is_selected=true
                    break
                fi
            done
            
            if [[ $i -eq $cursor_index ]]; then
                # 当前光标位置项
                if [[ "$is_selected" == "true" ]]; then
                    # 选中项
                    printf "%s%s❯ %s[✓] %s%s\n" \
                        "${BOLD}" "${CYAN}" "${GREEN}" "${git_dirs[$i]}" "${NC}"
                else
                    # 未选中项
                    printf "%s%s❯ %s[ ] %s%s\n" \
                        "${BOLD}" "${CYAN}" "${DIM}" "${git_dirs[$i]}" "${NC}"
                fi
            else
                # 非光标位置项
                if [[ "$is_selected" == "true" ]]; then
                    # 选中项
                    printf "  %s[✓] %s%s\n" \
                        "${GREEN}" "${git_dirs[$i]}" "${NC}"
                else
                    # 未选中项
                    printf "  %s[ ] %s%s\n" \
                        "${DIM}" "${git_dirs[$i]}" "${NC}"
                fi
            fi
        done
        
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
                    log_error "请至少选择一个 Git 仓库"
                    sleep 2  # 暂停显示错误信息
                    continue
                fi
                
                # 根据选中的索引获取对应的映射信息
                SYNC_MAPPINGS=()
                for idx in "${selected_indices[@]}"; do
                    SYNC_MAPPINGS+=("${all_mappings[$idx]}")
                done
                
                # 更新步骤状态
                STEP_GIT_REPOS="${#selected_indices[@]} 个仓库"
                CURRENT_STEP=3
                
                return 0
                ;;
            "QUIT")  # 退出
                log_error "操作已取消"
                return 1
                ;;
        esac
    done
}

# 读取工作区配置
read_workspace_config() {
    local workspace="$1"
    
    if ! command -v yq &> /dev/null; then
        log_warn "未安装 yq，将使用默认配置"
        return 1
    fi
    
    # 使用 yq 解析 YAML
    local mappings
    mappings=$(yq e ".workspaces.$workspace.sync_mappings" "$SYNC_CONFIG_FILE")
    if [[ "$mappings" != "null" ]]; then
        # 解析每个映射
        local count
        count=$(yq e ".workspaces.$workspace.sync_mappings | length" "$SYNC_CONFIG_FILE")
        for ((i=0; i<count; i++)); do
            local git_url
            local branch
            local sync_dir
            local git_dir
            local alias
            
            git_url=$(yq e ".workspaces.$workspace.sync_mappings[$i].source.git_url" "$SYNC_CONFIG_FILE")
            branch=$(yq e ".workspaces.$workspace.sync_mappings[$i].source.branch" "$SYNC_CONFIG_FILE")
            sync_dir=$(yq e ".workspaces.$workspace.sync_mappings[$i].target.sync_dir" "$SYNC_CONFIG_FILE")
            git_dir=$(yq e ".workspaces.$workspace.sync_mappings[$i].target.git_dir" "$SYNC_CONFIG_FILE")
            alias=$(yq e ".workspaces.$workspace.sync_mappings[$i].source.alias" "$SYNC_CONFIG_FILE")
            
            if [[ -n "$git_url" && -n "$sync_dir" ]]; then
                # 存储映射信息，添加别名
                SYNC_MAPPINGS+=("$git_url|$branch|$sync_dir|$git_dir|$alias")
            fi
        done
        return 0
    fi
    
    return 1
}

# 更新工作区配置
update_workspace_config() {
    local workspace="$1"
    
    if ! command -v yq &> /dev/null; then
        log_warn "未安装 yq，无法更新配置"
        return 1
    fi
    
    # 创建备份
    if [[ -f "$SYNC_CONFIG_FILE" ]]; then
        cp "$SYNC_CONFIG_FILE" "${SYNC_CONFIG_FILE}.bak"
    fi
    
    # 清空现有映射
    yq e -i ".workspaces.$workspace.sync_mappings = []" "$SYNC_CONFIG_FILE"
    
    # 添加新的映射
    for mapping in "${SYNC_MAPPINGS[@]}"; do
        IFS='|' read -r git_url branch sync_dir git_dir alias <<< "$mapping"
        yq e -i ".workspaces.$workspace.sync_mappings += [{\"source\": {\"git_url\": \"$git_url\", \"branch\": \"$branch\", \"alias\": \"$alias\"}, \"target\": {\"sync_dir\": \"$sync_dir\", \"git_dir\": \"$git_dir\"}}]" "$SYNC_CONFIG_FILE"
    done
    
    # 删除备份
    rm -f "${SYNC_CONFIG_FILE}.bak"
    log_info "工作区配置已更新"
    return 0
}

# 读取配置
read_config() {
    if [[ -z "$SYNC_CONFIG_FILE" ]]; then
        log_error "配置文件未初始化，请确保已找到项目根目录"
        return 1
    fi
    
    if [[ -f "$SYNC_CONFIG_FILE" ]]; then
        # 使用 yq 解析 YAML（如果安装了的话）
        if command -v yq &> /dev/null; then
            SELECTED_WORKSPACE=$(yq e '.config.workspace' "$SYNC_CONFIG_FILE")
            TARGET_GIT_DIR=$(yq e '.config.target_git_dir' "$SYNC_CONFIG_FILE")
            BRANCH=$(yq e '.config.branch' "$SYNC_CONFIG_FILE")
            SYNC_STRUCTURE=$(yq e '.config.sync_structure' "$SYNC_CONFIG_FILE")
            PARALLEL_BUILD=$(yq e '.config.parallel_build' "$SYNC_CONFIG_FILE")
            DRY_RUN=$(yq e '.config.dry_run' "$SYNC_CONFIG_FILE")
        else
            log_warn "未安装 yq，将使用默认配置"
        fi
    else
        log_error "配置文件不存在: $SYNC_CONFIG_FILE"
        return 1
    fi
}

# 保存配置
save_config() {
    if [[ -z "$SYNC_CONFIG_FILE" ]]; then
        log_error "配置文件未初始化，请确保已找到项目根目录"
        return 1
    fi
    
    if ! command -v yq &> /dev/null; then
        log_warn "未安装 yq，无法保存配置"
        return 1
    fi
    
    # 创建备份
    if [[ -f "$SYNC_CONFIG_FILE" ]]; then
        cp "$SYNC_CONFIG_FILE" "${SYNC_CONFIG_FILE}.bak"
    fi
    
    # 保存配置
    if ! yq e -i ".config.workspace = \"$SELECTED_WORKSPACE\"" "$SYNC_CONFIG_FILE" \
        && yq e -i ".config.target_git_dir = \"$TARGET_GIT_DIR\"" "$SYNC_CONFIG_FILE" \
        && yq e -i ".config.branch = \"$BRANCH\"" "$SYNC_CONFIG_FILE" \
        && yq e -i ".config.sync_structure = $SYNC_STRUCTURE" "$SYNC_CONFIG_FILE" \
        && yq e -i ".config.parallel_build = $PARALLEL_BUILD" "$SYNC_CONFIG_FILE" \
        && yq e -i ".config.dry_run = $DRY_RUN" "$SYNC_CONFIG_FILE"; then
        log_error "保存配置失败"
        # 恢复备份
        if [[ -f "${SYNC_CONFIG_FILE}.bak" ]]; then
            mv "${SYNC_CONFIG_FILE}.bak" "$SYNC_CONFIG_FILE"
        fi
        return 1
    fi
    
    # 删除备份
    rm -f "${SYNC_CONFIG_FILE}.bak"
    log_info "配置已保存"
    return 0
}

# 导出函数
export -f prepare_git_repo
export -f get_source_commit_info
export -f commit_changes
export -f push_changes
export -f select_git_dirs
export -f read_workspace_config
export -f update_workspace_config
export -f read_config
export -f save_config 