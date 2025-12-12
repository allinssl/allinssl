#!/bin/bash

# ===================================================
# 项目同步脚本 - sync-project.sh
# 用于同步 Turborepo 项目工作区的编译结果到 Git 仓库
# ===================================================

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 全局变量
PROJECT_ROOT="" # 项目根目录
SELECTED_WORKSPACE="" # 选中的工作区
PARALLEL_BUILD=false # 是否并行编译
DRY_RUN=false # 是否干运行
OS="" # 操作系统类型
DEBUG_MODE=false # 调试模式

# 相关文件和目录变量（初始化为空，后续赋值）
SYNC_DIR="" # 同步配置目录
GIT_DIR="" # Git 仓库目录
SYNC_CONFIG_FILE="" # 同步配置文件
HISTORY_FILE="" # 历史记录文件
PLUGINS_DIR="" # 插件目录
WORKSPACE_CONFIG_DIR="" # 工作区配置目录

# 步骤状态变量
CURRENT_STEP=1
STEP_WORKSPACE=""
STEP_GIT_REPOS=""
STEP_SYNC_MODE=""

# 操作历史相关
MAX_HISTORY=10

# 加载拆分后的脚本
source "$SCRIPT_DIR/file-operations.sh"
source "$SCRIPT_DIR/git-operations.sh"
source "$SCRIPT_DIR/build-operations.sh"

# 主函数
main() {
    # 检查参数
    if [[ $# -gt 0 ]]; then
        for arg in "$@"; do
            if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
                show_help
                exit 0
            fi
        done
    fi
    
    # 初始化
    detect_os
    check_dependencies  # 检查依赖，包括 yq
    
    # 首先查找项目根目录
    find_project_root || exit 1
    
    # 初始化同步目录结构
    init_sync_dirs || exit 1
    
    # 在找到项目根目录后，初始化插件系统
    init_plugins
    load_plugins
    
    # 读取配置
    read_config
    
    # 解析命令行参数
    parse_args "$@"
    
    # 运行前置钩子
    run_hook "pre_main"
    
    # 如果是干运行模式，只显示将要执行的操作
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "干运行模式 - 将显示将要执行的操作"
        log_info "工作区: $SELECTED_WORKSPACE"
        log_info "并行编译: $PARALLEL_BUILD"
        exit 0
    fi
    
    # 解析工作区（如果未通过参数指定）
    if [[ -z "$SELECTED_WORKSPACE" ]]; then
        parse_workspaces || {
            log_error "工作区选择失败"
            exit 1
        }
    fi
    
    # 验证工作区是否有效
    if [[ -z "$SELECTED_WORKSPACE" ]]; then
        log_error "未选择有效的工作区"
        exit 1
    fi
    
    # 验证工作区目录是否存在
    if [[ ! -d "$PROJECT_ROOT/apps/$SELECTED_WORKSPACE" ]]; then
        log_error "工作区目录不存在: $PROJECT_ROOT/apps/$SELECTED_WORKSPACE"
        exit 1
    fi
    
    log_info "当前选择的工作区: $SELECTED_WORKSPACE"
    
    # 编译工作区
    build_workspace || {
        log_error "编译失败"
        exit 1
    }
    
    # 检查编译结果
    check_build_result || {
        log_error "编译结果检查失败"
        exit 1
    }
    
    # 选择 Git 项目目录
    select_git_dirs || {
        log_error "Git 仓库选择失败"
        exit 1
    }
    
    # 询问是否同步源码
    show_title "同步选项"
    printf "%s%s%s\n" "${DIM}" "选择要执行的操作" "${NC}"
    show_separator
    
    local sync_options=(
        "仅同步编译结果"
        "同步编译结果和源码"
    )
    
    local selected_index=0
    local max_index=$((${#sync_options[@]}-1))
    local padding=2
    
    # 设置当前步骤
    CURRENT_STEP=3
    
    while true; do
        # 显示步骤状态
        show_steps
        
        # 显示选项列表标题
        printf "%s%s选择同步方式%s\n\n" "${BOLD}" "${CYAN}" "${NC}"
        
        # 显示同步选项
        for i in "${!sync_options[@]}"; do
            if [[ $i -eq $selected_index ]]; then
                printf "%s%s❯ %s%s\n" \
                    "${BOLD}" "${GREEN}" "${sync_options[$i]}" "${NC}"
            else
                printf "  %s%s%s\n" \
                    "${DIM}" "${sync_options[$i]}" "${NC}"
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
                "")  # 回车键
                    key_pressed="ENTER"
                    ;;
                *)  # 其他按键
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
                case $selected_index in
                    0)  # 仅同步编译结果
                        STEP_SYNC_MODE="仅同步编译结果"
                        CURRENT_STEP=4
                        sync_files || {
                            log_error "同步编译结果失败"
                            exit 1
                        }
                        ;;
                    1)  # 同步编译结果和源码
                        STEP_SYNC_MODE="同步编译结果和源码"
                        CURRENT_STEP=4
                        sync_files || {
                            log_error "同步编译结果失败"
                            exit 1
                        }
                        sync_source_code || {
                            log_error "同步源码失败"
                            exit 1
                        }
                        ;;
                esac
                break
                ;;
            "QUIT")  # 退出
                log_error "操作已取消"
                exit 1
                ;;
        esac
    done
    
    # 运行工作区选择后钩子
    run_hook "post_workspace_select" "$SELECTED_WORKSPACE"
    
    # 设置当前步骤
    CURRENT_STEP=4
    
    # 显示当前步骤
    show_steps
    printf "%s%s正在执行同步操作，请稍候...%s\n\n" "${BOLD}" "${CYAN}" "${NC}"
    
    # 准备 Git 仓库
    for mapping in "${SYNC_MAPPINGS[@]}"; do
        IFS='|' read -r git_url branch sync_dir git_dir alias <<< "$mapping"
        prepare_git_repo "$git_url" "$branch" "$alias" || {
            log_error "准备 Git 仓库失败"
            exit 1
        }
    done
    
    # 提交和推送
    for mapping in "${SYNC_MAPPINGS[@]}"; do
        IFS='|' read -r git_url branch sync_dir git_dir alias <<< "$mapping"
        local repo_dir="$GIT_DIR/${alias:-$(basename "$git_url" .git)}"
        cd "$repo_dir" || {
            log_error "无法切换到 Git 仓库目录"
            exit 1
        }
        
        commit_changes || {
            log_error "提交更改失败"
            exit 1
        }
        
        push_changes || {
            log_error "推送更改失败"
            exit 1
        }
    done
    
    # 保存配置
    save_config || log_warn "保存配置失败，但操作已完成"
    
    # 记录操作历史
    record_history "同步工作区 $SELECTED_WORKSPACE"
    
    # 运行完成钩子
    run_hook "post_main"
    
    # 设置最后步骤状态，显示完成
    CURRENT_STEP=5
    show_steps
    printf "%s%s所有操作已完成！%s\n" "${BOLD}" "${GREEN}" "${NC}"
}

# 执行主函数
main "$@"