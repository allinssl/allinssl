#!/bin/bash

# 设置工作目录
WORK_DIR="/www/allinssl"

# 检查工作目录是否存在
if [ ! -d "$WORK_DIR" ]; then
  echo "目录 $WORK_DIR 不存在，正在创建..."
  mkdir -p "$WORK_DIR"
fi

# 切换到工作目录
cd "$WORK_DIR" || exit

# 检查二进制文件是否存在
BINARY_FILE="allinssl"
if [ ! -f "$BINARY_FILE" ]; then
  echo "二进制文件 $BINARY_FILE 不存在，请确保已编译并放置在 $WORK_DIR 目录下。"
  exit 1
fi

if [ $# -eq 0 ]; then
  echo "=========== ALLinSSL 控制台 ==========="
  echo "1: 启动服务"
  echo "2: 停止服务"
  echo "3: 重启服务"
  echo "4: 修改安全入口"
  echo "5: 修改用户名"
  echo "6: 修改密码"
  echo "7: 修改端口"
  echo "8: 关闭web服务"
  echo "9: 开启web服务"
  echo "10: 重启web服务"
  echo "11: 关闭后台自动调度"
  echo "12: 开启后台自动调度"
  echo "13: 重启后台自动调度"
  echo "14: 关闭https"
  echo "15: 获取面板地址"
  echo "16: 修复/更新ALLinSSL到最新版本（文件覆盖安装）"
  echo "17: 卸载ALLinSSL"
  echo "========================================"
  read -p "请输入操作编号 (1-17): " user_input

  if [[ ! "$user_input" =~ ^([1-9]|1[0-7])$ ]]; then
    echo "❌ 非法操作编号：$user_input"
    exit 1
  fi

  set -- "$user_input"
fi

function update_allinssl() {
  CN_CHECK=$(curl -sS --connect-timeout 10 -m 10 https://api.bt.cn/api/isCN)
    if [ "${CN_CHECK}" == "True" ];then
      node_host="https://download.allinssl.com"
    else
        node_host="https://node1.allinssl.com"
    fi
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        local url="${node_host}/bin/allinssl-Linux-x86_64.tar.gz"
    elif [[ "$ARCH" == "aarch64" ]]; then
        local url="${node_host}/bin/allinssl-Linux-aarch64.tar.gz"
    else
        echo "不支持$ARCH"
        exit 1
    fi
    local target_dir="${WORK_DIR}"
    local temp_file=$(mktemp)
    local original_filename temp_file
    # 创建目录
    create_directory() {
        echo -e "${BLUE}${GEAR} Creating directory...${NC}"
        ${SUDO} mkdir -p "$target_dir" || {
            echo -e "${RED}${CROSS} Error: Failed to create directory $target_dir${NC}"
            exit 1
        }
    }

    # 下载文件
    download_file() {
        echo -e "${BLUE}${DOWNLOAD} Downloading from $url...${NC}"

        # 获取原始文件名（去除URL参数）
        original_filename=$(basename "$url" | cut -d '?' -f1)
        [[ -z "$original_filename" ]] && {
            echo -e "${RED}${CROSS} Error: Cannot determine filename from URL${NC}"
            exit 1
        }

        temp_file="${temp_dir}/${original_filename}"

        wget --no-check-certificate -O "$temp_file" "$url" || {
            echo -e "${RED}${CROSS} Error: Download failed${NC}"
            exit 1
        }

        echo -e "${BLUE}⚙️ 保存文件名: ${original_filename}${NC}"
    }

    # 解压文件
    extract_file() {
        echo -e "${BLUE}${PACKAGE} Extracting to $target_dir...${NC}"
        case "$temp_file" in
            *.tar.gz|*.tgz)
                ${SUDO} tar xzf "$temp_file" -C "$target_dir"
                ;;
            *.zip)
                ${SUDO} unzip -q "$temp_file" -d "$target_dir"
                ;;
            *)
                echo -e "${RED}${CROSS} 不支持的压缩格式: ${temp_file##*.}${NC}"
                exit 1
                ;;
        esac || {
            echo -e "${RED}${CROSS} 解压失败，请检查文件完整性${NC}"
            exit 1
        }
    }

    set_cloudc() {
        echo -e "${BLUE}${GEAR} Setting up ALLinSSL...${NC}"
        chmod 755 "$target_dir/allinssl"
        chmod +x "$target_dir/allinssl"
        chmod 755 "$target_dir/allinssl.sh"
        chmod +x "$target_dir/allinssl.sh"
        ln -s "$target_dir/allinssl.sh" /usr/bin/allinssl
        cd $target_dir || exit 1
        allinssl 3
    }

    # 清理临时文件
    cleanup() {
        rm -f "$temp_file"
        echo -e "${GREEN}${CLEAN} Temporary files cleaned${NC}"
    }

    # 执行安装流程
    if create_directory && download_file && extract_file; then
        set_cloudc
        cleanup
        echo -e "${GREEN}${CHECK} Successfully installed to $target_dir${NC}"
        return 0
    else
        cleanup
        exit 1
    fi
}

function get_pack_manager(){
	if [ -f "/usr/bin/yum" ] && [ -d "/etc/yum.repos.d" ]; then
		PM="yum"
	elif [ -f "/usr/bin/apt-get" ] && [ -f "/usr/bin/dpkg" ]; then
		PM="apt-get"
	fi
}

function set_firewall(){
	sshPort=$(cat /etc/ssh/sshd_config | grep 'Port '|awk '{print $2}')
	if [ "${PM}" = "apt-get" ]; then
		apt-get install -y ufw
		if [ -f "/usr/sbin/ufw" ];then
			ufw allow 22/tcp
			ufw allow ${panelPort}/tcp
			ufw allow ${sshPort}/tcp
			ufw status
			echo y|ufw enable
			ufw default deny
			ufw reload
		fi
	else
		if [ -f "/etc/init.d/iptables" ];then
			iptables -I INPUT -p tcp -m state --state NEW -m tcp --dport 22 -j ACCEPT
			iptables -I INPUT -p tcp -m state --state NEW -m tcp --dport ${panelPort} -j ACCEPT
			iptables -I INPUT -p tcp -m state --state NEW -m tcp --dport ${sshPort} -j ACCEPT
			iptables -A INPUT -p icmp --icmp-type any -j ACCEPT
			iptables -A INPUT -s localhost -d localhost -j ACCEPT
			iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
			iptables -P INPUT DROP
			service iptables save
			sed -i "s#IPTABLES_MODULES=\"\"#IPTABLES_MODULES=\"ip_conntrack_netbios_ns ip_conntrack_ftp ip_nat_ftp\"#" /etc/sysconfig/iptables-config
			iptables_status=$(service iptables status | grep 'not running')
			if [ "${iptables_status}" == '' ];then
				service iptables restart
			fi
		else
			AliyunCheck=$(cat /etc/redhat-release|grep "Aliyun Linux")
			[ "${AliyunCheck}" ] && return
			yum install firewalld -y
			systemctl enable firewalld
			systemctl start firewalld
			firewall-cmd --set-default-zone=public > /dev/null 2>&1
			firewall-cmd --permanent --zone=public --add-port=22/tcp > /dev/null 2>&1
			firewall-cmd --permanent --zone=public --add-port=${panelPort}/tcp > /dev/null 2>&1
			firewall-cmd --permanent --zone=public --add-port=${sshPort}/tcp > /dev/null 2>&1
			firewall-cmd --reload
		fi
	fi
}

# 判断特殊操作
if [ "$1" == "16" ]; then
  echo "⚠️ 正在准备执行 ALLinSSL 更新操作..."
  read -p "是否继续更新？(y/n): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "已取消更新操作。"
    exit 0
  fi
  echo "✅ 已确认，执行更新操作..."
  update_allinssl
  echo "ALLinSSL 更新完成！"
  exit 0
elif [ "$1" == "17" ]; then
  echo "⚠️ 正在准备执行 ALLinSSL 卸载操作..."
  read -p "是否确认卸载 ALLinSSL？这将删除相关组件，此操作不可逆！(y/n): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "已取消卸载操作。"
    exit 0
  fi

  # 可在此插入卸载逻辑（如删除文件、清除服务等）
  echo "✅ 已确认，执行卸载操作..."
  # 删除工作目录
  rm -rf "$WORK_DIR"
  exit 0
elif [ "$1" == "7" ]; then
  # 先调用二进制程序修改端口
  "./$BINARY_FILE" "$@"
  
  # 获取修改后的端口
  panelPort=$("./$BINARY_FILE" 15 | grep -o ":[0-9]\+" | grep -o "[0-9]\+" | head -n 1)
  echo "检测到新的端口: ${panelPort}"
  
  # 放行新端口
  get_pack_manager
  echo "正在放行端口 ${panelPort}..."
  set_firewall
  
  echo "✅ 端口修改并放行完成！"
  exit 0
elif [ "$1" == "status" ]; then
  # 检查服务状态
  exit 0
fi

# 运行二进制文件
"./$BINARY_FILE" "$@"