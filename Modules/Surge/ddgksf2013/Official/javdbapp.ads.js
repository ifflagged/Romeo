/*********

JAVDB IOS APP 去广告

2026.01.01V1.0.6


[rewrite_local]

# > JavDB_开屏广告
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/startup  url jsonjq-response-body 'del(.data.settings.NOTICE)| .data.splash_ad.enabled = false| .data.splash_ad.overtime = 0'
# > JavDB_Tab广告
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/ads  url jsonjq-response-body '.data.ads = null'
# > JavDB_播放页
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v4\/movies  url jsonjq-response-body '.data.show_vip_banner = false'


[mitm] 

hostname = api.pxxgg.xyz, api.ujvnmkx.cn, jdforrepam.com, api.yijingluowangluo.xyz, api.wwwuh5.cn, api.ffaoa.com, apidd.btyjscl.com

**********/
