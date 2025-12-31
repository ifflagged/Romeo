let result = {};
let regions = {
  mainland: "哔哩哔哩大陆限定",
  hkMctw: "哔哩哔哩港澳台限定",
  tw: "哔哩哔哩台湾限定",
};

(async () => {
  try {
    console.log(`[${new Date().toLocaleString()}] 🚀 开始 Bilibili 解锁检测...`);
    await MediaUnlockTest_Bilibili("mainland");
    await MediaUnlockTest_Bilibili("hkMctw");
    await MediaUnlockTest_Bilibili("tw");
    console.log(`[${new Date().toLocaleString()}] 🎉 Bilibili 解锁检测完成`);
  } catch (error) {
    result.message = `❌ 发生错误: ${error.message}`;
    console.log(`[${new Date().toLocaleString()}] ❌ 错误信息: ${error.message}`);
  }

  result.message = Object.values(result).join('<br>');
  console.log(`[${new Date().toLocaleString()}] 📄 返回结果: ${JSON.stringify(result)}`);

  $done({
    response: {
      status: 200,
      body: JSON.stringify(result),
      headers: { "Content-Type": "application/json" },
    },
  });
})();

async function MediaUnlockTest_Bilibili(region) {
  const randsession = generateUUID();
  let url = getBilibiliUrl(region, randsession);

  console.log(`[${new Date().toLocaleString()}] 🔍 检测 ${regions[region]}...`);
  console.log(`[${new Date().toLocaleString()}] 🔗 请求 URL: ${url}`);

  let options = {
    url: url,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 10000,
  };

  return new Promise((resolve, reject) => {
    $httpClient.get(options, (error, response, body) => {
      if (error) {
        result[region] = `${regions[region]}: ❌ 网络连接失败`;
        console.log(`[${new Date().toLocaleString()}] ❌ ${regions[region]}: 网络连接失败`);
        console.log(`[${new Date().toLocaleString()}] 🔍 错误详情: ${error}`);
        resolve();
      } else {
        console.log(`[${new Date().toLocaleString()}] 📄 响应体内容: ${body}`);
        let code = extractResultCode(body);
        if (code === "0") {
          result[region] = `${regions[region]}: ✅ 解锁成功`;
          console.log(`[${new Date().toLocaleString()}] 🎉 ${regions[region]}: 解锁成功`);
        } else if (code === "-10403") {
          result[region] = `${regions[region]}: ❌ 未解锁`;
          console.log(`[${new Date().toLocaleString()}] ❌ ${regions[region]}: 未解锁`);
        } else {
          result[region] = `${regions[region]}: ❌ 错误代码: ${code}`;
          console.log(`[${new Date().toLocaleString()}] ❌ ${regions[region]}: 错误代码: ${code}`);
        }
        resolve();
      }
    });
  });
}

function getBilibiliUrl(region, randsession) {
  const urls = {
    mainland: `https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&session=${randsession}&module=bangumi`,
    hkMctw: `https://api.bilibili.com/pgc/player/web/playurl?avid=18281381&cid=29892777&qn=0&type=&otype=json&ep_id=183799&fourk=1&fnver=0&fnval=16&session=${randsession}&module=bangumi`,
    tw: `https://api.bilibili.com/pgc/player/web/playurl?avid=50762638&cid=100279344&qn=0&type=&otype=json&ep_id=268176&fourk=1&fnver=0&fnval=16&session=${randsession}&module=bangumi`,
  };
  return urls[region] || "";
}

function extractResultCode(body) {
  const result = body.match(/"code"\s*:\s*(-?\d+)/);
  return result ? result[1] : null;
}

function generateUUID() {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}