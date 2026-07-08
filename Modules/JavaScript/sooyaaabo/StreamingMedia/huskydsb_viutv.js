let url = "https://api.viu.now.com/p8/3/getLiveURL";
let headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
};
let data = JSON.stringify({
    "callerReferenceNo": "20210726112323",
    "contentId": "099",
    "contentType": "Channel",
    "channelno": "099",
    "mode": "prod",
    "deviceId": "29b3cb117a635d5b56",
    "deviceType": "ANDROID_WEB"
});

function getTimestamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

console.log(`${getTimestamp()} 🚀 开始发起 ViuTV 解锁检测请求`);
console.log(`${getTimestamp()} 🌐 请求 URL: ${url}`);
console.log(`${getTimestamp()} 📋 请求 Headers: ${JSON.stringify(headers)}`);
console.log(`${getTimestamp()} 📦 请求数据: ${data}`);

$httpClient.post({ url: url, headers: headers, body: data }, function (error, response, body) {
    let result = {};

    if (error) {
        result.message = "ViuTV: 网络连接失败";
        console.log(`${getTimestamp()} ❌ ViuTV 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
    } else if (body) {
        console.log(`${getTimestamp()} ✅ ViuTV 响应体获取成功`);
        console.log(`${getTimestamp()} 📊 响应状态码: ${response.status}`);
        console.log(`${getTimestamp()} 📄 响应头: ${JSON.stringify(response.headers)}`);
        console.log(`${getTimestamp()} 📥 响应体: ${body}`);

        let responseCode = JSON.parse(body).responseCode;
        switch (responseCode) {
            case 'GEO_CHECK_FAIL':
                result.message = "ViuTV: 未解锁 ❌";
                console.log(`${getTimestamp()} ❌ ViuTV 检测结果 - ${result.message}`);
                console.log(`${getTimestamp()} 🔍 失败原因: 地理位置不符合要求`);
                break;
            case 'SUCCESS':
                result.message = "ViuTV: 已解锁 ✅";
                console.log(`${getTimestamp()} 🌍 ViuTV 检测结果 - ${result.message}`);
                console.log(`${getTimestamp()} 🔍 成功原因: 地理位置符合要求`);
                break;
            default:
                result.message = `ViuTV: 检测失败，错误代码: ${responseCode}`;
                console.log(`${getTimestamp()} ❓ ViuTV 检测结果 - ${result.message}`);
                console.log(`${getTimestamp()} 🔍 失败原因: 未知错误代码`);
                break;
        }
    } else {
        result.message = "ViuTV: 检测失败，无法获取响应";
        console.log(`${getTimestamp()} ❌ ViuTV 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 响应体为空`);
    }
    
    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
});