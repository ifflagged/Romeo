// 引用地址：https://raw.githubusercontent.com/osinx/Script/main/vip/streamMusic.js

let res = JSON.parse($response.body);

const url = $request.url;
const valiorder = "/validations/orders";
const device = "/onlinedevices";

if (url.indexOf(valiorder) != -1) {
    res.originalTransactionId = "1704038400";
    res.originalPurchaseDate = 1704038400;
    res.email = "";
    res.platform = "alipay";
} else if (url.indexOf(device) != -1) {
    res["Authorization-Date"] = 4102358400;
    delete res.code
    delete res.message
}

$done({
    body: JSON.stringify(res)
});