var params = {
    url: 'https://www.paramountplus.com/',
    timeout: 5000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
    }
};

$httpClient.get(params, function(errormsg, response, data) {
    const currentTime = new Date();
    const formattedTime = `[${currentTime.getFullYear()}/${(currentTime.getMonth() + 1).toString().padStart(2, '0')}/${currentTime.getDate().toString().padStart(2, '0')} ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}]`;

    console.log(`${formattedTime} 💻 开始请求Paramount+登录检测`);

    const result = { message: "" };

    if (errormsg) {
        console.log(`${formattedTime} 🚨 网络错误 - ${errormsg}`);
        result.message = 'Paramount+: Failed (Network Connection)';
        return $done({
            response: {
                status: 200,
                body: JSON.stringify(result),
                headers: { "Content-Type": "application/json" }
            }
        });
    }

    console.log(`${formattedTime} ✅ 请求成功，开始解析响应`);

    const httpCode = response.status;
    console.log(`${formattedTime} 🔍 HTTP 状态码: ${httpCode}`);

    console.log(`${formattedTime} 🔍 响应头: ${JSON.stringify(response.headers)}`);

    const xRealServer = response.headers['X-Real-Server'];
    let region = '';

    if (xRealServer) {
        console.log(`${formattedTime} 🔍 X-Real-Server: ${xRealServer}`);
        const serverParts = xRealServer.split('_');
        if (serverParts.length > 0) {
            region = serverParts[0].toUpperCase();
            console.log(`${formattedTime} 🔍 从 X-Real-Server 提取的地区: ${region}`);
        }
    } else {
        console.log(`${formattedTime} ⚠️ 未找到 X-Real-Server`);
    }

    if (httpCode === 0) {
        console.log(`${formattedTime} 🚨 Paramount+: Failed (Network Connection)`);
        result.message = 'Paramount+: Failed (Network Connection)';
        return $done({
            response: {
                status: 200,
                body: JSON.stringify(result),
                headers: { "Content-Type": "application/json" }
            }
        });
    }

    if (region === 'INTERNATIONAL' || region === 'INTL') {
        console.log(`${formattedTime} 🌍 Paramount+: ❌未解锁 (地区受限)`);
        result.message = 'Paramount+: ❌未解锁 (地区受限)';
        return $done({
            response: {
                status: 200,
                body: JSON.stringify(result),
                headers: { "Content-Type": "application/json" }
            }
        });
    }

    if (httpCode === 200) {
        if (!region) {
            region = 'US';
        }
        console.log(`${formattedTime} 🔓 Paramount+: ✅已解锁 (地区: ${region})`);
        result.message = `Paramount+: ✅已解锁 (地区: ${region})`;
        return $done({
            response: {
                status: 200,
                body: JSON.stringify(result),
                headers: { "Content-Type": "application/json" }
            }
        });
    }

    console.log(`${formattedTime} ❌ Paramount+: Failed (错误: ${httpCode})`);
    result.message = `Paramount+: Failed (Error: ${httpCode})`;
    return $done({
        response: {
            status: 200,
            body: JSON.stringify(result),
            headers: { "Content-Type": "application/json" }
        }
    });
});