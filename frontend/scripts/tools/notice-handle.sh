#!/bin/bash

#######################################
# 通知处理脚本
# 
# 此脚本提供了一系列用于在终端中显示不同类型通知的函数，
# 包括普通信息、成功、警告、错误、调试信息等，以及交互式
# 的用户输入、确认、单选和多选菜单功能。
#
# 作者: chudong
# 版本: 1.0.0
#######################################

# 定义颜色
RED='\033[0;31m'          # 错误
GREEN='\033[0;32m'        # 成功
YELLOW='\033[0;33m'       # 警告
BLUE='\033[0;34m'         # 信息
PURPLE='\033[0;35m'       # 调试
CYAN='\033[0;36m'         # 提示
NC='\033[0m'              # 无颜色

#######################################
# 普通信息通知
# 参数:
#   $1: 消息内容
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
notice_info() {
  local message="$1"
  
  if [ -z "$message" ]; then
    echo "${BLUE}[信息] 未提供消息内容${NC}"
    return 1
  fi
  
  echo "${BLUE}[信息] $message${NC}"
  return 0
}

#######################################
# 成功信息通知
# 参数:
#   $1: 消息内容
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
notice_success() {
  local message="$1"
  
  if [ -z "$message" ]; then
    echo "${GREEN}[成功] 未提供消息内容${NC}"
    return 1
  fi
  
  echo "${GREEN}[成功] $message${NC}"
  return 0
}

#######################################
# 警告信息通知
# 参数:
#   $1: 消息内容
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
notice_warning() {
  local message="$1"
  
  if [ -z "$message" ]; then
    echo "${YELLOW}[警告] 未提供消息内容${NC}"
    return 1
  fi
  
  echo "${YELLOW}[警告] $message${NC}"
  return 0
}

#######################################
# 错误信息通知
# 参数:
#   $1: 消息内容
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
notice_error() {
  local message="$1"
  
  if [ -z "$message" ]; then
    echo "${RED}[错误] 未提供消息内容${NC}"
    return 1
  fi
  
  echo "${RED}[错误] $message${NC}"
  return 0
}

#######################################
# 调试信息通知（仅在调试模式下显示）
# 参数:
#   $1: 消息内容
# 环境变量:
#   DEBUG: 设置为 "true" 时启用调试输出
# 返回值:
#   0 - 成功
#   1 - 失败（仅在调试模式下且未提供消息内容时）
#######################################
notice_debug() {
  local message="$1"
  local debug_mode="${DEBUG:-false}"
  
  if [ "$debug_mode" = "true" ]; then
    if [ -z "$message" ]; then
      echo "${PURPLE}[调试] 未提供消息内容${NC}"
      return 1
    fi
    
    echo "${PURPLE}[调试] $message${NC}"
  fi
  
  return 0
}

#######################################
# 系统通知（使用系统原生通知功能）
# 参数:
#   $1: 通知标题
#   $2: 通知消息内容
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
notice_system() {
  local title="$1"
  local message="$2"
  
  if [ -z "$title" ] || [ -z "$message" ]; then
    echo "${RED}[错误] 系统通知需要标题和消息内容${NC}"
    return 1
  fi
  
  # 检测系统类型，使用适当的系统通知方法
  if [ "$(uname)" = "Darwin" ]; then
    # MacOS
    osascript -e "display notification \"$message\" with title \"$title\""
  elif [ "$(uname)" = "Linux" ] && command -v notify-send &> /dev/null; then
    # Linux 并且有 notify-send
    notify-send "$title" "$message"
  else
    # 回退到普通输出
    echo "${CYAN}[系统通知] $title: $message${NC}"
  fi
  
  return 0
}

#######################################
# 进度条通知
# 参数:
#   $1: 当前进度值
#   $2: 总进度值
#   $3: 进度描述 (可选，默认为"处理中")
# 返回值:
#   0 - 成功
#   1 - 失败
#######################################
notice_progress() {
  local current="$1"
  local total="$2"
  local description="${3:-处理中}"
  
  if [ -z "$current" ] || [ -z "$total" ]; then
    echo "${RED}[错误] 进度条需要当前值和总值${NC}"
    return 1
  fi
  
  # 计算百分比
  local percent=$((current * 100 / total))
  local completed=$((percent / 2))
  local remaining=$((50 - completed))
  
  # 创建进度条
  local bar="["
  for ((i=0; i<completed; i++)); do
    bar+="#"
  done
  
  for ((i=0; i<remaining; i++)); do
    bar+="-"
  done
  
  bar+="] $percent%"
  
  # 显示进度条
  echo -n "${CYAN}$description: $bar\r${NC}"
  
  # 如果完成了，添加换行
  if [ "$current" -ge "$total" ]; then
    echo ""
  fi
  
  return 0
}

#######################################
# 用户输入提示
# 参数:
#   $1: 提示文本
#   $2: 用于存储用户输入的变量名
#   $3: 默认值 (可选)
# 返回值:
#   0 - 成功
#   1 - 失败
# 注意:
#   此函数通过 eval 设置调用者环境中的变量，
#   必须通过 source 方式调用脚本才能生效
#######################################
notice_prompt() {
  local prompt="$1"
  local variable_name="$2"
  local default_value="$3"
  
  if [ -z "$prompt" ] || [ -z "$variable_name" ]; then
    echo "${RED}[错误] 用户输入提示需要提示文本和变量名${NC}"
    return 1
  fi
  
  local input=""
  
  # 显示带有默认值的提示（如果有）
  if [ -n "$default_value" ]; then
    echo -n "${CYAN}$prompt [${default_value}]: ${NC}"
    read input
    
    # 如果用户未输入任何内容，使用默认值
    if [ -z "$input" ]; then
      input="$default_value"
    fi
  else
    echo -n "${CYAN}$prompt: ${NC}"
    read input
  fi
  
  # 为调用脚本设置变量
  # 注意：这只在 source 调用此脚本时有效
  eval "$variable_name=\"$input\""
  
  return 0
}

#######################################
# 确认消息通知（询问用户是/否）
# 参数:
#   $1: 提示文本
#   $2: 默认选项 (可选，"y"或"n"，默认为"n")
# 返回值:
#   0 - 用户确认是
#   1 - 用户确认否
#######################################
notice_confirm() {
  local message="$1"
  local default="${2:-n}"  # 默认为否
  
  if [ -z "$message" ]; then
    echo "${RED}[错误] 确认消息需要提示文本${NC}"
    return 1
  fi
  
  local prompt=""
  
  # 根据默认值设置提示
  if [ "$default" = "y" ]; then
    prompt="[Y/n]"
  else
    prompt="[y/N]"
  fi
  
  # 询问用户
  while true; do
    echo -n "${CYAN}$message $prompt ${NC}"
    read response
    
    # 如果用户未输入任何内容，使用默认值
    if [ -z "$response" ]; then
      response="$default"
    fi
    
    # 检查响应
    case "$response" in
      [Yy]*)
        return 0
        ;;
      [Nn]*)
        return 1
        ;;
      *)
        echo "${YELLOW}请输入 y 或 n${NC}"
        ;;
    esac
  done
}

#######################################
# 单选菜单函数，支持键盘方向键控制
# 参数:
#   $1: 菜单标题
#   $2: 用于存储选择结果的变量名
#   $3...$n: 菜单选项
# 使用方法:
#   notice_select_menu "请选择一个选项" "selected_option" "选项1" "选项2" "选项3"
#   echo "用户选择了: $selected_option"
# 返回值:
#   0 - 用户选择了一个选项
#   1 - 用户取消选择 (按q)
#   2 - 参数错误
#######################################
notice_select_menu() {
  local title="$1"
  local return_var="$2"
  
  # 检查参数
  if [ -z "$title" ] || [ -z "$return_var" ] || [ $# -lt 3 ]; then
    echo "${RED}[错误] 单选菜单需要标题、返回变量名和至少一个选项${NC}"
    return 2
  fi
  
  # 移除前两个参数，剩下的是菜单选项
  shift 2
  local options=("$@")
  local selected=0
  local option_count=${#options[@]}
  local result=""
  
  # 检查是否支持 tput (但不强制依赖)
  local has_tput=false
  if command -v tput &>/dev/null; then
    has_tput=true
  fi
  
  # 隐藏光标 (如果支持)
  if [ "$has_tput" = true ]; then
    tput civis 2>/dev/null || true
  fi
  
  # 保存终端设置
  local saved_tty=""
  if [ -t 0 ]; then
    saved_tty=$(stty -g)
  fi
  
  # 设置终端为非规范模式，禁用回显
  stty -icanon -echo 2>/dev/null || true
  
  while true; do
    # 清屏和显示标题
    clear 2>/dev/null || printf "\033c" || echo -e "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
    echo "${CYAN}$title${NC}"
    echo "${CYAN}(使用方向键↑↓移动，回车确认，q退出)${NC}"
    echo ""
    
    # 显示选项
    for i in "${!options[@]}"; do
      if [ $i -eq $selected ]; then
        echo "${GREEN}>> $((i+1)). ${options[$i]} <<${NC}"
      else
        echo "   $((i+1)). ${options[$i]}"
      fi
    done
    
    # 读取用户输入
    local key=""
    IFS= read -r -s -n1 key
    
    # 处理特殊键
    if [[ $key == $'\e' ]]; then
      if read -r -s -n2 -t 0.1 key2; then
        key+="$key2"
      fi
      
      case "$key" in
        $'\e[A') # 上箭头
          ((selected--))
          if [ $selected -lt 0 ]; then
            selected=$((option_count - 1))
          fi
          ;;
        $'\e[B') # 下箭头
          ((selected++))
          if [ $selected -ge $option_count ]; then
            selected=0
          fi
          ;;
        $'\e[C'|$'\e[D') # 左右箭头 (忽略)
          ;;
        *) # 其他ESC序列 (忽略)
          ;;
      esac
      continue
    fi
    
    # 处理其他键
    case "$key" in
      "q"|"Q")
        # 恢复终端设置
        if [ -n "$saved_tty" ]; then
          stty "$saved_tty" 2>/dev/null || true
        fi
        # 显示光标 (如果支持)
        if [ "$has_tput" = true ]; then
          tput cnorm 2>/dev/null || true
        fi
        echo ""
        return 1
        ;;
      "w"|"W") # 向上兼容原始的 w/s 控制
        ((selected--))
        if [ $selected -lt 0 ]; then
          selected=$((option_count - 1))
        fi
        ;;
      "s"|"S") # 向上兼容原始的 w/s 控制
        ((selected++))
        if [ $selected -ge $option_count ]; then
          selected=0
        fi
        ;;
      "")  # 回车键
        result="$selected"
        break
        ;;
      [0-9]) # 数字键 - 直接跳转
        local num=$((key - 1))
        if [ $num -ge 0 ] && [ $num -lt $option_count ]; then
          selected=$num
          result="$selected"
          break
        fi
        ;;
    esac
  done
  
  # 恢复终端设置
  if [ -n "$saved_tty" ]; then
    stty "$saved_tty" 2>/dev/null || true
  fi
  
  # 显示光标 (如果支持)
  if [ "$has_tput" = true ]; then
    tput cnorm 2>/dev/null || true
  fi
  
  # 设置返回变量
  eval "$return_var=\"$result\""
  
  echo ""
  echo "${GREEN}已选择: ${options[$result]}${NC}"
  
  return 0
}

#######################################
# 多选菜单函数，支持键盘方向键控制
# 参数:
#   $1: 菜单标题
#   $2: 用于存储选择结果的变量名 (将存储为选中项的索引，用逗号分隔)
#   $3...$n: 菜单选项
# 使用方法:
#   notice_multi_select_menu "请选择多个选项" "selected_options" "选项1" "选项2" "选项3"
#   echo "用户选择了索引: $selected_options"
#   IFS=',' read -ra SELECTED_INDICES <<< "$selected_options"
#   for i in "${SELECTED_INDICES[@]}"; do
#     echo "选中了选项: ${原选项数组[$i]}"
#   done
# 返回值:
#   0 - 用户完成选择
#   1 - 用户取消选择 (按q)
#   2 - 参数错误
#######################################
notice_multi_select_menu() {
  local title="$1"
  local return_var="$2"
  
  # 检查参数
  if [ -z "$title" ] || [ -z "$return_var" ] || [ $# -lt 3 ]; then
    echo "${RED}[错误] 多选菜单需要标题、返回变量名和至少一个选项${NC}"
    return 2
  fi
  
  # 移除前两个参数，剩下的是菜单选项
  shift 2
  local options=("$@")
  local cursor=0
  local option_count=${#options[@]}
  local result=""
  
  # 初始化选中状态数组 (0表示未选中，1表示已选中)
  local selected_status=()
  for ((i=0; i<option_count; i++)); do
    selected_status[$i]=0
  done
  
  # 检查是否支持 tput (但不强制依赖)
  local has_tput=false
  if command -v tput &>/dev/null; then
    has_tput=true
  fi
  
  # 隐藏光标 (如果支持)
  if [ "$has_tput" = true ]; then
    tput civis 2>/dev/null || true
  fi
  
  # 保存终端设置
  local saved_tty=""
  if [ -t 0 ]; then
    saved_tty=$(stty -g)
  fi
  
  # 设置终端为非规范模式，禁用回显
  stty -icanon -echo 2>/dev/null || true
  
  while true; do
    # 清屏和显示标题
    clear 2>/dev/null || printf "\033c" || echo -e "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
    echo "${CYAN}$title${NC}"
    echo "${CYAN}(使用方向键↑↓移动，空格键选择/取消，回车确认，q退出)${NC}"
    echo ""
    
    # 显示选项
    for i in "${!options[@]}"; do
      if [ $i -eq $cursor ]; then
        if [ ${selected_status[$i]} -eq 1 ]; then
          echo "${GREEN}>> [X] ${options[$i]} <<${NC}"
        else
          echo "${GREEN}>> [ ] ${options[$i]} <<${NC}"
        fi
      else
        if [ ${selected_status[$i]} -eq 1 ]; then
          echo "   [X] ${options[$i]}"
        else
          echo "   [ ] ${options[$i]}"
        fi
      fi
    done
    
    # 读取用户输入
    local key=""
    IFS= read -r -s -n1 key
    
    # 处理特殊键
    if [[ $key == $'\e' ]]; then
      if read -r -s -n2 -t 0.1 key2; then
        key+="$key2"
      fi
      
      case "$key" in
        $'\e[A') # 上箭头
          ((cursor--))
          if [ $cursor -lt 0 ]; then
            cursor=$((option_count - 1))
          fi
          ;;
        $'\e[B') # 下箭头
          ((cursor++))
          if [ $cursor -ge $option_count ]; then
            cursor=0
          fi
          ;;
        $'\e[C') # 右箭头 (忽略)
          ;;
        $'\e[D') # 左箭头 (忽略)
          ;;
        *) # 其他ESC序列 (忽略)
          ;;
      esac
      continue
    fi
    
    # 处理其他键
    case "$key" in
      "q"|"Q")
        # 恢复终端设置
        if [ -n "$saved_tty" ]; then
          stty "$saved_tty" 2>/dev/null || true
        fi
        # 显示光标 (如果支持)
        if [ "$has_tput" = true ]; then
          tput cnorm 2>/dev/null || true
        fi
        echo ""
        return 1
        ;;
      " ")  # 空格键
        # 切换选中状态
        if [ ${selected_status[$cursor]} -eq 0 ]; then
          selected_status[$cursor]=1
        else
          selected_status[$cursor]=0
        fi
        ;;
      "")  # 回车键
        # 构建结果字符串 (选中项的索引，用逗号分隔)
        local first=true
        for i in "${!selected_status[@]}"; do
          if [ ${selected_status[$i]} -eq 1 ]; then
            if [ "$first" = true ]; then
              result="$i"
              first=false
            else
              result="$result,$i"
            fi
          fi
        done
        break
        ;;
      [0-9]) # 数字键 - 直接跳转
        local num=$((key))
        if [ $num -lt $option_count ]; then
          cursor=$num
        fi
        ;;
    esac
  done
  
  # 恢复终端设置
  if [ -n "$saved_tty" ]; then
    stty "$saved_tty" 2>/dev/null || true
  fi
  
  # 显示光标 (如果支持)
  if [ "$has_tput" = true ]; then
    tput cnorm 2>/dev/null || true
  fi
  
  # 设置返回变量
  eval "$return_var=\"$result\""
  
  echo ""
  echo "${GREEN}已选择索引: $result${NC}"
  
  # 显示已选项
  if [ -n "$result" ]; then
    echo "${GREEN}已选择选项:${NC}"
    IFS=',' read -ra SELECTED_INDICES <<< "$result"
    for i in "${SELECTED_INDICES[@]}"; do
      echo "${GREEN}  - ${options[$i]}${NC}"
    done
  else
    echo "${YELLOW}未选择任何选项${NC}"
  fi
  
  return 0
}

#######################################
# 使用示例
#######################################

# notice_info "这是一条信息通知"
# notice_success "操作成功完成"
# notice_warning "请注意这个警告"
# notice_error "发生了错误"
# DEBUG=true notice_debug "这是调试信息"
# notice_system "系统通知" "这是一条系统通知消息"

# # 进度条示例
# for i in {1..10}; do
#   notice_progress $i 10 "文件下载中"
#   sleep 0.5
# done

# # 用户输入示例
# notice_prompt "请输入您的名字" "user_name"
# echo "您好, $user_name!"

# # 确认示例
# if notice_confirm "是否继续?"; then
#   echo "用户选择继续"
# else
#   echo "用户选择取消"
# fi

# # 单选菜单示例
# notice_select_menu "请选择一个操作系统" "selected_os" "Linux" "MacOS" "Windows" "其他"
# echo "您选择了: $selected_os"

# # 多选菜单示例
# notice_multi_select_menu "请选择您喜欢的编程语言" "selected_langs" "Python" "JavaScript" "Bash" "Go" "Rust" "Java"
# echo "选择的索引: $selected_langs"
