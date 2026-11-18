// 京东去广告：Loon [Rewrite] 请求规则的 Surge 脚本版
// 原插件：ccyykk666、RuCu6（Loon，2026-10-04）
// 两条请求规则合并进一个 http-request 脚本：
//   1. wareBusiness：Accept-Encoding 改为 "gzip, deflate, br"，删 Available-Dictionary 头。
//   2. cartCouponRecommendGoods / intelligentRecommendSku / searchBoxWord / stationPullService：直接回 200 空字典
//      （对应 Loon 的 reject_dict(200)，与中国移动的 ChinaMobile-request.js 同一写法）。
var url = $request.url;
var fid = (url.match(/[?&]functionId=([^&#]*)/) || [])[1] || "";
var REJECT = ["cartCouponRecommendGoods", "intelligentRecommendSku", "searchBoxWord", "stationPullService"];

if (REJECT.indexOf(fid) !== -1) {
  $done({ status: 200, headers: { "Content-Type": "application/json" }, body: "{}" });
} else if (fid === "wareBusiness") {
  var h = {};
  var src = $request.headers || {};
  for (var k in src) {
    if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
    var lk = k.toLowerCase();
    if (lk === "available-dictionary" || lk === "accept-encoding") continue;
    h[k] = src[k];
  }
  h["Accept-Encoding"] = "gzip, deflate, br";
  $done({ headers: h });
} else {
  $done({});
}
