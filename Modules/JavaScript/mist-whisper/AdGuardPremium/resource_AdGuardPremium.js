// 引用地址：https://raw.githubusercontent.com/chxm1023/Rewrite/main/AdGuard.js
// 更新日期：2025-01-08

var ddm = JSON.parse($response.body);

ddm = {"products":[{"premium_status":"ACTIVE","product_id":"com.adguard.lifetimePurchase"}]};

$done({body : JSON.stringify(ddm)});