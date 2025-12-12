以下是根据你提供的脚本生成的说明文档：

### 脚本概述
这些脚本主要包含了Git操作、文件处理、通知处理以及通用工具处理等功能，旨在提供便捷、安全的操作封装，使各项任务更加高效。

### 各脚本功能及函数说明

#### 1. `git-handle.sh`
此脚本提供了与Git操作相关的函数，如仓库检查、代码拉取推送、分支管理等。

| 函数名 | 参数 | 返回值 | 使用方法 |
| ---- | ---- | ---- | ---- |
| `check_git_repository` | `$1: 项目路径，默认为当前目录` | `0 - 是Git项目<br>1 - 不是Git项目` | `check_git_repository /path/to/repo` |
| `git_list_branches` | `$1: 项目路径，默认为当前目录<br>$2: 分支类型 ("all" 表示所有分支，"remote" 表示远程分支，默认为本地分支)` | `0 - 成功<br>1 - 失败` | `git_list_branches /path/to/repo all` |
| `git_current_branch` | `$1: 项目路径，默认为当前目录` | `0 - 成功，并打印分支名称<br>1 - 失败` | `git_current_branch /path/to/repo` |

#### 2. `file-handle.sh`
该脚本提供了文件和文件夹的创建、删除、读写、权限设置等操作。

| 函数名 | 参数 | 返回值 | 使用方法 |
| ---- | ---- | ---- | ---- |
| `create_file` | `$1: 文件路径` | `0 - 成功<br>1 - 失败` | `create_file /path/to/file.txt` |
| `create_directory` | `$1: 文件夹路径` | `0 - 成功<br>1 - 失败` | `create_directory /path/to/directory` |
| `delete_file` | `$1: 文件路径` | `0 - 成功<br>1 - 失败` | `delete_file /path/to/file.txt` |
| `delete_directory` | `$1: 文件夹路径<br>$2: 是否强制删除 ("force" 表示强制删除)` | `0 - 成功<br>1 - 失败` | `delete_directory /path/to/directory force` |
| `rename_directory` | `$1: 旧文件夹路径<br>$2: 新文件夹路径` | `0 - 成功<br>1 - 失败` | `rename_directory old/directory/path new/directory/path` |
| `rename_file` | `$1: 旧文件路径<br>$2: 新文件路径` | `0 - 成功<br>1 - 失败` | `rename_file old/file/path.txt new/file/path.txt` |
| `copy_file` | `$1: 源文件路径<br>$2: 目标文件路径<br>$3: 是否强制覆盖 ("force" 表示强制覆盖)` | `0 - 成功<br>1 - 失败` | `copy_file source/file.txt target/file.txt force` |
| `copy_directory` | `$1: 源文件夹路径<br>$2: 目标文件夹路径<br>$3: 是否强制覆盖 ("force" 表示强制覆盖)` | `0 - 成功<br>1 - 失败` | `copy_directory source/dir target/dir force` |
| `file_exists` | `$1: 文件路径` | `0 - 文件存在<br>1 - 文件不存在` | `file_exists /path/to/file.txt` |
| `directory_exists` | `$1: 文件夹路径` | `0 - 文件夹存在<br>1 - 文件夹不存在` | `directory_exists /path/to/directory` |
| `get_file_size` | `$1: 文件路径<br>$2: 单位 (B, K, M, G)` | `0 - 成功<br>1 - 失败` | `get_file_size /path/to/file.txt M` |
| `read_file_content` | `$1: 文件路径` | `0 - 成功<br>1 - 失败` | `read_file_content /path/to/file.txt` |
| `write_file_content` | `$1: 文件路径<br>$2: 要写入的内容<br>$3: 是否覆盖已存在的文件 ("force" 表示强制覆盖)` | `0 - 成功<br>1 - 失败` | `write_file_content /path/to/file.txt "Hello, World!" force` |
| `append_file_content` | `$1: 文件路径<br>$2: 要追加的内容` | `0 - 成功<br>1 - 失败` | `append_file_content /path/to/file.txt "New line"` |
| `find_files` | `$1: 目录路径<br>$2: 文件名模式（支持通配符）<br>$3: 是否递归搜索 ("recursive" 表示递归)` | `0 - 成功<br>1 - 失败` | `find_files /path/to/search "*.txt" recursive` |
| `find_directories` | `$1: 目录路径<br>$2: 文件夹名模式（支持通配符）<br>$3: 是否递归搜索 ("recursive" 表示递归)` | `0 - 成功<br>1 - 失败` | `find_directories /path/to/search "data*" recursive` |
| `set_file_permission` | `$1: 文件路径<br>$2: 权限模式 (例如: "755", "644")` | `0 - 成功<br>1 - 失败` | `set_file_permission /path/to/file.txt "755"` |
| `compare_files` | `$1: 第一个文件路径<br>$2: 第二个文件路径` | `0 - 文件内容相同<br>1 - 文件内容不同或出错` | `compare_files file1.txt file2.txt` |
| `get_file_type` | `$1: 文件路径` | `0 - 成功<br>1 - 失败` | `get_file_type /path/to/file` |
| `check_file_checksum` | `$1: 文件路径<br>$2: 校验和算法 (md5, sha1, sha256, sha512)<br>$3: 期望的校验和值 (可选)` | `0 - 校验成功或校验和已输出<br>1 - 校验失败或出错` | `check_file_checksum /path/to/file.txt sha256` |
| `get_file_mtime` | `$1: 文件路径` | `0 - 成功<br>1 - 失败` | `get_file_mtime /path/to/file.txt` |
| `encrypt_file` | `$1: 文件路径<br>$2: 加密后文件路径<br>$3: 密码` | `0 - 成功<br>1 - 失败` | `encrypt_file /path/to/file.txt /path/to/file.enc "password123"` |
| `watch_file_changes` | `$1: 要监控的文件路径<br>$2: 检查间隔时间（秒，默认为 1）<br>$3: 运行最大时间（秒，默认为 60）` | `0 - 文件被修改或创建<br>1 - 超时或出错` | `watch_file_changes /path/to/file.txt 2 120` |

#### 3. `notice-handle.sh`
该脚本提供了在终端中显示不同类型通知的函数，以及交互式的用户输入、确认、单选和多选菜单功能。

| 函数名 | 参数 | 返回值 | 使用方法 |
| ---- | ---- | ---- | ---- |
| `notice_info` | `$1: 消息内容` | `0 - 成功<br>1 - 失败` | `notice_info "这是一条信息通知"` |
| `notice_success` | `$1: 消息内容` | `0 - 成功<br>1 - 失败` | `notice_success "操作成功完成"` |
| `notice_warning` | `$1: 消息内容` | `0 - 成功<br>1 - 失败` | `notice_warning "请注意这个警告"` |
| `notice_error` | `$1: 消息内容` | `0 - 成功<br>1 - 失败` | `notice_error "发生了错误"` |
| `notice_debug` | `$1: 消息内容` | `0 - 成功<br>1 - 失败` | `DEBUG=true notice_debug "这是调试信息"` |
| `notice_system` | `$1: 通知类型<br>$2: 消息内容` | `0 - 成功<br>1 - 失败` | `notice_system "系统通知" "这是一条系统通知消息"` |
| `notice_progress` | `$1: 当前进度<br>$2: 总进度<br>$3: 描述信息` | `0 - 成功<br>1 - 失败` | `notice_progress 5 10 "文件下载中"` |
| `notice_prompt` | `$1: 提示文本<br>$2: 用于存储用户输入的变量名<br>$3: 默认值 (可选)` | `0 - 成功<br>1 - 失败` | `notice_prompt "请输入您的名字" "user_name"` |
| `notice_confirm` | `$1: 提示文本<br>$2: 默认选项 (可选，"y"或"n"，默认为"n")` | `0 - 用户确认是<br>1 - 用户确认否` | `notice_confirm "是否继续?"` |
| `notice_select_menu` | `$1: 菜单标题<br>$2: 用于存储选择结果的变量名<br>$3...$n: 菜单选项` | `0 - 用户选择了一个选项<br>1 - 用户取消选择 (按q)<br>2 - 参数错误` | `notice_select_menu "请选择一个操作系统" "selected_os" "Linux" "MacOS" "Windows" "其他"` |
| `notice_multi_select_menu` | `$1: 菜单标题<br>$2: 用于存储选择结果的变量名 (将存储为选中项的索引，用逗号分隔)<br>$3...$n: 菜单选项` | `0 - 用户完成选择<br>1 - 用户取消选择 (按q)<br>2 - 参数错误` | `notice_multi_select_menu "请选择您喜欢的编程语言" "selected_langs" "Python" "JavaScript" "Bash" "Go" "Rust" "Java"` |

#### 4. `other-handle.sh`
此脚本提供了通用工具函数，如系统环境检测、依赖检测、配置文件解析等。

| 函数名 | 参数 | 返回值 | 使用方法 |
| ---- | ---- | ---- | ---- |
| `check_environment` | 无 | `0 - 成功检测<br>1 - 检测失败` | `check_environment` |
| `parse_yaml_config` | `$1: YAML配置文件路径<br>$2: 用于存储解析后配置的关联数组名称` | `0 - 成功解析配置<br>1 - 解析失败` | `declare -A CONFIG; parse_yaml_config "config.yaml" CONFIG` |
| `parse_arguments` | `$@: 所有命令行参数` | `0 - 成功解析参数<br>1 - 解析参数时出错` | `parse_arguments --name="示例项目" --debug -v -o output.txt input1.txt input2.txt` |
| `yq_get_value` | `$1: YAML文件路径<br>$2: YAML路径表达式` | `0 - 成功获取值<br>1 - 失败` | `yq_get_value "example.yaml" ".name"` |
| `yq_has_path` | `$1: YAML文件路径<br>$2: YAML路径表达式` | `0 - 路径存在<br>1 - 路径不存在` | `yq_has_path "example.yaml" ".version"` |
| `run_examples` | 无 | 无 | `run_examples` |

### 总结
这些脚本涵盖了Git操作、文件处理、通知显示和通用工具等多个方面，通过封装常用操作，提高了脚本的可维护性和易用性。在使用时，可根据具体需求调用相应的函数，并按照函数说明提供正确的参数。