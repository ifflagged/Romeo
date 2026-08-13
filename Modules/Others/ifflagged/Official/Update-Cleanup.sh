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
    CLEAN_CMDS=("apt-get autoremove -y" "apt-get clean" "apt-get autoclean")
    PKG_UPDATE_CMD="apt-get update -y"
    UPGRADE_CMD="apt-get full-upgrade -y"
    INSTALL_CMD="apt-get install -y"
    PURGE_CMD="apt-get purge -y"
elif command -v dnf > /dev/null; then
    PKG_MANAGER="dnf"
    CLEAN_CMDS=("dnf autoremove -y" "dnf clean all")
    PKG_UPDATE_CMD="dnf update -y"
    UPGRADE_CMD="dnf upgrade -y"
    INSTALL_CMD="dnf install -y"
    PURGE_CMD="dnf remove -y"
elif command -v apk > /dev/null; then
    PKG_MANAGER="apk"
    CLEAN_CMDS=("apk cache clean")
    PKG_UPDATE_CMD="apk update"
    UPGRADE_CMD="apk upgrade -a"
    INSTALL_CMD="apk add"
    PURGE_CMD="apk del"
else
    echo "不支持的包管理器"
    exit 1
fi

# 系统升级
echo "正在更新软件包信息..."
$PKG_UPDATE_CMD || { echo "软件包信息更新失败"; exit 1; }

echo "正在升级系统..."
$UPGRADE_CMD || { echo "系统升级失败"; exit 1; }

echo "正在自动移除不再需要的软件包..."
for cmd in "${CLEAN_CMDS[@]}"; do
    $cmd || { echo "执行命令失败: $cmd"; exit 1; }
done

# 安全删除旧内核（只适用于使用apt和dnf的系统）
echo "正在删除未使用的内核..."
if [[ "$PKG_MANAGER" == "apt" || "$PKG_MANAGER" == "dnf" ]]; then
    current_kernel=$(uname -r)
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        kernel_packages=$(dpkg --list | grep -E '^ii  linux-(image|headers)-[0-9]+' | awk '{ print $2 }' | grep -v "$current_kernel")
    else
        kernel_packages=$(rpm -qa | grep -E '^kernel-(core|modules|devel)-[0-9]+' | grep -v "$current_kernel")
    fi
    if [ ! -z "$kernel_packages" ]; then
        echo "找到旧内核，正在删除：$kernel_packages"
        $PURGE_CMD $kernel_packages || { echo "内核删除失败"; exit 1; }
        [[ "$PKG_MANAGER" == "apt" ]] && update-grub || { echo "更新GRUB失败"; exit 1; }
    else
        echo "没有旧内核需要删除。"
    fi
fi

# 清理系统日志文件（保留最近一周的日志）
echo "正在清理系统日志文件..."
find /var/log -type f -name "*.log" -mtime +7 -exec truncate -s 0 {} \;
find /root -type f -name "*.log" -mtime +7 -exec truncate -s 0 {} \;
find /home -type f -name "*.log" -mtime +7 -exec truncate -s 0 {} \;
# 确保/ql目录存在时才执行
[ -d "/ql" ] && find /ql -type f -name "*.log" -mtime +7 -exec truncate -s 0 {} \;

# 清理缓存目录
echo "正在清理缓存目录..."
find /tmp -type f -mtime +1 -exec rm -f {} \;
find /var/tmp -type f -mtime +1 -exec rm -f {} \;
for user in /home/* /root; do
  cache_dir="$user/.cache"
  if [ -d "$cache_dir" ]; then
    rm -rf "$cache_dir"/* > /dev/null 2>&1
  fi
done

# 清理Docker（如果使用Docker）
if command -v docker &> /dev/null
then
    echo "正在清理Docker镜像、容器和卷..."
    docker system prune -a -f --volumes || { echo "Docker清理失败"; exit 1; }
fi

# 清理孤立包（仅apt）
if [ "$PKG_MANAGER" = "apt" ]; then
    echo "正在清理孤立包..."
    if [ ! -x /usr/bin/deborphan ]; then
        $INSTALL_CMD deborphan || { echo "deborphan安装失败"; exit 1; }
    fi
    orphan_packages=$(deborphan --guess-all)
    if [ ! -z "$orphan_packages" ]; then
        echo "找到孤立包，正在删除：$orphan_packages"
        echo "$orphan_packages" | xargs -r apt-get -y remove --purge || { echo "孤立包删除失败"; exit 1; }
    else
        echo "没有孤立包需要删除。"
    fi
fi

# 清理包管理器缓存
echo "正在清理包管理器缓存..."
for cmd in "${CLEAN_CMDS[@]}"; do
    $cmd || { echo "执行命令失败: $cmd"; exit 1; }
done

end_space=$(df / | tail -n 1 | awk '{print $3}')
cleared_space=$((start_space - end_space))
echo "系统清理完成，清理了 $((cleared_space / 1024))M 空间！"
