#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检测操作系统并设置相关变量
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    SETTINGS_DIR="$HOME/Library/Application Support/Cursor"
    EXTENSIONS_DIR="$HOME/.cursor"
    USER_DIR="$SETTINGS_DIR/User"
    TEMP_ROOT="/tmp"
    PATH_SEP="/"
    STAT_CMD="stat -f"
    STAT_TIME_FORMAT="%Sm"
    STAT_SIZE_FORMAT="%z"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
    # Windows 下使用 APPDATA 环境变量
    if [ -n "$APPDATA" ]; then
        SETTINGS_DIR="$APPDATA/Cursor"
        EXTENSIONS_DIR="$APPDATA/Cursor"
    else
        SETTINGS_DIR="$HOME/AppData/Roaming/Cursor"
        EXTENSIONS_DIR="$HOME/AppData/Roaming/Cursor"
    fi
    USER_DIR="$SETTINGS_DIR/User"
    TEMP_ROOT="$TEMP"
    [ -z "$TEMP_ROOT" ] && TEMP_ROOT="$TMP"
    [ -z "$TEMP_ROOT" ] && TEMP_ROOT="$HOME/AppData/Local/Temp"
    PATH_SEP="/"
    STAT_CMD="stat -c"
    STAT_TIME_FORMAT="%y"
    STAT_SIZE_FORMAT="%s"
else
    echo -e "${RED}错误: 不支持的操作系统${NC}"
    exit 1
fi

# 规范化路径
normalize_path() {
    local path="$1"
    echo "$path" | sed 's/\\/\//g'
}

# 备份目录
BACKUP_DIR="$(normalize_path "$HOME/cursor_backups")"

# 检查目录是否存在
if [ ! -d "$SETTINGS_DIR" ] && [ ! -d "$EXTENSIONS_DIR" ]; then
    echo -e "${RED}错误: 未找到 Cursor 目录${NC}"
    echo -e "${YELLOW}请确保 Cursor 编辑器已经安装并运行过至少一次${NC}"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 获取文件修改时间
get_file_time() {
    local file="$1"
    if [[ "$OS" == "Windows" ]]; then
        # 对于 Windows，使用兼容的时间格式
        $STAT_CMD "$STAT_TIME_FORMAT" "$file" 2>/dev/null || echo "Unknown"
    else
        $STAT_CMD "$STAT_TIME_FORMAT" "$file"
    fi
}

# 获取文件大小
get_file_size() {
    local file="$1"
    if [[ "$OS" == "Windows" ]]; then
        # 对于 Windows，使用兼容的大小获取方式
        $STAT_CMD "$STAT_SIZE_FORMAT" "$file" 2>/dev/null || echo "0"
    else
        $STAT_CMD "$STAT_SIZE_FORMAT" "$file"
    fi
}

# 创建临时目录
create_temp_dir() {
    local prefix="$1"
    local temp_dir
    
    if [[ "$OS" == "Windows" ]]; then
        temp_dir="$(normalize_path "$TEMP_ROOT/$prefix")"
    else
        temp_dir="$TEMP_ROOT/$prefix"
    fi
    
    mkdir -p "$temp_dir"
    echo "$temp_dir"
}

# 获取下一个可用的序号
get_next_sequence() {
    local date=$1
    local max_seq=0
    
    # 查找同一天的备份，获取最大序号
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "cursor_${date}_*" | while read -r backup; do
        if [ -d "$backup" ]; then
            backup_name=$(basename "$backup")
            # 提取日期和序号
            if [[ $backup_name =~ ^cursor_${date}_([0-9]+)$ ]]; then
                seq_num=${BASH_REMATCH[1]}
                if (( seq_num > max_seq )); then
                    max_seq=$seq_num
                fi
            fi
        fi
    done
    
    # 返回下一个序号
    echo $((max_seq + 1))
}

# 获取插件列表
get_extensions_list() {
    local extensions_dir="$(normalize_path "$1")"
    local output_file="$(normalize_path "$2")"
    
    if [ ! -d "$extensions_dir/extensions" ]; then
        echo -e "${YELLOW}! 未找到插件目录${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}正在检查插件列表...${NC}"
    
    # 创建一个临时文件来存储插件信息
    local temp_list="$(create_temp_dir "cursor_ext_list")/extensions.tmp"
    
    # 遍历插件目录
    if [[ "$OS" == "Windows" ]]; then
        # Windows 环境使用 dir /b 命令
        (cd "$extensions_dir/extensions" && cmd //c "dir /b /ad" 2>/dev/null) | while read -r ext_name; do
            local package_json="$extensions_dir/extensions/$ext_name/package.json"
            package_json="$(normalize_path "$package_json")"
            if [ -f "$package_json" ]; then
                # 尝试从 package.json 中提取版本信息
                local version=$(grep -o '"version": *"[^"]*"' "$package_json" 2>/dev/null | cut -d'"' -f4)
                if [ -n "$version" ]; then
                    echo "$ext_name@$version" >> "$temp_list"
                else
                    echo "$ext_name" >> "$temp_list"
                fi
            else
                echo "$ext_name" >> "$temp_list"
            fi
        done
    else
        # Unix 环境使用 find 命令
        find "$extensions_dir/extensions" -maxdepth 1 -type d | while read -r ext_dir; do
            if [ "$ext_dir" != "$extensions_dir/extensions" ]; then
                local ext_name=$(basename "$ext_dir")
                local package_json="$ext_dir/package.json"
                if [ -f "$package_json" ]; then
                    local version=$(grep -o '"version": *"[^"]*"' "$package_json" 2>/dev/null | cut -d'"' -f4)
                    if [ -n "$version" ]; then
                        echo "$ext_name@$version" >> "$temp_list"
                    else
                        echo "$ext_name" >> "$temp_list"
                    fi
                else
                    echo "$ext_name" >> "$temp_list"
                fi
            fi
        done
    fi
    
    # 排序插件列表
    if [ -f "$temp_list" ]; then
        sort "$temp_list" > "$output_file"
        rm -f "$temp_list"
        return 0
    fi
    
    rm -f "$temp_list"
    return 1
}

# 显示插件列表差异
show_extensions_diff() {
    local backup_list="$1"
    local current_list="$2"
    
    if [ ! -f "$backup_list" ] || [ ! -f "$current_list" ]; then
        return 1
    fi
    
    echo -e "\n${YELLOW}插件对比:${NC}"
    
    # 找出新增的插件
    echo -e "\n${GREEN}新增的插件:${NC}"
    comm -13 "$backup_list" "$current_list" | while read -r ext; do
        echo -e "${GREEN}+ $ext${NC}"
    done
    
    # 找出删除的插件
    echo -e "\n${RED}删除的插件:${NC}"
    comm -23 "$backup_list" "$current_list" | while read -r ext; do
        echo -e "${RED}- $ext${NC}"
    done
    
    # 找出相同的插件
    echo -e "\n${YELLOW}保持不变的插件:${NC}"
    comm -12 "$backup_list" "$current_list" | while read -r ext; do
        echo -e "  $ext"
    done
}

# 创建备份
create_backup() {
    # 生成日期和序号
    DATE=$(date +"%Y%m%d")
    SEQ=$(get_next_sequence "$DATE")
    # 格式化序号为两位数
    printf -v SEQ_PADDED "%02d" "$SEQ"
    BACKUP_NAME="cursor_${DATE}_${SEQ_PADDED}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    TEMP_PATH="/tmp/$BACKUP_NAME"
    
    echo -e "${YELLOW}正在创建备份...${NC}"
    echo -e "${YELLOW}操作系统: $OS${NC}"
    echo -e "${YELLOW}设置目录: $SETTINGS_DIR${NC}"
    echo -e "${YELLOW}插件目录: $EXTENSIONS_DIR${NC}"
    
    # 创建临时目录
    mkdir -p "$TEMP_PATH"
    
    # 获取当前插件列表
    local extensions_list="$TEMP_PATH/extensions.list"
    if get_extensions_list "$EXTENSIONS_DIR" "$extensions_list"; then
        echo -e "${GREEN}✓ 已保存插件列表${NC}"
        echo -e "\n${YELLOW}当前安装的插件:${NC}"
        cat "$extensions_list" | while read -r ext; do
            echo "  $ext"
        done
        echo
    fi
    
    # 备份设置文件
    if [ -f "$USER_DIR/settings.json" ]; then
        mkdir -p "$TEMP_PATH/User"
        cp "$USER_DIR/settings.json" "$TEMP_PATH/User/"
        echo -e "${GREEN}✓ 已备份设置文件${NC}"
    else
        echo -e "${YELLOW}! 未找到设置文件${NC}"
    fi
    
    # 备份扩展目录
    if [ -d "$EXTENSIONS_DIR/extensions" ]; then
        cp -r "$EXTENSIONS_DIR/extensions" "$TEMP_PATH/"
        echo -e "${GREEN}✓ 已备份扩展目录${NC}"
    else
        echo -e "${YELLOW}! 未找到扩展目录${NC}"
    fi

    # 压缩备份
    echo -e "${YELLOW}正在压缩备份...${NC}"
    tar -czf "${BACKUP_PATH}.tar.gz" -C "/tmp" "$BACKUP_NAME"
    
    # 清理临时目录
    rm -rf "$TEMP_PATH"
    
    echo -e "${GREEN}备份创建成功: ${BACKUP_PATH}.tar.gz${NC}"
}

# 还原备份
restore_backup() {
    if [ -z "$1" ]; then
        echo -e "${RED}错误: 请指定要还原的备份名称${NC}"
        echo "用法: $0 restore <backup_name>"
        exit 1
    fi
    
    BACKUP_NAME="$1"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    TEMP_PATH="/tmp/$BACKUP_NAME"
    
    if [ ! -f "${BACKUP_PATH}.tar.gz" ]; then
        echo -e "${RED}错误: 未找到备份文件: ${BACKUP_PATH}.tar.gz${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}正在还原备份...${NC}"
    echo -e "${YELLOW}操作系统: $OS${NC}"
    echo -e "${YELLOW}设置目录: $SETTINGS_DIR${NC}"
    echo -e "${YELLOW}插件目录: $EXTENSIONS_DIR${NC}"
    
    # 解压备份到临时目录
    echo -e "${YELLOW}正在解压备份...${NC}"
    rm -rf "$TEMP_PATH"
    tar -xzf "${BACKUP_PATH}.tar.gz" -C "/tmp"
    
    # 获取当前插件列表
    local current_list=$(mktemp)
    local backup_list="$TEMP_PATH/extensions.list"
    
    if get_extensions_list "$EXTENSIONS_DIR" "$current_list"; then
        if [ -f "$backup_list" ]; then
            show_extensions_diff "$backup_list" "$current_list"
            echo
            echo -n "是否继续还原? [y/N] "
            read -r confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}取消还原操作${NC}"
                rm -f "$current_list"
                rm -rf "$TEMP_PATH"
                return
            fi
        fi
    fi
    rm -f "$current_list"
    
    # 还原设置文件
    if [ -f "$TEMP_PATH/User/settings.json" ]; then
        mkdir -p "$USER_DIR"
        cp "$TEMP_PATH/User/settings.json" "$USER_DIR/"
        echo -e "${GREEN}✓ 已还原设置文件${NC}"
    else
        echo -e "${YELLOW}! 备份中未找到设置文件${NC}"
    fi
    
    # 还原扩展目录
    if [ -d "$TEMP_PATH/extensions" ]; then
        rm -rf "$EXTENSIONS_DIR/extensions"
        cp -r "$TEMP_PATH/extensions" "$EXTENSIONS_DIR/"
        echo -e "${GREEN}✓ 已还原扩展目录${NC}"
    else
        echo -e "${YELLOW}! 备份中未找到扩展目录${NC}"
    fi
    
    # 清理临时目录
    rm -rf "$TEMP_PATH"
    
    echo -e "${GREEN}备份还原成功${NC}"
    echo -e "${YELLOW}请重启 Cursor 编辑器以使更改生效${NC}"
}

# 删除备份
delete_backup() {
    if [ -z "$1" ]; then
        echo -e "${RED}错误: 请指定要删除的备份名称${NC}"
        echo "用法: $0 delete <backup_name>"
        exit 1
    fi
    
    BACKUP_NAME="$1"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    if [ ! -f "${BACKUP_PATH}.tar.gz" ]; then
        echo -e "${RED}错误: 未找到备份文件: ${BACKUP_PATH}.tar.gz${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}即将删除备份: $BACKUP_NAME${NC}"
    echo -n "确认删除? [y/N] "
    read -r confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        rm -f "${BACKUP_PATH}.tar.gz"
        echo -e "${GREEN}备份已删除: $BACKUP_NAME${NC}"
    else
        echo -e "${YELLOW}取消删除操作${NC}"
    fi
}

# 删除所有备份
delete_all_backups() {
    # 检查是否有备份
    if ! list_backups; then
        return 1
    fi
    
    echo -e "${YELLOW}警告: 即将删除所有备份!${NC}"
    echo -n "确认删除所有备份? [y/N] "
    read -r confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        rm -f "$BACKUP_DIR"/cursor_*.tar.gz
        echo -e "${GREEN}已删除所有备份${NC}"
    else
        echo -e "${YELLOW}取消删除操作${NC}"
    fi
}

# 格式化文件大小
format_size() {
    local size=$1
    local units=("B" "KiB" "MiB" "GiB" "TiB")
    local unit=0
    
    while (( size > 1024 && unit < 4 )); do
        size=$(( (size + 512) / 1024 ))
        ((unit++))
    done
    
    echo "${size}${units[$unit]}"
}

# 列出备份并返回备份名称数组
list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}未找到备份${NC}"
        return 1
    fi
    
    # 创建一个数组来存储备份名称
    backup_names=()
    
    echo -e "${YELLOW}可用的备份:${NC}"
    id=1
    
    if [[ "$OS" == "Windows" ]]; then
        # Windows 环境使用 dir 命令
        (cd "$BACKUP_DIR" && cmd //c "dir /b *.tar.gz" 2>/dev/null) | sort -r | while read -r backup_file; do
            local backup="$BACKUP_DIR/$backup_file"
            backup="$(normalize_path "$backup")"
            if [ -f "$backup" ]; then
                local backup_name=$(basename "$backup" .tar.gz)
                backup_names+=("$backup_name")
                local backup_time=$(get_file_time "$backup")
                local backup_size=$(get_file_size "$backup")
                local formatted_size=$(format_size "$backup_size")
                printf "%2d) %s (%s) [%8s]\n" $id "$backup_name" "$backup_time" "$formatted_size"
                ((id++))
            fi
        done
    else
        # Unix 环境使用 find 命令
        find "$BACKUP_DIR" -maxdepth 1 -type f -name "cursor_*.tar.gz" | sort -r | while read -r backup; do
            if [ -f "$backup" ]; then
                local backup_name=$(basename "$backup" .tar.gz)
                backup_names+=("$backup_name")
                local backup_time=$(get_file_time "$backup")
                local backup_size=$(get_file_size "$backup")
                local formatted_size=$(format_size "$backup_size")
                printf "%2d) %s (%s) [%8s]\n" $id "$backup_name" "$backup_time" "$formatted_size"
                ((id++))
            fi
        done
    fi
    
    # 如果没有找到备份
    if [ ${#backup_names[@]} -eq 0 ]; then
        echo -e "${YELLOW}没有可用的备份${NC}"
        return 1
    fi
    
    return 0
}

# 根据ID获取备份名称
get_backup_by_id() {
    local id=$1
    local -a backup_names=()
    
    # 获取所有备份名称并排序
    find "$BACKUP_DIR" -maxdepth 1 -type f -name "cursor_*.tar.gz" | sort -r | while read -r backup; do
        if [ -f "$backup" ]; then
            backup_name=$(basename "$backup" .tar.gz)
            backup_names+=("$backup_name")
        fi
    done
    
    # 检查ID是否有效
    if [ "$id" -le 0 ] || [ "$id" -gt "${#backup_names[@]}" ]; then
        return 1
    fi
    
    # 返回对应的备份名称
    echo "${backup_names[$((id-1))]}"
    return 0
}

# 显示帮助信息
show_help() {
    echo -e "${GREEN}Cursor 编辑器备份工具${NC}"
    echo -e "${YELLOW}当前操作系统: $OS${NC}"
    if [[ "$OS" == "macOS" ]]; then
        echo -e "${YELLOW}设置目录: $SETTINGS_DIR${NC}"
        echo -e "${YELLOW}插件目录: $EXTENSIONS_DIR${NC}"
    else
        echo -e "${YELLOW}Cursor 目录: $SETTINGS_DIR${NC}"
    fi
    echo -e "${YELLOW}备份目录: $BACKUP_DIR${NC}"
    echo
    echo "用法:"
    echo "  创建备份: $0 backup"
    echo "  还原备份: $0 restore <backup_name>"
    echo "  删除备份: $0 delete <backup_name>"
    echo "  删除所有: $0 delete-all"
    echo "  列出备份: $0 list"
    echo "  显示帮助: $0 help"
}

# 显示菜单并获取用户选择
show_menu() {
    clear
    echo -e "${GREEN}Cursor 编辑器备份工具${NC}"
    echo -e "${YELLOW}当前操作系统: $OS${NC}"
    if [[ "$OS" == "macOS" ]]; then
        echo -e "${YELLOW}设置目录: $SETTINGS_DIR${NC}"
        echo -e "${YELLOW}插件目录: $EXTENSIONS_DIR${NC}"
    else
        echo -e "${YELLOW}Cursor 目录: $SETTINGS_DIR${NC}"
    fi
    echo -e "${YELLOW}备份目录: $BACKUP_DIR${NC}"
    echo
    echo "请选择操作:"
    echo "1) 创建备份"
    echo "2) 还原备份"
    echo "3) 删除备份"
    echo "4) 删除所有备份"
    echo "5) 列出备份"
    echo "0) 退出"
    echo
    echo -n "请输入选项 [0-5]: "
    read -r choice

    case $choice in
        1)
            create_backup
            ;;
        2)
            # 显示可用备份并获取用户选择
            echo
            if list_backups; then
                echo
                echo -n "请输入要还原的备份ID: "
                read -r backup_id
                if [[ "$backup_id" =~ ^[0-9]+$ ]]; then
                    backup_name=$(get_backup_by_id "$backup_id")
                    if [ -n "$backup_name" ]; then
                        restore_backup "$backup_name"
                    else
                        echo -e "${RED}错误: 无效的备份ID${NC}"
                    fi
                else
                    echo -e "${RED}错误: 请输入有效的数字ID${NC}"
                fi
            fi
            ;;
        3)
            # 显示可用备份并获取用户选择
            echo
            if list_backups; then
                echo
                echo -n "请输入要删除的备份ID: "
                read -r backup_id
                if [[ "$backup_id" =~ ^[0-9]+$ ]]; then
                    backup_name=$(get_backup_by_id "$backup_id")
                    if [ -n "$backup_name" ]; then
                        delete_backup "$backup_name"
                    else
                        echo -e "${RED}错误: 无效的备份ID${NC}"
                    fi
                else
                    echo -e "${RED}错误: 请输入有效的数字ID${NC}"
                fi
            fi
            ;;
        4)
            delete_all_backups
            ;;
        5)
            list_backups
            ;;
        0)
            echo "退出程序"
            exit 0
            ;;
        *)
            echo -e "${RED}无效的选项${NC}"
            ;;
    esac
    
    echo
    echo -n "按回车键继续..."
    read -r
    show_menu
}

# 主程序
if [ $# -eq 0 ]; then
    # 如果没有命令行参数，显示交互式菜单
    show_menu
else
    # 保持原有的命令行参数支持
    case "$1" in
        "backup")
            create_backup
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "delete")
            delete_backup "$2"
            ;;
        "delete-all")
            delete_all_backups
            ;;
        "list")
            list_backups
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}未知命令: $1${NC}"
            show_help
            exit 1
            ;;
    esac
fi 