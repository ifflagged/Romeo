// 闲鱼去广告（合并版）：ccyykk666 版与可莉现网版的响应规则合并
// 来源：ccyykk666、ddgksf2013（Loon，2026-09-19）
//       可莉现网版（Loon，2026-10-02，经 VPS2 自部署 Script Hub 代取 kelee.one）
// 合并语义：只一边有的接口保留原清理；两边都有的接口先后都做（取清理交集）；
// 同一字段两边意见不同时以可莉新版为准（首页顶部列表、搜索发现、搜索激活、我的页、交易详情、开屏）。
// 门禁沿用 ccyykk666 版的 status 200；body 非 JSON 或异常时原样放行。
// jq 翻译约定：`x |= map(select(p))` 译为数组则过滤、缺失/null 则置 []、其他形状不动；
// 简单赋值译为建路径赋值；delete 为守卫删除。

function __hasOwn(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function __isObj(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
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
// 沿路径走到父对象，对其 key 做 jq `|=` map 过滤；父对象不存在则不动
function __mapPath(o, path, key, pred) {
  var cur = o;
  for (var i = 0; i < path.length; i++) {
    if (!__isObj(cur)) return;
    cur = cur[path[i]];
  }
  if (!__isObj(cur)) return;
  if (Array.isArray(cur[key])) cur[key] = cur[key].filter(pred);
  else if (cur[key] == null) cur[key] = [];
}
function __mapFilter(parent, key, pred) {
  if (!__isObj(parent)) return;
  if (Array.isArray(parent[key])) parent[key] = parent[key].filter(pred);
  else if (parent[key] == null) parent[key] = [];
}

// ccyykk666 版首页圈子 clean（见原插件 circle.list 那条 jq）
function __cleanCircle(o) {
  if (!__isObj(o)) return;
  if (Array.isArray(o.circleList)) {
    o.circleList = o.circleList.filter(function (it) {
      return !it || typeof it !== "object" || it.bizCode !== "saveMoney";
    });
  }
  if (Array.isArray(o.headList)) {
    o.headList.forEach(function (it) {
      if (!__isObj(it)) return;
      if (it.bizCode === "main" && String(it.circleId) === "100") delete it.headerGuideConfig;
      if (__isObj(it.showInfo) &&
        ((it.bizCode === "market" && String(it.circleId) === "202") ||
         (it.bizCode === "recycle" && String(it.circleId) === "203"))) {
        it.showInfo.rightTagImage = { lightUrl: "", selectUrl: "", url: "" };
      }
    });
  }
}

// ccyykk666 版首页/小组件共用的清理（不含 homeTopList 清空——顶部列表以可莉版 kingkongDo 过滤为准）
function __gfNextfreshWidget(obj) {
  if (!__isObj(obj.data)) return;
  if (__isObj(obj.data.configInfo) && __isObj(obj.data.configInfo.experimentContext)) {
    obj.data.configInfo.experimentContext.widget_is_show = "false";
  }
  delete obj.data.bannerReturnDO;
  delete obj.data.widgetReturnDO;
  __mapFilter(obj.data, "sections", function (s) {
    return !!s && !!s.data && s.data.bizType === "item";
  });
}

var url = $request.url;
var obj = null;
try { obj = JSON.parse($response.body); } catch (e) { obj = null; }

if (Number($response.status) !== 200 || obj === null || typeof obj !== "object") {
  $done({});
} else {
  var matched = false;

  if (url.indexOf("mtop.taobao.idlecommerce.splash.async.ads") !== -1) {
    __set(obj, "data.adMap", {});
    matched = true;
  } else if (url.indexOf("mtop.idle.idleadv.scene.restore") !== -1) {
    __set(obj, "data.trackParams.stageMatch", "false");
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlehome.home.circle.list") !== -1) {
    // 先 ccyykk666 clean（data 与 next），再可莉版 showInfo 删除与 headList 过滤
    __cleanCircle(obj.data);
    if (__isObj(obj.data) && __isObj(obj.data.next)) __cleanCircle(obj.data.next);
    if (__isObj(obj.data) && Array.isArray(obj.data.circleList)) {
      obj.data.circleList.forEach(function (it) {
        if (__isObj(it) && __isObj(it.showInfo)) {
          delete it.showInfo.titleImage;
          delete it.showInfo.atmosphereImageUrl;
        }
      });
    }
    if (__isObj(obj.data) && __isObj(obj.data.next)) {
      __mapPath(obj, ["data", "next"], "headList", function (h) {
        return !!h && (h.bizCode === "main" || h.bizCode === "market" || h.bizCode === "IDLE_CIRCLE");
      });
      if (Array.isArray(obj.data.next.headList)) {
        obj.data.next.headList.forEach(function (h) {
          if (__isObj(h) && __isObj(h.showInfo)) delete h.showInfo.rightTagImage;
        });
      }
    }
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlehome.home.nextfresh") !== -1) {
    __gfNextfreshWidget(obj);
    __mapPath(obj, ["data"], "homeTopList", function (s) {
      return !!s && s.sectionType === "kingkongDo";
    });
    __mapPath(obj, ["data"], "sections", function (s) {
      var ct = s && s.data && s.data.clickParam && s.data.clickParam.args && s.data.clickParam.args.cardType;
      if (ct === "homeMultiBanner" || ct === "mamaAD") return false;
      var tn = s && s.template && s.template.name;
      return typeof tn === "string" && (tn === "idlefish_home_new_commodity_card" || tn.indexOf("fish_home_tags_item_card") !== -1);
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlehome.widget.refresh.get") !== -1) {
    __gfNextfreshWidget(obj);
    __mapPath(obj, ["data"], "homeTopList", function (s) {
      return !!s && s.sectionType === "kingkongDo";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlemtopsearch.item.search.activate") !== -1) {
    // 以可莉版为准：只删 hotwords，不把 cardList 整个换成 [{}]
    if (__isObj(obj.data) && Array.isArray(obj.data.cardList)) {
      obj.data.cardList.forEach(function (it) {
        if (__isObj(it) && __hasOwn(it, "cardData") && __isObj(it.cardData) && __hasOwn(it.cardData, "hotwords")) {
          delete it.cardData.hotwords;
        }
      });
    }
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlemtopsearch.search.discover") !== -1) {
    // 以可莉版为准：只滤 MarketHotSpot，不删整个 resultList
    __mapPath(obj, ["data"], "resultList", function (it) {
      return !it || it.type !== "MarketHotSpot";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.local.flow.plat.section") !== -1) {
    __mapPath(obj, ["data", "data"], "components", function (c) {
      return !!c && __isObj(c.data) && __isObj(c.data.template) &&
        typeof c.data.template.name === "string" && c.data.template.name.indexOf("fish_city_kingkong") !== -1;
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.local.home.top") !== -1) {
    __mapPath(obj, ["data", "data"], "components", function (c) {
      return !!c && c.key === "fish_home_second_stage_top_cardV3";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.local.home") !== -1) {
    // 两边都滤（交集）：bizType 须为 item，且 cardEnum 不为 ads、cardType 为 common
    __mapFilter(obj.data, "sections", function (s) {
      return !!s && !!s.data && s.data.bizType === "item";
    });
    __mapPath(obj, ["data"], "sections", function (s) {
      return !!s && (!s.template || s.template.cardEnum !== "ads") && s.cardType === "common";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlemtopsearch.detailpage.search.shade") !== -1) {
    __set(obj, "data.idleShadeOutputDo.result", []);
    __set(obj, "data.idleShadeOutputDo.scroll", "false");
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlemtopsearch.search.activate.tablist") !== -1) {
    __set(obj, "data.tabList", []);
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlemtopsearch.search.activate.trendlist") !== -1) {
    __set(obj, "data.resultList", []);
    matched = true;
  } else if (url.indexOf("idle.user.page.my.adapter") !== -1) {
    // 注意：两边前缀不同（ccyykk666 版 mtop.taobao.*，可莉版 mtop.*），去前缀匹配两种都覆盖
    // 以可莉版为准：模板名正则过滤 + tips level 删除 + entry2025 工具箱重排分片 + 删 ability
    __mapPath(obj, ["data", "container"], "sections", function (s) {
      var tn = (s && s.template && s.template.name) || "";
      return /^my_fy[0-9]+_(header|user_info|trade|appraise|tools)$/.test(tn);
    });
    if (obj.data && obj.data.container && Array.isArray(obj.data.container.sections)) {
      obj.data.container.sections.forEach(function (s) {
        if (!__isObj(s) || !__isObj(s.item)) return;
        if (__isObj(s.item.level) && __isObj(s.item.level.exContent) && __hasOwn(s.item.level.exContent, "tips")) {
          delete s.item.level;
        }
        if (s.sectionBizCode === "entry2025" && __isObj(s.item.tool) && __isObj(s.item.tool.exContent) && Array.isArray(s.item.tool.exContent.tools)) {
          var ORDER = [5, 39, 6, 30, 29, 2, 32, 3, 1];
          var flat = [];
          s.item.tool.exContent.tools.forEach(function (row) {
            (Array.isArray(row) ? row : [row]).forEach(function (t) {
              if (t && t.exContent && ORDER.indexOf(t.exContent.id) !== -1) flat.push(t);
            });
          });
          flat.sort(function (a, b) { return ORDER.indexOf(a.exContent.id) - ORDER.indexOf(b.exContent.id); });
          var chunked = [];
          for (var i = 0; i < flat.length; i += 5) chunked.push(flat.slice(i, i + 5));
          s.item.tool.exContent.tools = chunked;
        }
      });
    }
    __del(obj, "data.ability");
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.trade.full.info") !== -1) {
    // 以可莉版白名单为准（ccyykk666 的黑名单三项本就不在白名单里，被包含）
    __mapPath(obj, ["data"], "components", function (c) {
      return !!c && (c.render === "orderStatusVO" || c.render === "addressInfoVO" || c.render === "orderInfoVO");
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.awesome.detail.unit") !== -1) {
    if (obj.data && obj.data.flowData && __isObj(obj.data.flowData.body) &&
        Array.isArray(obj.data.flowData.body.sections)) {
      obj.data.flowData.body.sections.forEach(function (sec) {
        if (sec && Array.isArray(sec.components)) {
          sec.components = sec.components.filter(function (c) {
            return !c || c.key !== "Basic_Native_spn_marketing_module" ||
              !(c.data && c.data.template && c.data.template.name === "marketing_module_bargain_activity");
          });
        }
      });
    }
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.item.recommend") !== -1) {
    __mapFilter(obj.data, "cardList", function (c) {
      return !c || !c.cardData || c.cardData.bizType !== "mamaAD";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlemtopsearch.search/") !== -1 ||
             url.indexOf("mtop.taobao.idlemtopsearch.search?") !== -1) {
    // ccyykk666 的 biz_type 过滤两边主机都做；可莉版的 ad 过滤与 resultPrefixBar 删除只在 g-acs 做
    __mapFilter(obj.data, "resultList", function (it) {
      return !!it && !!it.data && !!it.data.item && !!it.data.item.main &&
        !!it.data.item.main.clickParam && !!it.data.item.main.clickParam.args &&
        it.data.item.main.clickParam.args.biz_type === "item";
    });
    if (url.indexOf("://g-acs.") !== -1) {
      __mapPath(obj, ["data"], "resultList", function (it) {
        var bt = it && it.data && it.data.item && it.data.item.main && it.data.item.main.exContent &&
          it.data.item.main.exContent.dislikeFeedback && it.data.item.main.exContent.dislikeFeedback.clickParam &&
          it.data.item.main.exContent.dislikeFeedback.clickParam.args && it.data.item.main.exContent.dislikeFeedback.clickParam.args.bizType;
        return bt !== "ad";
      });
      __del(obj, "data.resultPrefixBar");
    }
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.home.whale.modulet") !== -1) {
    __mapPath(obj, ["data", "container"], "sections", function (s) {
      return !!s && !!s.template && s.template.name === "fish_home_miniapp";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idle.fun.follow.feed.list") !== -1) {
    __mapPath(obj, ["data"], "sections", function (s) {
      return !!s && s.cardType === 2001;
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlehome.home.community") !== -1) {
    __mapPath(obj, ["data"], "feedsList", function (f) {
      return !!f && !!f.template && (f.template.name === "idlefish_home_new_commodity_card" || f.template.name === "idlefish_home_new_content_card");
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlehome.home.newitem.page") !== -1) {
    __mapPath(obj, ["data"], "sections", function (s) {
      var ct = s && s.data && s.data.clickParam && s.data.clickParam.args && s.data.clickParam.args.cardType;
      return ct !== "banner" && ct !== "mamaAD";
    });
    matched = true;
  } else if (url.indexOf("mtop.taobao.idlehome.magic.home.page.list") !== -1) {
    __del(obj, "data.topList");
    matched = true;
  }

  if (matched) {
    try { $done({ body: JSON.stringify(obj) }); } catch (e) { $done({}); }
  } else {
    $done({});
  }
}
