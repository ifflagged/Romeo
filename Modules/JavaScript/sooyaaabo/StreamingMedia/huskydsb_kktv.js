let url = "https://api.kktv.me/v3/ipcheck";
let headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en-GB;q=0.8,en;q=0.7,en-US;q=0.6",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15"
};

function getTimestamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

console.log(`${getTimestamp()} 🚀 开始发起 KKTV 解锁检测请求`);
console.log(`${getTimestamp()} 🌐 请求 URL: ${url}`);
console.log(`${getTimestamp()} 📋 请求 Headers: ${JSON.stringify(headers)}`);

$httpClient.get({ url: url, headers: headers }, function (error, response, body) {
    let result = {};

    if (error) {
        result.message = "KKTV: 网络连接失败";
        console.log(`${getTimestamp()} ❌ KKTV 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
    } else if (body) {
        console.log(`${getTimestamp()} ✅ KKTV 响应体获取成功`);
        console.log(`${getTimestamp()} 📊 响应状态码: ${response.status}`);
        console.log(`${getTimestamp()} 📄 响应头: ${JSON.stringify(response.headers)}`);
        console.log(`${getTimestamp()} 📥 响应体: ${body}`);

        let parsedBody = JSON.parse(body);
        let country = parsedBody.data.country;
        let isAllowed = parsedBody.data.is_allowed;

        if (country === 'TW' && isAllowed) {
            result.message = "KKTV: 已解锁 ✅";
            console.log(`${getTimestamp()} 🌍 KKTV 检测结果 - ${result.message}`);
            console.log(`${getTimestamp()} 🔍 成功原因: 地理位置符合要求`);
        } else {
            result.message = "KKTV: 未解锁 ❌";
            console.log(`${getTimestamp()} ❌ KKTV 检测结果 - ${result.message}`);
            console.log(`${getTimestamp()} 🔍 失败原因: 地理位置不符合要求`);
        }
    } else {
        result.message = "KKTV: 检测失败，无法获取响应";
        console.log(`${getTimestamp()} ❌ KKTV 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 响应体为空`);
    }
    
    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
});