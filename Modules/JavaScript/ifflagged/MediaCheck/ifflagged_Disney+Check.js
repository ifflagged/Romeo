/**
 * Thanks to & modified from 
 * https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/streaming-ui-check.js
 * 
 * 脚本功能：节点Disney支持查询
 * For Loon 373+ Only, 小于373版本会有bug
 * 更新于：2022-05-14
 * 脚本使用方式：将以下配置粘贴于Loon配置文件中的[Script]模块下，也可以进行UI添加脚本，添加后需开启Loon代理，在策略组或者所有节点页面，选择一个节点长按，出现菜单后进行测试
 * 
 * [Script]
 * generic script-path=https://raw.githubusercontent.com/Loon0x00/LoonScript/main/MediaCheck/disney_check.js, tag=Disney-解锁查询, img-url=checkmark.seal.system
 */

 const DISNEY_BASE_URL = 'https://www.disneyplus.com';
 const DISNEY_LOCATION_BASE_URL = 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql';

var inputParams = $environment.params;
var nodeName = inputParams.node;

let flags = new Map([[ "AC" , "🇦🇨" ] ,["AE","🇦🇪"], [ "AF" , "🇦🇫" ] , [ "AI" , "🇦🇮" ] , [ "AL" , "🇦🇱" ] , [ "AM" , "🇦🇲" ] , [ "AQ" , "🇦🇶" ] , [ "AR" , "🇦🇷" ] , [ "AS" , "🇦🇸" ] , [ "AT" , "🇦🇹" ] , [ "AU" , "🇦🇺" ] , [ "AW" , "🇦🇼" ] , [ "AX" , "🇦🇽" ] , [ "AZ" , "🇦🇿" ] , ["BA", "🇧🇦"], [ "BB" , "🇧🇧" ] , [ "BD" , "🇧🇩" ] , [ "BE" , "🇧🇪" ] , [ "BF" , "🇧🇫" ] , [ "BG" , "🇧🇬" ] , [ "BH" , "🇧🇭" ] , [ "BI" , "🇧🇮" ] , [ "BJ" , "🇧🇯" ] , [ "BM" , "🇧🇲" ] , [ "BN" , "🇧🇳" ] , [ "BO" , "🇧🇴" ] , [ "BR" , "🇧🇷" ] , [ "BS" , "🇧🇸" ] , [ "BT" , "🇧🇹" ] , [ "BV" , "🇧🇻" ] , [ "BW" , "🇧🇼" ] , [ "BY" , "🇧🇾" ] , [ "BZ" , "🇧🇿" ] , [ "CA" , "🇨🇦" ] , [ "CF" , "🇨🇫" ] , [ "CH" , "🇨🇭" ] , [ "CK" , "🇨🇰" ] , [ "CL" , "🇨🇱" ] , [ "CM" , "🇨🇲" ] , [ "CN" , "🇨🇳" ] , [ "CO" , "🇨🇴" ] , [ "CP" , "🇨🇵" ] , [ "CR" , "🇨🇷" ] , [ "CU" , "🇨🇺" ] , [ "CV" , "🇨🇻" ] , [ "CW" , "🇨🇼" ] , [ "CX" , "🇨🇽" ] , [ "CY" , "🇨🇾" ] , [ "CZ" , "🇨🇿" ] , [ "DE" , "🇩🇪" ] , [ "DG" , "🇩🇬" ] , [ "DJ" , "🇩🇯" ] , [ "DK" , "🇩🇰" ] , [ "DM" , "🇩🇲" ] , [ "DO" , "🇩🇴" ] , [ "DZ" , "🇩🇿" ] , [ "EA" , "🇪🇦" ] , [ "EC" , "🇪🇨" ] , [ "EE" , "🇪🇪" ] , [ "EG" , "🇪🇬" ] , [ "EH" , "🇪🇭" ] , [ "ER" , "🇪🇷" ] , [ "ES" , "🇪🇸" ] , [ "ET" , "🇪🇹" ] , [ "EU" , "🇪🇺" ] , [ "FI" , "🇫🇮" ] , [ "FJ" , "🇫🇯" ] , [ "FK" , "🇫🇰" ] , [ "FM" , "🇫🇲" ] , [ "FO" , "🇫�" ] , [ "FR" , "🇫🇷" ] , [ "GA" , "🇬🇦" ] , [ "GB" , "🇬🇧" ] , [ "HK" , "🇭🇰" ] ,["HU","🇭🇺"], [ "ID" , "🇮🇩" ] , [ "IE" , "🇮🇪" ] , [ "IL" , "🇮🇱" ] , [ "IM" , "🇮🇲" ] , [ "IN" , "🇮🇳" ] , [ "IS" , "🇮🇸" ] , [ "IT" , "🇮🇹" ] , [ "JP" , "🇯🇵" ] , [ "KR" , "🇰🇷" ] , [ "LU" , "🇱🇺" ] , [ "MO" , "🇲🇴" ] , [ "MX" , "🇲🇽" ] , [ "MY" , "🇲🇾" ] , [ "NL" , "🇳🇱" ] , [ "PH" , "🇵🇭" ] , [ "RO" , "🇷🇴" ] , [ "RS" , "🇷🇸" ] , [ "RU" , "🇷🇺" ] , [ "RW" , "🇷🇼" ] , [ "SA" , "🇸🇦" ] , [ "SB" , "��🇧" ] , [ "SC" , "🇸🇨" ] , [ "SD" , "🇸🇩" ] , [ "SE" , "🇸🇪" ] , [ "SG" , "🇸🇬" ] , [ "TH" , "🇹🇭" ] , [ "TN" , "🇹🇳" ] , [ "TO" , "🇹🇴" ] , [ "TR" , "🇹🇷" ] , [ "TV" , "🇹🇻" ] , [ "TW" , "🇨🇳" ] , [ "UK" , "🇬🇧" ] , [ "UM" , "🇺🇲" ] , [ "US" , "🇺🇸" ] , [ "UY" , "🇺🇾" ] , [ "UZ" , "🇺🇿" ] , [ "VA" , "🇻🇦" ] , [ "VE" , "🇻🇪" ] , [ "VG" , "🇻🇬" ] , [ "VI" , "🇻🇮" ] , [ "VN" , "🇻🇳" ] , [ "ZA" , "🇿🇦"]])

let result = {
    "title": 'Disney+ Check',
    "Disney": "❗️ Check Failed",
}

let arrow = " ➟ "

console.log("start execute");
disneyLocation().then(value => {
    let content = "-----------------------------------</br>"+([result["Disney"]]).join("</br></br>")
    content = content + "</br>-----------------------------------</br>"+"<font color=#CD5C5C>"+ nodeName+ "</font>"
    content =`<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + content + `</p>`
    console.log(content);
    $done({"title":result["title"],"htmlMessage":content})
}).catch (values => {
    console.log("reject:" + values);
    let content = "-----------------------------------</br>"+([result["Disney"]]).join("</br></br>")
    content = content + "</br>-----------------------------------</br>"+"<font color=#CD5C5C>"+ nodeName+ "</font>"
    content =`<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + content + `</p>`
    $done({"title":result["title"],"htmlMessage":content})
})

function disneyLocation() {
    return new Promise((resolve, reject) => {
        let params = {
            url: DISNEY_LOCATION_BASE_URL,
            node: nodeName,
            timeout: 8000, //ms
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
        }
        $httpClient.post(params, (errormsg,response,data) => {
            console.log("----------disney--------------");
            if (errormsg) {
                resolve("disney request failed:" + errormsg);
                return;
            }
            if (response.status == 200) {
                console.log("disney request result:" + response.status);
                let resData = JSON.parse(data);
                if (resData?.extensions?.sdk?.session != null) {
                    let {
                        inSupportedLocation,
                        location: { countryCode },
                    } = resData?.extensions?.sdk?.session
                    if (inSupportedLocation == false) {
                        result["Disney"] = "⚠️ Coming Soon in "+flags.get(countryCode.toUpperCase())
                        resolve();
                    } else {
                        result["Disney"] = "✅ Available in "+flags.get(countryCode.toUpperCase())
                        resolve({ inSupportedLocation, countryCode });
                    }
                } else {
                    result["Disney"] = "❎ Unavailable";
                    resolve();
                }
            } else {
                result["Disney"] = "❗️ Check Failed";
                resolve();
            }
        })
    })
}

function disneyHomePage() {
    return new Promise((resolve, reject) => {
        let params = {
            url: DISNEY_BASE_URL,
            node: nodeName,
            timeout: 8000, //ms
            headers: {
                'Accept-Language': 'en',
                'User-Agent': UA,
            }
        }
        $httpClient.get(params, (errormsg,response,data) => {
            if (errormsg) {
                resolve(errormsg);
                return;
            }
            if (response.status != 200 || data.indexOf('unavailable') != -1) {
                resolve();
            } else {
                let match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/)
                if (!match) {
                    resolve();
                } else {
                    let region = match[1];
                    let cnbl = match[2];
                    //console.log("homepage"+region+cnbl)
                    resolve({region, cnbl});
                }
            }
        })
    })
}
