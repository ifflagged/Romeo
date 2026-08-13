#!/bin/bash
# onekey proxy
linux_os=("Debian" "Ubuntu" "CentOS" "Fedora")
linux_update=("apt update" "apt update" "yum -y update" "yum -y update")
linux_install=("apt -y install" "apt -y install" "yum -y install" "yum -y install")
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
if [ $n == 4 ]
then
	echo 当前系统$(grep -i PRETTY_NAME /etc/os-release | cut -d \" -f2)没有适配
	echo 默认使用APT包管理器
	n=0
fi
if [ -z $(type -P unzip) ]
then
	${linux_update[$n]}
	${linux_install[$n]} unzip
fi
if [ -z $(type -P curl) ]
then
	${linux_update[$n]}
	${linux_install[$n]} curl
fi
if [ -z $(type -P wget) ]
then
	${linux_update[$n]}
	${linux_install[$n]} wget
fi
if [ -z $(type -P systemctl) ]
then
	${linux_update[$n]}
	${linux_install[$n]} systemctl
fi

function quicktunnel(){
rm -rf xray cloudflared-linux xray.zip
case "$(uname -m)" in
	x86_64 | x64 | amd64 )
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-64.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared-linux
	;;
	i386 | i686 )
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-32.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386 -O cloudflared-linux
	;;
	armv8 | arm64 | aarch64 )
	echo arm64
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-arm64-v8a.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -O cloudflared-linux
	;;
	arm71 )
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-arm32-v7a.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -O cloudflared-linux
	;;
	* )
	echo 当前架构$(uname -m)没有适配
	exit
	;;
esac
chmod +x cloudflared-linux
unzip -d xray xray.zip
rm -rf xray.zip
uuid=ffffffff-ffff-ffff-ffff-ffffffffffff
urlpath=$(echo $uuid | awk -F- '{print $1}')
port=$[$RANDOM+10000]
if [ $protocol == 1 ]
then
if [ $warpmode == 0 ]
then
cat>xray/config.json<<EOF
{
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vmess",
			"settings": {
				"clients": [
					{
						"id": "$uuid",
						"alterId": 0
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "freedom",
			"settings": {}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
else
cat>xray/config.json<<EOF
{
	"dns": {
		"servers": [
			"https://1.1.1.1/dns-query"
		]
	},
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vmess",
			"settings": {
				"clients": [
					{
						"id": "$uuid",
						"alterId": 0
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "wireguard",
			"settings": {
				"secretKey": "OoyvpkySqdnZgGnjpVuD9HqUJ5lJiu8ZWo+cMI+/c00=",
				"address": [
					"172.16.0.2/32"
				],
				"peers": [
					{
						"publicKey": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
						"AllowedIPs": [
							"0.0.0.0/0"
						],
						"endpoint": "$warp"
					}
				]
			}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
fi
fi
if [ $protocol == 2 ]
then
if [ $warpmode == 0 ]
then
cat>xray/config.json<<EOF
{
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vless",
			"settings": {
				"decryption": "none",
				"clients": [
					{
						"id": "$uuid"
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "freedom",
			"settings": {}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
else
cat>xray/config.json<<EOF
{
	"dns": {
		"servers": [
			"https://1.1.1.1/dns-query"
		]
	},
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vless",
			"settings": {
				"decryption": "none",
				"clients": [
					{
						"id": "$uuid"
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "wireguard",
			"settings": {
				"secretKey": "OoyvpkySqdnZgGnjpVuD9HqUJ5lJiu8ZWo+cMI+/c00=",
				"address": [
					"172.16.0.2/32"
				],
				"peers": [
					{
						"publicKey": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
						"AllowedIPs": [
							"0.0.0.0/0"
						],
						"endpoint": "$warp"
					}
				]
			}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
fi
fi
./xray/xray run>/dev/null 2>&1 &
./cloudflared-linux tunnel --url http://localhost:$port --no-autoupdate --edge-ip-version $ips --protocol h2mux>argo.log 2>&1 &
sleep 2
clear
echo 等待cloudflare argo生成地址
sleep 5
argo=$(cat argo.log | grep trycloudflare.com | awk 'NR==2{print}' | awk -F// '{print $2}' | awk '{print $1}')
clear
if [ $protocol == 1 ]
then
	echo -e vmess链接已经生成, speed.cloudflare.com 可替换为CF优选IP'\n' > v2ray.txt
	echo 'vmess://'$(echo '{"add":"speed.cloudflare.com","aid":"0","host":"'$argo'","id":"'$uuid'","net":"ws","path":"","port":"443","ps":"'$(echo $isp | sed -e 's/_/ /g')'_tls","tls":"tls","type":"none","v":"2"}' | base64 -w 0) >> v2ray.txt
	echo -e '\n'端口 443 可改为 2053 2083 2087 2096 8443'\n' >> v2ray.txt
	echo 'vmess://'$(echo '{"add":"speed.cloudflare.com","aid":"0","host":"'$argo'","id":"'$uuid'","net":"ws","path":"","port":"80","ps":"'$(echo $isp | sed -e 's/_/ /g')'","tls":"","type":"none","v":"2"}' | base64 -w 0) >> v2ray.txt
	echo -e '\n'端口 80 可改为 8080 8880 2052 2082 2086 2095 >> v2ray.txt
fi
if [ $protocol == 2 ]
then
	echo -e vless链接已经生成, speed.cloudflare.com 可替换为CF优选IP'\n' > v2ray.txt
	echo 'vless://'$uuid'@speed.cloudflare.com:443?encryption=none&security=tls&type=ws&host='$argo'&path=#'$(echo $isp | sed -e 's/_/%20/g' -e 's/,/%2C/g')'' >> v2ray.txt
	echo -e '\n'端口 443 可改为 2053 2083 2087 2096 8443'\n' >> v2ray.txt
	echo 'vless://'$uuid'@speed.cloudflare.com:80?encryption=none&security=none&type=ws&host='$argo'&path=#'$(echo $isp | sed -e 's/_/%20/g' -e 's/,/%2C/g')'' >> v2ray.txt
	echo -e '\n'端口 80 可改为 8080 8880 2052 2082 2086 2095 >> v2ray.txt
fi
rm -rf argo.log
cat v2ray.txt
echo -e '\n'信息已经保存在 v2ray.txt,再次查看请运行 cat v2ray.txt
}

function installtunnel(){
#创建主目录
mkdir -p /opt/suoha/ >/dev/null 2>&1
rm -rf xray cloudflared-linux xray.zip
case "$(uname -m)" in
	x86_64 | x64 | amd64 )
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-64.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared-linux
	;;
	i386 | i686 )
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-32.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386 -O cloudflared-linux
	;;
	armv8 | arm64 | aarch64 )
	echo arm64
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-arm64-v8a.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -O cloudflared-linux
	;;
	arm71 )
	wget https://github.com/XTLS/Xray-core/releases/download/v1.6.5/Xray-linux-arm32-v7a.zip -O xray.zip
	wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -O cloudflared-linux
	;;
	* )
	echo 当前架构$(uname -m)没有适配
	exit
	;;
esac
unzip -d xray xray.zip
chmod +x cloudflared-linux xray/xray
mv cloudflared-linux /opt/suoha/
mv xray/xray /opt/suoha/
rm -rf xray xray.zip
uuid=$(cat /proc/sys/kernel/random/uuid)
urlpath=$(echo $uuid | awk -F- '{print $1}')
port=$[$RANDOM+10000]
if [ $protocol == 1 ]
then
if [ $warpmode == 0 ]
then
cat>/opt/suoha/config.json<<EOF
{
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vmess",
			"settings": {
				"clients": [
					{
						"id": "$uuid",
						"alterId": 0
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "freedom",
			"settings": {}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
else
cat>/opt/suoha/config.json<<EOF
{
	"dns": {
		"servers": [
			"https://1.1.1.1/dns-query"
		]
	},
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vmess",
			"settings": {
				"clients": [
					{
						"id": "$uuid",
						"alterId": 0
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "wireguard",
			"settings": {
				"secretKey": "OoyvpkySqdnZgGnjpVuD9HqUJ5lJiu8ZWo+cMI+/c00=",
				"address": [
					"172.16.0.2/32"
				],
				"peers": [
					{
						"publicKey": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
						"AllowedIPs": [
							"0.0.0.0/0"
						],
						"endpoint": "$warp"
					}
				]
			}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
fi
fi
if [ $protocol == 2 ]
then
if [ $warpmode == 0 ]
then
cat>/opt/suoha/config.json<<EOF
{
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vless",
			"settings": {
				"decryption": "none",
				"clients": [
					{
						"id": "$uuid"
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "freedom",
			"settings": {}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
else
cat>/opt/suoha/config.json<<EOF
{
	"dns": {
		"servers": [
			"https://1.1.1.1/dns-query"
		]
	},
	"inbounds": [
		{
			"port": $port,
			"listen": "localhost",
			"protocol": "vless",
			"settings": {
				"decryption": "none",
				"clients": [
					{
						"id": "$uuid"
					}
				]
			},
			"streamSettings": {
				"network": "ws",
				"wsSettings": {
					"path": ""
				}
			}
		}
	],
	"outbounds": [
		{
			"protocol": "wireguard",
			"settings": {
				"secretKey": "OoyvpkySqdnZgGnjpVuD9HqUJ5lJiu8ZWo+cMI+/c00=",
				"address": [
					"172.16.0.2/32"
				],
				"peers": [
					{
						"publicKey": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
						"AllowedIPs": [
							"0.0.0.0/0"
						],
						"endpoint": "$warp"
					}
				]
			}
		}
	],
	"policy": {
		"levels": {
			"0": {
				"handshake": 3,
				"connIdle": 60,
				"uplinkOnly": 0,
				"downlinkOnly": 0,
				"bufferSize": 0
			}
		}
	}
}
EOF
fi
fi
clear
echo 复制下面的链接,用浏览器打开并授权需要绑定的域名
echo 在网页中授权完毕后会继续进行下一步设置
/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel login
clear
/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel list >argo.log 2>&1
echo -e ARGO TUNNEL当前已经绑定的服务如下'\n'
sed 1,2d argo.log | awk '{print $2}'
echo -e '\n'自定义一个完整二级域名,例如 xxx.example.com
echo 必须是网页里面绑定授权的域名才生效,不能乱输入
read -p "输入绑定域名的完整二级域名: " domain
if [ -z "$domain" ]
then
	echo 没有设置域名
	exit
elif [ $(echo $domain | grep "\." | wc -l) == 0 ]
then
	echo 域名格式不正确
	exit
fi
name=$(echo $domain | awk -F\. '{print $1}')
if [ $(sed 1,2d argo.log | awk '{print $2}' | grep -w $name | wc -l) == 0 ]
then
	echo 创建TUNNEL $name
	/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel create $name >argo.log 2>&1
	echo TUNNEL $name 创建成功
else
	echo TUNNEL $name 已经存在
	if [ ! -f "/root/.cloudflared/$(sed 1,2d argo.log | awk '{print $1" "$2}' | grep -w $name | awk '{print $1}').json" ]
	then
		echo /root/.cloudflared/$(sed 1,2d argo.log | awk '{print $1" "$2}' | grep -w $name | awk '{print $1}').json 文件不存在
		echo 清理TUNNEL $name
		/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel cleanup $name >argo.log 2>&1
		echo 删除TUNNEL $name
		/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel delete $name >argo.log 2>&1
		echo 重建TUNNEL $name
		/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel create $name >argo.log 2>&1
	else
		echo 清理TUNNEL $name
		/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel cleanup $name >argo.log 2>&1
	fi
fi
echo 绑定 TUNNEL $name 到域名 $domain
/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel route dns --overwrite-dns $name $domain >argo.log 2>&1
echo $domain 绑定成功
tunneluuid=$(cut -d= -f2 argo.log)
if [ $protocol == 1 ]
then
	echo -e vmess链接已经生成, speed.cloudflare.com 可替换为CF优选IP'\n' >/opt/suoha/v2ray.txt
	echo 'vmess://'$(echo '{"add":"speed.cloudflare.com","aid":"0","host":"'$domain'","id":"'$uuid'","net":"ws","path":"","port":"443","ps":"'$(echo $isp | sed -e 's/_/ /g')'","tls":"tls","type":"none","v":"2"}' | base64 -w 0) >>/opt/suoha/v2ray.txt
	echo -e '\n'端口 443 可改为 2053 2083 2087 2096 8443'\n' >>/opt/suoha/v2ray.txt
	echo 'vmess://'$(echo '{"add":"speed.cloudflare.com","aid":"0","host":"'$argo'","id":"'$uuid'","net":"ws","path":"","port":"80","ps":"'$(echo $isp | sed -e 's/_/ /g')'","tls":"","type":"none","v":"2"}' | base64 -w 0) >>/opt/suoha/v2ray.txt
	echo -e '\n'端口 80 可改为 8080 8880 2052 2082 2086 2095'\n' >>/opt/suoha/v2ray.txt
	echo 注意:如果 80 8080 8880 2052 2082 2086 2095 端口无法正常使用 >>/opt/suoha/v2ray.txt
	echo 请前往 https://dash.cloudflare.com/ >>/opt/suoha/v2ray.txt
	echo 检查管理面板 SSL/TLS - 边缘证书 - 始终使用HTTPS 是否处于关闭状态 >>/opt/suoha/v2ray.txt
fi
if [ $protocol == 2 ]
then
	echo -e vless链接已经生成, speed.cloudflare.com 可替换为CF优选IP'\n' >/opt/suoha/v2ray.txt
	echo 'vless://'$uuid'@speed.cloudflare.com:443?encryption=none&security=tls&type=ws&host='$domain'&path=#'$(echo $isp | sed -e 's/_/%20/g' -e 's/,/%2C/g')'' >>/opt/suoha/v2ray.txt
	echo -e '\n'端口 443 可改为 2053 2083 2087 2096 8443'\n' >>/opt/suoha/v2ray.txt
	echo 'vless://'$uuid'@speed.cloudflare.com:80?encryption=none&security=none&type=ws&host='$argo'&path=#'$(echo $isp | sed -e 's/_/%20/g' -e 's/,/%2C/g')'' >>/opt/suoha/v2ray.txt
	echo -e '\n'端口 80 可改为 8080 8880 2052 2082 2086 2095'\n' >>/opt/suoha/v2ray.txt
	echo 注意:如果 80 8080 8880 2052 2082 2086 2095 端口无法正常使用 >>/opt/suoha/v2ray.txt
	echo 请前往 https://dash.cloudflare.com/ >>/opt/suoha/v2ray.txt
	echo 检查管理面板 SSL/TLS - 边缘证书 - 始终使用HTTPS 是否处于关闭状态 >>/opt/suoha/v2ray.txt
fi
rm -rf argo.log
cat>/opt/suoha/config.yaml<<EOF
tunnel: $tunneluuid
credentials-file: /root/.cloudflared/$tunneluuid.json

ingress:
  - hostname:
    service: http://localhost:$port
EOF
#创建服务
cat>/lib/systemd/system/cloudflared.service<<EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
TimeoutStartSec=0
Type=simple
ExecStart=/opt/suoha/cloudflared-linux --edge-ip-version $ips --protocol h2mux tunnel --config /opt/suoha/config.yaml run $name
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
cat>/lib/systemd/system/xray.service<<EOF
[Unit]
Description=Xray
After=network.target

[Service]
TimeoutStartSec=0
Type=simple
ExecStart=/opt/suoha/xray run -config /opt/suoha/config.json
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
systemctl enable cloudflared.service >/dev/null 2>&1
systemctl enable xray.service >/dev/null 2>&1
systemctl --system daemon-reload
systemctl start cloudflared.service
systemctl start xray.service
#创建命令链接
cat>/opt/suoha/suoha.sh<<EOF
#!/bin/bash
clear
while true
do
echo argo \$(systemctl status cloudflared.service | sed -n '3p')
echo xray \$(systemctl status xray.service | sed -n '3p')
echo 1.管理TUNNEL
echo 2.启动服务
echo 3.停止服务
echo 4.重启服务
echo 5.卸载服务
echo 6.查看当前v2ray链接
echo 0.退出
read -p "请选择菜单(默认0): " menu
if [ -z "\$menu" ]
then
	menu=0
fi
if [ \$menu == 1 ]
then
	clear
	while true
	do
		echo ARGO TUNNEL当前已经绑定的服务如下
		/opt/suoha/cloudflared-linux tunnel list
		echo 1.删除TUNNEL
		echo 0.退出
		read -p "请选择菜单(默认0): " tunneladmin
		if [ -z "\$tunneladmin" ]
		then
			tunneladmin=0
		fi
		if [ \$tunneladmin == 1 ]
		then
			read -p "请输入要删除的TUNNEL NAME: " tunnelname
			echo 断开TUNNEL \$tunnelname
			/opt/suoha/cloudflared-linux tunnel cleanup \$tunnelname
			echo 删除TUNNEL \$tunnelname
			/opt/suoha/cloudflared-linux tunnel delete \$tunnelname
		else
			break
		fi
	done
elif [ \$menu == 2 ]
then
	systemctl start cloudflared.service
	systemctl start xray.service
	clear
elif [ \$menu == 3 ]
then
	systemctl stop cloudflared.service
	systemctl stop xray.service
	clear
elif [ \$menu == 4 ]
then
	systemctl restart cloudflared.service
	systemctl restart xray.service
	clear
elif [ \$menu == 5 ]
then
	systemctl stop cloudflared.service
	systemctl stop xray.service
	systemctl disable cloudflared.service
	systemctl disable xray.service
	rm -rf /opt/suoha /lib/systemd/system/cloudflared.service /lib/systemd/system/xray.service /usr/bin/suoha ~/.cloudflared
	systemctl --system daemon-reload
	echo 所有服务都卸载完成
	echo 彻底删除授权记录
	echo 请访问 https://dash.cloudflare.com/profile/api-tokens
	echo 删除授权的 Argo Tunnel API Token 即可
	exit
elif [ \$menu == 6 ]
then
	clear
	cat /opt/suoha/v2ray.txt
elif [ \$menu == 0 ]
then
	echo 退出成功
	exit
fi
done
EOF
chmod +x /opt/suoha/suoha.sh
ln -sf /opt/suoha/suoha.sh /usr/bin/suoha
}

clear
echo 梭哈模式不需要自己提供域名,使用CF ARGO QUICK TUNNEL创建快速链接
echo 梭哈模式在重启或者脚本再次运行后失效,如果需要使用需要再次运行创建
echo 安装服务模式,需要有CF托管域名,并且需要按照提示手动绑定ARGO服务
echo 首次绑定ARGO服务后如果不想再次跳转网页绑定
echo 将已经绑定的系统目录下的 /root/.cloudflared 文件夹以及内容
echo 拷贝至新系统下同样的目录,会自动跳过登录验证

echo -e '\n'梭哈是一种智慧!!!梭哈!梭哈!梭哈!梭哈!梭哈!梭哈!梭哈...'\n'
echo 1.梭哈模式
echo 2.安装服务
echo 3.卸载服务
echo 4.清空缓存
echo -e 0.退出脚本'\n'
read -p "请选择模式(默认1):" mode
if [ -z "$mode" ]
then
	mode=1
fi
if [ $mode == 1 ]
then
	read -p "请选择xray协议(默认1.vmess,2.vless):" protocol
	if [ -z "$protocol" ]
	then
		protocol=1
	fi
	if [ $protocol != 1 ] && [ $protocol != 2 ]
	then
		echo 请输入正确的xray协议
		exit
	fi
	read -p "请选择argo连接模式IPV4或者IPV6(输入4或6,默认4):" ips
	if [ -z "$ips" ]
	then
		ips=4
	fi
	if [ $ips != 4 ] && [ $ips != 6 ]
	then
		echo 请输入正确的argo连接模式
		exit
	elif [ $ips == 4 ]
	then
		warp=162.159.192.0:4500
	else
		warp=[2606:4700:d0::]:4500
	fi
	read -p "是否需要套WARP(默认0.否,1.是):" warpmode
	if [ -z "$warpmode" ]
	then
		warpmode=0
	fi
	if [ $warpmode == 1 ]
	then
		isp=$(curl -$ips -s https://speed.cloudflare.com/meta | awk -F\" '{print $26"-Cloudflare WARP"}' | sed -e 's/ /_/g')
	else
		isp=$(curl -$ips -s https://speed.cloudflare.com/meta | awk -F\" '{print $26"-"$18}' | sed -e 's/ /_/g')
	fi
	kill -9 $(ps -ef | grep xray | grep -v grep | awk '{print $2}') >/dev/null 2>&1
	kill -9 $(ps -ef | grep cloudflared-linux | grep -v grep | awk '{print $2}') >/dev/null 2>&1
	rm -rf xray cloudflared-linux v2ray.txt
	quicktunnel
elif [ $mode == 2 ]
then
	read -p "请选择xray协议(默认1.vmess,2.vless):" protocol
	if [ -z "$protocol" ]
	then
		protocol=1
	fi
	if [ $protocol != 1 ] && [ $protocol != 2 ]
	then
		echo 请输入正确的xray协议
		exit
	fi
	read -p "请选择argo连接模式IPV4或者IPV6(输入4或6,默认4):" ips
	if [ -z "$ips" ]
	then
		ips=4
	fi
	if [ $ips != 4 ] && [ $ips != 6 ]
	then
		echo 请输入正确的argo连接模式
		exit
	elif [ $ips == 4 ]
	then
		warp=162.159.192.0:4500
	else
		warp=[2606:4700:d0::]:4500
	fi
	read -p "是否需要套WARP(默认0.否,1.是):" warpmode
	if [ -z "$warpmode" ]
	then
		warpmode=0
	fi
	if [ $warpmode == 1 ]
	then
		isp=$(curl -$ips -s https://speed.cloudflare.com/meta | awk -F\" '{print $26"-Cloudflare WARP"}' | sed -e 's/ /_/g')
	else
		isp=$(curl -$ips -s https://speed.cloudflare.com/meta | awk -F\" '{print $26"-"$18}' | sed -e 's/ /_/g')
	fi
	systemctl stop cloudflared.service
	systemctl stop xray.service
	systemctl disable cloudflared.service
	systemctl disable xray.service
	rm -rf /opt/suoha /lib/systemd/system/cloudflared.service /lib/systemd/system/xray.service /usr/bin/suoha
	systemctl --system daemon-reload
	installtunnel
	cat /opt/suoha/v2ray.txt
	echo 服务安装完成,管理服务请运行命令 suoha
elif [ $mode == 3 ]
then
	systemctl stop cloudflared.service
	systemctl stop xray.service
	systemctl disable cloudflared.service
	systemctl disable xray.service
	rm -rf /opt/suoha /lib/systemd/system/cloudflared.service /lib/systemd/system/xray.service /usr/bin/suoha ~/.cloudflared
	systemctl --system daemon-reload
	clear
	echo 所有服务都卸载完成
	echo 彻底删除授权记录
	echo 请访问 https://dash.cloudflare.com/profile/api-tokens
	echo 删除授权的 Argo Tunnel API Token 即可
elif [ $mode == 4 ]
then
	kill -9 $(ps -ef | grep xray | grep -v grep | awk '{print $2}') >/dev/null 2>&1
	kill -9 $(ps -ef | grep cloudflared-linux | grep -v grep | awk '{print $2}') >/dev/null 2>&1
	rm -rf xray cloudflared-linux v2ray.txt
else
	echo 退出成功
	exit
fi
