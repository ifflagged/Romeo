/***********************************************


[rewrite_local]

# > 随手记_开屏广告
https://tg.feidee.com/online_ad/api/search.do url reject
# > 随手记_广告推送
https://tg.feidee.com/vis-ad-engine-ws/api/show url reject
# > 随手记_社区
https://api.feidee.net/v1/configs/client/configs url reject-200
# > 随手记_首页推荐
https://yunmk.feidee.net/cab-market-ws/market/v2/contents url reject-dict
# > 随手记_社区推广
https://community.feidee.com/api/v1/home/top url reject-200
# > 随手记_账本中间推广
https://yun.feidee.net/cab-query-ws/v1/comet/vtable/score-card url reject-dict
# > 随手记_推广Tips
https://moneymarket.ssjlicai.com/finance-common-operation-ws/api/actShelve/v1/actShelveShowTipInfo url reject
# > 随手记_会员信息
#https://userapi.feidee.net/v1/profile/basic_info url script-response-body https://ddgksf2013.top/scripts/suishouji.ads.js
# > 随手记_状态信息
#https://yun.feidee.net/cab-vip-ws/terminal/v1/vip-users/show-info url script-response-body https://ddgksf2013.top/scripts/suishouji.ads.js
# > 随手记_账本顶部推广
https://yun.feidee.net/cab-draw-activity-ws/terminal/v1/draw-record/user-draw-result url reject-dict

[mitm]

hostname = *.feidee.*, *.ssjlicai.*

***********************************************/



let body=$response.body;if(body){switch(!0){case /vip-users\/show-info/.test($request.url):try{var obj={vip_center_link:"https://t.me/ddgksf2021",vip_show_tip:"",vip_icon_link:"https://t.me/ddgksf2021",vip_icon:"https://img1.imgtp.com/2023/03/15/ZiOBvW5C.png",dec_icon:"",vip_status:"1",selected_dec_icon:""};body=JSON.stringify(obj)}catch(a){console.log(`market: `+a)}break;case /profile\/basic_info/.test($request.url):try{let a=JSON.parse(body);a.is_vip=!0,body=JSON.stringify(a)}catch(a){console.log(`market: `+a)}break;case /online_ad\/api\/search.do/.test($request.url):try{body=body.replace(/adBtnEff":"\d+/g,"adBtnEff\":\"2027")}catch(a){console.log(`search: `+a)}break;case /cab-market-ws\/market\/v2\/contents/.test($request.url):try{let a=JSON.parse(body);a.data=[],body=JSON.stringify(a)}catch(a){console.log(`market: `+a)}break;default:$done({});}$done({body})}else $done({});
