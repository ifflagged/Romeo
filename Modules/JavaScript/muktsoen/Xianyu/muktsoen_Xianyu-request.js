// 闲鱼去广告（合并版）：ccyykk666 版与可莉现网版的请求规则合并
// 动作对照：reject(200) → 200 空正文；reject_dict(200) → 200 空字典 {}；
// AMDC 那条只拦 http 的 /amdc/mobileDispatch/，且 User-Agent 命中名单才拦截（名单含 URL 编码与中文两种写法）。
// 冲突处以可莉新版为准：开屏 splash.ads 回空字典（ccyykk666 版是空正文）。
// 注意：splash.ads/ 带斜杠精确匹配，不会误伤 splash.async.ads（后者走响应脚本的 adMap 清理）。
var url = $request.url;

if (/^http:\/\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){1,4}(?::\d+)?\/amdc\/mobileDispatch\//.test(url)) {
  var ua = "";
  var h = $request.headers || {};
  for (var k in h) {
    if (Object.prototype.hasOwnProperty.call(h, k) && k.toLowerCase() === "user-agent") ua = String(h[k]);
  }
  if (/(AMap|Cainiao|%E9%97%B2%E9%B1%BC|%E9%A3%9E%E7%8C%AA%E6%97%85%E8%A1%8C|%E5%96%B5%E8%A1%97|%E5%A4%A9%E7%8C%AB|Alibaba|MovieApp|Hema4iPhone|Moon|DMPortal|闲鱼|飞猪旅行|喫街|天猫)/.test(ua)) {
    $done({ status: 200, body: "ddgksf2013" });
  } else {
    $done({});
  }
} else if (url.indexOf("mtop.idle.ad.expose") !== -1) {
  $done({ status: 200, body: "" });
} else if (url.indexOf("mtop.taobao.idlecommerce.splash.ads/") !== -1 ||
           url.indexOf("mtop.taobao.idle.user.strategy.list/") !== -1 ||
           url.indexOf("mtop.taobao.idle.item.recommend.list/") !== -1 ||
           url.indexOf("mtop.taobao.idle.local.near.by.corner.info/") !== -1 ||
           url.indexOf("mtop.taobao.idle.item.buy.feeds/") !== -1 ||
           url.indexOf("mtop.taobao.idlemtopsearch.search.shade/") !== -1 ||
           url.indexOf("mtop.taobao.idlemessage.user.query.top.resource") !== -1 ||
           url.indexOf("mtop.taobao.idle.item.resell.recommendorhotcate") !== -1 ||
           url.indexOf("mtop.taobao.idle.item.resell.channel") !== -1 ||
           url.indexOf("mtop.taobao.idle.activity.sell.seller.recommend") !== -1 ||
           url.indexOf("mtop.taobao.idle.playboy.recommend") !== -1) {
  $done({ status: 200, headers: { "Content-Type": "application/json" }, body: "{}" });
} else {
  $done({});
}
