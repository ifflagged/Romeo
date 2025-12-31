function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getTime() {
  const now = new Date();
  return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
}

function getDNSInfo() {
  var uuid = guid();
  var url = `https://${uuid}.ipv4.surfsharkdns.com`;

  console.log(`${getTime()} 🚀 发起 DNS 查询请求：${url}`);

  var headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  };

  $httpClient.get({ url: url, headers: headers }, function(error, response, body) {
    if (error) {
      console.log(`${getTime()} ❌ DNS 请求失败，错误：${error}`);
      $done({ response: { status: 500, body: "请求失败" } });
      return;
    }

    try {
      var data = JSON.parse(body);
      var localDNSInfo = {};
      var foreignDNSInfo = {};

      Object.values(data).forEach((item) => {
        if (item.CountryCode === "CN") {
          localDNSInfo = {
            dnsOperator: item.ISP || '获取失败',
            dnsProvince: item.City || '获取失败',
            dnsCountry: item.CountryCode || '获取失败',
            ldns: item.IP || '获取失败'
          };
        } else {
          foreignDNSInfo = {
            foreignDnsOperator: item.ISP || '获取失败',
            foreignDnsCountry: item.CountryCode || '获取失败',
            foreignDnsCity: item.City || '获取失败',
            foreignDnsIp: item.IP || '获取失败'
          };
        }
      });

      console.log(`${getTime()} 🌐 国内 DNS 运营商：${localDNSInfo.dnsOperator}`);
      console.log(`${getTime()} 🏙 国内 DNS 省份：${localDNSInfo.dnsProvince}`);
      console.log(`${getTime()} 🌍 国内 DNS 国家：${localDNSInfo.dnsCountry}`);
      console.log(`${getTime()} 🖥 国内 Local DNS：${localDNSInfo.ldns}`);
      console.log(`${getTime()} 🌐 国外 DNS 运营商：${foreignDNSInfo.foreignDnsOperator}`);
      console.log(`${getTime()} 🌍 国外 DNS 国家：${foreignDNSInfo.foreignDnsCountry}`);
      console.log(`${getTime()} 🏙 国外 DNS 城市：${foreignDNSInfo.foreignDnsCity}`);
      console.log(`${getTime()} 🖥 国外 Local DNS：${foreignDNSInfo.foreignDnsIp}`);

      const result = {
        message: `surfsharkdns:
          <br>
          <br>国内 DNS:
          <br>DNS 所属运营商: ${localDNSInfo.dnsOperator}
          <br>DNS 所属国家: ${localDNSInfo.dnsCountry}
          <br>DNS 所属城市: ${localDNSInfo.dnsProvince}
          <br>Local DNS: ${localDNSInfo.ldns}
          <br>
          <br>国外 DNS:
          <br>DNS 所属运营商: ${foreignDNSInfo.foreignDnsOperator}
          <br>DNS 所属国家: ${foreignDNSInfo.foreignDnsCountry}
          <br>DNS 所属城市: ${foreignDNSInfo.foreignDnsCity}
          <br>Local DNS: ${foreignDNSInfo.foreignDnsIp}
        `
      };

      $done({
        response: {
          status: 200,
          body: JSON.stringify(result),
          headers: { "Content-Type": "application/json" }
        }
      });
    } catch (e) {
      console.log(`${getTime()} ❌ 解析 DNS 响应失败：${e}`);
      $done({ response: { status: 500, body: "解析响应失败" } });
    }
  });
}

getDNSInfo();