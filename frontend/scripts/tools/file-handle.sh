#!/bin/bash

# 导入通知处理脚本
FILE_TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$FILE_TOOL_DIR/notice-handle.sh"

#######################################
# 创建文件
# 参数:
#   $1: 文件路径
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
create_file() {
  local file_path="$1"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ -e "$file_path" ]; then
    notice_warning "文件 '$file_path' 已存在"
    return 1
  fi
  
  touch "$file_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已创建文件 '$file_path'"
    return 0
  else
    notice_error "无法创建文件 '$file_path'"
    return 1
  fi
}

#######################################
# 创建文件夹
# 参数:
#   $1: 文件夹路径
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
create_directory() {
  local dir_path="$1"
  
  if [ -z "$dir_path" ]; then
    notice_error "请提供文件夹路径"
    return 1
  fi
  
  if [ -d "$dir_path" ]; then
    notice_warning "文件夹 '$dir_path' 已存在"
    return 1
  fi
  
  mkdir -p "$dir_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已创建文件夹 '$dir_path'"
    return 0
  else
    notice_error "无法创建文件夹 '$dir_path'"
    return 1
  fi
}

#######################################
# 删除文件
# 参数:
#   $1: 文件路径
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
delete_file() {
  local file_path="$1"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ ! -f "$file_path" ]; then
    notice_error "文件 '$file_path' 不存在"
    return 1
  fi
  
  rm "$file_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已删除文件 '$file_path'"
    return 0
  else
    notice_error "无法删除文件 '$file_path'"
    return 1
  fi
}

#######################################
# 删除文件夹
# 参数:
#   $1: 文件夹路径
#   $2: 是否强制删除 ("force" 表示强制删除非空文件夹)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
delete_directory() {
  local dir_path="$1"
  local force="$2"
  
  if [ -z "$dir_path" ]; then
    notice_error "请提供文件夹路径"
    return 1
  fi
  
  if [ ! -d "$dir_path" ]; then
    notice_error "文件夹 '$dir_path' 不存在"
    return 1
  fi
  
  if [ "$force" = "force" ]; then
    rm -rf "$dir_path"
  else
    rmdir "$dir_path" 2>/dev/null
    
    if [ $? -ne 0 ]; then
      notice_warning "文件夹 '$dir_path' 不为空，添加 'force' 参数强制删除"
      return 1
    fi
  fi
  
  if [ ! -d "$dir_path" ]; then
    notice_success "已删除文件夹 '$dir_path'"
    return 0
  else
    notice_error "无法删除文件夹 '$dir_path'"
    return 1
  fi
}

#######################################
# 修改文件夹名
# 参数:
#   $1: 原文件夹路径
#   $2: 新文件夹路径
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
rename_directory() {
  local old_path="$1"
  local new_path="$2"
  
  if [ -z "$old_path" ] || [ -z "$new_path" ]; then
    notice_error "请提供原文件夹路径和新文件夹路径"
    return 1
  fi
  
  if [ ! -d "$old_path" ]; then
    notice_error "文件夹 '$old_path' 不存在"
    return 1
  fi
  
  if [ -e "$new_path" ]; then
    notice_error "目标路径 '$new_path' 已存在"
    return 1
  fi
  
  mv "$old_path" "$new_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已将 '$old_path' 重命名为 '$new_path'"
    return 0
  else
    notice_error "无法重命名文件夹"
    return 1
  fi
}

#######################################
# 修改文件名
# 参数:
#   $1: 原文件路径
#   $2: 新文件路径
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
rename_file() {
  local old_path="$1"
  local new_path="$2"
  
  if [ -z "$old_path" ] || [ -z "$new_path" ]; then
    notice_error "请提供原文件路径和新文件路径"
    return 1
  fi
  
  if [ ! -f "$old_path" ]; then
    notice_error "文件 '$old_path' 不存在"
    return 1
  fi
  
  if [ -e "$new_path" ]; then
    notice_error "目标路径 '$new_path' 已存在"
    return 1
  fi
  
  mv "$old_path" "$new_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已将 '$old_path' 重命名为 '$new_path'"
    return 0
  else
    notice_error "无法重命名文件"
    return 1
  fi
}

#######################################
# 复制文件
# 参数:
#   $1: 源文件路径
#   $2: 目标文件路径
#   $3: 是否覆盖已存在的文件 ("force" 表示强制覆盖)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
copy_file() {
  local source_path="$1"
  local target_path="$2"
  local force="$3"
  
  if [ -z "$source_path" ] || [ -z "$target_path" ]; then
    notice_error "请提供源文件路径和目标文件路径"
    return 1
  fi
  
  if [ ! -f "$source_path" ]; then
    notice_error "源文件 '$source_path' 不存在"
    return 1
  fi
  
  if [ -e "$target_path" ] && [ "$force" != "force" ]; then
    notice_warning "目标文件 '$target_path' 已存在，添加 'force' 参数强制覆盖"
    return 1
  fi
  
  # 确保目标目录存在
  local target_dir=$(dirname "$target_path")
  if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
  fi
  
  cp "$source_path" "$target_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已将 '$source_path' 复制到 '$target_path'"
    return 0
  else
    notice_error "无法复制文件"
    return 1
  fi
}

#######################################
# 复制文件夹
# 参数:
#   $1: 源文件夹路径
#   $2: 目标文件夹路径
#   $3: 是否覆盖已存在的文件 ("force" 表示强制覆盖)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
copy_directory() {
  local source_path="$1"
  local target_path="$2"
  local force="$3"
  
  if [ -z "$source_path" ] || [ -z "$target_path" ]; then
    notice_error "请提供源文件夹路径和目标文件夹路径"
    return 1
  fi
  
  if [ ! -d "$source_path" ]; then
    notice_error "源文件夹 '$source_path' 不存在"
    return 1
  fi
  
  if [ -e "$target_path" ] && [ "$force" != "force" ]; then
    notice_warning "目标路径 '$target_path' 已存在，添加 'force' 参数强制覆盖"
    return 1
  fi
  
  if [ "$force" = "force" ]; then
    cp -r "$source_path" "$target_path"
  else
    mkdir -p "$target_path"
    cp -r "$source_path"/* "$target_path" 2>/dev/null
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "已将 '$source_path' 复制到 '$target_path'"
    return 0
  else
    notice_error "无法复制文件夹"
    return 1
  fi
}

#######################################
# 检查文件是否存在
# 参数:
#   $1: 文件路径
# 返回值:
#   0 - 文件存在
#   1 - 文件不存在
#######################################
file_exists() {
  local file_path="$1"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ -f "$file_path" ]; then
    notice_info "文件 '$file_path' 存在"
    return 0
  else
    notice_info "文件 '$file_path' 不存在"
    return 1
  fi
}

#######################################
# 检查文件夹是否存在
# 参数:
#   $1: 文件夹路径
# 返回值:
#   0 - 文件夹存在
#   1 - 文件夹不存在
#######################################
directory_exists() {
  local dir_path="$1"
  
  if [ -z "$dir_path" ]; then
    notice_error "请提供文件夹路径"
    return 1
  fi
  
  if [ -d "$dir_path" ]; then
    notice_info "文件夹 '$dir_path' 存在"
    return 0
  else
    notice_info "文件夹 '$dir_path' 不存在"
    return 1
  fi
}

#######################################
# 获取文件大小
# 参数:
#   $1: 文件路径
#   $2: 单位 (可选: "B", "K", "M", "G", 默认为 "B")
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 文件大小
#######################################
get_file_size() {
  local file_path="$1"
  local unit="${2:-B}"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ ! -f "$file_path" ]; then
    notice_error "文件 '$file_path' 不存在"
    return 1
  fi
  
  local size_bytes=$(stat -f%z "$file_path" 2>/dev/null || stat --format="%s" "$file_path" 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    notice_error "无法获取文件 '$file_path' 的大小"
    return 1
  fi
  
  case "$unit" in
    "B")
      echo "$size_bytes"
      notice_info "文件 '$file_path' 大小: ${size_bytes}B"
      ;;
    "K")
      local size_kb=$(echo "scale=2; $size_bytes / 1024" | bc)
      echo "$size_kb"
      notice_info "文件 '$file_path' 大小: ${size_kb}KB"
      ;;
    "M")
      local size_mb=$(echo "scale=2; $size_bytes / 1024 / 1024" | bc)
      echo "$size_mb"
      notice_info "文件 '$file_path' 大小: ${size_mb}MB"
      ;;
    "G")
      local size_gb=$(echo "scale=2; $size_bytes / 1024 / 1024 / 1024" | bc)
      echo "$size_gb"
      notice_info "文件 '$file_path' 大小: ${size_gb}GB"
      ;;
    *)
      notice_error "不支持的单位: '$unit'"
      return 1
      ;;
  esac
  
  return 0
}

#######################################
# 读取文件内容
# 参数:
#   $1: 文件路径
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 文件内容
#######################################
read_file_content() {
  local file_path="$1"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ ! -f "$file_path" ]; then
    notice_error "文件 '$file_path' 不存在"
    return 1
  fi
  
  cat "$file_path"
  
  if [ $? -eq 0 ]; then
    return 0
  else
    notice_error "无法读取文件 '$file_path'"
    return 1
  fi
}

#######################################
# 写入文件内容（覆盖原内容）
# 参数:
#   $1: 文件路径
#   $2: 要写入的内容
#   $3: 是否覆盖已存在的文件 ("force" 表示强制覆盖)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
write_file_content() {
  local file_path="$1"
  local content="$2"
  local force="$3"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ -f "$file_path" ] && [ "$force" != "force" ]; then
    notice_warning "文件 '$file_path' 已存在，添加 'force' 参数强制覆盖"
    return 1
  fi
  
  # 确保目标目录存在
  local file_dir=$(dirname "$file_path")
  if [ ! -d "$file_dir" ]; then
    mkdir -p "$file_dir"
  fi
  
  echo "$content" > "$file_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已写入内容到文件 '$file_path'"
    return 0
  else
    notice_error "无法写入文件 '$file_path'"
    return 1
  fi
}

#######################################
# 追加文件内容
# 参数:
#   $1: 文件路径
#   $2: 要追加的内容
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
append_file_content() {
  local file_path="$1"
  local content="$2"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  # 确保目标目录存在
  local file_dir=$(dirname "$file_path")
  if [ ! -d "$file_dir" ]; then
    mkdir -p "$file_dir"
  fi
  
  # 如果文件不存在则创建它
  if [ ! -f "$file_path" ]; then
    touch "$file_path"
  fi
  
  echo "$content" >> "$file_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已追加内容到文件 '$file_path'"
    return 0
  else
    notice_error "无法追加内容到文件 '$file_path'"
    return 1
  fi
}

#######################################
# 查找文件
# 参数:
#   $1: 目录路径
#   $2: 文件名模式（支持通配符）
#   $3: 是否递归搜索 ("recursive" 表示递归)
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 找到的文件列表
#######################################
find_files() {
  local dir_path="$1"
  local pattern="$2"
  local recursive="$3"
  
  if [ -z "$dir_path" ] || [ -z "$pattern" ]; then
    notice_error "请提供目录路径和文件名模式"
    return 1
  fi
  
  if [ ! -d "$dir_path" ]; then
    notice_error "目录 '$dir_path' 不存在"
    return 1
  fi
  
  local found_files
  
  if [ "$recursive" = "recursive" ]; then
    found_files=$(find "$dir_path" -type f -name "$pattern" 2>/dev/null)
  else
    found_files=$(find "$dir_path" -maxdepth 1 -type f -name "$pattern" 2>/dev/null)
  fi
  
  if [ -z "$found_files" ]; then
    notice_info "未找到匹配 '$pattern' 的文件"
    return 1
  fi
  
  echo "$found_files"
  notice_success "已找到匹配的文件"
  return 0
}

#######################################
# 查找文件夹
# 参数:
#   $1: 目录路径
#   $2: 文件夹名模式（支持通配符）
#   $3: 是否递归搜索 ("recursive" 表示递归)
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 找到的文件夹列表
#######################################
find_directories() {
  local dir_path="$1"
  local pattern="$2"
  local recursive="$3"
  
  if [ -z "$dir_path" ] || [ -z "$pattern" ]; then
    notice_error "请提供目录路径和文件夹名模式"
    return 1
  fi
  
  if [ ! -d "$dir_path" ]; then
    notice_error "目录 '$dir_path' 不存在"
    return 1
  fi
  
  local found_dirs
  
  if [ "$recursive" = "recursive" ]; then
    found_dirs=$(find "$dir_path" -type d -name "$pattern" 2>/dev/null)
  else
    found_dirs=$(find "$dir_path" -maxdepth 1 -type d -name "$pattern" 2>/dev/null)
  fi
  
  if [ -z "$found_dirs" ]; then
    notice_info "未找到匹配 '$pattern' 的文件夹"
    return 1
  fi
  
  echo "$found_dirs"
  notice_success "已找到匹配的文件夹"
  return 0
}

#######################################
# 设置文件权限
# 参数:
#   $1: 文件路径
#   $2: 权限模式 (例如: "755", "644")
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
set_file_permission() {
  local file_path="$1"
  local permission="$2"
  
  if [ -z "$file_path" ] || [ -z "$permission" ]; then
    notice_error "请提供文件路径和权限模式"
    return 1
  fi
  
  if [ ! -e "$file_path" ]; then
    notice_error "文件或目录 '$file_path' 不存在"
    return 1
  fi
  
  chmod "$permission" "$file_path"
  
  if [ $? -eq 0 ]; then
    notice_success "已设置 '$file_path' 的权限为 '$permission'"
    return 0
  else
    notice_error "无法设置文件权限"
    return 1
  fi
}

#######################################
# 比较两个文件的内容
# 参数:
#   $1: 第一个文件路径
#   $2: 第二个文件路径
# 返回值:
#   0 - 文件内容相同
#   1 - 文件内容不同或出错
#######################################
compare_files() {
  local file1="$1"
  local file2="$2"
  
  if [ -z "$file1" ] || [ -z "$file2" ]; then
    notice_error "请提供两个文件路径进行比较"
    return 1
  fi
  
  if [ ! -f "$file1" ]; then
    notice_error "文件 '$file1' 不存在"
    return 1
  fi
  
  if [ ! -f "$file2" ]; then
    notice_error "文件 '$file2' 不存在"
    return 1
  fi
  
  diff -q "$file1" "$file2" > /dev/null
  
  if [ $? -eq 0 ]; then
    notice_info "文件 '$file1' 和 '$file2' 内容相同"
    return 0
  else
    notice_info "文件 '$file1' 和 '$file2' 内容不同"
    return 1
  fi
}

#######################################
# 获取文件类型
# 参数:
#   $1: 文件路径
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 文件类型
#######################################
get_file_type() {
  local file_path="$1"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ ! -e "$file_path" ]; then
    notice_error "文件或目录 '$file_path' 不存在"
    return 1
  fi
  
  local file_type=$(file -b "$file_path")
  
  if [ $? -eq 0 ]; then
    echo "$file_type"
    notice_info "文件 '$file_path' 类型: $file_type"
    return 0
  else
    notice_error "无法获取文件类型"
    return 1
  fi
}

#######################################
# 检查文件校验和
# 参数:
#   $1: 文件路径
#   $2: 校验和算法 (md5, sha1, sha256, sha512)
#   $3: 期望的校验和值 (可选)
# 返回值:
#   0 - 校验成功或校验和已输出
#   1 - 校验失败或出错
# 标准输出: 如果未提供期望校验和，则输出计算的校验和
#######################################
check_file_checksum() {
  local file_path="$1"
  local algorithm="${2:-md5}"
  local expected_checksum="$3"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ ! -f "$file_path" ]; then
    notice_error "文件 '$file_path' 不存在"
    return 1
  fi
  
  local cmd=""
  case "$algorithm" in
    "md5")
      if command -v md5sum > /dev/null; then
        cmd="md5sum"
      elif command -v md5 > /dev/null; then
        cmd="md5"
      else
        notice_error "系统未安装 md5 校验工具"
        return 1
      fi
      ;;
    "sha1")
      if command -v sha1sum > /dev/null; then
        cmd="sha1sum"
      else
        notice_error "系统未安装 sha1 校验工具"
        return 1
      fi
      ;;
    "sha256")
      if command -v sha256sum > /dev/null; then
        cmd="sha256sum"
      else
        notice_error "系统未安装 sha256 校验工具"
        return 1
      fi
      ;;
    "sha512")
      if command -v sha512sum > /dev/null; then
        cmd="sha512sum"
      else
        notice_error "系统未安装 sha512 校验工具"
        return 1
      fi
      ;;
    *)
      notice_error "不支持的校验和算法: '$algorithm'"
      return 1
      ;;
  esac
  
  # 计算校验和
  local actual_checksum=""
  if [ "$cmd" = "md5" ]; then
    # macOS 的 md5 命令输出格式不同
    actual_checksum=$($cmd "$file_path" | awk '{print $NF}')
  else
    actual_checksum=$($cmd "$file_path" | awk '{print $1}')
  fi
  
  if [ -z "$actual_checksum" ]; then
    notice_error "计算文件 '$file_path' 的校验和时出错"
    return 1
  fi
  
  # 如果提供了期望值，则进行比较
  if [ -n "$expected_checksum" ]; then
    if [ "$actual_checksum" = "$expected_checksum" ]; then
      notice_success "文件 '$file_path' 校验和匹配"
      return 0
    else
      notice_error "文件 '$file_path' 校验和不匹配"
      notice_info "期望: $expected_checksum"
      notice_info "实际: $actual_checksum"
      return 1
    fi
  else
    # 如果未提供期望值，则输出计算结果
    echo "$actual_checksum"
    notice_info "文件 '$file_path' ${algorithm} 校验和: $actual_checksum"
    return 0
  fi
}

#######################################
# 获取文件最后修改时间
# 参数:
#   $1: 文件路径
#   $2: 时间格式 (可选，默认为 "%Y-%m-%d %H:%M:%S")
# 返回值:
#   0 - 成功
#   1 - 失败
# 标准输出: 文件最后修改时间
#######################################
get_file_mtime() {
  local file_path="$1"
  local format="${2:-%Y-%m-%d %H:%M:%S}"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供文件路径"
    return 1
  fi
  
  if [ ! -e "$file_path" ]; then
    notice_error "文件或目录 '$file_path' 不存在"
    return 1
  fi
  
  local mtime=""
  if [ "$(uname)" = "Darwin" ]; then
    # macOS
    mtime=$(stat -f "%Sm" -t "$format" "$file_path" 2>/dev/null)
  else
    # Linux
    mtime=$(stat -c "%y" "$file_path" 2>/dev/null | date +"$format" 2>/dev/null)
  fi
  
  if [ -z "$mtime" ]; then
    notice_error "无法获取文件 '$file_path' 的修改时间"
    return 1
  fi
  
  echo "$mtime"
  notice_info "文件 '$file_path' 最后修改时间: $mtime"
  return 0
}

#######################################
# 加密文件
# 参数:
#   $1: 源文件路径
#   $2: 输出文件路径
#   $3: 密码 (可选，如果不提供会提示输入)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
encrypt_file() {
  local source_path="$1"
  local output_path="$2"
  local password="$3"
  
  if [ -z "$source_path" ] || [ -z "$output_path" ]; then
    notice_error "请提供源文件路径和输出文件路径"
    return 1
  fi
  
  if [ ! -f "$source_path" ]; then
    notice_error "源文件 '$source_path' 不存在"
    return 1
  fi
  
  if [ -e "$output_path" ]; then
    notice_warning "输出文件 '$output_path' 已存在"
    return 1
  fi
  
  # 确保输出目录存在
  local output_dir=$(dirname "$output_path")
  if [ ! -d "$output_dir" ]; then
    mkdir -p "$output_dir"
  fi
  
  # 检查 openssl 是否可用
  if ! command -v openssl > /dev/null; then
    notice_error "未安装 OpenSSL，无法进行加密"
    return 1
  fi
  
  # 执行加密
  if [ -z "$password" ]; then
    # 如果没有提供密码，使用输入提示
    openssl enc -aes-256-cbc -salt -in "$source_path" -out "$output_path"
  else
    # 使用提供的密码
    openssl enc -aes-256-cbc -salt -in "$source_path" -out "$output_path" -k "$password"
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "已加密文件 '$source_path' 到 '$output_path'"
    return 0
  else
    notice_error "加密文件失败"
    return 1
  fi
}

#######################################
# 解密文件
# 参数:
#   $1: 加密文件路径
#   $2: 输出文件路径
#   $3: 密码 (可选，如果不提供会提示输入)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
decrypt_file() {
  local source_path="$1"
  local output_path="$2"
  local password="$3"
  
  if [ -z "$source_path" ] || [ -z "$output_path" ]; then
    notice_error "请提供加密文件路径和输出文件路径"
    return 1
  fi
  
  if [ ! -f "$source_path" ]; then
    notice_error "加密文件 '$source_path' 不存在"
    return 1
  fi
  
  if [ -e "$output_path" ]; then
    notice_warning "输出文件 '$output_path' 已存在"
    return 1
  fi
  
  # 确保输出目录存在
  local output_dir=$(dirname "$output_path")
  if [ ! -d "$output_dir" ]; then
    mkdir -p "$output_dir"
  fi
  
  # 检查 openssl 是否可用
  if ! command -v openssl > /dev/null; then
    notice_error "未安装 OpenSSL，无法进行解密"
    return 1
  fi
  
  # 执行解密
  if [ -z "$password" ]; then
    # 如果没有提供密码，使用输入提示
    openssl enc -aes-256-cbc -d -in "$source_path" -out "$output_path"
  else
    # 使用提供的密码
    openssl enc -aes-256-cbc -d -in "$source_path" -out "$output_path" -k "$password"
  fi
  
  if [ $? -eq 0 ]; then
    notice_success "已解密文件 '$source_path' 到 '$output_path'"
    return 0
  else
    notice_error "解密文件失败"
    return 1
  fi
}

#######################################
# 压缩文件或目录
# 参数:
#   $1: 源文件/目录路径
#   $2: 输出压缩文件路径
#   $3: 压缩格式 (zip, tar, targz, tarbz2)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
compress_file() {
  local source_path="$1"
  local output_path="$2"
  local format="${3:-zip}"
  
  if [ -z "$source_path" ] || [ -z "$output_path" ]; then
    notice_error "请提供源路径和输出压缩文件路径"
    return 1
  fi
  
  if [ ! -e "$source_path" ]; then
    notice_error "源文件或目录 '$source_path' 不存在"
    return 1
  fi
  
  if [ -e "$output_path" ]; then
    notice_warning "输出文件 '$output_path' 已存在"
    return 1
  fi
  
  # 确保输出目录存在
  local output_dir=$(dirname "$output_path")
  if [ ! -d "$output_dir" ]; then
    mkdir -p "$output_dir"
  fi
  
  # 基于格式选择压缩命令
  case "$format" in
    "zip")
      if ! command -v zip > /dev/null; then
        notice_error "未安装 zip 命令"
        return 1
      fi
      
      if [ -d "$source_path" ]; then
        (cd "$(dirname "$source_path")" && zip -r "$output_path" "$(basename "$source_path")")
      else
        (cd "$(dirname "$source_path")" && zip "$output_path" "$(basename "$source_path")")
      fi
      ;;
    "tar")
      if ! command -v tar > /dev/null; then
        notice_error "未安装 tar 命令"
        return 1
      fi
      
      tar -cf "$output_path" -C "$(dirname "$source_path")" "$(basename "$source_path")"
      ;;
    "targz")
      if ! command -v tar > /dev/null; then
        notice_error "未安装 tar 命令"
        return 1
      fi
      
      tar -czf "$output_path" -C "$(dirname "$source_path")" "$(basename "$source_path")"
      ;;
    "tarbz2")
      if ! command -v tar > /dev/null; then
        notice_error "未安装 tar 命令"
        return 1
      fi
      
      tar -cjf "$output_path" -C "$(dirname "$source_path")" "$(basename "$source_path")"
      ;;
    *)
      notice_error "不支持的压缩格式: '$format'"
      return 1
      ;;
  esac
  
  if [ $? -eq 0 ]; then
    notice_success "已压缩 '$source_path' 到 '$output_path'"
    return 0
  else
    notice_error "压缩失败"
    return 1
  fi
}

#######################################
# 解压缩文件
# 参数:
#   $1: 压缩文件路径
#   $2: 解压目录路径
#   $3: 文件格式 (可选，自动检测)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
extract_file() {
  local archive_path="$1"
  local output_dir="$2"
  local format="$3"
  
  if [ -z "$archive_path" ] || [ -z "$output_dir" ]; then
    notice_error "请提供压缩文件路径和解压目录路径"
    return 1
  fi
  
  if [ ! -f "$archive_path" ]; then
    notice_error "压缩文件 '$archive_path' 不存在"
    return 1
  fi
  
  # 确保输出目录存在
  if [ ! -d "$output_dir" ]; then
    mkdir -p "$output_dir"
  fi
  
  # 如果未指定格式，尝试自动检测
  if [ -z "$format" ]; then
    if [[ "$archive_path" == *.zip ]]; then
      format="zip"
    elif [[ "$archive_path" == *.tar ]]; then
      format="tar"
    elif [[ "$archive_path" == *.tar.gz ]] || [[ "$archive_path" == *.tgz ]]; then
      format="targz"
    elif [[ "$archive_path" == *.tar.bz2 ]] || [[ "$archive_path" == *.tbz2 ]]; then
      format="tarbz2"
    else
      notice_error "无法自动检测压缩文件格式，请指定格式"
      return 1
    fi
  fi
  
  # 基于格式选择解压命令
  case "$format" in
    "zip")
      if ! command -v unzip > /dev/null; then
        notice_error "未安装 unzip 命令"
        return 1
      fi
      
      unzip "$archive_path" -d "$output_dir"
      ;;
    "tar")
      if ! command -v tar > /dev/null; then
        notice_error "未安装 tar 命令"
        return 1
      fi
      
      tar -xf "$archive_path" -C "$output_dir"
      ;;
    "targz")
      if ! command -v tar > /dev/null; then
        notice_error "未安装 tar 命令"
        return 1
      fi
      
      tar -xzf "$archive_path" -C "$output_dir"
      ;;
    "tarbz2")
      if ! command -v tar > /dev/null; then
        notice_error "未安装 tar 命令"
        return 1
      fi
      
      tar -xjf "$archive_path" -C "$output_dir"
      ;;
    *)
      notice_error "不支持的压缩格式: '$format'"
      return 1
      ;;
  esac
  
  if [ $? -eq 0 ]; then
    notice_success "已解压 '$archive_path' 到 '$output_dir'"
    return 0
  else
    notice_error "解压失败"
    return 1
  fi
}

#######################################
# 批量重命名文件
# 参数:
#   $1: 目录路径
#   $2: 文件匹配模式
#   $3: 搜索字符串
#   $4: 替换字符串
#   $5: 是否递归 (recursive)
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
batch_rename_files() {
  local dir_path="$1"
  local file_pattern="$2"
  local search_str="$3"
  local replace_str="$4"
  local recursive="$5"
  
  if [ -z "$dir_path" ] || [ -z "$file_pattern" ] || [ -z "$search_str" ]; then
    notice_error "请提供目录路径、文件匹配模式和搜索字符串"
    return 1
  fi
  
  if [ ! -d "$dir_path" ]; then
    notice_error "目录 '$dir_path' 不存在"
    return 1
  fi
  
  local found_files
  
  # 根据是否递归搜索文件
  if [ "$recursive" = "recursive" ]; then
    found_files=$(find "$dir_path" -type f -name "$file_pattern" 2>/dev/null)
  else
    found_files=$(find "$dir_path" -maxdepth 1 -type f -name "$file_pattern" 2>/dev/null)
  fi
  
  if [ -z "$found_files" ]; then
    notice_info "未找到匹配 '$file_pattern' 的文件"
    return 1
  fi
  
  local count=0
  local errors=0
  
  # 遍历所有找到的文件并重命名
  echo "$found_files" | while read file; do
    local dir=$(dirname "$file")
    local filename=$(basename "$file")
    local new_filename="${filename//$search_str/$replace_str}"
    
    # 如果文件名没有变化，跳过
    if [ "$filename" = "$new_filename" ]; then
      continue
    fi
    
    local new_path="$dir/$new_filename"
    
    # 如果新文件已存在，报错并跳过
    if [ -e "$new_path" ]; then
      notice_warning "无法重命名 '$file': 目标文件 '$new_path' 已存在"
      ((errors++))
      continue
    fi
    
    # 重命名文件
    mv "$file" "$new_path"
    
    if [ $? -eq 0 ]; then
      notice_info "已将 '$file' 重命名为 '$new_path'"
      ((count++))
    else
      notice_warning "无法重命名 '$file'"
      ((errors++))
    fi
  done
  
  if [ $count -gt 0 ]; then
    notice_success "已重命名 $count 个文件"
    
    if [ $errors -gt 0 ]; then
      notice_warning "有 $errors 个文件未能重命名"
    fi
    
    return 0
  else
    if [ $errors -gt 0 ]; then
      notice_error "所有文件均未能重命名"
    else
      notice_info "没有文件需要重命名"
    fi
    
    return 1
  fi
}

#######################################
# 监控文件变化
# 参数:
#   $1: 要监控的文件路径
#   $2: 检查间隔时间（秒，默认为 1）
#   $3: 运行最大时间（秒，默认为 60）
# 返回值:
#   0 - 文件被修改或创建
#   1 - 超时或出错
#######################################
watch_file_changes() {
  local file_path="$1"
  local interval="${2:-1}"
  local max_time="${3:-60}"
  
  if [ -z "$file_path" ]; then
    notice_error "请提供要监控的文件路径"
    return 1
  fi
  
  local start_time=$(date +%s)
  local last_modified=0
  
  if [ -f "$file_path" ]; then
    if [ "$(uname)" = "Darwin" ]; then
      last_modified=$(stat -f "%m" "$file_path")
    else
      last_modified=$(stat -c "%Y" "$file_path")
    fi
  fi
  
  notice_info "开始监控文件 '$file_path' 的变化..."
  
  while true; do
    # 检查是否超时
    local current_time=$(date +%s)
    local elapsed_time=$((current_time - start_time))
    
    if [ $elapsed_time -ge $max_time ]; then
      notice_warning "监控超时，文件 '$file_path' 没有变化"
      return 1
    fi
    
    # 检查文件是否存在
    if [ -f "$file_path" ]; then
      local current_modified
      
      if [ "$(uname)" = "Darwin" ]; then
        current_modified=$(stat -f "%m" "$file_path")
      else
        current_modified=$(stat -c "%Y" "$file_path")
      fi
      
      # 如果是新创建的文件或修改时间不同
      if [ $last_modified -eq 0 ] || [ $current_modified -ne $last_modified ]; then
        notice_success "文件 '$file_path' 已被修改或创建"
        return 0
      fi
    fi
    
    sleep $interval
  done
}

# 使用示例
# create_file "path/to/file.txt" 
# create_directory "path/to/directory"
# delete_file "path/to/file.txt"
# delete_directory "path/to/directory"
# delete_directory "path/to/directory" "force"
# rename_directory "old/directory/path" "new/directory/path"
# rename_file "old/file/path.txt" "new/file/path.txt"
# copy_file "source/file.txt" "target/file.txt"
# copy_file "source/file.txt" "target/file.txt" "force"
# copy_directory "source/dir" "target/dir"
# copy_directory "source/dir" "target/dir" "force"
# file_exists "path/to/file.txt"
# directory_exists "path/to/directory"
# size=$(get_file_size "path/to/file.txt" "M")
# read_file_content "path/to/file.txt"
# write_file_content "path/to/file.txt" "Hello, World!"
# write_file_content "path/to/file.txt" "Hello, World!" "force"
# append_file_content "path/to/file.txt" "New line"
# found_files=$(find_files "/path/to/search" "*.txt" "recursive")
# found_dirs=$(find_directories "/path/to/search" "data*" "recursive")
# set_file_permission "path/to/file.txt" "755"
# compare_files "file1.txt" "file2.txt"
# filetype=$(get_file_type "path/to/file")
# checksum=$(check_file_checksum "path/to/file.txt" "sha256")
# check_file_checksum "path/to/file.txt" "md5" "expected_checksum_value"
# last_modified=$(get_file_mtime "path/to/file.txt")
# encrypt_file "path/to/file.txt" "path/to/file.enc" "password123"
# decrypt_file "path/to/file.enc" "path/to/file.dec" "password123"
# compress_file "path/to/directory" "path/to/archive.zip" "zip"
# extract_file "path/to/archive.zip" "path/to/extract_dir"
# batch_rename_files "/path/to/search" "*.txt" "old" "new" "recursive"
# watch_file_changes "/path/to/file.txt" 2 120


