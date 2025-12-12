#!/bin/bash

#######################################
# 临时文件清理脚本
# 
# 此脚本用于清理项目中的临时文件和构建产物，包括
# node_modules、pnpm-lock.yaml、dist目录和.turbo目录等，
# 便于重新安装依赖或重新构建项目。
#
# 作者: chudong
# 版本: 1.0.0
#######################################

# 导入通知处理脚本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/tools/notice-handle.sh" ]; then
  source "$SCRIPT_DIR/tools/notice-handle.sh"
else
  # 如果没有找到通知处理脚本，定义简单的替代函数
  function notice_info() { echo "[信息] $1"; }
  function notice_success() { echo "[成功] $1"; }
  function notice_warning() { echo "[警告] $1"; }
  function notice_error() { echo "[错误] $1"; }
fi

#######################################
# 清理特定类型的文件或目录
# 参数:
#   $1: 查找的文件/目录名
#   $2: 类型 (f: 文件, d: 目录)
#   $3: 描述信息
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
clean_item() {
  local item_name="$1"
  local item_type="$2"
  local description="$3"
  local count=0
  
  if [ -z "$item_name" ] || [ -z "$item_type" ]; then
    notice_error "清理项目需要名称和类型"
    return 1
  fi
  
  notice_info "开始清理$description..."
  
  if [ "$item_type" = "d" ]; then
    # 查找并删除目录
    count=$(find . -name "$item_name" -type d | wc -l)
    if [ $count -gt 0 ]; then
      find . -name "$item_name" -type d -prune -exec rm -rf {} \; 2>/dev/null
      if [ $? -eq 0 ]; then
        notice_success "已清理$count个$description"
      else
        notice_error "清理$description时出错"
        return 1
      fi
    else
      notice_info "未找到任何$description"
    fi
  elif [ "$item_type" = "f" ]; then
    # 查找并删除文件
    count=$(find . -name "$item_name" -type f | wc -l)
    if [ $count -gt 0 ]; then
      find . -name "$item_name" -type f -delete 2>/dev/null
      if [ $? -eq 0 ]; then
        notice_success "已清理${count}个${description}"
      else
        notice_error "清理${description}时出错"
        return 1
      fi
    else
      notice_info "未找到任何${description}"
    fi
  else
    notice_error "不支持的项目类型: $item_type"
    return 1
  fi
  
  return 0
}

#######################################
# 清理项目中的所有临时文件和构建产物
# 参数:
#   $1: 起始目录，默认为当前目录
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
clean_all() {
  local start_dir="${1:-.}"
  local total_success=0
  local total_failed=0
  
  notice_info "开始清理临时文件和构建产物..."
  
  # 保存当前目录
  local current_dir=$(pwd)
  
  # 切换到指定目录
  cd "$start_dir" || {
    notice_error "无法切换到目录: $start_dir"
    return 1
  }
  
  # 清理 node_modules 目录
  clean_item "node_modules" "d" "依赖目录"
  [ $? -eq 0 ] && ((total_success++)) || ((total_failed++))
  
  # 清理 pnpm-lock.yaml 文件
  clean_item "pnpm-lock.yaml" "f" "包管理器锁定文件"
  [ $? -eq 0 ] && ((total_success++)) || ((total_failed++))
  
  # 清理 dist 目录
  clean_item "dist" "d" "构建产物目录"
  [ $? -eq 0 ] && ((total_success++)) || ((total_failed++))
  
  # 清理 .turbo 目录
  clean_item ".turbo" "d" "Turbo缓存目录"
  [ $? -eq 0 ] && ((total_success++)) || ((total_failed++))
  
  # 返回原始目录
  cd "$current_dir"
  
  # 显示清理结果
  if [ $total_failed -eq 0 ]; then
    notice_success "所有项目清理成功"
    return 0
  else
    notice_warning "清理结果: $total_success 成功, $total_failed 失败"
    return 1
  fi
}

#######################################
# 主函数
#######################################
main() {
  # 清理所有临时文件和构建产物
  clean_all
  # 显示完成信息
  notice_info "清理操作已完成"
  notice_info "您现在可以重新安装依赖并构建项目"
}

# 执行主函数
main