/**
 * Thanks to & modified from 
 * https://github.com/Loon0x00/LoonScript/blob/main/MediaCheck/nf_check.js?raw=true
 * 
 * 脚本功能：节点NetFlix支持查询
 * For Loon 373+ Only, 小于373版本会有bug
 * 更新于：2022-04-12
 * 
 * generic script-path=https://raw.githubusercontent.com/Loon0x00/LoonScript/main/MediaCheck/nf_check.js, tag=Netflix-解锁查询, img-url=checkmark.seal.system
 */

 const NF_BASE_URL = "https://www.netflix.com/title/81215567";

var inputParams = $environment.params;
var nodeName = inputParams.node;

let flags = new Map([[ "AC" , "🇦🇨" ] ,["AE","🇦🇪"], [ "AF" , "🇦🇫" ] , [ "AI" , "🇦🇮" ] , [ "AL" , "🇦🇱" ] , [ "AM" , "🇦🇲" ] , [ "AQ" , "🇦🇶" ] , [ "AR" , "🇦🇷" ] , [ "AS" , "🇦🇸" ] , [ "AT" , "🇦🇹" ] , [ "AU" , "🇦🇺" ] , [ "AW" , "🇦🇼" ] , [ "AX" , "🇦🇽" ] , [ "AZ" , "🇦🇿" ] , ["BA", "🇧🇦"], [ "BB" , "🇧🇧" ] , [ "BD" , "🇧🇩" ] , [ "BE" , "🇧🇪" ] , [ "BF" , "🇧🇫" ] , [ "BG" , "🇧🇬" ] , [ "BH" , "🇧🇭" ] , [ "BI" , "🇧🇮" ] , [ "BJ" , "🇧🇯" ] , [ "BM" , "🇧🇲" ] , [ "BN" , "🇧🇳" ] , [ "BO" , "🇧🇴" ] , [ "BR" , "🇧🇷" ] , [ "BS" , "🇧🇸" ] , [ "BT" , "🇧🇹" ] , [ "BV" , "🇧🇻" ] , [ "BW" , "🇧🇼" ] , [ "BY" , "🇧🇾" ] , [ "BZ" , "🇧🇿" ] , [ "CA" , "🇨🇦" ] , [ "CF" , "🇨🇫" ] , [ "CH" , "🇨🇭" ] , [ "CK" , "🇨🇰" ] , [ "CL" , "🇨🇱" ] , [ "CM" , "🇨🇲" ] , [ "CN" , "🇨🇳" ] , [ "CO" , "🇨🇴" ] , [ "CP" , "🇨🇵" ] , [ "CR" , "🇨🇷" ] , [ "CU" , "🇨🇺" ] , [ "CV" , "🇨🇻" ] , [ "CW" , "🇨🇼" ] , [ "CX" , "🇨🇽" ] , [ "CY" , "🇨🇾" ] , [ "CZ" , "🇨🇿" ] , [ "DE" , "🇩🇪" ] , [ "DG" , "🇩🇬" ] , [ "DJ" , "🇩🇯" ] , [ "DK" , "🇩🇰" ] , [ "DM" , "🇩🇲" ] , [ "DO" , "🇩🇴" ] , [ "DZ" , "🇩🇿" ] , [ "EA" , "🇪🇦" ] , [ "EC" , "🇪🇨" ] , [ "EE" , "🇪🇪" ] , [ "EG" , "🇪🇬" ] , [ "EH" , "🇪🇭" ] , [ "ER" , "🇪🇷" ] , [ "ES" , "🇪🇸" ] , [ "ET" , "🇪🇹" ] , [ "EU" , "🇪🇺" ] , [ "FI" , "🇫🇮" ] , [ "FJ" , "🇫🇯" ] , [ "FK" , "🇫🇰" ] , [ "FM" , "🇫🇲" ] , [ "FO" , "🇫�" ] , [ "FR" , "🇫🇷" ] , [ "GA" , "🇬🇦" ] , [ "GB" , "🇬🇧" ] , [ "HK" , "🇭🇰" ] ,["HU","🇭🇺"], [ "ID" , "🇮🇩" ] , [ "IE" , "🇮🇪" ] , [ "IL" , "🇮🇱" ] , [ "IM" , "🇮🇲" ] , [ "IN" , "🇮🇳" ] , [ "IS" , "🇮🇸" ] , [ "IT" , "🇮🇹" ] , [ "JP" , "🇯🇵" ] , [ "KR" , "🇰🇷" ] , [ "LU" , "🇱🇺" ] , [ "MO" , "🇲🇴" ] , [ "MX" , "🇲🇽" ] , [ "MY" , "🇲🇾" ] , [ "NL" , "🇳🇱" ] , [ "PH" , "🇵🇭" ] , [ "RO" , "🇷🇴" ] , [ "RS" , "🇷🇸" ] , [ "RU" , "🇷🇺" ] , [ "RW" , "🇷🇼" ] , [ "SA" , "🇸🇦" ] , [ "SB" , "��🇧" ] , [ "SC" , "🇸🇨" ] , [ "SD" , "🇸🇩" ] , [ "SE" , "🇸🇪" ] , [ "SG" , "🇸🇬" ] , [ "TH" , "🇹🇭" ] , [ "TN" , "🇹🇳" ] , [ "TO" , "🇹🇴" ] , [ "TR" , "🇹🇷" ] , [ "TV" , "🇹🇻" ] , [ "TW" , "🇨🇳" ] , [ "UK" , "🇬🇧" ] , [ "UM" , "🇺🇲" ] , [ "US" , "🇺🇸" ] , [ "UY" , "🇺🇾" ] , [ "UZ" , "🇺🇿" ] , [ "VA" , "🇻🇦" ] , [ "VE" , "🇻🇪" ] , [ "VG" , "🇻🇬" ] , [ "VI" , "🇻🇮" ] , [ "VN" , "🇻🇳" ] , [ "ZA" , "🇿🇦"]])

let result = {
    "title": 'Netflix Check',
    "Netflix": '❗️ Check Failed'
}

let arrow = " ➟ "

console.log("start execute");
nfTest().then(value => {
    let content = "-----------------------------------</br>"+([result["Netflix"]]).join("</br></br>")
    content = content + "</br>-----------------------------------</br>"+"<font color=#CD5C5C>"+ nodeName+ "</font>"
    content =`<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + content + `</p>`
    console.log(content);
    $done({"title":result["title"],"htmlMessage":content})
}).catch (values => {
    console.log("reject:" + values);
    let content = "-----------------------------------</br>"+([result["Netflix"]]).join("</br></br>")
    content = content + "</br>-----------------------------------</br>"+"<font color=#CD5C5C>"+ nodeName+ "</font>"
    content =`<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + content + `</p>`
    $done({"title":result["title"],"htmlMessage":content})
})

function nfTest() {
    return new Promise((resolve, reject) => {
        let params = {
            url: NF_BASE_URL,
            node: nodeName,
            timeout: 8000, //ms
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
            }
        }
        console.log("start request:" + JSON.stringify(params));
        $httpClient.get(params, (errormsg,response,data) => {
            console.log("----------NetFlix--------------");
            if (errormsg) {
                console.log("NF request failed:" + errormsg);
                resolve(errormsg);
                return;
            }
            if (response.status == 403) {
                result["Netflix"] = "❎ Unavailable"
                resolve("403 Not Available");
            } else if (response.status == 404) {
                result["Netflix"] = "⚠️ Original Netflix"
                resolve("404 Not Found");
            } else if (response.status == 200) {
                console.log("NF request result:" + JSON.stringify(response.headers));
                let ourl = response.headers['X-Originating-URL']
                if (ourl == undefined) {
                    ourl = response.headers['X-Originating-Url']
                }
                console.log("X-Originating-URL:" + ourl)
                let region = ourl.split('/')[3]
                region = region.split('-')[0];
                if (region == 'title') {
                    region = 'us'
                }
                result["Netflix"] = "✅ Full Netflix available in "+flags.get(region.toUpperCase())
                resolve(region);
            } else {
                result["Netflix"] = "❗️ Check Failed";
                resolve(response.status)
            }
        })
    })
}
