/***************

极简汇率 Pro

https://t.me/ddgksf2021

[rewrite_local]
^https?:\/\/explorer\.tratao\.com\/api\/client\/xtool\/vip url script-response-body https://ddgksf2013.top/scripts/jijianhuilv.vip.js


[mitm]

hostname = explorer.tratao.com

****************/




var ddgksf2013 = JSON.parse($response.body);
ddgksf2013.data=[{vipStatus:"paid",vipLevel:"senior",expire:"2099-12-18 10:10:00",vipPayType:"auto_sub",vipPayUnit:"year",vipPayNum:1}];
$done({
    body: JSON.stringify(ddgksf2013),
});
