const arrow = " ➟ ";
let lastPrice = null;
let spotify = "🔴No"; 
let result = {}; 

const token = $persistentStore.read("ipinfo_token") || "";

(async () => {
  try {
    console.log(`[${new Date().toLocaleString()}] ▶️ 开始 Spotify 测试...`);
    await Spotify_Test();
    console.log(`[${new Date().toLocaleString()}] ✅ Spotify 测试完成`);

    console.log(`[${new Date().toLocaleString()}] ▶️ 开始获取 Spotify 价格...`);
    await Spotify_Price();
    console.log(`[${new Date().toLocaleString()}] ✅ Spotify 价格获取完成`);
  } catch (error) {
    result.message = "❌发生错误: " + error.message;
    console.log(`[${new Date().toLocaleString()}] ❌ 错误信息: ${error.message}`);
    return $done({
      response: {
        status: 200,
        body: JSON.stringify(result),
        headers: { "Content-Type": "application/json" },
      },
    });
  }

  result.message = `🎶查询成功 - Spotify 状态与价格<br>`;
  result.message += `Spotify Status: ${spotify}<br>`;
  result.message += `Price: ${lastPrice || "N/A"}<br>`; 

  console.log(`[${new Date().toLocaleString()}] 📤 返回结果: ${JSON.stringify(result)}`);

  return $done({
    response: {
      status: 200,
      body: JSON.stringify(result),
      headers: { "Content-Type": "application/json" },
    },
  });
})();

async function Spotify_Test() {
  var options = {
    url: `https://spclient.wg.spotify.com/signup/public/v1/account`,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "en",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: "birth_day=11&birth_month=11&birth_year=2000&collect_personal_info=undefined&creation_flow=&creation_point=https%3A%2F%2Fwww.spotify.com%2Fhk-en%2F&displayname=Gay%20Lord&gender=male&iagree=1&key=a1e486e2729f46d6bb368d6b2bcda326&platform=www&referrer=&send-email=0&thirdpartyemail=0&identifier_token=AgE6YTvEzkReHNfJpO114514",
    timeout: 10000,
  };

  console.log(`[${new Date().toLocaleString()}] 📤 发送 Spotify 测试请求...`);
  return new Promise((resolve, reject) => {
    $httpClient.post(options, (error, response, body) => {
      if (error) {
        console.log(`[${new Date().toLocaleString()}] ❌ Spotify 测试请求失败: ${error}`);
        reject("❌请求失败: " + error);
      } else {
        console.log(`[${new Date().toLocaleString()}] 📥 Spotify 注册响应: ${body}`);
        try {
          var obj = JSON.parse(body);
          if (obj.status == "320" || obj.status == "120") {
            spotify = "🔴No";
          } else if (obj.status == "311") {
            let spotify_country = obj.country;
            spotify = "🎉Yes" + arrow + getCountryFlagEmoji(obj.country) + spotify_country;
          }
          console.log(`[${new Date().toLocaleString()}] ℹ️🎵 Spotify 状态: ${spotify}`);
          resolve();
        } catch (e) {
          console.log(`[${new Date().toLocaleString()}] ❌ JSON 解析失败: ${e}`);
          reject("❌响应解析失败");
        }
      }
    });
  });
}

async function Spotify_Price() {
  let lang;
  try {
    lang = spotify_country ? spotify_country.toLowerCase() : await getLanguage();
  } catch (e) {
    console.log(`[${new Date().toLocaleString()}] ❌ 获取语言失败: ${e}`);
    lang = "us";
  }

  var options = {
    url: `https://www.spotify.com/${lang}/premium/`,
    headers: {
      Cookie: `sp_t=10f2c6c4-dcd4-4ca8-9b60-bd1718e60d4b; sp_landing=https%3A%2F%2Fwww.spotify.com%2Fnl%2Fpremium%2F; sp_m=nl; sp_new=1; sp_t=8edfd15b-23d8-4b5f-b6ec-27da0f69f674`,
      "Accept-Encoding": `gzip, deflate, br`,
      Accept: `*/*`,
      Referer: `https://www.spotify.com/nl/premium/`,
      Connection: `keep-alive`,
      Host: `www.spotify.com`,
      "User-Agent": `Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1`,
      "Accept-Language": `zh-CN,zh-Hans;q=0.9`,
    },
    timeout: 10000,
  };

  console.log(`[${new Date().toLocaleString()}] 📤 发送价格请求到: ${options.url}`);
  return new Promise((resolve, reject) => {
    $httpClient.get(options, (error, response, body) => {
      if (error) {
        console.log(`[${new Date().toLocaleString()}] ❌ 价格请求失败: ${error}`);
        reject("❌请求失败: " + error);
      } else {
        console.log(`[${new Date().toLocaleString()}] 📥 价格响应状态码: ${response.status}`);
        let matchResult;
        const regex = /"primaryPriceDescription"\s*:\s*"([^"]+)"/g;

        try {
          while ((matchResult = regex.exec(body)) !== null) {
            const price = matchResult[1];
            if (!price.includes("Free")) {
              lastPrice = price.trim().replace(/\s*\/\s*/, "/");
            }
          }
          if (lastPrice !== null) {
            console.log(`[${new Date().toLocaleString()}] ✅ 解析价格成功: ${lastPrice}`);
          } else {
            lastPrice = "N/A";
            console.log(`[${new Date().toLocaleString()}] ℹ️ 未找到家庭套餐价格`);
          }
          resolve();
        } catch (e) {
          console.log(`[${new Date().toLocaleString()}] ❌ 价格解析失败: ${e}`);
          reject("❌价格解析失败");
        }
      }
    });
  });
}

async function getCountry() {
  console.log(`[${new Date().toLocaleString()}] ▶️ 开始获取IP信息...`);
  var options = {
    url: `https://ipinfo.io/json?token=${token}`,
    headers: {
      "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36`,
      "Content-Type": "application/json",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
    },
  };

  return new Promise((resolve, reject) => {
    $httpClient.get(options, (error, response, body) => {
      if (error) {
        console.log(`[${new Date().toLocaleString()}] ❌ IP查询失败: ${error}`);
        reject("❌IP查询失败: " + error);
      } else {
        console.log(`[${new Date().toLocaleString()}] 📥 IP查询响应: ${body}`);
        try {
          var obj = JSON.parse(body);
          if (!obj.ip) {
            console.log(`[${new Date().toLocaleString()}] ❌ 无效的IP响应`);
            reject("🔴IP查询失败!");
          }
          console.log(`[${new Date().toLocaleString()}] ✅ 获取国家代码: ${obj.country}`);
          resolve(obj.country.toLowerCase());
        } catch (e) {
          console.log(`[${new Date().toLocaleString()}] ❌ IP响应解析失败: ${e}`);
          reject("❌IP响应解析失败");
        }
      }
    });
  });
}

async function getLanguage() {
  console.log(`[${new Date().toLocaleString()}] ▶️ 开始获取语言设置...`);
  let country;
  try {
    country = await getCountry();
    console.log(`[${new Date().toLocaleString()}] ℹ️ 使用国家代码: ${country}`);
  } catch (e) {
    country = "us";
    console.log(`[${new Date().toLocaleString()}] ℹ️ 使用默认国家代码: ${country}`);
  }

  var options = {
    url: `https://www.spotify.com/${country}/premium/`,
    headers: {
      Cookie: `sp_t=10f2c6c4-dcd4-4ca8-9b60-bd1718e60d4b; sp_landing=https%3A%2F%2Fwww.spotify.com%2Fnl%2Fpremium%2F; sp_m=nl; sp_new=1; sp_t=8edfd15b-23d8-4b5f-b6ec-27da0f69f674`,
      "Accept-Encoding": `gzip, deflate, br`,
      Accept: `*/*`,
      Referer: `https://www.spotify.com/nl/premium/`,
      Connection: `keep-alive`,
      Host: `www.spotify.com`,
      "User-Agent": `Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1`,
      "Accept-Language": `zh-CN,zh-Hans;q=0.9`,
    },
    timeout: 10000,
  };

  return new Promise((resolve, reject) => {
    $httpClient.get(options, (error, response, body) => {
      if (error) {
        console.log(`[${new Date().toLocaleString()}] ❌ 语言请求失败: ${error}`);
        reject("❌获取语言失败: " + error);
      } else {
        console.log(`[${new Date().toLocaleString()}] 📥 语言响应状态码: ${response.status}`);
        try {
          const regex =
            /updatePreferredLocaleUrl\"\:\"https:\/\/www\.spotify\.com\/(.*)\/update-preferred-locale\//;
          let ret = regex.exec(body);
          let region = ret != null && ret.length === 2 ? ret[1] : country;
          console.log(`[${new Date().toLocaleString()}] ✅ 最终使用地区: ${region}`);
          resolve(region);
        } catch (e) {
          console.log(`[${new Date().toLocaleString()}] ❌ 语言解析失败: ${e}`);
          resolve(country);
        }
      }
    });
  });
}

function getCountryFlagEmoji(countryCode) {
  console.log(`[${new Date().toLocaleString()}] ℹ️ 转换国家代码到旗帜: ${countryCode}`);
  if (countryCode.toUpperCase() === "TW") {
    countryCode = "WS";
    console.log(`[${new Date().toLocaleString()}] ℹ️ 特殊处理TW地区代码`);
  }
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}