/***********************************

一言 Pro

2025.12.12V1.0.6

https://t.me/ddgksf2021

[rewrite_local]

^https:\/\/app\.yiyan\.art\/yiyan\/ url script-response-body https://ddgksf2013.top/scripts/yiyan.vip.js

[mitm] 

hostname = app.yiyan.art

***********************************/





var body = $response.body.replace(/viptype":"1"/g, 'viptype":"4"');
$done({ body });
