#!/bin/bash

#######################################
# Git操作处理脚本
# 
# 此脚本提供了一系列与Git操作相关的函数，包括仓库检查、
# 代码拉取推送、分支管理、标签管理、日志查看等Git常用
# 操作的封装，使Git操作更加便捷和安全。
#
# 作者: chudong
# 版本: 1.0.0
#######################################

# 导入通知处理脚本
GIT_TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$GIT_TOOL_DIR/notice-handle.sh"

#######################################
# 检查是否为Git项目
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 是Git项目
#   1 - 不是Git项目
#######################################
check_git_repository() {
  local repo_path="${1:-.}"
  
  if [ ! -d "$repo_path" ]; then
    notice_error "路径 '$repo_path' 不存在或不是一个目录"
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到指定目录
  cd "$repo_path" || return 1
  
  # 检查是否存在.git目录
  if [ -d ".git" ] || git rev-parse --git-dir > /dev/null 2>&1; then
    cd "$current_dir"
    notice_success "'$repo_path' 是一个有效的Git仓库"
    return 0
  else
    cd "$current_dir"
    notice_error "'$repo_path' 不是一个Git仓库"
    return 1
  fi
}

#######################################
# 拉取Git项目更新
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 分支名称，默认为当前分支
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_pull() {
  local repo_path="${1:-.}"
  local branch="$2"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 如果没有指定分支，则拉取当前分支
  if [ -z "$branch" ]; then
    notice_info "拉取当前分支的最新代码..."
    git pull
  else
    notice_info "拉取 '$branch' 分支的最新代码..."
    git pull origin "$branch"
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "Git拉取成功"
    cd "$current_dir"
    return 0
  else
    notice_error "Git拉取失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 推送Git项目变更
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 分支名称，默认为当前分支
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_push() {
  local repo_path="${1:-.}"
  local branch="$2"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 如果没有指定分支，则推送当前分支
  if [ -z "$branch" ]; then
    # 获取当前分支名称
    local current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
    if [ -z "$current_branch" ]; then
      notice_error "无法获取当前分支名称"
      cd "$current_dir"
      return 1
    fi
    
    notice_info "推送到当前分支 '$current_branch'..."
    git push origin "$current_branch"
  else
    notice_info "推送到 '$branch' 分支..."
    git push origin "$branch"
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "Git推送成功"
    cd "$current_dir"
    return 0
  else
    notice_error "Git推送失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 提交Git变更
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 提交信息
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_commit() {
  local repo_path="${1:-.}"
  local commit_message="$2"
  
  if [ -z "$commit_message" ]; then
    notice_error "请提供提交信息"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 检查是否有变更需要提交
  if ! git diff --quiet || ! git diff --staged --quiet; then
    # 添加所有变更
    git add .
    
    # 提交变更
    git commit -m "$commit_message"
    
    if [ $? -eq 0 ]; then
      notice_success "Git提交成功: $commit_message"
      cd "$current_dir"
      return 0
    else
      notice_error "Git提交失败"
      cd "$current_dir"
      return 1
    fi
  else
    notice_warning "没有变更需要提交"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 获取Git提交记录日志
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 记录数量，默认为10
#   $3: 格式化输出格式，默认为 "%h - %an, %ar : %s"
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: Git日志信息
#######################################
git_log() {
  local repo_path="${1:-.}"
  local count="${2:-10}"
  local format="${3:-%h - %an, %ar : %s}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  notice_info "获取最近 $count 条提交记录:"
  git log -n "$count" --pretty=format:"$format"
  
  if [ $? -eq 0 ]; then
    cd "$current_dir"
    return 0
  else
    notice_error "获取Git提交记录失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 创建Git分支
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 新分支名称
#   $3: 基于的分支名称，默认为当前分支
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_create_branch() {
  local repo_path="${1:-.}"
  local new_branch="$2"
  local base_branch="$3"
  
  if [ -z "$new_branch" ]; then
    notice_error "请提供新分支名称"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 如果没有指定基础分支，则基于当前分支创建
  if [ -z "$base_branch" ]; then
    git checkout -b "$new_branch"
  else
    git checkout -b "$new_branch" "$base_branch"
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "成功创建并切换到分支 '$new_branch'"
    cd "$current_dir"
    return 0
  else
    notice_error "创建分支 '$new_branch' 失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 切换Git分支
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 目标分支名称
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_checkout_branch() {
  local repo_path="${1:-.}"
  local target_branch="$2"
  
  if [ -z "$target_branch" ]; then
    notice_error "请提供目标分支名称"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  git checkout "$target_branch"
  
  if [ $? -eq 0 ]; then
    notice_success "已切换到分支 '$target_branch'"
    cd "$current_dir"
    return 0
  else
    notice_error "切换到分支 '$target_branch' 失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 删除Git分支
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 要删除的分支名称
#   $3: 是否强制删除 ("force" 表示强制删除未合并的分支)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_delete_branch() {
  local repo_path="${1:-.}"
  local branch_name="$2"
  local force="$3"
  
  if [ -z "$branch_name" ]; then
    notice_error "请提供要删除的分支名称"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 检查是否为当前分支
  local current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
  if [ "$current_branch" = "$branch_name" ]; then
    notice_error "无法删除当前所在的分支 '$branch_name'，请先切换到其他分支"
    cd "$current_dir"
    return 1
  fi
  
  # 根据是否强制删除选择不同的命令
  if [ "$force" = "force" ]; then
    git branch -D "$branch_name"
  else
    git branch -d "$branch_name"
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "已删除分支 '$branch_name'"
    cd "$current_dir"
    return 0
  else
    if [ "$force" != "force" ]; then
      notice_error "删除分支 '$branch_name' 失败，可能该分支尚未合并，请添加 'force' 参数强制删除"
    else
      notice_error "删除分支 '$branch_name' 失败"
    fi
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 查看Git分支列表
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 分支类型 ("all" 表示所有分支，"remote" 表示远程分支，默认为本地分支)
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 分支列表
#######################################
git_list_branches() {
  local repo_path="${1:-.}"
  local branch_type="${2:-local}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 根据分支类型选择不同的命令
  case "$branch_type" in
    "all")
      notice_info "所有分支列表:"
      git branch -a
      ;;
    "remote")
      notice_info "远程分支列表:"
      git branch -r
      ;;
    *)
      notice_info "本地分支列表:"
      git branch
      ;;
  esac
  
  if [ $? -eq 0 ]; then
    cd "$current_dir"
    return 0
  else
    notice_error "获取分支列表失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 获取Git当前分支名称
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 成功，并打印分支名称
#   1 - 失败
# 标准输出: 当前分支名称
#######################################
git_current_branch() {
  local repo_path="${1:-.}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  local branch_name=$(git symbolic-ref --short HEAD 2>/dev/null)
  
  if [ -n "$branch_name" ]; then
    notice_info "当前分支: $branch_name"
    echo "$branch_name"
    cd "$current_dir"
    return 0
  else
    notice_error "无法获取当前分支名称，可能处于分离的HEAD状态"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 查看Git仓库状态
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 仓库状态信息
#######################################
git_status() {
  local repo_path="${1:-.}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  notice_info "Git仓库状态:"
  git status
  
  cd "$current_dir"
  return 0
}

#######################################
# 创建Git标签
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 标签名称
#   $3: 标签消息，默认为标签名称
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_create_tag() {
  local repo_path="${1:-.}"
  local tag_name="$2"
  local tag_message="${3:-$tag_name}"
  
  if [ -z "$tag_name" ]; then
    notice_error "请提供标签名称"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  git tag -a "$tag_name" -m "$tag_message"
  
  if [ $? -eq 0 ]; then
    notice_success "已创建标签 '$tag_name'"
    cd "$current_dir"
    return 0
  else
    notice_error "创建标签 '$tag_name' 失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 删除Git标签
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 标签名称
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_delete_tag() {
  local repo_path="${1:-.}"
  local tag_name="$2"
  
  if [ -z "$tag_name" ]; then
    notice_error "请提供标签名称"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  git tag -d "$tag_name"
  
  if [ $? -eq 0 ]; then
    notice_success "已删除标签 '$tag_name'"
    cd "$current_dir"
    return 0
  else
    notice_error "删除标签 '$tag_name' 失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 列出Git标签
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 标签列表
#######################################
git_list_tags() {
  local repo_path="${1:-.}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  notice_info "标签列表:"
  git tag
  
  cd "$current_dir"
  return 0
}

#######################################
# 比较两个提交之间的差异
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 起始提交或分支
#   $3: 目标提交或分支，默认为当前分支
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 差异内容
#######################################
git_diff() {
  local repo_path="${1:-.}"
  local start_commit="$2"
  local end_commit="$3"
  
  if [ -z "$start_commit" ]; then
    notice_error "请提供起始提交或分支"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 如果没有指定目标提交，则与当前分支比较
  if [ -z "$end_commit" ]; then
    notice_info "比较 '$start_commit' 与当前分支的差异:"
    git diff "$start_commit"
  else
    notice_info "比较 '$start_commit' 与 '$end_commit' 的差异:"
    git diff "$start_commit" "$end_commit"
  fi
  
  if [ $? -eq 0 ]; then
    cd "$current_dir"
    return 0
  else
    notice_error "比较差异失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 合并分支
# 参数:
#   $1: 项目路径，默认为当前目录
#   $2: 要合并的源分支
#   $3: 目标分支，默认为当前分支
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_merge() {
  local repo_path="${1:-.}"
  local source_branch="$2"
  local target_branch="$3"
  
  if [ -z "$source_branch" ]; then
    notice_error "请提供要合并的源分支"
    return 1
  fi
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 如果指定了目标分支，则先切换到目标分支
  if [ -n "$target_branch" ]; then
    git checkout "$target_branch"
    
    if [ $? -ne 0 ]; then
      notice_error "切换到目标分支 '$target_branch' 失败"
      cd "$current_dir"
      return 1
    fi
  fi
  
  notice_info "合并分支 '$source_branch'..."
  git merge "$source_branch"
  
  if [ $? -eq 0 ]; then
    notice_success "成功合并分支 '$source_branch'"
    cd "$current_dir"
    return 0
  else
    notice_error "合并分支 '$source_branch' 失败，可能存在冲突"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 解决冲突后继续合并
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_merge_continue() {
  local repo_path="${1:-.}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  # 检查是否有未解决的冲突
  if git diff --name-only --diff-filter=U | grep -q .; then
    notice_error "仍有未解决的冲突，请先解决冲突"
    cd "$current_dir"
    return 1
  fi
  
  # 提交解决的冲突
  git add .
  git commit --no-edit
  
  if [ $? -eq 0 ]; then
    notice_success "成功完成合并"
    cd "$current_dir"
    return 0
  else
    notice_error "完成合并失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 取消合并
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
git_merge_abort() {
  local repo_path="${1:-.}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  git merge --abort
  
  if [ $? -eq 0 ]; then
    notice_success "已取消合并"
    cd "$current_dir"
    return 0
  else
    notice_error "取消合并失败"
    cd "$current_dir"
    return 1
  fi
}

#######################################
# 获取远程仓库信息
# 参数:
#   $1: 项目路径，默认为当前目录
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 远程仓库信息
#######################################
git_remote_info() {
  local repo_path="${1:-.}"
  
  if ! check_git_repository "$repo_path"; then
    return 1
  fi
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到仓库目录
  cd "$repo_path" || return 1
  
  notice_info "远程仓库信息:"
  git remote -v
  
  cd "$current_dir"
  return 0
}

#######################################
# 使用示例
#######################################

# # 检查是否为Git仓库
# check_git_repository "/path/to/repo"

# # 代码拉取与推送
# git_pull "/path/to/repo" "main"
# git_push "/path/to/repo" "feature/branch"
# git_commit "/path/to/repo" "修复了某个问题"

# # 查看日志和状态
# git_log "/path/to/repo" 5 "%h - %an, %ar : %s"
# git_status "/path/to/repo"

# # 分支管理
# git_create_branch "/path/to/repo" "feature/new-feature" "main"
# git_checkout_branch "/path/to/repo" "develop"
# git_delete_branch "/path/to/repo" "old-branch" "force"
# git_list_branches "/path/to/repo" "all"
# git_current_branch "/path/to/repo"

# # 标签管理
# git_create_tag "/path/to/repo" "v1.0.0" "第一个正式版本"
# git_delete_tag "/path/to/repo" "v0.9.9"
# git_list_tags "/path/to/repo"

# # 比较与合并
# git_diff "/path/to/repo" "v1.0.0" "v1.1.0"
# git_merge "/path/to/repo" "feature/completed" "main"
# git_merge_continue "/path/to/repo"
# git_merge_abort "/path/to/repo"

# # 远程仓库
# git_remote_info "/path/to/repo"
