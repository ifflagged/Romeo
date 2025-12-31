const url = "https://play.google.com/";
const headers = {
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "en-US;q=0.9",
  "priority": "u=0, i",
  "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
};

function getCurrentTime() {
  const now = new Date();
  return now.toISOString().replace("T", " ").split(".")[0];
}

function log(status, message) {
  const time = getCurrentTime();
  const emoji = status === "success" ? "✅" : status === "error" ? "❌" : "⚠️";
  console.log(`[${time}] ${emoji} ${message}`);
}

function detailedLog(message) {
  const time = getCurrentTime();
  console.log(`[${time}] 🔍 ${message}`);
}

detailedLog("开始检测 Google Play Store 可访问性...");

$httpClient.get(
  {
    url: url,
    headers: headers
  },
  (error, response, data) => {
    if (error) {
      log("error", "无法连接到 Google Play Store (网络连接失败)");
      detailedLog("请求过程中发生错误，无法连接到服务器");

      const result = {
        message: "Google Play Store: ❌ Failed"
      };
      $done({ response: { status: 200, body: JSON.stringify(result) } });
      return;
    }

    detailedLog(`收到响应，状态码：${response.status}`);

    if (response.status !== 200) {
      log("error", `请求失败，状态码：${response.status}`);
      detailedLog(`请求失败，状态码：${response.status}`);

      const result = {
        message: `Google Play Store: ❌ Failed - 状态码：${response.status}`
      };
      $done({ response: { status: 200, body: JSON.stringify(result) } });
      return;
    }

    detailedLog("开始检查返回的内容");

    const result = data.match(/<div class="yVZQTb">([^<]+)<\/div>/);
    if (!result) {
      log("error", "未能提取到有效数据");
      detailedLog("未能提取到有效数据");

      const resultMessage = {
        message: "Google Play Store: ❌ Failed"
      };
      $done({ response: { status: 200, body: JSON.stringify(resultMessage) } });
    } else {
      detailedLog(`提取到的数据：${result[1]}`);
      log("success", `Google Play Store: ✅ ${result[1]}`);

      const resultMessage = {
        message: `Google Play Store: ✅ ${result[1]}`
      };
      $done({ response: { status: 200, body: JSON.stringify(resultMessage) } });
    }
  }
);