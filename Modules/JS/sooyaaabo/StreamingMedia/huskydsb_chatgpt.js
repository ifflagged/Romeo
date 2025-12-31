async function WebTest_OpenAI() {
    const log = (message) => {
        console.log(`[${new Date().toLocaleString()}] ${message}`);
    };

    try {
        log("🚀 开始检测 ChatGPT 服务可用性...");

        const cookieUrl = 'https://api.openai.com/compliance/cookie_requirements';
        log(`🔍 正在发起第一个请求：检查 Cookie 要求...`);
        log(`📄 请求 URL: ${cookieUrl}`);
        log(`📄 请求头: ${JSON.stringify({
            'authority': 'api.openai.com',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'Bearer null',
            'content-type': 'application/json',
            'origin': 'https://platform.openai.com',
            'referer': 'https://platform.openai.com/',
            'sec-ch-ua': '',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': ''
        }, null, 2)}`);

        $httpClient.get({
            url: cookieUrl,
            headers: {
                'authority': 'api.openai.com',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'authorization': 'Bearer null',
                'content-type': 'application/json',
                'origin': 'https://platform.openai.com',
                'referer': 'https://platform.openai.com/',
                'sec-ch-ua': '',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': ''
            }
        }, function (error, response, data) {
            let result = {};

            if (error) {
                result = {
                    status: "failed",
                    message: "网络连接失败"
                };
                log(`❌ 检测结果: ${JSON.stringify(result)}`);
                log(`🔍 错误详情: ${error}`);
                $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                return;
            }

            log(`✅ ChatGPT: 已收到 Cookie 请求的响应。`);
            log(`📄 响应状态码: ${response.status}`);
            log(`📄 响应头: ${JSON.stringify(response.headers, null, 2)}`);
            log(`📄 响应体内容: ${data}`);
            const tmpresult1 = data.toLowerCase().includes('unsupported_country');
            log(`🔍 是否包含 'unsupported_country': ${tmpresult1}`);

            if (!tmpresult1) {
                const vpnUrl = 'https://ios.chat.openai.com/';
                log(`🔍 正在发起第二个请求：检查 VPN 限制...`);
                log(`📄 请求 URL: ${vpnUrl}`);
                log(`📄 请求头: ${JSON.stringify({
                    'authority': 'ios.chat.openai.com',
                    'accept': '*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'en-US,en;q=0.9',
                    'sec-ch-ua': '',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'user-agent': ''
                }, null, 2)}`);

                $httpClient.get({
                    url: vpnUrl,
                    headers: {
                        'authority': 'ios.chat.openai.com',
                        'accept': '*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'accept-language': 'en-US,en;q=0.9',
                        'sec-ch-ua': '',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'document',
                        'sec-fetch-mode': 'navigate',
                        'sec-fetch-site': 'none',
                        'sec-fetch-user': '?1',
                        'upgrade-insecure-requests': '1',
                        'user-agent': ''
                    }
                }, function (error2, response2, data2) {
                    if (error2) {
                        result = {
                            status: "failed",
                            message: "网络连接失败"
                        };
                        log(`❌ 检测结果: ${JSON.stringify(result)}`);
                        log(`🔍 错误详情: ${error2}`);
                        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                        return;
                    }

                    log(`✅ ChatGPT: 已收到 VPN 请求的响应。`);
                    log(`📄 响应状态码: ${response2.status}`);
                    log(`📄 响应头: ${JSON.stringify(response2.headers, null, 2)}`);
                    log(`📄 响应体内容: ${data2}`);
                    const tmpresult2 = data2.toLowerCase().includes('vpn');
                    log(`🔍 是否包含 'vpn': ${tmpresult2}`);

                    if (!tmpresult1 && !tmpresult2) {
                        result = {
                            status: "success",
                            message: "ChatGPT: 恭喜你，服务全部可用。"
                        };
                    } else if (tmpresult1 && tmpresult2) {
                        result = {
                            status: "failed",
                            message: "ChatGPT: 对不起，服务因国家和 VPN 限制而不可用。"
                        };
                    } else if (!tmpresult1 && tmpresult2) {
                        result = {
                            status: "failed",
                            message: "ChatGPT: 对不起，服务仅限使用网页浏览器（VPN 限制）。"
                        };
                    } else if (tmpresult1 && !tmpresult2) {
                        result = {
                            status: "failed",
                            message: "ChatGPT: 对不起，服务仅限使用移动应用（国家限制）。"
                        };
                    } else {
                        result = {
                            status: "failed",
                            message: "ChatGPT: 检测失败（未知错误）。"
                        };
                    }

                    log(`🎉 检测结果: ${JSON.stringify(result)}`);
                    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                });
            } else {
                result = {
                    status: "failed",
                    message: "ChatGPT: 对不起，该服务在您的国家不可用。"
                };
                log(`❌ 检测结果: ${JSON.stringify(result)}`);
                $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
            }
        });

    } catch (error) {
        const errorMsg = `ChatGPT: 检测失败（错误: ${error.message}）`;
        let result = {
            status: "failed",
            message: errorMsg
        };
        log(`❌ 检测结果: ${JSON.stringify(result)}`);
        log(`🔍 错误详情: ${error}`);
        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
    }
}

WebTest_OpenAI();