function log(message, emoji = "📄") {
    const now = new Date();
    const timestamp = `[${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    console.log(`${timestamp} - ${emoji} ${message}`);
}

function retryRequest(options, callback, attempts = 3) {
    log(`[HTTP] 开始请求 ${options.url} (超时:${options.timeout}ms 重试:${attempts}次)`, "🌐");

    $httpClient.get(options, function (error, response, data) {
        if (error) {
            log(`[HTTP] 请求失败 ${options.url}: ${error.code || 'UNKNOWN_ERROR'}`, "❌");
            if (attempts > 1) {
                log(`[HTTP] 将重试 ${options.url} 剩余次数:${attempts - 1}`, "🔄");
                return retryRequest(options, callback, attempts - 1);
            }
            callback(error);
            return;
        }

        log(`[HTTP] 响应成功 ${options.url} 状态码:${response.status} 数据长度:${data.length}`, "✅");
        callback(null, response, data);
    });
}

function MediaUnlockTest_YouTube_Premium() {
    return new Promise((resolve) => {
        log("[检测] 开始执行 YouTube Premium 解锁检测", "🔍");

        let options = {
            url: 'https://www.youtube.com/premium',
            headers: {
                'accept-language': 'en-US,en;q=0.9',
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1'
            },
            timeout: 10000
        };

        retryRequest(options, function (error, response, data) {
            if (error) {
                log("[检测] YouTube Premium 网络连接失败", "❌");
                resolve("Failed (Network Connection)");
                return;
            }

            log("[检测] 开始解析 YouTube Premium 响应数据", "🔍");
            let isCN = data.includes('www.google.cn');
            if (isCN) {
                log("[检测] 识别到中国地区限制 (www.google.cn)", "🚫");
                resolve("No (Region: CN)");
                return;
            }

            let isNotAvailable = data.match(/Premium is not available in your country/i);
            let region = data.match(/"INNERTUBE_CONTEXT_GL"\s*:\s*"([^"]+)"/);
            let isAvailable = data.match(/ad-free/i);

            if (isNotAvailable) {
                log("[检测] 匹配到地区不可用提示", "🚫");
                resolve("No");
                return;
            }

            region = region ? region[1] : 'UNKNOWN';
            log(`[检测] 提取到地区代码: ${region}`, "📍");

            if (isAvailable) {
                log("[检测] 确认 Premium 可用状态", "✅");
                resolve(`Yes (Region: ${region})`);
            } else {
                log("[检测] 页面数据异常，无法判断状态", "❓");
                resolve("Failed (Error: PAGE ERROR)");
            }
        });
    });
}

function RegionTest_YouTubeCDN() {
    return new Promise((resolve) => {
        log("[检测] 开始执行 YouTube CDN 检测", "🔍");

        let options = {
            url: 'https://redirector.googlevideo.com/report_mapping',
            headers: {
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1'
            },
            timeout: 10000
        };

        retryRequest(options, function (error, response, data) {
            if (error) {
                log("[检测] YouTube CDN 网络连接失败", "❌");
                resolve("Failed (Network Connection)");
                return;
            }

            log(`[检测] 收到 CDN 数据长度: ${data.length}`, "📦");
            let output = data.split('Debug Info:')[0].trim();

            if (output.length === 0) {
                log("[检测] CDN 数据异常：无有效内容", "❓");
                resolve("Failed (No valid data found before 'Debug Info:')");
                return;
            }

            log(`[检测] 原始 CDN 数据片段: ${output.substring(0, 50)}...`, "🔍");
            let match = output.match(/=>\s*([a-z]{3})/i);
            let location = match ? match[1] : "Unknown";

            log(`[检测] 解析到 CDN 位置标识: ${location}`, "📍");
            resolve(location);
        });
    });
}

function handleRequest() {
    log("========== 开始执行综合检测 ==========", "🚀");
    return Promise.all([MediaUnlockTest_YouTube_Premium(), RegionTest_YouTubeCDN()])
        .then(results => {
            log("========== 检测结果汇总 ==========", "📊");
            const youTubeCDNStatus = results[1];
            const youTubePremiumStatus = results[0];

            log(`CDN 状态: ${youTubeCDNStatus}`, "📍");
            log(`Premium 状态: ${youTubePremiumStatus}`, "✅");

            const combinedMessage = `YouTube CDN: ${youTubeCDNStatus}<br>YouTube Premium: ${youTubePremiumStatus}`;

            $done({
                response: {
                    status: 200,
                    body: JSON.stringify({ message: combinedMessage }),
                    headers: { "Content-Type": "application/json" }
                }
            });
        }).catch(error => {
            log(`[错误] 全局捕获异常: ${error}`, "❌");
            $done({
                response: {
                    status: 500,
                    body: JSON.stringify({ message: "检测失败" }),
                    headers: { "Content-Type": "application/json" }
                }
            });
        });
}

handleRequest();