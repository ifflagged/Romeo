let url = "https://www.linetv.tw/";
let headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
};

function getTimestamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

console.log(`${getTimestamp()} 🚀 开始发起 LineTV.TW 解锁检测请求`);
console.log(`${getTimestamp()} 🌐 请求 URL: ${url}`);
console.log(`${getTimestamp()} 📋 请求 Headers: ${JSON.stringify(headers)}`);

$httpClient.get({ url: url, headers: headers }, function (error, response, body) {
    if (error) {
        console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 网络连接失败`);
        console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
        $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 网络连接失败" }), headers: { "Content-Type": "application/json" } } });
        return;
    }

    let mainJsUrl = body.match(/<script[^>]+src="([^"]*\/main-[a-z0-9]+-prod\.js)"/);
    if (!mainJsUrl) {
        console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 未找到 main.js 链接`);
        $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 未找到 main.js 链接" }), headers: { "Content-Type": "application/json" } } });
        return;
    }

    mainJsUrl = mainJsUrl[1];
    console.log(`${getTimestamp()} 🌐 main.js URL: ${mainJsUrl}`);

    $httpClient.get({ url: mainJsUrl, headers: { "Referer": "https://www.linetv.tw/", "User-Agent": headers["User-Agent"] } }, function (error, response, body) {
        if (error) {
            console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 网络连接失败 (main.js)`);
            console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 网络连接失败 (main.js)" }), headers: { "Content-Type": "application/json" } } });
            return;
        }

        let appId = body.match(/appId:"([^"]+)"/);
        if (!appId) {
            console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 未找到 appId`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 未找到 appId" }), headers: { "Content-Type": "application/json" } } });
            return;
        }

        appId = appId[1];
        console.log(`${getTimestamp()} 🌐 appId: ${appId}`);

        let testUrl = `https://www.linetv.tw/api/part/11829/eps/1/part?appId=${appId}&productType=FAST&version=10.38.0`;
        console.log(`${getTimestamp()} 🌐 测试 URL: ${testUrl}`);

        $httpClient.get({ url: testUrl, headers: headers }, function (error, response, body) {
            if (error) {
                console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 网络连接失败 (API)`);
                console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
                $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 网络连接失败 (API)" }), headers: { "Content-Type": "application/json" } } });
                return;
            }

            console.log(`${getTimestamp()} 📄 API 响应: ${body}`);

            let result = body.match(/"countryCode"\s*:\s*(\d+)/);
            if (result) {
                console.log(`${getTimestamp()} 🌍 检测到的国家代码: ${result[1]}`);
                if (result[1] === '228') {
                    console.log(`${getTimestamp()} 🌍 LineTV.TW 检测结果 - 已解锁 ✅`);
                    $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 已解锁 ✅" }), headers: { "Content-Type": "application/json" } } });
                } else {
                    console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 未解锁 ❌`);
                    $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 未解锁 ❌" }), headers: { "Content-Type": "application/json" } } });
                }
            } else {
                console.log(`${getTimestamp()} ❌ LineTV.TW 检测结果 - 未能解析国家代码`);
                $done({ response: { status: 200, body: JSON.stringify({ message: "LINE TV: 未能解析国家代码" }), headers: { "Content-Type": "application/json" } } });
            }
        });
    });
});