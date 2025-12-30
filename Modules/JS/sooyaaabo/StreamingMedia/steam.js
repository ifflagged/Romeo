function getTimeStamp() {
    const now = new Date();
    return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

function logWithEmoji(emoji, message) {
    console.log(`${getTimeStamp()} - ${emoji} ${message}`);
}

let url = "https://store.steampowered.com/app/1295660/VII/";
let headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Host': 'store.steampowered.com',
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
};

var params = {
    url: url,
    timeout: 5000,
    headers: headers,
};

const currencyMap = {
    "JP": ["¥", "JPY"],    "US": ["$", "USD"],  "GB": ["£", "GBP"],
    "CN": ["¥", "CNY"],    "EU": ["€", "EUR"],  "IN": ["₹", "INR"],
    "CA": ["$", "CAD"],    "AU": ["$", "AUD"],  "KR": ["₩", "KRW"],
    "TW": ["NT$", "TWD"],  "RU": ["₽", "RUB"],  "CH": ["Fr", "CHF"],
    "BR": ["R$", "BRL"],   "ZA": ["R", "ZAR"],  "MX": ["$", "MXN"],
    "SG": ["$", "SGD"],    "HK": ["$", "HKD"],  "NZ": ["$", "NZD"],
    "SE": ["kr", "SEK"],   "NO": ["kr", "NOK"], "DK": ["kr", "DKK"],
    "PL": ["zł", "PLN"],   "TH": ["฿", "THB"],  "MY": ["RM", "MYR"],
    "ID": ["Rp", "IDR"],   "TR": ["₺", "TRY"],  "SA": ["﷼", "SAR"],
    "AE": ["د.إ", "AED"],  "IL": ["₪", "ILS"],  "EG": ["£", "EGP"],
    "NG": ["₦", "NGN"],    "PK": ["₨", "PKR"],  "BD": ["৳", "BDT"],
    "VN": ["₫", "VND"],    "PH": ["₱", "PHP"],  "AR": ["$", "ARS"],
    "CL": ["$", "CLP"],    "CO": ["$", "COP"],  "PE": ["S/", "PEN"],
    "UA": ["₴", "UAH"],    "HU": ["Ft", "HUF"], "CZ": ["Kč", "CZK"],
    "RO": ["lei", "RON"],  "BG": ["лв", "BGN"], "HR": ["kn", "HRK"],
    "KE": ["Sh", "KES"],   "TZ": ["Sh", "TZS"], "UG": ["Sh", "UGX"]
};

function fetchData(params) {
    return new Promise((resolve, reject) => {
        logWithEmoji("🚀", `启动请求 -> ${params.url}`);
        logWithEmoji("🔍", `请求头: ${JSON.stringify(params.headers).slice(0, 80)}...`);
        $httpClient.get(params, (err, response, data) => {
            if (err) {
                logWithEmoji("❌", `请求失败: ${err.code} | ${err.message}`);
                reject(err);
            } else {
                logWithEmoji("✅", `响应状态: ${response.status}`);
                logWithEmoji("📦", `响应头: ${JSON.stringify(response.headers).slice(0, 100)}...`);
                resolve(response);
            }
        });
    });
}

logWithEmoji("⚡", "脚本初始化开始");
fetchData(params)
    .then(response => {
        let result = {};
        logWithEmoji("🔧", "开始解析响应数据");
        try {
            const cookies = response.headers['Set-Cookie'];
            if (!cookies) {
                logWithEmoji("⚠️", "响应头中未找到Set-Cookie字段");
                throw new Error("Missing cookies");
            }
            logWithEmoji("🍪", `原始Cookie数据: ${cookies.slice(0, 80)}...`);
            const steamCountry = cookies.split(';').find(c => c.trim().startsWith('steamCountry='));
            if (!steamCountry) {
                logWithEmoji("⚠️", "Cookie中未找到steamCountry字段");
                throw new Error("Country code not found");
            }
            const countryCode = steamCountry.split('=')[1].split('%7C')[0];
            logWithEmoji("🌍", `提取国家代码: ${countryCode}`);
            const currency = currencyMap[countryCode] || ["?", "Unknown"];
            result.message = `Steam地区: ${countryCode}<br>Steam货币: ${currency[0]} ${currency[1]}`;
            logWithEmoji("💹", `最终货币解析: ${currency[1]} (${currency[0]})`);
        } catch (e) {
            logWithEmoji("⛔", `数据处理错误: ${e.message}`);
            result.message = "无法检测地区信息";
        }
        logWithEmoji("📋", `最终结果: ${result.message}`);
        $done({ response: { status: 200, body: JSON.stringify(result) } });
    })
    .catch(error => {
        logWithEmoji("💥", `全局错误: ${error.message || error}`);
        $done({
            response: {
                status: 500,
                body: JSON.stringify({ message: "检测失败: " + (error.message || "未知错误") })
            }
        });
    });

logWithEmoji("⏳", "等待请求响应...");