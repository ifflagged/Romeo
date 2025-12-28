/***********************************

Session Pro


https://t.me/ddgksf2021


[rewrite_local]
  

^https:\/\/api\.stayinsession\.com\/user\/detail url script-response-body https://ddgksf2013.top/scripts/session.vip.js
(^https:\/\/api\.stayinsession\.com\/\?token=.*?&)(is_setapp\=false) url 302 $1is_setapp=true
^https:\/\/api\.stayinsession\.com\/user\/detail url request-header (\r\n)If-None-Match:.+(\r\n) request-header $1If-None-Match:$2

[mitm] 

hostname=api.stayinsession.com

***********************************/












var obj=JSON.parse($response.body);obj.subscription_status="active",obj.subscription_expiry_date="2099-02-27T10:33:57Z",$done({body:JSON.stringify(obj)});
