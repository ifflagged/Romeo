let url = "https://webtvapi.nowe.com/16/1/getVodURL";
let headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en-GB;q=0.8,en;q=0.7,en-US;q=0.6",
    "Content-Type": "text/plain",
    "Origin": "https://www.nowe.com",
    "Priority": "u=1, i",
    "Referer": "https://www.nowe.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/131.0.0.0"
};
let data = JSON.stringify({
    "contentId": "202310181863841",
    "contentType": "Vod",
    "pin": "",
    "deviceName": "Browser",
    "deviceId": "w-678913af-3998-3998-3998-39983998",
    "deviceType": "WEB",
    "secureCookie": null,
    "callerReferenceNo": "W17370372345461425",
    "profileId": null,
    "mupId": null,
    "trackId": "738296446.226.1737037103860.2",
    "sessionId": "c39f03e6-9e74-4d24-a82f-e0d0f328bb70"
});

function getTimestamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

console.log(`${getTimestamp()} 🚀 开始发起 Now E 解锁检测请求`);
console.log(`${getTimestamp()} 🌐 请求 URL: ${url}`);
console.log(`${getTimestamp()} 📋 请求 Headers: ${JSON.stringify(headers)}`);
console.log(`${getTimestamp()} 📦 请求数据: ${data}`);

$httpClient.post({ url: url, headers: headers, body: data }, function (error, response, body) {
    let result = {};

    if (error) {
        result.message = "Now E: 网络连接失败";
        console.log(`${getTimestamp()} ❌ Now E 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
    } else if (body) {
        console.log(`${getTimestamp()} ✅ Now E 响应体获取成功`);
        console.log(`${getTimestamp()} 📊 响应状态码: ${response.status}`);
        console.log(`${getTimestamp()} 📄 响应头: ${JSON.stringify(response.headers)}`);
        console.log(`${getTimestamp()} 📥 响应体: ${body}`);

        let parsedBody = JSON.parse(body);
        let responseCode = parsedBody.responseCode;
        let ottapiResponseCode = parsedBody.OTTAPI_ResponseCode;

        if (responseCode === 'GEO_CHECK_FAIL') {
            result.message = "Now E: 未解锁 ❌";
            console.log(`${getTimestamp()} ❌ Now E 检测结果 - ${result.message}`);
            console.log(`${getTimestamp()} 🔍 失败原因: 地理位置不符合要求`);
        } else if (ottapiResponseCode === 'SUCCESS') {
            result.message = "Now E: 已解锁 ✅";
            console.log(`${getTimestamp()} 🌍 Now E 检测结果 - ${result.message}`);
            console.log(`${getTimestamp()} 🔍 成功原因: 地理位置符合要求`);
        } else {
            result.message = `Now E: 检测失败，错误代码: ${responseCode}`;
            console.log(`${getTimestamp()} ❓ Now E 检测结果 - ${result.message}`);
            console.log(`${getTimestamp()} 🔍 失败原因: 未知错误代码`);
        }
    } else {
        result.message = "Now E: 检测失败，无法获取响应";
        console.log(`${getTimestamp()} ❌ Now E 检测结果 - ${result.message}`);
        console.log(`${getTimestamp()} 🔍 响应体为空`);
    }
    
    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
});