const url = "https://zh.wikipedia.org/w/index.php?title=Wikipedia%3A%E6%B2%99%E7%9B%92&action=edit";
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

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

detailedLog("开始检测 Wikipedia 可编辑性...");

$httpClient.get(
  {
    url: url,
    headers: { "User-Agent": userAgent }
  },
  (error, response, data) => {
    if (error) {
      log("error", "无法连接到 Wikipedia (网络连接失败)");
      detailedLog("请求过程中发生错误，无法连接到服务器");

      const result = {
        message: "无法连接到 Wikipedia (网络连接失败)"
      };
      $done({ response: { status: 200, body: JSON.stringify(result) } });
      return;
    }

    detailedLog(`收到响应，状态码：${response.status}`);

    if (response.status !== 200) {
      log("error", `请求失败，状态码：${response.status}`);
      detailedLog(`请求失败，状态码：${response.status}`);

      const result = {
        message: `请求失败，状态码：${response.status}`
      };
      $done({ response: { status: 200, body: JSON.stringify(result) } });
      return;
    }

    detailedLog("开始检查返回的内容是否包含 'Banned'");

    let resultMessage = '';
    if (data.includes("Banned")) {
      resultMessage = "Wikipedia :❌ 不可编辑 (被禁止访问)";
      detailedLog("'Banned' 字样已被检测到，判定为不可编辑");

      const result = {
        message: "Wikipedia :❌ 不可编辑 (被禁止访问)"
      };
      $done({ response: { status: 200, body: JSON.stringify(result) } });
    } else {
      resultMessage = "Wikipedia :✅ 可编辑";
      detailedLog("未检测到 'Banned' 字样，判定为可编辑");

      const result = {
        message: "Wikipedia :✅ 可编辑"
      };
      $done({ response: { status: 200, body: JSON.stringify(result) } });
    }

    log("success", resultMessage);
  }
);