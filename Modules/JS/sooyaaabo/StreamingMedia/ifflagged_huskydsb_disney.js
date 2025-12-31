const DISNEY_LOCATION_BASE_URL = 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql';

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

function disneyLocation() {
    return new Promise((resolve, reject) => {
        let params = {
            url: DISNEY_LOCATION_BASE_URL,
            timeout: 5000,
            headers: {
                'Accept-Language': 'en',
                "Authorization": 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
                'Content-Type': 'application/json',
                'User-Agent': 'UA'
            },
            body: JSON.stringify({
                query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
                variables: {
                    input: {
                        applicationRuntime: 'chrome',
                        attributes: {
                            browserName: 'chrome',
                            browserVersion: '94.0.4606',
                            manufacturer: 'microsoft',
                            model: null,
                            operatingSystem: 'windows',
                            operatingSystemVersion: '10.0',
                            osDeviceIds: [],
                        },
                        deviceFamily: 'browser',
                        deviceLanguage: 'en',
                        deviceProfile: 'windows',
                    },
                },
            }),
        };

        console.log(`[${new Date().toLocaleString()}] 🚀 正在发起 Disney+ 检测请求...`);
        console.log(`[${new Date().toLocaleString()}] 📄 请求 URL: ${params.url}`);
        console.log(`[${new Date().toLocaleString()}] 📄 请求头: ${JSON.stringify(params.headers, null, 2)}`);
        console.log(`[${new Date().toLocaleString()}] 📄 请求体: ${params.body}`);

        $httpClient.post(params, (errormsg, response, data) => {
            console.log(`[${new Date().toLocaleString()}] ----------Disney+ 检测--------------`);
            let result = {};

            if (errormsg) {
                result.message = "Disney+: 检测失败 ❗️";
                console.log(`[${new Date().toLocaleString()}] ❌ ${result.message}`);
                console.log(`[${new Date().toLocaleString()}] 🔍 错误详情: ${errormsg}`);
                $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                return;
            }

            console.log(`[${new Date().toLocaleString()}] ✅ Disney+ 请求成功，响应状态码: ${response.status}`);
            console.log(`[${new Date().toLocaleString()}] 📄 响应头: ${JSON.stringify(response.headers, null, 2)}`);
            console.log(`[${new Date().toLocaleString()}] 📄 响应体: ${data}`);

            if (response.status == 200) {
                let resData = JSON.parse(data);
                if (resData?.extensions?.sdk?.session != null) {
                    let {
                        inSupportedLocation,
                        location: { countryCode },
                    } = resData?.extensions?.sdk?.session;

                    if (inSupportedLocation) {
                        const countryFlag = flags.get(countryCode.toUpperCase()) || "🏳️";
                        result.message = `Disney+: 支持 ➟ ${countryFlag} (${countryCode}) 🎉`;
                        console.log(`[${new Date().toLocaleString()}] 🎉 ${result.message}`);
                        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                    } else {
                        const countryFlag = flags.get(countryCode.toUpperCase()) || "🏳️";
                        result.message = `Disney+: 即将登陆 ➟ ${countryFlag} ⚠️`;
                        console.log(`[${new Date().toLocaleString()}] ⚠️ ${result.message}`);
                        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                    }
                } else {
                    result.message = "Disney+: 响应数据格式错误 ❗️";
                    console.log(`[${new Date().toLocaleString()}] ❌ ${result.message}`);
                    $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                }
            } else {
                result.message = "Disney+: 请求失败 ❗️";
                console.log(`[${new Date().toLocaleString()}] ❌ ${result.message}`);
                $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
            }
        });
    });
}

disneyLocation();