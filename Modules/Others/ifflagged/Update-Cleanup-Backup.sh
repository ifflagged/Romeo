# bash <(curl -s https://raw.githubusercontent.com/ifflagged/Neverflagged/main/Tools/VPS/Update-Cleanup.sh)

#!/bin/bash

# 确保脚本以root权限运行
if [[ $EUID -ne 0 ]]; then
   echo "此脚本必须以root权限运行"
   exit 1
fi

start_space=$(df / | tail -n 1 | awk '{print $3}')

# 检测并设置包管理器变量
if command -v apt-get > /dev/null; then
    PKG_MANAGER="apt"
    CLEAN_CMD="apt-get autoremove -y && apt-get clean"
    PKG_UPDATE_CMD="apt-get update"
    UPGRADE_CMD="apt-get full-upgrade -y"
    INSTALL_CMD="apt-get install -y"
    PURGE_CMD="apt-get purge -y"
elif command -v dnf > /dev/null; then
    PKG_MANAGER="dnf"
    CLEAN_CMD="dnf autoremove -y && dnf clean all"
    PKG_UPDATE_CMD="dnf update"
    UPGRADE_CMD="dnf upgrade -y"
    INSTALL_CMD="dnf install -y"
    PURGE_CMD="dnf remove -y"
elif command -v apk > /dev/null; then
    PKG_MANAGER="apk"
    CLEAN_CMD="apk cache clean"
    PKG_UPDATE_CMD="apk update"
    UPGRADE_CMD="apk upgrade"
    INSTALL_CMD="apk add"
    PURGE_CMD="apk del"
else
    echo "不支持的包管理器"
    exit 1
fi

# 更新和升级系统
echo "正在更新和升级系统..."
$PKG_UPDATE_CMD > /dev/null 2>&1
$UPGRADE_CMD > /dev/null 2>&1

# 安装deborphan，如果使用apt包管理器并且deborphan未安装
if [ "$PKG_MANAGER" = "apt" ] && ! command -v deborphan > /dev/null; then
    echo "正在安装依赖deborphan..."
    $PKG_UPDATE_CMD > /dev/null 2>&1
    $INSTALL_CMD deborphan > /dev/null 2>&1
fi

# 删除旧内核（只适用于使用apt和dnf的系统）
echo "正在删除未使用的内核..."
if [[ "$PKG_MANAGER" == "apt" || "$PKG_MANAGER" == "dnf" ]]; then
    current_kernel=$(uname -r | sed 's/-.*//')
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        kernel_packages=$(dpkg --list | grep -E '^ii  linux-(image|headers)-[0-9]+' | awk '{ print $2 }' | grep -v "$current_kernel")
    else
        kernel_packages=$(rpm -qa | grep -E '^kernel-(core|modules|devel)-[0-9]+' | grep -v "$current_kernel")
    fi
    if [ -n "$kernel_packages" ]; then
        echo "找到旧内核，正在删除：$kernel_packages"
        echo "$kernel_packages" | xargs $PURGE_CMD > /dev/null 2>&1
        [[ "$PKG_MANAGER" == "apt" ]] && update-grub > /dev/null 2>&1
    else
        echo "没有旧内核需要删除。"
    fi
fi

# 额外的清理命令（仅适用于apt）
if [ "$PKG_MANAGER" = "apt" ]; then
    echo "正在运行额外的清理命令..."
    apt autoremove --purge -y > /dev/null 2>&1
    apt autoclean -y > /dev/null 2>&1
    apt remove --purge -y $(dpkg -l | awk '/^rc/ {print $2}') > /dev/null 2>&1
    journalctl --rotate > /dev/null 2>&1
    journalctl --vacuum-time=1s > /dev/null 2>&1
    journalctl --vacuum-size=50M > /dev/null 2>&1
    apt remove --purge -y $(dpkg -l | awk '/^ii linux-(image|headers)-[^ ]+/{print $2}' | grep -v "$current_kernel") > /dev/null 2>&1
    echo "额外的清理命令完成"
fi

# 清理系统日志文件
echo "正在清理系统日志文件..."
log_dirs=("/var/log" "/root" "/home" "/ql")
for dir in "${log_dirs[@]}"; do
    if [ -d "$dir" ]; then
        find "$dir" -type f -name "*.log" -print0 | xargs -0 truncate -s 0 > /dev/null 2>&1
    fi
done
echo "系统日志文件清理完成"

# 清理缓存目录
echo "正在清理缓存目录..."
find /tmp /var/tmp -type f -mtime +1 -print0 | xargs -0 rm -f > /dev/null 2>&1
for user in /home/* /root; do
  cache_dir="$user/.cache"
  if [ -d "$cache_dir" ]; then
    rm -rf "$cache_dir"/* > /dev/null 2>&1
  fi
done
echo "缓存目录清理完成"

# 清理Docker（如果使用Docker）
if command -v docker &> /dev/null; then
    echo "正在清理Docker镜像、容器和卷..."
    docker system prune -a -f --volumes > /dev/null 2>&1
    echo "Docker清理完成"
fi

# 清理孤立包（仅适用于apt）
if [ "$PKG_MANAGER" = "apt" ];then
    if command -v deborphan > /dev/null; then
        echo "正在清理孤立包..."
        deborphan --guess-all | xargs -r apt-get -y remove --purge > /dev/null 2>&1
        echo "孤立包清理完成"
    else
        echo "deborphan 未安装，跳过孤立包清理。"
    fi
fi

# 清理包管理器缓存
echo "正在清理包管理器缓存..."
$CLEAN_CMD > /dev/null 2>&1
echo "包管理器缓存清理完成"

end_space=$(df / | tail -n 1 | awk '{print $3}')
cleared_space=$((start_space - end_space))
echo "系统清理完成，清理了 $((cleared_space / 1024))M 空间！"
