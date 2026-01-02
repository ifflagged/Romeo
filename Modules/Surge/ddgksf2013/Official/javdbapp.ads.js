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


let body = $response.body;
let url = $request.url;
let obj = JSON.parse(body);

try {
  // 开屏广告
  if (/\/api\/v\d\/startup/.test(url)) {
    if (obj?.data?.settings?.NOTICE) {
      delete obj.data.settings.NOTICE;
    }
    if (obj?.data?.splash_ad) {
      obj.data.splash_ad.enabled = false;
      obj.data.splash_ad.overtime = 0;
    }
  }

  // Tab 广告
  if (/\/api\/v\d\/ads/.test(url)) {
    if (obj?.data) {
      obj.data.ads = null;
    }
  }

  // 播放页 VIP Banner
  if (/\/api\/v4\/movies/.test(url)) {
    if (obj?.data) {
      obj.data.show_vip_banner = false;
    }
  }
} catch (e) {}

$done({ body: JSON.stringify(obj) });

