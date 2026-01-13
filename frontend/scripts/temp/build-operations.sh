#!/bin/bash

# ===================================================
# 项目编译处理脚本 - build-operations.sh
# 用于处理项目编译、工作区选择和编译结果检查
# ===================================================

# 依赖文件操作脚本的函数
source "$(dirname "$0")/file-operations.sh"

# 检查依赖
check_dependencies() {
    local deps=("pnpm" "git")
    local missing_deps=()
    
    # 检查基本依赖
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    # 检查 yq
    if ! command -v yq &> /dev/null; then
        log_error "未安装 yq，这是必需的依赖"
        log_info "请按照以下步骤安装 yq："
        case "$(uname -s)" in
            "Darwin")
                log_info "1. 使用 Homebrew 安装："
                log_info "   brew install yq"
                ;;
            "Linux")
                log_info "1. 使用包管理器安装："
                log_info "   # Ubuntu/Debian"
                log_info "   sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64"
                log_info "   sudo chmod a+x /usr/local/bin/yq"
                log_info "   # CentOS/RHEL"
                log_info "   sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64"
                log_info "   sudo chmod a+x /usr/local/bin/yq"
                ;;
            "MINGW"*|"MSYS"*)
                log_info "1. 使用 Chocolatey 安装："
                log_info "   choco install yq"
                ;;
        esac
        log_info "2. 安装完成后重新运行此脚本"
        exit 1
    fi
    
    # 检查其他缺失的依赖
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "未找到必要的依赖: ${missing_deps[*]}"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        "Darwin")
            OS="macos"
            ;;
        "Linux")
            OS="linux"
            ;;
        "MINGW"*|"MSYS"*)
            OS="windows"
            ;;
        *)
            log_error "不支持的操作系统"
            exit 1
            ;;
    esac
    log_info "检测到操作系统: $OS"
}

# 解析工作区
parse_workspaces() {
    if [[ ! -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]]; then
        log_error "未找到工作区配置文件"
        return 1
    fi
    
    # 检查 apps 目录
    if [[ ! -d "$PROJECT_ROOT/apps" ]]; then
        log_error "未找到 apps 目录"
        return 1
    fi
    
    # 扫描 apps 目录下的子目录作为工作区
    local workspaces=()
    for dir in "$PROJECT_ROOT/apps"/*/; do
        if [[ -d "$dir" ]]; then
            local rel_path="${dir#$PROJECT_ROOT/apps/}"
            rel_path="${rel_path%/}"
            workspaces+=("$rel_path")
        fi
    done
    
    # 检查是否找到工作区
    if [[ ${#workspaces[@]} -eq 0 ]]; then
        log_error "未在 apps 目录下找到任何工作区"
        return 1
    fi
    
    # 初始化选择
    local selected_index=0
    local max_index=$((${#workspaces[@]}-1))
    
    # 设置当前步骤
    CURRENT_STEP=1
    
    # 显示工作区列表
    while true; do
        # 显示步骤状态
        show_steps
        
        # 打印工作区列表
        printf "%s%s选择当前项目工作区%s\n\n" "${BOLD}" "${CYAN}" "${NC}"
        
        for i in "${!workspaces[@]}"; do
            if [[ $i -eq $selected_index ]]; then
                printf "%s%s❯ %s%s\n" \
                    "${BOLD}" "${GREEN}" "${workspaces[$i]}" "${NC}"
            else
                printf "  %s%s%s\n" \
                    "${DIM}" "${workspaces[$i]}" "${NC}"
            fi
        done
        
        # 显示操作提示
        printf "\n%s%s使用上下箭头选择，回车确认，q键退出%s\n" \
            "${BOLD}" "${CYAN}" "${NC}"
    
        # 读取用户输入 - 统一处理方式
        local key_pressed=""
        local key
        read -r -n 1 key
        
        # 获取ASCII码用于调试
        if [[ -z "$key" ]]; then
            [[ "$DEBUG_MODE" == "true" ]] && printf "空字符，可能是回车键\n"
            key_pressed="ENTER"  # 空字符通常是回车键
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
                if [[ $selected_index -gt 0 ]]; then
                    selected_index=$((selected_index-1))
                else
                    # 如果已经是第一项，跳到最后一项
                    selected_index=$max_index
                fi
                ;;
            "DOWN")  # 下箭头
                if [[ $selected_index -lt $max_index ]]; then
                    selected_index=$((selected_index+1))
                else
                    # 如果已经是最后一项，回到第一项
                    selected_index=0
                fi
                ;;
            "ENTER")  # 回车
                SELECTED_WORKSPACE="${workspaces[$selected_index]}"
                STEP_WORKSPACE="$SELECTED_WORKSPACE"
                CURRENT_STEP=2
                return 0
                ;;
            "QUIT")  # 退出
                log_error "操作已取消"
                return 1
                ;;
        esac
    done
}

# 显示步骤状态
show_steps() {
    clear
    printf "\n%s%s项目同步向导%s\n\n" "${BOLD}" "${MAGENTA}" "${NC}"
    
    # 定义灰色文本样式，用于未到达的步骤
    local GRAY="${DIM}"
    
    # 步骤一：选择工作区
    if [[ $CURRENT_STEP -eq 1 ]]; then
        printf "%s%s▶ 第一步：选择工作区%s\n" "${BOLD}" "${GREEN}" "${NC}"
    elif [[ $CURRENT_STEP -gt 1 ]]; then
        printf "%s%s✓ 第一步：选择工作区%s %s- %s%s%s\n" \
            "${DIM}" "${GREEN}" "${NC}" \
            "${DIM}" "${CYAN}" "$STEP_WORKSPACE" "${NC}"
    else
        printf "%s%s○ 第一步：选择工作区%s\n" "${GRAY}" "${GRAY}" "${NC}"
    fi
    
    # 步骤二：选择Git仓库
    if [[ $CURRENT_STEP -eq 2 ]]; then
        printf "%s%s▶ 第二步：选择Git仓库%s\n" "${BOLD}" "${GREEN}" "${NC}"
    elif [[ $CURRENT_STEP -gt 2 ]]; then
        printf "%s%s✓ 第二步：选择Git仓库%s %s- %s%s%s\n" \
            "${DIM}" "${GREEN}" "${NC}" \
            "${DIM}" "${CYAN}" "$STEP_GIT_REPOS" "${NC}"
    else
        printf "%s%s○ 第二步：选择Git仓库%s\n" "${GRAY}" "${GRAY}" "${NC}"
    fi
    
    # 步骤三：选择同步方式
    if [[ $CURRENT_STEP -eq 3 ]]; then
        printf "%s%s▶ 第三步：选择同步方式%s\n" "${BOLD}" "${GREEN}" "${NC}"
    elif [[ $CURRENT_STEP -gt 3 ]]; then
        printf "%s%s✓ 第三步：选择同步方式%s %s- %s%s%s\n" \
            "${DIM}" "${GREEN}" "${NC}" \
            "${DIM}" "${CYAN}" "$STEP_SYNC_MODE" "${NC}"
    else
        printf "%s%s○ 第三步：选择同步方式%s\n" "${GRAY}" "${GRAY}" "${NC}"
    fi
    
    # 步骤四：执行同步
    if [[ $CURRENT_STEP -eq 4 ]]; then
        printf "%s%s▶ 第四步：执行同步%s\n" "${BOLD}" "${GREEN}" "${NC}"
    elif [[ $CURRENT_STEP -gt 4 ]]; then
        printf "%s%s✓ 第四步：执行同步%s\n" "${DIM}" "${GREEN}" "${NC}"
    else
        printf "%s%s○ 第四步：执行同步%s\n" "${GRAY}" "${GRAY}" "${NC}"
    fi
    
    # 分隔线
    printf "\n"
    show_separator
    printf "\n"
}

# 编译执行模块
build_workspace() {
    log_info "开始编译工作区: $SELECTED_WORKSPACE"
    
    # 切换到项目根目录
    cd "$PROJECT_ROOT" || {
        log_error "无法切换到项目根目录"
        return 1
    }
    
    # 执行编译命令
    log_info "执行编译命令: pnpm build --filter $SELECTED_WORKSPACE"
    if pnpm build --filter "$SELECTED_WORKSPACE"; then
        log_info "编译成功"
        return 0
    else
        log_error "编译失败"
        return 1
    fi
}

# 检查编译结果
check_build_result() {
    local workspace_path="$PROJECT_ROOT/apps/$SELECTED_WORKSPACE"
    local dist_path="$workspace_path/dist"
    
    if [[ ! -d "$dist_path" ]]; then
        log_error "未找到编译输出目录: $dist_path"
        return 1
    fi
    
    if [[ -z "$(ls -A "$dist_path")" ]]; then
        log_error "编译输出目录为空"
        return 1
    fi
    
    log_info "编译结果检查通过"
    return 0
}

# 并行编译功能
parallel_build_workspaces() {
    local workspaces=("$@")
    local pids=()
    local results=()
    
    # 检查参数
    if [[ ${#workspaces[@]} -eq 0 ]]; then
        log_error "未指定工作区"
        return 1
    fi
    
    log_info "开始并行编译 ${#workspaces[@]} 个工作区..."
    
    # 为每个工作区启动编译进程
    for workspace in "${workspaces[@]}"; do
        (
            log_info "开始编译工作区: $workspace"
            if pnpm build --filter "$workspace"; then
                echo "$workspace|success" > "/tmp/build_${workspace}.result"
            else
                echo "$workspace|failed" > "/tmp/build_${workspace}.result"
            fi
        ) &
        pids+=($!)
    done
    
    # 等待所有编译进程完成
    for pid in "${pids[@]}"; do
        wait "$pid" || {
            log_error "编译进程异常退出"
            return 1
        }
    done
    
    # 收集编译结果
    local success=true
    for workspace in "${workspaces[@]}"; do
        if [[ -f "/tmp/build_${workspace}.result" ]]; then
            local result=$(cat "/tmp/build_${workspace}.result")
            local status=$(echo "$result" | cut -d'|' -f2)
            if [[ "$status" == "failed" ]]; then
                log_error "工作区 $workspace 编译失败"
                success=false
            else
                log_info "工作区 $workspace 编译成功"
            fi
            rm -f "/tmp/build_${workspace}.result"
        else
            log_error "工作区 $workspace 编译结果文件丢失"
            success=false
        fi
    done
    
    if [[ "$success" == "true" ]]; then
        log_info "所有工作区编译完成"
        return 0
    else
        log_error "部分工作区编译失败"
        return 1
    fi
}

# 显示选项列表
show_option_list() {
    local title="$1"
    shift
    local selected_index="${!#}"  # 取最后一个参数
    local items=("${@:1:$(($#-1))}")  # 除最后一个参数外的所有参数
    local padding=2           # 选中标识的宽度
    
    # 显示标题
    show_title "$title"
    printf "%s%s%s\n" "${DIM}" "使用方向键选择，回车确认，q 退出" "${NC}"
    show_separator

    # 显示列表
    for i in "${!items[@]}"; do
        if [[ $i -eq $selected_index ]]; then
            # 选中项：使用固定宽度的选中标识
            printf "%s%s%s%*s%s%s%s\n" \
                "${BOLD}" "${CYAN}" "❯" \
                "$padding" "" \
                "${GREEN}" "${items[$i]}" "${NC}"
        else
            # 未选中项：使用相同的缩进保持对齐
            printf "%*s%s%s%s\n" \
                "$((padding + 1))" "" \
                "${DIM}" "${items[$i]}" "${NC}"
        fi
    done
    
    show_separator
}

# 显示多选列表
show_multi_select_list() {
    local title="$1"
    shift
    
    local items=()
    local i=0
    # 收集所有项目，直到遇到特殊标记 "--INDICES--"
    while [[ $i -lt $# && "$1" != "--INDICES--" ]]; do
        items+=("$1")
        shift
        ((i++))
    done
    
    shift  # 跳过 "--INDICES--" 标记
    local selected_indices=($@)  # 剩余的参数都是选中的索引
    local selected_index="${selected_indices[0]}"  # 第一个是当前光标位置
    
    # 移除当前索引，只保留选中项索引
    selected_indices=("${selected_indices[@]:1}")
    
    local padding=2  # 选中标识的宽度
    
    # 显示标题
    show_title "$title"
    printf "%s%s%s\n" "${DIM}" "使用数字键1选中/0取消，回车确认，q 退出" "${NC}"
    show_separator
    
    # 显示列表
    for i in "${!items[@]}"; do
        # 检查当前索引是否在选中列表中
        local is_selected=false
        for sel_idx in "${selected_indices[@]}"; do
            if [[ $i -eq $sel_idx ]]; then
                is_selected=true
                break
            fi
        done
        
        if [[ $i -eq $selected_index ]]; then
            # 当前光标位置项 - 使用青色箭头标识
            if [[ "$is_selected" == "true" ]]; then
                # 选中项 - 绿色文本，带复选框
                printf "%s%s%s%*s%s%s%s\n" \
                    "${BOLD}" "${CYAN}" "❯" \
                    "$padding" "" \
                    "${GREEN}" "[✓] ${items[$i]}" "${NC}"
            else
                # 未选中项 - 灰色文本，不带复选框
                printf "%s%s%s%*s%s%s%s\n" \
                    "${BOLD}" "${CYAN}" "❯" \
                    "$padding" "" \
                    "${DIM}" "[ ] ${items[$i]}" "${NC}"
            fi
        else
            # 非当前光标位置项
            if [[ "$is_selected" == "true" ]]; then
                # 选中项 - 绿色文本，带复选框
                printf "%*s%s%s%s\n" \
                    "$((padding + 1))" "" \
                    "${GREEN}" "[✓] ${items[$i]}" "${NC}"
            else
                # 未选中项 - 灰色文本，不带复选框
                printf "%*s%s%s%s\n" \
                    "$((padding + 1))" "" \
                    "${DIM}" "[ ] ${items[$i]}" "${NC}"
            fi
        fi
    done
    
    show_separator
}

# 显示帮助信息
show_help() {
    show_title "使用帮助"
    printf "%s%s用法:%s %s [选项]\n\n" "${BOLD}" "${GREEN}" "${NC}" "$0"
    printf "%s%s选项:%s\n" "${BOLD}" "${BLUE}" "${NC}"
    printf "  %s-w, --workspace%s WORKSPACE    %s指定工作区%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s-t, --target%s DIR            %s指定目标 Git 仓库路径%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s-b, --branch%s BRANCH         %s指定分支名称%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s-s, --sync-structure%s        %s同步项目结构%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s-p, --parallel%s              %s并行编译%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s-d, --dry-run%s               %s干运行模式%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s--debug%s                     %s调试模式（显示详细日志）%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    printf "  %s-h, --help%s                  %s显示帮助信息%s\n" "${GREEN}" "${NC}" "${CYAN}" "${NC}"
    
    show_separator
}

# 命令行参数解析
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -w|--workspace)
                SELECTED_WORKSPACE="$2"
                shift 2
                ;;
            -t|--target)
                TARGET_GIT_DIR="$2"
                shift 2
                ;;
            -b|--branch)
                BRANCH="$2"
                shift 2
                ;;
            -s|--sync-structure)
                SYNC_STRUCTURE=true
                shift
                ;;
            -p|--parallel)
                PARALLEL_BUILD=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --debug)
                DEBUG_MODE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 初始化插件目录
init_plugins() {
    if [[ -z "$PLUGINS_DIR" ]]; then
        log_error "插件目录未初始化，请确保已找到项目根目录"
        return 1
    fi
    
    if [[ ! -d "$PLUGINS_DIR" ]]; then
        mkdir -p "$PLUGINS_DIR" || {
            log_error "创建插件目录失败: $PLUGINS_DIR"
            return 1
        }
        log_info "已创建插件目录: $PLUGINS_DIR"
    fi
}

# 加载插件
load_plugins() {
    if [[ -z "$PLUGINS_DIR" ]]; then
        log_error "插件目录未初始化，请确保已找到项目根目录"
        return 1
    fi
    
    if [[ -d "$PLUGINS_DIR" ]]; then
        for plugin in "$PLUGINS_DIR"/*.sh; do
            if [[ -f "$plugin" ]]; then
                if ! source "$plugin"; then
                    log_error "加载插件失败: $(basename "$plugin")"
                    continue
                fi
                log_info "已加载插件: $(basename "$plugin")"
            fi
        done
    fi
}

# 插件钩子函数
run_hook() {
    local hook_name="$1"
    shift
    
    # 检查是否存在对应的钩子函数
    if declare -F "hook_${hook_name}" > /dev/null; then
        "hook_${hook_name}" "$@"
    fi
}

# 导出函数
export -f check_dependencies
export -f detect_os
export -f parse_workspaces
export -f show_steps
export -f build_workspace
export -f check_build_result
export -f parallel_build_workspaces
export -f show_option_list
export -f show_multi_select_list
export -f show_help
export -f parse_args
export -f init_plugins
export -f load_plugins
export -f run_hook 