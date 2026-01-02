/*********

JAVDB IOS APP 去广告

2026.01.01V1.0.6


[rewrite_local]

# > JavDB_开屏广告
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/startup url script-response-body https://ddgksf2013.top/scripts/javdbapp.ads.js
# > JavDB_Tab广告
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/ads url script-response-body https://ddgksf2013.top/scripts/javdbapp.ads.js
# > JavDB_播放页
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v4\/movies url script-response-body https://ddgksf2013.top/scripts/javdbapp.ads.js


[mitm] 

hostname = api.pxxgg.xyz, api.ujvnmkx.cn, jdforrepam.com, api.yijingluowangluo.xyz, api.wwwuh5.cn, api.ffaoa.com, apidd.btyjscl.com

**********/


let body=$response.body,url=$request.url,obj=JSON.parse(body);try{/\/api\/v\d\/startup/.test(url)&&(obj?.data?.settings?.NOTICE&&delete obj.data.settings.NOTICE,obj?.data?.splash_ad&&(obj.data.splash_ad.enabled=!1,obj.data.splash_ad.overtime=0)),/\/api\/v\d\/ads/.test(url)&&obj?.data&&(obj.data.ads=null),/\/api\/v4\/movies/.test(url)&&obj?.data&&(obj.data.show_vip_banner=!1)}catch(a){}$done({body:JSON.stringify(obj)});
