/***********************************
百度地图 去广告

2025.12.28V1.0.6

https://t.me/ddgksf2021

[rewrite_local]

# > 百度地图_首页底部推荐@ddgksf2013
^https?:\/\/.*map\.baidu\.com\/.*govui\/rich_content url jsonjq-response-body '.data.posts.content=[]'
# > 百度地图_搜索框下足记Tips@ddgksf2013
;^https?:\/\/newclient\.map\.baidu\.com\/client\/phpui.*qt=rgc url reject-200
# > 百度地图_搜索推广@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/client\/phpui.*qt=hw url reject-200
# > 百度地图_开屏广告|首页左上角广告@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/client\/phpui2\/\?qt=ads url reject-200
# > 百度地图_DNS处理@ddgksf2013
^https?:\/\/httpdns\.baidubce\.com url jsonjq-response-body '.data["newclient.map.baidu.com"]={}'
# > 百度地图_各种商业推广@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/client\/crossmarketing url reject-200
# > 百度地图_我的页面地图动态@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/client\/usersystem\/home\/dynamic url reject-200
# > 百度地图_TIPS@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/contributor-bus/bounty/tips url reject-200
# > 百度地图_我页面@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/usercenter/mine/page url jsonjq-response-body 'del(.data.sport_card, .data.gold, .data.gold_coin_card, .data.shop)'
# > 百度地图_周边搜索填词@ddgksf2013
^https?:\/\/newclient\.map\.baidu\.com\/living/nearby/hot-words\? url jsonjq-response-body '.Result.data=[]'

[mitm] 

hostname=180.76.76.200, newclient.map.baidu.com, httpdns.baidubce.com, ugc.map.baidu.com

***********************************/
