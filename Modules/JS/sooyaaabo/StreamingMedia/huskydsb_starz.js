let urlAuthorization = 'https://www.starz.com/sapi/header/v1/starz/us/09b397fc9eb64d5080687fc8a218775b';
let urlGeolocation = 'https://auth.starz.com/api/v4/User/geolocation';
let headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://www.starz.com/us/en/"
};

const countryFlags = {
    "US": "🇺🇸",
    "GB": "🇬🇧",
    "CA": "🇨🇦",
    "AU": "🇦🇺",
    "FR": "🇫🇷",
    "DE": "🇩🇪",
    "IN": "🇮🇳",
    "JP": "🇯🇵",
    "KR": "🇰🇷"
};

function getTimestamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

console.log(`${getTimestamp()} 🚀 开始发起 Starz 解锁检测请求`);

$httpClient.get({ url: urlAuthorization, headers: headers }, function (error, response, body) {
    if (error) {
        console.log(`${getTimestamp()} ❌ Starz 检测结果 - ❌网络连接失败`);
        console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
        $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: ❌网络连接失败" }), headers: { "Content-Type": "application/json" } } });
        return;
    }

    console.log(`${getTimestamp()} 📡 请求成功，开始解析授权信息`);
    let authorization = body;
    if (!authorization) {
        console.log(`${getTimestamp()} ❌ Starz 检测结果 - ❌获取授权失败 (授权信息为空)`);
        $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: ❌获取授权失败" }), headers: { "Content-Type": "application/json" } } });
        return;
    }

    console.log(`${getTimestamp()} ✅ 获取授权信息成功: ${authorization}`);
    
    $httpClient.get({ url: urlGeolocation, headers: { ...headers, "AuthTokenAuthorization": authorization } }, function (error, response, body) {
        if (error) {
            console.log(`${getTimestamp()} ❌ Starz 检测结果 - ❌网络连接失败`);
            console.log(`${getTimestamp()} 🔍 错误详情: ${error}`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: ❌网络连接失败" }), headers: { "Content-Type": "application/json" } } });
            return;
        }

        console.log(`${getTimestamp()} 📡 请求成功，开始解析地理位置数据`);
        
        let result = {};
        try {
            result = JSON.parse(body);
        } catch (e) {
            console.log(`${getTimestamp()} ❌ 解析响应体失败: ${e}`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: ❌响应体解析失败" }), headers: { "Content-Type": "application/json" } } });
            return;
        }

        console.log(`${getTimestamp()} 📊 响应体解析成功`);
        console.log(`${getTimestamp()} 📝 响应数据: ${JSON.stringify(result)}`);

        let isAllowedAccess = result.isAllowedAccess;
        let isAllowedCountry = result.isAllowedCountry;
        let isKnownProxy = result.isKnownProxy;
        let countryCode = result.country;

        console.log(`${getTimestamp()} 🧐 获取到的字段值：`);
        console.log(`${getTimestamp()} 🏷 isAllowedAccess: ${isAllowedAccess}`);
        console.log(`${getTimestamp()} 🏷 isAllowedCountry: ${isAllowedCountry}`);
        console.log(`${getTimestamp()} 🏷 isKnownProxy: ${isKnownProxy}`);
        console.log(`${getTimestamp()} 🏷 countryCode: ${countryCode}`);

        if (isAllowedAccess === undefined || isAllowedCountry === undefined || isKnownProxy === undefined) {
            console.log(`${getTimestamp()} ❌ Starz 检测结果 - ❌页面错误 (某个字段缺失)`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: ❌页面错误" }), headers: { "Content-Type": "application/json" } } });
            return;
        }

        console.log(`${getTimestamp()} 🔍 判断是否允许访问以及国家验证`);
        if (isAllowedAccess && isAllowedCountry && !isKnownProxy) {
            let countryFlag = countryFlags[countryCode] || "🏳️";
            console.log(`${getTimestamp()} ✅ Starz 检测结果 - ✅已解锁 ${countryFlag} (${countryCode})`);
            $done({ response: { status: 200, body: JSON.stringify({ message: `Starz: ✅已解锁 ${countryFlag} (${countryCode})` }), headers: { "Content-Type": "application/json" } } });
        } else if (!isAllowedAccess || isKnownProxy) {
            console.log(`${getTimestamp()} ❌ Starz 检测结果 - ❌未解锁`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: ❌未解锁" }), headers: { "Content-Type": "application/json" } } });
        } else {
            console.log(`${getTimestamp()} ❌ Starz 检测结果 - ❌未知错误`);
            $done({ response: { status: 200, body: JSON.stringify({ message: "Starz: 未知错误" }), headers: { "Content-Type": "application/json" } } });
        }
    });
});
