let url = "https://ani.gamer.com.tw/ajax/getdeviceid.php";
let headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TikTok/21.3.0"
};

console.log(`[${new Date().toLocaleString()}] 🚀 正在发起请求获取设备ID...`);
$httpClient.get({ url: url, headers: headers }, function (error, response, body) {
    let result = {};

    if (error) {
        result.message = "Bahamut Anime: 网络连接失败";
        console.log(`[${new Date().toLocaleString()}] ❌ 请求失败: ${result.message}`);
        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
    } else if (body) {
        console.log(`[${new Date().toLocaleString()}] 🔍 响应体获取成功，正在提取设备ID...`);

        let tempdeviceid = body.match(/"deviceid"\s*:\s*"([^"]+)"/);
        if (!tempdeviceid) {
            result.message = "Bahamut Anime: 无法提取设备ID";
            console.log(`[${new Date().toLocaleString()}] ❌ 提取设备ID失败: ${result.message}`);
            $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
            return;
        }

        console.log(`[${new Date().toLocaleString()}] ✅ 设备ID提取成功，设备ID：${tempdeviceid[1]}`);

        let sn = '37783';
        let tokenUrl = `https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=${sn}&device=${tempdeviceid[1]}`;

        console.log(`[${new Date().toLocaleString()}] 🚀 正在请求获取令牌...`);
        $httpClient.get({ url: tokenUrl, headers: headers }, function (tokenError, tokenResponse, tokenBody) {
            let tokenResult = {};

            if (tokenError || !tokenBody) {
                tokenResult.message = "Bahamut Anime: 无法获取令牌";
                console.log(`[${new Date().toLocaleString()}] ❌ 获取令牌失败: ${tokenResult.message}`);
                $done({ response: { status: 200, body: JSON.stringify(tokenResult), headers: { "Content-Type": "application/json" } } });
                return;
            }

            console.log(`[${new Date().toLocaleString()}] ✅ 令牌获取成功，正在发起区域请求...`);

            let regionRequestUrl = 'https://ani.gamer.com.tw/';
            $httpClient.get({ url: regionRequestUrl, headers: headers }, function (regionError, regionResponse, regionBody) {
                let regionResult = {};

                if (regionError || !regionBody) {
                    regionResult.message = "Bahamut Anime: 无法获取区域信息";
                    console.log(`[${new Date().toLocaleString()}] ❌ 获取区域信息失败: ${regionResult.message}`);
                    $done({ response: { status: 200, body: JSON.stringify(regionResult), headers: { "Content-Type": "application/json" } } });
                    return;
                }

                console.log(`[${new Date().toLocaleString()}] 🔍 区域信息获取成功，正在提取区域数据...`);

                let region = regionBody.match(/data-geo="([^"]+)"/);
                if (region) {
                    result.message = `Bahamut Anime: 解锁 ✅ (地区: ${region[1]})`;
                    console.log(`[${new Date().toLocaleString()}] 🎉 Bahamut Anime 检测结果 - ${result.message}`);
                    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                } else {
                    result.message = "Bahamut Anime: 未解锁 ❌";
                    console.log(`[${new Date().toLocaleString()}] ❌ Bahamut Anime 检测结果 - ${result.message}`);
                    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                }
            });
        });
    } else {
        result.message = "Bahamut Anime: 检测失败，无法获取响应";
        console.log(`[${new Date().toLocaleString()}] ❌ 请求失败: ${result.message}`);
        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
    }
});