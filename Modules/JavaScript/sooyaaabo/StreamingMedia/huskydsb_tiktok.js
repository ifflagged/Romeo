let url = "https://www.tiktok.com/";
let headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TikTok/21.3.0"
};

function getTimestamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

console.log(`${getTimestamp()} 🚀 开始发起 TikTok 解锁检测请求`);
console.log(`${getTimestamp()} 🌐 请求 URL: ${url}`);
console.log(`${getTimestamp()} 📋 请求 Headers: ${JSON.stringify(headers)}`);

$httpClient.get({ url: url, headers: headers }, function (error, response, body) {
    let result = {};

    if (error) {
        result.message = "TikTok:网络连接失败";
        console.log(`${getTimestamp()} ❌ TikTok 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
        $done({ 
            response: { 
                status: 200, 
                body: JSON.stringify(result), 
                headers: { "Content-Type": "application/json" } 
            } 
        });
    } else if (body) {
        console.log(`${getTimestamp()} ✅ TikTok 响应体获取成功`);
        console.log(`${getTimestamp()} 📊 响应状态码: ${response.status}`);
        console.log(`${getTimestamp()} 📄 响应头: ${JSON.stringify(response.headers)}`);

        if (body.includes('region')) {
            let region = body.match(/"region":"(.*?)"/);
            if (region && region[1]) {
                let regionCode = region[1];
                result.message = `TikTok:已解锁 ✅ (地区: ${regionCode})`;
                console.log(`${getTimestamp()} 🌍 TikTok 检测结果 - ${result.message}`);
                console.log(`${getTimestamp()} 🔎 检测到的地区代码: ${regionCode}`);
                $done({ 
                    response: { 
                        status: 200, 
                        body: JSON.stringify(result), 
                        headers: { "Content-Type": "application/json" } 
                    } 
                });
            } else if (body.includes("The #TikTokTraditions") || body.includes("This LIVE isn't available")) {
                result.message = "TikTok:未解锁 ❌";
                console.log(`${getTimestamp()} ❌ TikTok 检测结果 - ${result.message}`);
                console.log(`${getTimestamp()} 🔍 响应体中包含未解锁关键词`);
                $done({ 
                    response: { 
                        status: 200, 
                        body: JSON.stringify(result), 
                        headers: { "Content-Type": "application/json" } 
                    } 
                });
            } else {
                result.message = "TikTok:检测失败，未知状态";
                console.log(`${getTimestamp()} ❓ TikTok 检测结果 - ${result.message}`);
                console.log(`${getTimestamp()} 🔍 响应体内容: ${body}`);
                $done({ 
                    response: { 
                        status: 200, 
                        body: JSON.stringify(result), 
                        headers: { "Content-Type": "application/json" } 
                    } 
                });
            }
        } else {
            result.message = "TikTok:未解锁 ❌ (地区信息缺失)";
            console.log(`${getTimestamp()} ❌ TikTok 检测结果 - ${result.message}`);
            console.log(`${getTimestamp()} 🔍 响应体中未找到地区信息`);
            $done({ 
                response: { 
                    status: 200, 
                    body: JSON.stringify(result), 
                    headers: { "Content-Type": "application/json" } 
                } 
            });
        }
    } else {
        result.message = "TikTok:检测失败，无法获取响应";
        console.log(`${getTimestamp()} ❌ TikTok 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 响应体为空`);
        $done({ 
            response: { 
                status: 200, 
                body: JSON.stringify(result), 
                headers: { "Content-Type": "application/json" } 
            } 
        });
    }
});