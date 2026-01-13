#!/bin/bash

#######################################
# 通用工具处理脚本
# 
# 此脚本提供了一系列通用工具函数，包括系统环境检测、
# 依赖检测、工作区检测、配置文件解析、命令行参数解析
# 以及yq工具的常用操作方法。
#
# 作者: chudong
# 版本: 1.0.0
#######################################

# 引入通知处理脚本
OTHER_TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$OTHER_TOOL_DIR/notice-handle.sh"

#######################################
# 检测系统环境信息
# 全局变量:
#   OS_TYPE - 操作系统类型 (Linux/MacOS/Windows/Unknown)
#   OS_NAME - 操作系统名称 (如 Ubuntu, Debian, macOS等)
#   OS_VERSION - 操作系统版本
#   ARCH - 系统架构 (x86_64, arm64等)
#   SHELL_TYPE - Shell类型 (bash, zsh等)
# 返回值:
#   0 - 成功检测
#   1 - 检测失败
#######################################
check_environment() {
  notice_info "检测系统环境..."
  
  # 检测操作系统类型
  case "$(uname -s)" in
    Linux*)
      OS_TYPE="Linux"
      if [ -f /etc/os-release ]; then
        OS_NAME=$(grep -oP '(?<=^ID=).+' /etc/os-release | tr -d '"')
        OS_VERSION=$(grep -oP '(?<=^VERSION_ID=).+' /etc/os-release | tr -d '"')
      else
        OS_NAME="Unknown Linux"
        OS_VERSION="Unknown"
      fi
      ;;
    Darwin*)
      OS_TYPE="MacOS"
      OS_NAME="macOS"
      OS_VERSION=$(sw_vers -productVersion)
      ;;
    CYGWIN*|MINGW*|MSYS*)
      OS_TYPE="Windows"
      OS_NAME="Windows"
      OS_VERSION="Unknown"
      ;;
    *)
      OS_TYPE="Unknown"
      OS_NAME="Unknown"
      OS_VERSION="Unknown"
      notice_error "无法识别的操作系统类型: $(uname -s)"
      return 1
      ;;
  esac
  
  # 检测系统架构
  ARCH=$(uname -m)
  
  # 检测Shell类型
  SHELL_TYPE=$(basename "$SHELL")
  
  # 输出检测结果
  notice_success "系统环境检测完成"
  notice_info "操作系统类型: $OS_TYPE"
  notice_info "操作系统版本: $OS_VERSION"
  notice_info "系统架构: $ARCH"
  notice_info "Shell类型: $SHELL_TYPE"
  
  return 0
}

#######################################
# 检测yq依赖是否安装
# 参数:
#   $1: 最低版本要求 (可选，格式如 "4.0.0")
# 全局变量:
#   YQ_PATH - yq命令的完整路径
#   YQ_VERSION - yq的版本号
# 返回值:
#   0 - yq已安装且版本符合要求
#   1 - yq未安装或版本不符合要求
#######################################
check_yq_dependency() {
  local min_version="${1:-0.0.0}"
  local yq_cmd
  
  notice_info "检测yq依赖..."
  
  # 检查yq命令是否可用
  yq_cmd=$(command -v yq)
  if [ -z "$yq_cmd" ]; then
    notice_error "yq 未安装"
    notice_info "请安装yq: https://github.com/mikefarah/yq#install"
    return 1
  fi
  
  YQ_PATH="$yq_cmd"
  YQ_VERSION=$("$YQ_PATH" --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  
  # 检查版本要求
  if [ "$min_version" != "0.0.0" ]; then
    # 简单版本比较函数
    version_lt() {
      [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$1" ] && [ "$1" != "$2" ]
    }
    
    if version_lt "$YQ_VERSION" "$min_version"; then
      notice_error "yq版本过低: $YQ_VERSION (需要 $min_version 或更高)"
      return 1
    fi
  fi
  
  notice_success "yq依赖检测通过 (版本: $YQ_VERSION, 路径: $YQ_PATH)"
  return 0
}

#######################################
# 检测当前目录是否为工作区根目录
# 参数:
#   $@: 表示工作区的标志文件或目录 (默认为 package.json, .git等)
# 全局变量:
#   WORKSPACE_ROOT - 工作区根目录的绝对路径
# 返回值:
#   0 - 在工作区根目录中
#   1 - 不在工作区根目录中
#######################################
check_workspace() {
  local markers=("$@")
  local current_dir
  local parent_dir
  
  notice_info "检测工作区..."
  
  # 如果未指定标志，使用默认值
  if [ ${#markers[@]} -eq 0 ]; then
    markers=("package.json" ".git" "pnpm-workspace.yaml" "turbo.json")
  fi
  
  # 获取当前目录的绝对路径
  current_dir=$(pwd)
  parent_dir="$current_dir"
  
  while [ "$parent_dir" != "/" ]; do
    for marker in "${markers[@]}"; do
      if [ -e "$parent_dir/$marker" ]; then
        WORKSPACE_ROOT="$parent_dir"
        notice_success "找到工作区根目录: $WORKSPACE_ROOT"
        return 0
      fi
    done
    parent_dir=$(dirname "$parent_dir")
  done
  
  notice_error "未找到工作区根目录"
  return 1
}

#######################################
# 解析YAML配置文件
# 参数:
#   $1: YAML配置文件路径
#   $2: 用于存储解析后配置的关联数组名称
# 返回值:
#   0 - 成功解析配置
#   1 - 解析失败
# 使用示例:
#   declare -A CONFIG
#   parse_yaml_config "config.yaml" CONFIG
#   echo "用户名: ${CONFIG[username]}"
#######################################
parse_yaml_config() {
  local config_file="$1"
  local config_var="$2"
  
  notice_info "解析配置文件: $config_file"
  
  # 检查文件是否存在
  if [ ! -f "$config_file" ]; then
    notice_error "配置文件不存在: $config_file"
    return 1
  fi
  
  # 检查yq依赖
  if ! check_yq_dependency "4.0.0"; then
    notice_error "解析YAML需要yq 4.0.0或更高版本"
    return 1
  fi
  
  # 检查文件格式是否为YAML
  if ! "$YQ_PATH" e '.' "$config_file" > /dev/null 2>&1; then
    notice_error "无效的YAML文件: $config_file"
    return 1
  fi
  
  # 将YAML转换为扁平的键值对
  local key_values
  key_values=$("$YQ_PATH" e 'to_entries | .[] | select(.value != null) | [.key, .value] | join("=")' "$config_file")
  
  # 解析键值对到关联数组
  while IFS= read -r line; do
    if [ -n "$line" ]; then
      IFS='=' read -r key value <<< "$line"
      # 使用eval给指定的数组变量赋值
      eval "$config_var[\$key]=\$value"
    fi
  done <<< "$key_values"
  
  notice_success "配置文件解析完成"
  return 0
}

#######################################
# 解析命令行参数
# 参数:
#   $@: 所有命令行参数
# 全局变量:
#   PARAMS - 关联数组，存储所有解析后的参数
#   POSITIONAL - 数组，存储所有位置参数
# 返回值:
#   0 - 成功解析参数
#   1 - 解析参数时出错
# 使用示例:
#   parse_arguments "$@"
#   echo "输出文件: ${PARAMS[output]}"
#   echo "调试模式: ${PARAMS[debug]}"
#   echo "第一个位置参数: ${POSITIONAL[0]}"
#######################################
parse_arguments() {
  # 初始化全局参数数组
  declare -gA PARAMS
  declare -ga POSITIONAL=()
  
  notice_info "解析命令行参数..."
  
  # 如果没有参数，返回成功
  if [ $# -eq 0 ]; then
    notice_warning "没有提供命令行参数"
    return 0
  fi
  
  # 解析所有参数
  while [ $# -gt 0 ]; do
    case "$1" in
      # 长选项 (--option=value 或 --option value)
      --*=*)
        key="${1#--}"
        key="${key%%=*}"
        value="${1#*=}"
        PARAMS["$key"]="$value"
        shift
        ;;
      --*)
        key="${1#--}"
        if [[ "$2" != -* && $# -gt 1 ]]; then
          PARAMS["$key"]="$2"
          shift 2
        else
          # 布尔标志
          PARAMS["$key"]="true"
          shift
        fi
        ;;
      # 短选项 (-o value 或 -o)
      -*)
        if [ ${#1} -gt 2 ]; then
          # 组合短选项 (-abc)
          flags="${1:1}"
          for ((i=0; i<${#flags}; i++)); do
            flag="${flags:$i:1}"
            PARAMS["$flag"]="true"
          done
          shift
        else
          # 单个短选项 (-a value 或 -a)
          key="${1:1}"
          if [[ "$2" != -* && $# -gt 1 ]]; then
            PARAMS["$key"]="$2"
            shift 2
          else
            # 布尔标志
            PARAMS["$key"]="true"
            shift
          fi
        fi
        ;;
      # 位置参数
      *)
        POSITIONAL+=("$1")
        shift
        ;;
    esac
  done
  
  # 输出解析结果
  if [ ${#PARAMS[@]} -gt 0 ]; then
    notice_info "命名参数:"
    for key in "${!PARAMS[@]}"; do
      notice_info "  - $key: ${PARAMS[$key]}"
    done
  fi
  
  if [ ${#POSITIONAL[@]} -gt 0 ]; then
    notice_info "位置参数:"
    for ((i=0; i<${#POSITIONAL[@]}; i++)); do
      notice_info "  - $i: ${POSITIONAL[$i]}"
    done
  fi
  
  notice_success "命令行参数解析完成"
  return 0
}

#######################################
# yq常用操作方法集合
#######################################

#######################################
# 从YAML文件获取指定路径的值
# 参数:
#   $1: YAML文件路径
#   $2: YAML路径表达式
# 返回值:
#   0 - 成功获取值
#   1 - 失败
# 标准输出: 查询到的值
#######################################
yq_get_value() {
  local file="$1"
  local path="$2"
  
  if [ ! -f "$file" ]; then
    notice_error "文件不存在: $file"
    return 1
  fi
  
  "$YQ_PATH" e "$path" "$file"
  return $?
}

#######################################
# 设置YAML文件中指定路径的值
# 参数:
#   $1: YAML文件路径
#   $2: YAML路径表达式
#   $3: 要设置的值
# 返回值:
#   0 - 成功设置值
#   1 - 失败
#######################################
yq_set_value() {
  local file="$1"
  local path="$2"
  local value="$3"
  
  if [ ! -f "$file" ]; then
    notice_error "文件不存在: $file"
    return 1
  fi
  
  "$YQ_PATH" e "$path = $value" -i "$file"
  return $?
}

#######################################
# 删除YAML文件中指定路径的值
# 参数:
#   $1: YAML文件路径
#   $2: YAML路径表达式
# 返回值:
#   0 - 成功删除值
#   1 - 失败
#######################################
yq_delete_path() {
  local file="$1"
  local path="$2"
  
  if [ ! -f "$file" ]; then
    notice_error "文件不存在: $file"
    return 1
  fi
  
  "$YQ_PATH" e "del($path)" -i "$file"
  return $?
}

#######################################
# 合并两个YAML文件
# 参数:
#   $1: 目标文件路径
#   $2: 源文件路径
# 返回值:
#   0 - 成功合并文件
#   1 - 失败
#######################################
yq_merge_files() {
  local target_file="$1"
  local source_file="$2"
  
  if [ ! -f "$target_file" ] || [ ! -f "$source_file" ]; then
    notice_error "文件不存在"
    return 1
  fi
  
  "$YQ_PATH" eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' "$target_file" "$source_file" > "${target_file}.tmp" \
    && mv "${target_file}.tmp" "$target_file"
  
  return $?
}

#######################################
# 检查YAML文件中是否存在某个路径
# 参数:
#   $1: YAML文件路径
#   $2: YAML路径表达式
# 返回值:
#   0 - 路径存在
#   1 - 路径不存在或文件不存在
#######################################
yq_has_path() {
  local file="$1"
  local path="$2"
  
  if [ ! -f "$file" ]; then
    notice_error "文件不存在: $file"
    return 1
  fi
  
  # 若路径存在，则值不为null，返回true
  if [ "$("$YQ_PATH" e "$path" "$file")" != "null" ]; then
    return 0
  else
    return 1
  fi
}

#######################################
# 为YAML数组添加元素
# 参数:
#   $1: YAML文件路径
#   $2: 数组路径表达式
#   $3: 要添加的值
# 返回值:
#   0 - 成功添加元素
#   1 - 失败
#######################################
yq_array_append() {
  local file="$1"
  local array_path="$2"
  local value="$3"
  
  if [ ! -f "$file" ]; then
    notice_error "文件不存在: $file"
    return 1
  fi
  
  "$YQ_PATH" e "$array_path += [$value]" -i "$file"
  return $?
}

#######################################
# 获取YAML数组长度
# 参数:
#   $1: YAML文件路径
#   $2: 数组路径表达式
# 返回值:
#   0 - 成功获取长度
#   1 - 失败
# 标准输出: 数组长度
#######################################
yq_array_length() {
  local file="$1"
  local array_path="$2"
  
  if [ ! -f "$file" ]; then
    notice_error "文件不存在: $file"
    return 1
  fi
  
  "$YQ_PATH" e "$array_path | length" "$file"
  return $?
}

#######################################
# 将YAML转换为JSON
# 参数:
#   $1: YAML文件路径
#   $2: 输出JSON文件路径 (可选，默认为与YAML文件同名但扩展名为.json)
# 返回值:
#   0 - 成功转换
#   1 - 失败
#######################################
yq_to_json() {
  local yaml_file="$1"
  local json_file="${2:-${yaml_file%.*}.json}"
  
  if [ ! -f "$yaml_file" ]; then
    notice_error "YAML文件不存在: $yaml_file"
    return 1
  fi
  
  "$YQ_PATH" e -o=json '.' "$yaml_file" > "$json_file"
  notice_success "转换完成: $yaml_file -> $json_file"
  return $?
}

#######################################
# 将JSON转换为YAML
# 参数:
#   $1: JSON文件路径
#   $2: 输出YAML文件路径 (可选，默认为与JSON文件同名但扩展名为.yaml)
# 返回值:
#   0 - 成功转换
#   1 - 失败
#######################################
yq_from_json() {
  local json_file="$1"
  local yaml_file="${2:-${json_file%.*}.yaml}"
  
  if [ ! -f "$json_file" ]; then
    notice_error "JSON文件不存在: $json_file"
    return 1
  fi
  
  "$YQ_PATH" e -p=json -o=yaml '.' "$json_file" > "$yaml_file"
  notice_success "转换完成: $json_file -> $yaml_file"
  return $?
}

#######################################
# 使用示例
#######################################

# 运行所有示例函数
run_examples() {
  notice_info "运行示例..."
  
  # 1. 环境检测示例
  check_environment
  echo ""
  
  # 2. yq依赖检测示例
  check_yq_dependency
  echo ""
  
  # 3. 工作区检测示例
  check_workspace
  echo ""
  
  # 4. 配置文件解析示例（假设有配置文件）
  if [ -f "config.yaml" ]; then
    declare -A CONFIG
    parse_yaml_config "config.yaml" CONFIG
    echo "解析到的配置项:"
    for key in "${!CONFIG[@]}"; do
      echo "  $key: ${CONFIG[$key]}"
    done
    echo ""
  else
    notice_warning "示例配置文件 config.yaml 不存在，跳过解析示例"
    echo ""
  fi
  
  # 5. 命令行参数解析示例
  parse_arguments --name="示例项目" --debug -v -o output.txt input1.txt input2.txt
  echo ""
  
  # 6. yq操作示例（假设有YAML文件）
  if [ -f "example.yaml" ]; then
    notice_info "yq操作示例:"
    echo "- 获取值示例:"
    yq_get_value "example.yaml" ".name"
    echo ""
    
    echo "- 检查路径示例:"
    if yq_has_path "example.yaml" ".version"; then
      echo "version 字段存在"
    else
      echo "version 字段不存在"
    fi
    echo ""
  else
    notice_warning "示例YAML文件 example.yaml 不存在，跳过yq操作示例"
  fi
  
  notice_success "示例运行完成"
}

# 如果直接运行此脚本，显示帮助
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [ "$1" = "--examples" ] || [ "$1" = "-e" ]; then
    run_examples
  else
    notice_info "此脚本提供以下功能:"
    echo "  1. 系统环境检测 (check_environment)"
    echo "  2. yq依赖检测 (check_yq_dependency)"
    echo "  3. 工作区检测 (check_workspace)"
    echo "  4. YAML配置文件解析 (parse_yaml_config)"
    echo "  5. 命令行参数解析 (parse_arguments)"
    echo "  6. yq常用操作 (yq_*)"
    echo ""
    echo "使用 --examples 或 -e 参数可以运行示例"
  fi
fi
