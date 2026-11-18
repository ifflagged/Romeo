// 京东去广告：Loon [Rewrite] 响应规则的 Surge 脚本版
// 原插件：ccyykk666、RuCu6（Loon，2026-10-04）
// 来源：https://raw.githubusercontent.com/ccyykk666/Loon-Plugin/main/plugins/jingdong/Jingdong_remove_ads.lpx
// 说明：Loon 的 response.json.replace/delete/jq 在 Surge 模块里没有等价物（模块不能新增 Body Rewrite 段），
// 故把每条 jq/替换/删除逐条翻成等价 JS；开关与主脚本共用同一套 #!arguments。
// 失败模式安全：body 不是 JSON 或中途异常时原样放行。

// 与主脚本同一份解析器：Loon 传对象，Surge 传分号分隔字符串。
function __parseSurgeArgs() {
  var a = (typeof $argument !== "undefined") ? $argument : undefined;
  if (a && typeof a === "object") return a;
  var o = {};
  if (typeof a === "string") {
    var parts = a.split(";");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split(":");
      if (kv.length === 2) {
        if (kv[1] === "true" || kv[1] === "1") o[kv[0]] = true;
        else if (kv[1] === "false" || kv[1] === "0") o[kv[0]] = false;
      }
    }
  }
  return o;
}

var __OPTS = { HomeClean: true, OrderAds: true, ProfileClean: true, ProductClean: true };
(function () {
  var __a = __parseSurgeArgs();
  for (var n in __OPTS) {
    if (Object.prototype.hasOwnProperty.call(__a, n)) {
      __OPTS[n] = __a[n] === true || __a[n] === "true" || __a[n] === 1 || __a[n] === "1";
    }
  }
})();

function __hasOwn(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function __set(o, path, v) {
  var keys = path.split(".");
  var cur = o;
  for (var i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== "object") cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = v;
}
function __del(o, path) {
  var keys = path.split(".");
  var cur = o;
  for (var i = 0; i < keys.length - 1; i++) {
    if (!cur || typeof cur[keys[i]] !== "object") return;
    cur = cur[keys[i]];
  }
  if (cur && typeof cur === "object") delete cur[keys[keys.length - 1]];
}

var url = $request.url;
var fid = (url.match(/[?&]functionId=([^&#]*)/) || [])[1] || "";
var obj = null;
try { obj = JSON.parse($response.body); } catch (e) { obj = null; }

if (obj === null || typeof obj !== "object") {
  $done({});
} else {
  var matched = false;

  if (fid === "basicConfig") {
    __set(obj, "data.JDMessage.socketmonitor.isSocketEstablishedAhead", 0);
    __set(obj, "data.JDMessage.socketmonitor.isSocketReport", 0);
    __set(obj, "data.JDHttpToolKit.httpdns.httpdns", 0);
    matched = true;
  } else if (fid === "getBubbleInfo") {
    // jq: .result |= map(select(.position != "find" and .extraMap.tab != "Promotion"))
    //     | if (.result | length) == 0 then .islandConfig = false else . end
    if (Array.isArray(obj.result)) {
      obj.result = obj.result.filter(function (it) {
        return it && it.position !== "find" && !(it.extraMap && it.extraMap.tab === "Promotion");
      });
    } else if (obj.result == null) {
      obj.result = [];
    }
    if (Array.isArray(obj.result) && obj.result.length === 0) obj.islandConfig = false;
    matched = true;
  } else if (fid === "cart") {
    __del(obj, "cartLocationMap.loc_emptyCartFloor2");
    __del(obj, "emptyCartRecommendFloor");
    matched = true;
  } else if (fid === "start") {
    // jq: (.images | select(type == "array")) = [] | if has("showTimesDaily") then .showTimesDaily = 0 else . end
    if (Array.isArray(obj.images)) obj.images = [];
    if (__hasOwn(obj, "showTimesDaily")) obj.showTimesDaily = 0;
    matched = true;
  } else if (fid === "getTabHomeInfo" && __OPTS.HomeClean) {
    __del(obj, "result.iconInfo");
    __del(obj, "result.roofTop");
    matched = true;
  } else if (fid === "newPurchaseWareCheck" && __OPTS.OrderAds) {
    __del(obj, "purchaseOrder");
    __set(obj, "hitOrderHighPriceNewStyle", 0);
    matched = true;
  } else if (fid === "getGiftBuyEntryInfo" && __OPTS.OrderAds) {
    __set(obj, "newMyOrder", false);
    __set(obj, "data.newMyOrder", false);
    matched = true;
  } else if (fid === "queryListAsyncInfo" && __OPTS.OrderAds) {
    // jq: if (.data | type) == "object" then .data.guide = {} else . end
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) obj.data.guide = {};
    matched = true;
  } else if (fid === "obtainBffGrowingInfo" && __OPTS.OrderAds) {
    // jq: if (.data.floorList | type) == "array" then .data.floorList = [] else . end
    if (obj.data && Array.isArray(obj.data.floorList)) obj.data.floorList = [];
    matched = true;
  } else if (fid === "querySmallVideoWindow" && __OPTS.ProductClean) {
    // jq: (.result.contents? | select(type == "array")) = []
    if (obj.result && Array.isArray(obj.result.contents)) obj.result.contents = [];
    matched = true;
  } else if (fid === "personalCenter" && __OPTS.ProfileClean) {
    __del(obj, "data.operationBanner");
    matched = true;
  } else if (fid === "xview2Config" && (__OPTS.HomeClean || __OPTS.ProfileClean)) {
    // jq: (.data.targets[]? | select(.targetId == 34) | .layers) = []（首页）
    //     (.data.targets[]? | select(.targetId == 90 or .targetId == 141) | .layers) = []（我的页）
    if (obj.data && Array.isArray(obj.data.targets)) {
      obj.data.targets.forEach(function (t) {
        if (!t || typeof t !== "object") return;
        if (__OPTS.HomeClean && t.targetId === 34) t.layers = [];
        if (__OPTS.ProfileClean && (t.targetId === 90 || t.targetId === 141)) t.layers = [];
      });
    }
    matched = true;
  } else if (fid === "personInfoAsync" && __OPTS.ProfileClean) {
    // jq: if (.data.motionDataList | type) == "array" then
    //       .data.motionDataList |= map(select(.refId != "actionTNFloor"
    //         or (.functionId != "dianpuguanzhu_1" and .targetFunctionId != "dianpuguanzhu"))) else . end
    if (obj.data && Array.isArray(obj.data.motionDataList)) {
      obj.data.motionDataList = obj.data.motionDataList.filter(function (it) {
        return !it || it.refId !== "actionTNFloor" ||
          (it.functionId !== "dianpuguanzhu_1" && it.targetFunctionId !== "dianpuguanzhu");
      });
    }
    matched = true;
  } else if (fid === "queryCircleInfo" && __OPTS.ProfileClean) {
    // jq: (.wareInfoList | select(type == "array")) = []
    //     | if has("hasNextPage") then .hasNextPage = false else . end
    //     | if has("hasNext") then .hasNext = false else . end
    if (Array.isArray(obj.wareInfoList)) obj.wareInfoList = [];
    if (__hasOwn(obj, "hasNextPage")) obj.hasNextPage = false;
    if (__hasOwn(obj, "hasNext")) obj.hasNext = false;
    matched = true;
  }

  if (matched) {
    try { $done({ body: JSON.stringify(obj) }); } catch (e) { $done({}); }
  } else {
    $done({});
  }
}
