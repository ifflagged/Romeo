const urls = {
  direct: {
    ipv4: "https://4.ipw.cn",
    ipv6: "https://6.ipw.cn"
  },
  proxy: {
    ipv4: "https://4.ipcheck.ing",
    ipv6: "https://6.ipcheck.ing"
  }
};

const headers = { "User-Agent": "curl/8.0.1" };

function getTime() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

function getIP(url, version, type) {
  return new Promise((resolve) => {
    const start = Date.now();
    $httpClient.get({ url, headers }, (error, response, data) => {
      const end = Date.now();
      const duration = end - start;

      if (error) {
        console.log(`${getTime()} ❌ [${type} - ${version}] 请求失败，错误：${error}`);
        resolve({ type, version, ip: null, status: "请求失败", duration });
      } else {
        const ip = data.trim();
        console.log(`${getTime()} ✅ [${type} - ${version}] 请求成功，状态码：${response.status}, 响应时间：${duration}ms`);
        console.log(`${getTime()} 📄 [${type} - ${version}] 返回数据：${ip}`);
        resolve({ type, version, ip, status: response.status, duration });
      }
    });
  });
}

Promise.all([
  getIP(urls.direct.ipv4, "IPv4", "直连"),
  getIP(urls.direct.ipv6, "IPv6", "直连"),
  getIP(urls.proxy.ipv4, "IPv4", "代理"),
  getIP(urls.proxy.ipv6, "IPv6", "代理")
]).then(results => {
  const ipv4Direct = results.find(r => r.type === "直连" && r.version === "IPv4");
  const ipv6Direct = results.find(r => r.type === "直连" && r.version === "IPv6");
  const ipv4Proxy = results.find(r => r.type === "代理" && r.version === "IPv4");
  const ipv6Proxy = results.find(r => r.type === "代理" && r.version === "IPv6");

  console.log(`${getTime()} 🎯 综合 IP 测试结果：`);
  console.log(`${getTime()} 🌍 直连 IPv4：${ipv4Direct.ip || "未获取到"}`);
  console.log(`${getTime()} 🌍 直连 IPv6：${ipv6Direct.ip || "未获取到（可能未开启）"}`);
  console.log(`${getTime()} 🚀 代理 IPv4：${ipv4Proxy.ip || "未获取到"}`);
  console.log(`${getTime()} 🚀 代理 IPv6：${ipv6Proxy.ip || "未获取到（可能未支持）"}`);

  const message = `
    IP检测结果:
    <br>
    <br>🌍 直连 IPv4：<br>${ipv4Direct.ip || "未获取到"}
    <br>🌍 直连 IPv6：<br><span style="font-size: 0.8em;">${ipv6Direct.ip || "未获取到（可能未开启）"}</span>
    <br>
    <br>🚀 代理 IPv4：<br>${ipv4Proxy.ip || "未获取到"}
    <br>🚀 代理 IPv6：<br><span style="font-size: 0.8em;">${ipv6Proxy.ip || "未获取到（可能未支持）"}</span>
  `;

  const result = {
    message: message
  };

  $done({
    response: {
      status: 200,
      body: JSON.stringify(result),
      headers: { "Content-Type": "application/json" }
    }
  });
});