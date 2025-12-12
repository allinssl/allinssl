#!/usr/bin/env bash

#######################################
# Turborepo工作区编译部署自动化工具
# 
# 这是一款基于纯Shell脚本开发的自动化工具，用于Turborepo项目的
# 应用工作区扫描、编译及Git同步。支持跨平台操作，可在Windows、
# macOS和Linux系统上稳定运行。
#
# 作者: chudong
# 版本: 1.1.0
#######################################

# 设置严格模式
set -e

# 避免变量名冲突，重命名为唯一的名称
SYNC_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 导入工具脚本
source "$SYNC_SCRIPT_DIR/tools/git-handle.sh"
source "$SYNC_SCRIPT_DIR/tools/file-handle.sh"
source "$SYNC_SCRIPT_DIR/tools/notice-handle.sh"
source "$SYNC_SCRIPT_DIR/tools/other-handle.sh"

# 全局变量
SYNC_DIR=".sync"
SYNC_CONFIG="$SYNC_DIR/sync-config.yaml"
HISTORY_FILE="$SYNC_DIR/history"
GIT_SYNC_DIR="$SYNC_DIR/git-repos"
# 禁用插件扩展
# PLUGINS_DIR="$SYNC_DIR/plugins"
CONFIG_LOADED="false"
ENVIRONMENT_CHECKED="false"

# 配置变量
# 禁用并行编译模式
# CONFIG_PARALLEL_BUILD="false"
# 禁用干运行模式
# CONFIG_DRY_RUN="false"

#######################################
# 初始化工具环境
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
init_environment() {
  # 避免重复初始化环境
  if [ "$ENVIRONMENT_CHECKED" = "true" ]; then
    return 0
  fi

  notice_info "正在初始化环境..."
  
  # 检查系统环境
  check_environment
  
  # 检查工作区
  check_workspace "package.json" "pnpm-workspace.yaml" "turbo.json"
  if [ $? -ne 0 ]; then
    notice_error "必须在Turborepo项目根目录下运行此脚本"
    return 1
  fi
  
  # 检查依赖工具
  check_command_dependency "pnpm" || return 1
  check_command_dependency "git" || return 1
  
  # 确保YQ_PATH变量已设置
  if [ -z "$YQ_PATH" ]; then
    check_yq_dependency || notice_warning "未安装yq工具，部分功能可能受限"
  fi
  
  # 创建必要的目录结构 - 全部移至.sync目录
  if [ ! -d "$WORKSPACE_ROOT/$SYNC_DIR" ]; then
    notice_info "创建同步配置目录..."
    create_directory "$WORKSPACE_ROOT/$SYNC_DIR"
  fi
  
  if [ ! -d "$WORKSPACE_ROOT/$GIT_SYNC_DIR" ]; then
    notice_info "创建Git同步目录..."
    create_directory "$WORKSPACE_ROOT/$GIT_SYNC_DIR"
  fi
  
  # 禁用插件目录创建
  # if [ ! -d "$WORKSPACE_ROOT/$PLUGINS_DIR" ]; then
  #   notice_info "创建插件目录..."
  #   create_directory "$WORKSPACE_ROOT/$PLUGINS_DIR"
  # fi
  
  # 初始化配置文件
  if [ ! -f "$WORKSPACE_ROOT/$SYNC_CONFIG" ]; then
    init_config_file
  fi
  
  # 初始化历史记录文件
  if [ ! -f "$WORKSPACE_ROOT/$HISTORY_FILE" ]; then
    create_file "$WORKSPACE_ROOT/$HISTORY_FILE"
  fi
  
  ENVIRONMENT_CHECKED="true"
  notice_success "环境初始化完成"
  return 0
}

#######################################
# 检查命令是否可用
# 参数:
#   $1: 命令名称
# 返回值:
#   0 - 命令可用
#   1 - 命令不可用
#######################################
check_command_dependency() {
  local cmd="$1"
  
  if ! command -v "$cmd" &> /dev/null; then
    notice_error "未找到命令: $cmd"
    return 1
  fi
  
  notice_success "命令检查通过: $cmd"
  return 0
}

#######################################
# 初始化配置文件
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
init_config_file() {
  notice_info "初始化配置文件..."
  
  local config_content="# 工具配置
config:
  # 禁用并行编译
  # parallel_build: false  # 是否并行编译
  # 禁用干运行
  # dry_run: false  # 是否干运行

# 工作区配置
workspaces:
  # 示例工作区配置
  # app-name:
  #   sync_mappings: 
  #     - git:
  #         url: \"https://github.com/user/repo.git\"  # Git 仓库地址
  #         branch: \"main\"  # 分支名称
  #         alias: \"repo-name\"  # 仓库别名（可选）
  #         sync: [\"/dist\", \"/build\"]  # 要同步的目录列表
  #         source: false  # 是否同步源码
"
  
  write_file_content "$WORKSPACE_ROOT/$SYNC_CONFIG" "$config_content" "force"
  
  if [ $? -eq 0 ]; then
    notice_success "配置文件已初始化"
    return 0
  else
    notice_error "配置文件初始化失败"
    return 1
  fi
}

#######################################
# 扫描所有工作区
# 返回值:
#   0 - 成功
#   1 - 失败
# 全局变量:
#   WORKSPACES - 包含所有工作区路径的数组
#   DISPLAY_NAMES - 用于显示的工作区名称（移除apps/前缀）
#######################################
scan_workspaces() {
  notice_info "扫描/apps目录下的应用工作区..."
  
  local apps_dir="$WORKSPACE_ROOT/apps"
  
  if [ ! -d "$apps_dir" ]; then
    notice_error "未找到apps目录: $apps_dir"
    return 1
  fi
  
  # 清空工作区数组
  WORKSPACES=()
  DISPLAY_NAMES=()
  
  # 直接扫描apps目录下的所有子目录
  for dir in $(find "$apps_dir" -maxdepth 1 -mindepth 1 -type d -not -path "*/node_modules/*" -not -path "*/.*/*"); do
    if [ -f "$dir/package.json" ]; then
      # 添加完整路径（相对于工作区根目录）
      local full_path="${dir#$WORKSPACE_ROOT/}"
      WORKSPACES+=("$full_path")
      
      # 添加没有apps/前缀的显示名称
      local display_name="${full_path#apps/}"
      DISPLAY_NAMES+=("$display_name")
    fi
  done
  
  if [ ${#WORKSPACES[@]} -eq 0 ]; then
    notice_warning "未在apps目录下找到应用工作区"
    return 1
  fi
  
  notice_success "在apps目录下找到 ${#WORKSPACES[@]} 个应用工作区"
  for i in "${!WORKSPACES[@]}"; do
    notice_info "  - ${DISPLAY_NAMES[$i]}"
  done
  
  return 0
}

#######################################
# 加载配置文件
# 返回值:
#   0 - 成功
#   1 - 失败
# 全局变量:
#   CONFIG_DRY_RUN - 是否干运行模式
#######################################
load_config() {
  # 避免重复加载配置
  if [ "$CONFIG_LOADED" = "true" ]; then
    return 0
  fi
  
  notice_info "加载配置文件..."
  
  local config_file="$WORKSPACE_ROOT/$SYNC_CONFIG"
  
  if [ ! -f "$config_file" ]; then
    notice_error "配置文件不存在: $config_file"
    return 1
  fi
  
  # 确保yq可用
  if [ -z "$YQ_PATH" ]; then
    check_yq_dependency || return 1
  fi
  
  # 加载基本配置
  # 禁用并行编译设置加载
  # CONFIG_PARALLEL_BUILD=$("$YQ_PATH" e '.config.parallel_build // false' "$config_file")
  # 禁用干运行设置加载
  # CONFIG_DRY_RUN=$("$YQ_PATH" e '.config.dry_run // false' "$config_file")
  
  # 标记配置已加载
  CONFIG_LOADED="true"
  
  notice_success "配置文件加载完成"
  
  # 显示当前配置
  notice_info "当前配置:"
  # notice_info "  - 并行编译: $CONFIG_PARALLEL_BUILD"
  # notice_info "  - 干运行模式: $CONFIG_DRY_RUN"
  
  return 0
}

#######################################
# 选择工作区
# 返回值:
#   0 - 成功
#   1 - 失败
# 全局变量:
#   SELECTED_WORKSPACES - 存储用户选择的工作区
#######################################
select_workspaces() {
  notice_info "请选择要操作的工作区:"
  
  SELECTED_WORKSPACES=()
  local selected_index
  
  # 使用没有apps/前缀的显示名称展示选项
  notice_select_menu "选择要编译和同步的工作区" "selected_index" "${DISPLAY_NAMES[@]}"
  
  if [ $? -ne 0 ]; then
    notice_error "工作区选择被取消"
    return 1
  fi
  
  # 添加选择的工作区（使用完整路径）
  SELECTED_WORKSPACES+=("${WORKSPACES[$selected_index]}")
  # 使用没有apps/前缀的显示名称展示选项
  notice_success "已选择工作区: ${DISPLAY_NAMES[$selected_index]}"
  
  return 0
}

#######################################
# 编译工作区
# 参数:
#   $1: 工作区名称
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
build_workspace() {
  local workspace="$1"
  
  notice_info "正在编译工作区: $workspace..."
  
  # 检查是否为干运行模式
  # if [ "$CONFIG_DRY_RUN" = "true" ]; then
  #   notice_info "干运行模式：跳过实际编译"
  #   return 0
  # fi
  
  # 执行编译命令
  (cd "$WORKSPACE_ROOT" && pnpm --filter "$workspace" build)
  
  if [ $? -eq 0 ]; then
    notice_success "工作区 $workspace 编译成功"
    
    # 记录到历史文件
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 编译工作区 $workspace 成功" >> "$WORKSPACE_ROOT/$HISTORY_FILE"
    
    return 0
  else
    notice_error "工作区 $workspace 编译失败"
    
    # 记录到历史文件
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 编译工作区 $workspace 失败" >> "$WORKSPACE_ROOT/$HISTORY_FILE"
    
    return 1
  fi
}

#######################################
# 同步工作区到Git仓库
# 参数:
#   $1: 工作区名称
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
sync_workspace() {
  local workspace="$1"
  
  notice_info "正在同步工作区: $workspace..."
  
  # 确保配置已加载
  if [ "$CONFIG_LOADED" != "true" ]; then
    load_config || return 1
  fi
  
  # 确保yq可用
  if [ -z "$YQ_PATH" ]; then
    check_yq_dependency || return 1
  fi
  
  # 获取工作区配置
  local sync_mappings_count
  sync_mappings_count=$("$YQ_PATH" e ".workspaces.$workspace.sync_mappings | length // 0" "$WORKSPACE_ROOT/$SYNC_CONFIG")
  
  if [ "$sync_mappings_count" -eq 0 ]; then
    notice_warning "工作区 $workspace 没有同步映射配置"
    return 1
  fi
  
  # 遍历所有同步映射
  for i in $(seq 0 $((sync_mappings_count - 1))); do
    local git_url
    local branch
    local alias
    local sync_dirs
    local sync_source
    
    git_url=$("$YQ_PATH" e ".workspaces.$workspace.sync_mappings[$i].git.url" "$WORKSPACE_ROOT/$SYNC_CONFIG")
    branch=$("$YQ_PATH" e ".workspaces.$workspace.sync_mappings[$i].git.branch // \"main\"" "$WORKSPACE_ROOT/$SYNC_CONFIG")
    alias=$("$YQ_PATH" e ".workspaces.$workspace.sync_mappings[$i].git.alias // \"\"" "$WORKSPACE_ROOT/$SYNC_CONFIG")
    sync_dirs=$("$YQ_PATH" e ".workspaces.$workspace.sync_mappings[$i].git.sync | join(\",\")" "$WORKSPACE_ROOT/$SYNC_CONFIG")
    sync_source=$("$YQ_PATH" e ".workspaces.$workspace.sync_mappings[$i].git.source // false" "$WORKSPACE_ROOT/$SYNC_CONFIG")
    
    # 如果alias为空，从git_url生成
    if [ -z "$alias" ]; then
      alias=$(basename "$git_url" .git)
    fi
    
    notice_info "正在处理同步映射: $git_url -> $branch (别名: $alias)"
    
    # 准备Git仓库
    local git_repo_path="$WORKSPACE_ROOT/$GIT_SYNC_DIR/$alias"
    
    if [ ! -d "$git_repo_path" ]; then
      notice_info "克隆Git仓库: $git_url"
      
      # 禁用干运行判断
      # if [ "$CONFIG_DRY_RUN" = "true" ]; then
      #   notice_info "干运行模式：跳过实际克隆"
      # else
        git clone "$git_url" -b "$branch" "$git_repo_path"
        
        if [ $? -ne 0 ]; then
          notice_error "克隆仓库失败: $git_url"
          continue
        fi
      # fi
    else
      # 确认是正确的仓库
      local remote_url
      remote_url=$(cd "$git_repo_path" && git config --get remote.origin.url)
      
      if [ "$remote_url" != "$git_url" ]; then
        notice_warning "仓库URL不匹配，预期: $git_url, 实际: $remote_url"
        
        notice_confirm "是否要重置仓库URL?" "n"
        if [ $? -eq 0 ]; then
          # 禁用干运行判断
          # if [ "$CONFIG_DRY_RUN" = "true" ]; then
          #   notice_info "干运行模式：跳过URL重置"
          # else
            (cd "$git_repo_path" && git remote set-url origin "$git_url")
          # fi
        else
          notice_error "由于URL不匹配，跳过同步"
          continue
        fi
      fi
      
      # 拉取最新代码
      notice_info "拉取最新代码: $branch"
      
      # 禁用干运行判断
      # if [ "$CONFIG_DRY_RUN" = "true" ]; then
      #   notice_info "干运行模式：跳过实际拉取"
      # else
        git_pull "$git_repo_path" "$branch"
        
        if [ $? -ne 0 ]; then
          notice_warning "拉取代码失败，尝试继续同步"
        fi
      # fi
    fi
    
    # 同步目录列表
    IFS=',' read -ra dirs <<< "$sync_dirs"
    
    # 同步每个指定的目录
    for dir in "${dirs[@]}"; do
      # 去除前导斜杠
      dir="${dir#/}"
      
      # 复制编译结果到Git仓库
      local source_dir="$WORKSPACE_ROOT/$workspace/$dir"
      local target_dir="$git_repo_path/$dir"
      
      if [ ! -d "$source_dir" ]; then
        notice_warning "源目录不存在: $source_dir"
        continue
      fi
      
      notice_info "同步目录: $source_dir -> $target_dir"
      
      # 禁用干运行判断
      # if [ "$CONFIG_DRY_RUN" = "true" ]; then
      #   notice_info "干运行模式：跳过实际复制"
      # else
        # 确保目标目录存在
        if [ ! -d "$target_dir" ]; then
          create_directory "$target_dir"
        else
          # 清空目标目录
          notice_info "清空目标目录: $target_dir"
          rm -rf "$target_dir"/*
        fi
        
        # 复制文件
        cp -r "$source_dir"/* "$target_dir"/
        
        if [ $? -ne 0 ]; then
          notice_error "复制文件失败"
          continue
        fi
      # fi
    done
    
    # 如果需要同步源代码
    if [ "$sync_source" = "true" ]; then
      notice_info "同步源代码..."
      
      # 禁用干运行判断
      # if [ "$CONFIG_DRY_RUN" = "true" ]; then
      #   notice_info "干运行模式：跳过源代码同步"
      # else
        # 复制源代码（除了node_modules和构建目录）
        rsync -av --exclude node_modules --exclude .git --exclude dist --exclude build \
          "$WORKSPACE_ROOT/$workspace/" "$git_repo_path/"
        
        if [ $? -ne 0 ]; then
          notice_error "源代码同步失败"
        else
          notice_success "源代码同步成功"
        fi
      # fi
    fi
    
    # 提交更改
    notice_info "提交更改到Git仓库"
    
    # 禁用干运行判断
    # if [ "$CONFIG_DRY_RUN" = "true" ]; then
    #   notice_info "干运行模式：跳过提交和推送"
    # else
      local commit_message="自动同步: $workspace 工作区 - $(date '+%Y-%m-%d %H:%M:%S')"
      
      (cd "$git_repo_path" && git add .)
      git_commit "$git_repo_path" "$commit_message"
      
      # 即使没有变更需要提交，也尝试推送
      git_push "$git_repo_path" "$branch"
      
      if [ $? -eq 0 ]; then
        notice_success "同步工作区 $workspace 到 $git_url 成功"
        
        # 记录到历史文件
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 同步工作区 $workspace 到 $git_url 成功" >> "$WORKSPACE_ROOT/$HISTORY_FILE"
      else
        notice_error "推送更改失败"
        
        # 记录到历史文件
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 同步工作区 $workspace 到 $git_url 失败" >> "$WORKSPACE_ROOT/$HISTORY_FILE"
        
        continue
      fi
    # fi
  done
  
  return 0
}

#######################################
# 处理命令行参数
# 参数:
#   $@: 命令行参数
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
parse_args() {
  # 解析命令行参数
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      # 禁用并行编译选项
      # --parallel|-p)
      #   CONFIG_PARALLEL_BUILD="true"
      #   ;;
      # 禁用干运行选项
      # --dry-run|-d)
      #   CONFIG_DRY_RUN="true"
      #   ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        notice_error "未知参数: $1"
        show_help
        return 1
        ;;
    esac
    shift
  done
  
  return 0
}

#######################################
# 显示帮助信息
#######################################
show_help() {
  echo "用法: sync-project.sh [选项]"
  echo ""
  echo "选项:"
  # echo "  --parallel, -p     启用并行编译"
  # echo "  --dry-run, -d      干运行模式，不执行实际操作"
  echo "  --help, -h         显示此帮助信息"
  echo ""
  echo "示例:"
  # echo "  ./sync-project.sh -p         # 启用并行编译"
  # echo "  ./sync-project.sh --dry-run  # 干运行模式"
}

#######################################
# 显示历史记录
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
show_history() {
  local history_file="$WORKSPACE_ROOT/$HISTORY_FILE"
  
  if [ ! -f "$history_file" ]; then
    notice_warning "历史记录文件不存在"
    return 1
  fi
  
  notice_info "最近的操作历史:"
  
  # 显示最后10条记录
  tail -n 10 "$history_file"
  
  return 0
}

#######################################
# 主函数
# 参数:
#   $@: 命令行参数
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
main() {
  notice_info "欢迎使用 Turborepo 工作区编译部署自动化工具"
  
  # 解析命令行参数
  parse_args "$@"
  
  # 初始化环境（只运行一次）
  init_environment || exit 1
  
  # 加载配置（只运行一次）
  load_config || exit 1
  
  # 扫描工作区
  scan_workspaces || exit 1
  
  # 选择工作区
  select_workspaces || exit 1
  
  # 编译和同步选中的工作区
  for workspace in "${SELECTED_WORKSPACES[@]}"; do
    # 禁用并行模式
    # if [ "$CONFIG_PARALLEL_BUILD" = "true" ]; then
    #   # 并行模式
    #   build_workspace "$workspace" && sync_workspace "$workspace" &
    # else
      # 顺序模式
      build_workspace "$workspace" && sync_workspace "$workspace"
    # fi
  done
  
  # 禁用并行模式等待
  # if [ "$CONFIG_PARALLEL_BUILD" = "true" ]; then
  #   wait
  # fi
  
  # 显示操作历史
  show_history
  
  notice_success "所有操作完成"
  return 0
}

# 执行主函数
main "$@"
