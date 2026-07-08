let url = "https://www.nicovideo.jp/watch/so23017073";
let liveUrl = "https://live.nicovideo.jp/?cmnhd_ref=device=pc&site=nicolive&pos=header_servicelink&ref=WatchPage-Anchor";
let headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "sec-ch-ua": "Some-UA",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "Windows",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
};

function log(message, emoji = "📄") {
    const now = new Date();
    const timestamp = `[${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    console.log(`${timestamp} - ${emoji} ${message}`);
}

log("========== 开始执行检测 ==========", "🚀");

$httpClient.get({ url: url, headers: headers }, function (error, response, body) {
    let result = {};

    if (error) {
        result.message = "Niconico: 网络连接失败";
        log(`[HTTP] 请求失败: ${error}`, "❌");
        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
        return;
    }

    log(`[HTTP] 视频页面请求成功 状态码:${response.status} 数据长度:${body.length}`, "✅");

    log("[检测] 开始请求直播页面", "🔍");
    $httpClient.get({ url: liveUrl, headers: headers }, function (error2, response2, body2) {
        if (error2) {
            result.message = "Niconico: 网络连接失败 (Live Page)";
            log(`[HTTP] 直播页面请求失败: ${error2}`, "❌");
            $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
            return;
        }

        log(`[HTTP] 直播页面请求成功 状态码:${response2.status} 数据长度:${body2.length}`, "✅");

        log("[检测] 开始解析直播页面数据", "🔍");
        let liveID = body2.match(/&quot;id&quot;:&quot;(lv[0-9]+)/);
        if (!liveID) {
            result.message = "Niconico: 获取直播ID失败";
            log("[检测] 无法找到直播ID", "❓");
            $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
            return;
        }

        log(`[检测] 提取到直播ID: ${liveID[1]}`, "📍");

        log(`[检测] 开始请求直播ID页面: ${liveID[1]}`, "🔍");
        $httpClient.get({ url: `https://live.nicovideo.jp/watch/${liveID[1]}`, headers: headers }, function (error3, response3, body3) {
            if (error3) {
                result.message = "Niconico: 网络连接失败 (LiveID Page)";
                log(`[HTTP] 直播ID页面请求失败: ${error3}`, "❌");
                $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                return;
            }

            log(`[HTTP] 直播ID页面请求成功 状态码:${response3.status} 数据长度:${body3.length}`, "✅");

            log("[检测] 开始检测地区限制", "🔍");
            let isBlocked = body.match(/同じ地域/);
            let isJapanOnly = body3.match(/notAllowedCountry/);

            if (!isBlocked && !isJapanOnly) {
                result.message = `Niconico: 解锁 ✅ (LiveID: ${liveID[1]})`;
                log("[检测] Niconico 解锁成功", "✅");
            } else if (isBlocked) {
                result.message = "Niconico: 未解锁 ❌ (地区限制)";
                log("[检测] Niconico 被地区限制", "🚫");
            } else if (isJapanOnly) {
                result.message = `Niconico: 未解锁 ❌ (仅限日本) (LiveID: ${liveID[1]})`;
                log("[检测] Niconico 仅限日本", "🚫");
            } else {
                result.message = "Niconico: 未解锁 ❌ (未知原因)";
                log("[检测] Niconico 未解锁 (未知原因)", "❓");
            }

            log("========== 检测结果汇总 ==========", "📊");
            log(`结果: ${result.message}`, "📝");
            $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
        });
    });
});