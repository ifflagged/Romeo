 #!/bin/bash
# asscan 获取 CF 反代节点

linux_os=("Debian" "Ubuntu" "CentOS" "Fedora" "Alpine")
linux_update=("apt update" "apt update" "yum -y update" "yum -y update" "apk update -f")
linux_install=("apt -y install" "apt -y install" "yum -y install" "yum -y install" "apk add -f")
n=0

for i in `echo ${linux_os[@]}`
do
	if [ $i == $(grep -i PRETTY_NAME /etc/os-release | cut -d \" -f2 | awk '{print $1}') ]
	then
		break
	else
		n=$[$n+1]
	fi
done

if [ $n == 5 ]
then
	echo "当前系统$(grep -i PRETTY_NAME /etc/os-release | cut -d \" -f2)没有适配"
	echo "默认使用APT包管理器"
	n=0
fi

if [ -z $(type -P curl) ]
then
	echo "缺少curl,正在安装..."
	${linux_update[$n]}
	${linux_install[$n]} curl
fi

if [ -z $(type -P masscan) ]
then
	echo "缺少masscan,正在安装..."
	${linux_update[$n]}
	${linux_install[$n]} masscan
fi

if [ $(cat /proc/net/dev | sed '1,2d' | grep -v "lo" | awk -F: '{print $1}' | sed -e 's/ //g' | wc -l) == 1 ]
then
	Interface=$(cat /proc/net/dev | sed '1,2d' | grep -v "lo" | awk -F: '{print $1}' | sed -e 's/ //g')
	echo "网口已经自动设置为 $Interface"
	sleep 5
else
	echo "当前可用网口如下"
	cat /proc/net/dev | sed '1,2d' | grep -v "lo" | awk -F: '{print $1}' | sed -e 's/ //g'
	read -p "选择当前需要抓包的网卡: " Interface
	if [ -z "$Interface" ]
	then
		echo "请输入正确的网口名称"
		exit
	fi
	if [ $(cat /proc/net/dev | sed '1,2d' | grep -v "lo" | awk -F: '{print $1}' | sed -e 's/ //g' | grep -w "$Interface" | wc -l) == 0 ]
	then
		echo "找不到网口 $Interface"
		exit
	fi
fi

clear
echo "本脚需要用root权限执行masscan扫描"
echo "请自行确认当前是否以root权限运行"
echo "1.单个AS模式"
echo "2.批量AS列表模式"
read -p "请输入模式号(默认模式1):" scanmode
if [ -z "$scanmode" ]
then
	scanmode=1
fi
if [ $scanmode == 1 ]
then
	clear
	echo "当前为单个AS模式"
	read -p "请输入AS号码(默认45102):" asn
	read -p "请输入扫描端口(默认443):" port
	if [ -z "$asn" ]
	then
		asn=45102
	fi
	if [ -z "$port" ]
	then
		port=443
	fi
elif [ $scanmode == 2 ]
then
	clear
	echo "当前批量AS列表模式"
	echo "待扫描的默认列表文件as.txt格式如下所示"
	echo -e "\n45102:443\n132203:443\n自治域号:端口号\n"
	read -p "请设置列表文件(默认as.txt):" filename
	if [ -z "$filename" ]
	then
		filename=as.txt
	fi
else
	echo "输入的数值不正确,脚本已退出!"
	exit
fi
read -p "请设置masscan pps rate(默认10000):" rate
read -p "请设置curl测试进程数(默认50,最大100):" tasknum
read -p "是否需要测速[(默认0.否)1.是]:" mode
if [ -z "$rate" ]
then
	rate=10000
fi
if [ -z "$tasknum" ]
then
	tasknum=50
fi
if [ $tasknum -eq 0 ]
then
	echo "进程数不能为0,自动设置为默认值"
	tasknum=50
fi
if [ $tasknum -gt 100 ]
then
	echo "超过最大进程限制,自动设置为最大值"
	tasknum=100
fi
if [ -z "$mode" ]
then
	mode=0
fi

function divsubnet(){
mask=$5;a=$1;b=$2;c=$3;d=$4;
echo "拆分子网:$a.$b.$c.$d/$mask";

if [ $mask -ge 8 ] && [ $mask -le 23 ];then
    ipstart=$(((a<<24)|(b<<16)|(c<<8)|l));
    hostend=$((2**(32-mask)-1));
    loop=0;
    while [ $loop -le $hostend ]
    do
        subnet=$((ipstart|loop));
        a=$(((subnet>>24)&255));
        b=$(((subnet>>16)&255));
        c=$(((subnet>>8)&255));
        d=$(((subnet>>0)&255));
        loop=$((loop+256));
        echo $a.$b.$c.$d/24 >> ips.txt;
    done
else
    echo $a.$b.$c.$d/24 >> ips.txt;
fi
}

function getip(){
rm -rf ips.txt
for i in `cat asn/$asn`
do
	a=$(echo $i | awk -F. '{print $1}');
	b=$(echo $i | awk -F. '{print $2}');
	c=$(echo $i | awk -F. '{print $3}');
	d=$(echo $i | awk -F. '{print $4}' | awk -F/ '{print $1}');
	mask=$(echo $i | awk -F/ '{print $2}');
	divsubnet $a $b $c $d $mask
done
sort -u ips.txt | sed -e 's/\./#/g' | sort -t# -k 1n -k 2n -k 3n -k 4n | sed -e 's/#/\./g'>asn/$asn-24
rm -rf ips.txt
}

function colocation(){
curl --ipv4 --retry 3 -s https://speed.cloudflare.com/locations | sed -e 's/},{/\n/g' -e 's/\[{//g' -e 's/}]//g' -e 's/"//g' -e 's/,/:/g' | awk -F: '{print $12","$10"-("$2")"}'>colo.txt
}

function realip(){
sparrow=$(curl --resolve sparrow.cloudflare.com:$port:$1 https://sparrow.cloudflare.com:$port/ -s --connect-timeout 1 --max-time 2)
if [ "$sparrow" == "Unauthorized" ]
then
	echo $1 >> realip.txt
fi
}

function rtt(){
declare -i ms
ip=$i
curl -A "trace" --retry 2 --resolve www.cloudflare.com:$port:$ip https://www.cloudflare.com:$port/cdn-cgi/trace -s --connect-timeout 2 --max-time 3 -w "timems="%{time_connect}"\n" >> log/$1
status=$(grep uag=trace log/$1 | wc -l)
if [ $status == 1 ]
then
	clientip=$(grep ip= log/$1 | cut -f 2- -d'=')
	colo=$(grep colo= log/$1 | cut -f 2- -d'=')
	location=$(grep $colo colo.txt | awk -F"-" '{print $1}' | awk -F"," '{print $1}')
	country=$(grep loc= log/$1 | cut -f 2- -d'=')
	ms=$(grep timems= log/$1 | awk -F"=" '{printf ("%d\n",$2*1000)}')
	if [[ "$clientip" == "$publicip" ]]
	then
		clientip=0.0.0.0
		ipstatus=官方
	elif [[ "$clientip" == "$ip" ]]
	then
		ipstatus=中转
	else
		ipstatus=隧道
	fi
	rm -rf log/$1
	echo "$ip,$port,$clientip,$country,$location,$ipstatus,$ms ms" >> rtt.txt
else
	rm -rf log/$1
fi
}

function speedtest(){
rm -rf log.txt speed.txt
curl --resolve archlinux.cloudflaremirrors.com:$2:$1 https://archlinux.cloudflaremirrors.com:$2/archlinux/iso/latest/archlinux-x86_64.iso -o /dev/null --connect-timeout 2 --max-time 5 -w "HTTPCODE"_%{http_code}"\n"> log.txt 2>&1
status=$(cat log.txt | grep HTTPCODE | awk -F_ '{print $2}')
if [ $status == 200 ]
then
	cat log.txt | tr '\r' '\n' | awk '{print $NF}' | sed '1,3d;$d' | grep -v 'k\|M\|received' >> speed.txt
	for i in `cat log.txt | tr '\r' '\n' | awk '{print $NF}' | sed '1,3d;$d' | grep k | sed 's/k//g'`
	do
		declare -i k
		k=$i
		k=k*1024
		echo $k >> speed.txt
	done
	for i in `cat log.txt | tr '\r' '\n' | awk '{print $NF}' | sed '1,3d;$d' | grep M | sed 's/M//g'`
	do
		i=$(echo | awk '{print '$i'*10 }')
		declare -i M
		M=$i
		M=M*1024*1024/10
		echo $M >> speed.txt
	done
	declare -i max
	max=0
	for i in `cat speed.txt`
	do
		if [ $i -ge $max ]
		then
			max=$i
		fi
	done
else
	max=0
fi
rm -rf log.txt speed.txt
echo $max
}

function cloudflarerealip(){
rm -rf realip.txt
declare -i ipnum
declare -i seqnum
declare -i n=1
ipnum=$(grep tcp data.txt | awk '{print $4}' | wc -l)
seqnum=$tasknum
if [ $ipnum == 0 ]
then
	echo "当前没有任何IP"
fi
if [ $tasknum == 0 ]
then
	tasknum=1
fi
if [ $ipnum -lt $tasknum ]
then
	seqnum=$ipnum
fi
trap "exec 6>&-; exec 6<&-;exit 0" 2
tmp_fifofile="./$$.fifo"
mkfifo $tmp_fifofile &> /dev/null
if [ ! $? -eq 0 ]
then
	mknod $tmp_fifofile p
fi
exec 6<>$tmp_fifofile
rm -f $tmp_fifofile
for i in `seq $seqnum`;
do
	echo >&6
done
for i in `grep tcp data.txt | awk '{print $4}' | tr -d '\r'`
do
		read -u6;
		{
		realip $i;
		echo >&6
		}&
		echo "RTT IP总数 $ipnum 已完成 $n"
		n=n+1
done
wait
exec 6>&-
exec 6<&-
echo "RTT IP全部测试完成"
}

function cloudflarertt(){
if [ ! -f "realip.txt" ]
then
	echo "当前没有任何REAL IP"
else
	rm -rf rtt.txt log
	mkdir log
	declare -i ipnum
	declare -i seqnum
	declare -i n=1
	ipnum=$(cat realip.txt | wc -l)
	seqnum=$tasknum
	if [ $ipnum == 0 ]
	then
		echo "当前没有任何REAL IP"
	fi
	if [ $tasknum == 0 ]
	then
		tasknum=1
	fi
	if [ $ipnum -lt $tasknum ]
	then
		seqnum=$ipnum
	fi
	trap "exec 6>&-; exec 6<&-;exit 0" 2
	tmp_fifofile="./$$.fifo"
	mkfifo $tmp_fifofile &> /dev/null
	if [ ! $? -eq 0 ]
	then
		mknod $tmp_fifofile p
	fi
	exec 6<>$tmp_fifofile
	rm -f $tmp_fifofile
	for i in `seq $seqnum`;
	do
		echo >&6
	done
	n=1
	for i in `cat realip.txt | tr -d '\r'`
	do
			read -u6;
			{
			rtt $i;
			echo >&6
			}&
			echo "REAL IP总数 $ipnum 已完成 $n"
			n=n+1
	done
	wait
	exec 6>&-
	exec 6<&-
	echo "REAL IP全部测试完成"
fi
}

function main(){
start=`date +%s`
publicip=$(curl --ipv4 -s https://www.cloudflare-cn.com/cdn-cgi/trace | grep ip= | cut -f 2- -d'=')
if [ ! -f "colo.txt" ]
then
	echo "生成colo.txt"
	colocation
else
	echo "colo.txt 已存在,跳过此步骤!"
fi
if [ ! -d asn ]
then
	mkdir asn
fi
if [ ! -f "asn/$asn" ]
then
	curl -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.62 Safari/537.36' -s https://whois.ipip.net/AS$asn | grep /AS$asn/ | awk '{print $2}' | sed -e 's#"##g' | awk -F/ '{print $3"/"$4}' | grep -v :>asn/$asn
	echo "$asn数据下载完毕"
else
	echo "$asn 已存在,跳过数据下载!"
fi
if [ ! -f "asn/$asn-24" ]
then
	getip
else
	echo $asn-24 "已存在,跳过CIDR拆分!"
fi
echo "开始检测 AS$asn TCP端口 $port 有效性"
rm -rf paused.conf
masscan -p $port -iL asn/$asn-24 --wait=3 --rate=$rate -oL data.txt --interface $Interface
echo "开始检测 AS$asn REAL IP有效性"
cloudflarerealip
echo "开始检测 AS$asn RTT信息"
cloudflarertt
if [ ! -f "rtt.txt" ]
then
	rm -rf log data.txt realip.txt rtt.txt
	echo "当前没有任何有效IP"
elif [ $mode == 1 ]
then
	echo "中转IP,中转端口,回源IP,国家,数据中心,IP类型,网络延迟">AS$asn-$port.csv
	cat rtt.txt>>AS$asn-$port.csv
	echo "AS$asn-$port.csv 已经生成"
	echo "中转IP,中转端口,回源IP,国家,数据中心,IP类型,网络延迟,等效带宽,峰值速度">AS$asn-$port-测速.csv
	for i in `cat rtt.txt | sed -e 's/ /_/g'`
	do
		ip=$(echo $i | awk -F, '{print $1}')
		port=$(echo $i | awk -F, '{print $2}')
		clientip=$(echo $i | awk -F, '{print $3}')
		if [ $clientip != 0.0.0.0 ]
		then
			echo "正在测试 $ip 端口 $port"
			maxspeed=$(speedtest $ip $port)
			maxspeed=$[$maxspeed/1024]
			maxbandwidth=$[$maxspeed/128]
			echo "$ip 等效带宽 $maxbandwidth Mbps 峰值速度 $maxspeed kB/s"
			if [ $maxspeed == 0 ]
			then
				echo "重新测试 $ip 端口 $port"
				maxspeed=$(speedtest $ip $port)
				maxspeed=$[$maxspeed/1024]
				maxbandwidth=$[$maxspeed/128]
				echo "$ip 等效带宽 $maxbandwidth Mbps 峰值速度 $maxspeed kB/s"
			fi
		else
			echo "跳过测试 $ip 端口 $port"
			maxspeed=null
			maxbandwidth=null
		fi
		if [ $maxspeed != 0 ]
		then
			echo "$i,$maxbandwidth Mbps,$maxspeed kB/s" | sed -e 's/_/ /g'>>AS$asn-$port-测速.csv
		fi
	done
	rm -rf log data.txt realip.txt rtt.txt
	echo "AS$asn-$port-测速.csv 已经生成"
else
	echo "中转IP,中转端口,回源IP,国家,数据中心,IP类型,网络延迟">AS$asn-$port.csv
	cat rtt.txt>>AS$asn-$port.csv
	rm -rf log data.txt realip.txt rtt.txt
	echo "AS$asn-$port.csv 已经生成"
fi
end=`date +%s`
echo "AS$asn-$port 耗时:$[$end-$start]秒"
}

if [ $scanmode == 2 ]
then
	for i in `cat $filename`
	do
		asn=$(echo $i | awk -F: '{print $1}')
		port=$(echo $i | awk -F: '{print $2}')
		main
	done
else
	main
fi
