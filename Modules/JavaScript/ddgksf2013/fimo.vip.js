/***********************************

Fimo Pro

2025.12.07V1.0.6

https://t.me/ddgksf2021

[rewrite_local]

^https?:\/\/.*fimo\.com\/fimo-user url script-response-body https://ddgksf2013.top/scripts/fimo.vip.js

[mitm] 

hostname = *fimo.com

***********************************/




var obj=JSON.parse($response.body);obj.subscribe={valid:!0,forever:1,endTime:4092599349},$done({body:JSON.stringify(obj)});
