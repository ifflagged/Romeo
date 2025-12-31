const NF_BASE_URL = "https://www.netflix.com/title/80211492";
let result = {};
const flags = new Map([
    ["AC", "🇦🇨"], ["AE", "🇦🇪"], ["AF", "🇦🇫"], ["AI", "🇦🇮"],
    ["AL", "🇦🇱"], ["AM", "🇦🇲"], ["AQ", "🇦🇶"], ["AR", "🇦🇷"],
    ["AS", "🇦🇸"], ["AT", "🇦🇹"], ["AU", "🇦🇺"], ["AW", "🇦🇼"],
    ["AX", "🇦🇽"], ["AZ", "🇦🇿"], ["BA", "🇧🇦"], ["BB", "🇧🇧"],
    ["BD", "🇧🇩"], ["BE", "🇧🇪"], ["BF", "🇧🇫"], ["BG", "🇧🇬"],
    ["BH", "🇧🇭"], ["BI", "🇧🇮"], ["BJ", "🇧🇯"], ["BM", "🇧🇲"],
    ["BN", "🇧🇳"], ["BO", "🇧🇴"], ["BR", "🇧🇷"], ["BS", "🇧🇸"],
    ["BT", "🇧🇹"], ["BV", "🇧🇻"], ["BW", "🇧🇼"], ["BY", "🇧🇾"],
    ["BZ", "🇧🇿"], ["CA", "🇨🇦"], ["CF", "🇨🇫"], ["CH", "🇨🇭"],
    ["CK", "🇨🇰"], ["CL", "🇨🇱"], ["CM", "🇨🇲"], ["CN", "🇨🇳"],
    ["CO", "🇨🇴"], ["CP", "🇨🇵"], ["CR", "🇨🇷"], ["CU", "🇨🇺"],
    ["CV", "🇨🇻"], ["CW", "🇨🇼"], ["CX", "🇨🇽"], ["CY", "🇨🇾"],
    ["CZ", "🇨🇿"], ["DE", "🇩🇪"], ["DG", "🇩🇬"], ["DJ", "🇩🇯"],
    ["DK", "🇩🇰"], ["DM", "🇩🇲"], ["DO", "🇩🇴"], ["DZ", "🇩🇿"],
    ["EA", "🇪🇦"], ["EC", "🇪🇨"], ["EE", "🇪🇪"], ["EG", "🇪🇬"],
    ["EH", "🇪🇭"], ["ER", "🇪🇷"], ["ES", "🇪🇸"], ["ET", "🇪🇹"],
    ["EU", "🇪🇺"], ["FI", "🇫🇮"], ["FJ", "🇫🇯"], ["FK", "🇫🇰"],
    ["FM", "🇫🇲"], ["FO", "🇫"], ["FR", "🇫🇷"], ["GA", "🇬🇦"],
    ["GB", "🇬🇧"], ["HK", "🇭🇰"], ["HU", "🇭🇺"], ["ID", "🇮🇩"],
    ["IE", "🇮🇪"], ["IL", "🇮🇱"], ["IM", "🇮🇲"], ["IN", "🇮🇳"],
    ["IS", "🇮🇸"], ["IT", "🇮🇹"], ["JP", "🇯🇵"], ["KR", "🇰🇷"],
    ["LU", "🇱🇺"], ["MO", "🇲🇴"], ["MX", "🇲🇽"], ["MY", "🇲🇾"],
    ["NL", "🇳🇱"], ["PH", "🇵🇭"], ["RO", "🇷🇴"], ["RS", "🇷🇸"],
    ["RU", "🇷🇺"], ["RW", "🇷🇼"], ["SA", "🇸🇦"], ["SB", "🇧"],
    ["SC", "🇸🇨"], ["SD", "🇸🇩"], ["SE", "🇸🇪"], ["SG", "🇸🇬"],
    ["TH", "🇹🇭"], ["TN", "🇹🇳"], ["TO", "🇹🇴"], ["TR", "🇹🇷"],
    ["TV", "🇹🇻"], ["TW", "🇨🇳"], ["UK", "🇬🇧"], ["UM", "🇺🇲"],
    ["US", "🇺🇸"], ["UY", "🇺🇾"], ["UZ", "🇺🇿"], ["VA", "🇻🇦"],
    ["VE", "🇻🇪"], ["VG", "🇻🇬"], ["VI", "🇻🇮"], ["VN", "🇻🇳"],
    ["ZA", "🇿🇦"]
]);

function logWithTimestamp(message) {
    const timestamp = new Date().toLocaleString('zh-CN', { 
        hour12: false, 
        timeZone: 'Asia/Shanghai', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    }).replace(',', '');
    console.log(`[${timestamp}] ${message}`);
}

function nfTest() {
    return new Promise((resolve, reject) => {
        let params = {
            url: NF_BASE_URL,
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
            }
        };
        
        logWithTimestamp("▷ 开始发起 Netflix 请求...");
        logWithTimestamp(`ℹ️ 请求配置: ${JSON.stringify(params, null, 2)}`);

        $httpClient.get(params, (errormsg, response, data) => {
            logWithTimestamp("\n---------- 请求处理阶段 ----------");
            
            if (errormsg) {
                logWithTimestamp(`❌ 请求发生错误: ${JSON.stringify(errormsg)}`);
                logWithTimestamp(`◉ 响应对象: ${response ? JSON.stringify(response) : '无响应'}`);
                logWithTimestamp(`◉ 响应数据: ${data ? data.slice(0, 100) + '...' : '无数据'}`);
                
                result.message = "Netflix: 检测失败 ❗️";
                logWithTimestamp(`✓ 设置结果: ${result.message}`);
                $done({
                    response: {
                        status: 200,
                        body: JSON.stringify(result),
                        headers: { "Content-Type": "application/json" }
                    }
                });
                resolve(errormsg);
                return;
            }

            logWithTimestamp(`✔️ 收到响应 状态码: ${response.status}`);
            logWithTimestamp(`◉ 响应头: ${JSON.stringify(response.headers, null, 2)}`);
            logWithTimestamp(`◉ 响应体长度: ${data.length} 字符`);

            if (response.status === 403) {
                logWithTimestamp("🚫 进入 403 处理流程");
                logWithTimestamp(`◼︎ 可能原因: 地区未支持/代理服务器限制`);
                result.message = "Netflix: 未支持 🚫";
                $done({
                    response: {
                        status: 200,
                        body: JSON.stringify(result),
                        headers: { "Content-Type": "application/json" }
                    }
                });
                resolve("403 Not Available");
            } else if (response.status === 404) {
                logWithTimestamp("🔎 进入 404 处理流程");
                logWithTimestamp(`◼︎ 可能原因: 仅支持自制剧`);
                result.message = "Netflix: 支持自制剧集 ⚠️";
                $done({
                    response: {
                        status: 200,
                        body: JSON.stringify(result),
                        headers: { "Content-Type": "application/json" }
                    }
                });
                resolve("404 Not Found");
            } else if (response.status === 200) {
                logWithTimestamp("✅ 进入 200 处理流程");
                
                let ourl = response.headers['X-Originating-URL'] || 
                          response.headers['X-Originating-Url'] || 
                          response.headers['x-originating-url'];
                
                logWithTimestamp(`🌐 原始URL解析: ${ourl || '未找到相关头信息'}`);
                logWithTimestamp(`◼︎ 检查的头信息键: [
  "X-Originating-URL": "${response.headers['X-Originating-URL']}",
  "X-Originating-Url": "${response.headers['X-Originating-Url']}",
  "x-originating-url": "${response.headers['x-originating-url']}"
]`);

                if (!ourl) {
                    logWithTimestamp("⚠️ 未检测到地域信息，使用默认处理");
                    result.message = "Netflix: 完整支持 ⟦未知地区⟧ 🎉";
                    $done({
                        response: {
                            status: 200,
                            body: JSON.stringify(result),
                            headers: { "Content-Type": "application/json" }
                        }
                    });
                    resolve();
                    return;
                }

                logWithTimestamp("🔄 开始解析地域代码...");
                let urlParts = ourl.split('/');
                logWithTimestamp(`◉ URL分割结果: ${JSON.stringify(urlParts)}`);
                
                let region = urlParts[3] ? urlParts[3] : 'title';
                logWithTimestamp(`◉ 提取的原始地域代码: ${region}`);
                
                region = region.split('-')[0];
                logWithTimestamp(`◉ 处理后的地域代码: ${region}`);
                
                if (region === 'title') {
                    logWithTimestamp("⚠️ 检测到特殊地域代码 'title'，默认设置为 'us'");
                    region = 'us';
                }
                
                const regionFlag = flags.get(region.toUpperCase()) || '🇺🇳 未知';
                logWithTimestamp(`🌍 最终地域信息: ${regionFlag} (${region.toUpperCase()})`);
                
                result.message = `Netflix: 完整支持 ⟦${regionFlag}（${region.toUpperCase()}）⟧ 🎉`;
                $done({
                    response: {
                        status: 200,
                        body: JSON.stringify(result),
                        headers: { "Content-Type": "application/json" }
                    }
                });
                resolve(region);
            } else {
                logWithTimestamp(`⚠️ 进入非常规状态码处理: ${response.status}`);
                logWithTimestamp(`◼︎ 非预期状态码，标记为检测失败`);
                result.message = "Netflix: 检测失败 ❗️";
                $done({
                    response: {
                        status: 200,
                        body: JSON.stringify(result),
                        headers: { "Content-Type": "application/json" }
                    }
                });
                resolve(response.status);
            }
        });
    });
}

nfTest().then(region => {
    logWithTimestamp(`\n🎯 检测结果: ${JSON.stringify(result, null, 2)}`);
    $done();
}).catch(error => {
    logWithTimestamp(`\n❌ 发生错误: ${JSON.stringify({ error: error }, null, 2)}`);
    $done();
});