const testName = "📺 DAZN 解锁检测";
const testUrl = "https://startup.core.indazn.com/misl/v5/Startup";
const testUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.2 Safari/537.36";

const logs = [];
const addLog = (emoji, message) => {
    const time = new Date().toLocaleString();
    const logEntry = `🕒 ${time} | ${emoji} ${message}`;
    logs.push(logEntry);
    console.log(logEntry);
};

addLog('🚀', '开始检测 DAZN 解锁情况...');
addLog('ℹ️', `User-Agent: ${testUA}`);

$httpClient.post({
    url: testUrl,
    headers: {
        "Content-Type": "application/json",
        "User-Agent": testUA
    },
    body: JSON.stringify({
        "LandingPageKey": "generic",
        "languages": "en-US,en",
        "Platform": "web",
        "PlatformAttributes": {},
        "Manufacturer": "",
        "PromoCode": "",
        "Version": "2"
    })
}, (error, response, data) => {
    const result = { message: "" };

    if (error) {
        result.message = `DAZN:请求失败: ${error}`;
        addLog('❌', result.message);
        return $done({
            response: {
                status: 200,
                body: JSON.stringify(result),
                headers: { "Content-Type": "application/json" }
            }
        });
    }

    addLog('✅', `API 请求成功 (状态码: ${response.status})`);
    addLog('📜', `响应正文: ${data}`);

    try {
        const parsedData = JSON.parse(data);

        if (parsedData["odata.error"]) {
            result.message = `DAZN:拒绝访问: ${parsedData["odata.error"].message.value}`;
            addLog('🚫', result.message);
        } else {
            const isAllowed = parsedData.Region.isAllowed;
            const country = parsedData.Region.GeolocatedCountry ? parsedData.Region.GeolocatedCountry.toUpperCase() : "未知";
            const countryName = parsedData.Region.GeolocatedCountryName || "未知";
            const region = parsedData.Region.GeolocatedRegion || "未知";
            const currency = parsedData.Region.Currency || "未知";

            addLog('🌍', `检测到地区: ${country} (${countryName}), 区域: ${region}, 货币: ${currency}`);

            if (isAllowed === true) {
                result.message = `DAZN:已解锁✅ (地区: ${country})`;
                addLog('🎉', result.message);
            } else if (isAllowed === false) {
                result.message = `DAZN:🚫被封锁，无法观看`;
                addLog('🚫', result.message);
            } else {
                result.message = `未知返回值: ${JSON.stringify(parsedData)}`;
                addLog('⚠️', result.message);
            }
        }
    } catch (e) {
        result.message = `解析 JSON 失败: ${e.message}`;
        addLog('🔴', result.message);
    }

    return $done({
        response: {
            status: 200,
            body: JSON.stringify(result),
            headers: { "Content-Type": "application/json" }
        }
    });
});