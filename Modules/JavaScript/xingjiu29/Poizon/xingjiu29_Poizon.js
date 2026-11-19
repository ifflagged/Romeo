const url = $request.url;
const body = $response.body;
const DROP_ME = ["creatorCenter", "wallet", "merchant", "discountCoupon", "toolBox"];
const DROP_DISCOVERY = [5, 6, 8, 9];
const DROP_TAB_NAME = /运营频道|玉龙出场/;
const DROP_TABS = ["tagChanllenge", "tab_video_new"];
function parse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}
function filterTabs(list) {
  if (!Array.isArray(list)) return { list: list, removed: 0 };
  let removed = 0;
  const out = list.filter(function (t) {
    if (!t) return true;
    const id = String(t.cId);
    if (DROP_TABS.indexOf(id) >= 0) {
      removed++;
      return false;
    }
    if (t.cType === 2 || DROP_TAB_NAME.test(String(t.name || ""))) {
      removed++;
      return false;
    }
    return true;
  });
  return { list: out, removed: removed };
}
function stripOrderNoise(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) stripOrderNoise(node[i]);
    return;
  }
  delete node.smallFootmark;
  delete node.recommendProductInfo;
  delete node.noteDesc;
  if (node.noteHeader) delete node.noteHeader;
  if (node.performanceCopywriting) delete node.performanceCopywriting;
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) stripOrderNoise(node[keys[i]]);
}
function cleanOrderList(data) {
  const orders = data && data.orderList;
  if (!Array.isArray(orders)) return 0;
  let removed = 0;
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (!o) continue;
    if (Array.isArray(o.commonNoteList)) {
      const before = o.commonNoteList.length;
      o.commonNoteList = o.commonNoteList.filter(function (it) {
        if (!it) return false;
        if (it.recommendProductInfo) return false;
        if (it.type === 10) return false;
        return JSON.stringify(it).indexOf("为你推荐") < 0;
      });
      removed += before - o.commonNoteList.length;
    }
    stripOrderNoise(o);
  }
  return removed;
}
function clearWordArrays(data) {
  if (!data || typeof data !== "object") return;
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = data[k];
    if (!Array.isArray(v) || v.length === 0) continue;
    const first = v[0];
    if (first && typeof first === "object" && ("word" in first || "content" in first || "displayQuery" in first)) {
      data[k] = [];
    }
  }
}
function cleanOrderCards(mods) {
  if (!Array.isArray(mods)) return 0;
  let n = 0;
  for (let i = 0; i < mods.length; i++) {
    const m = mods[i];
    if (!m || m.key !== "order" || !m.data) continue;
    if (Array.isArray(m.data.cards)) {
      n += m.data.cards.length;
      m.data.cards = [];
    }
  }
  return n;
}
function cleanLeadTools(mods) {  if (!Array.isArray(mods)) return 0;
  let n = 0;
  for (let i = 0; i < mods.length; i++) {
    const m = mods[i];
    if (!m || m.key !== "leadTools") continue;
    const menus = (m.data && m.data.menus) || [];
    for (let k = 0; k < menus.length; k++) {
      const menu = menus[k];
      if (menu && menu.ext && menu.ext.carouselArea) {
        delete menu.ext.carouselArea;
        n++;
        if (Object.keys(menu.ext).length === 0) delete menu.ext;
      }
    }
  }
  return n;
}
if (!body) {
  $done({});
} else if (/biz-aggregate\/me\/user-index/.test(url)) {
  const j = parse(body);
  const mods = j && j.data && j.data.modules;
  if (!Array.isArray(mods)) {
    $done({});
  } else {
    const before = mods.length;
    j.data.modules = mods.filter(function (m) {
      return !m || DROP_ME.indexOf(m.key) < 0;
    });
    const c = cleanLeadTools(j.data.modules);
    const oc = cleanOrderCards(j.data.modules);
    console.log("DW me modules " + before + " -> " + j.data.modules.length + ", carousel " + c + " removed, order cards " + oc + " removed");
    $done({ body: JSON.stringify(j) });
  }
} else if (/identify-discovery\/v1\/discovery\/index/.test(url)) {
  const j = parse(body);
  const groups = j && j.data && j.data.groups;
  if (!Array.isArray(groups)) {
    $done({});
  } else {
    const before = groups.length;
    const out = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const items = Array.isArray(g.items) ? g.items : [];
      const kept = items.filter(function (it) {
        return !it || DROP_DISCOVERY.indexOf(it.entryId) < 0;
      });
      if (kept.length > 0) {
        g.items = kept;
        out.push(g);
      }
    }
    j.data.groups = out;
    console.log("DW discovery groups " + before + " -> " + out.length);
    $done({ body: JSON.stringify(j) });
  }
} else if (/sns-rec\/v1\/du-tab/.test(url)) {
  const j = parse(body);
  const d = j && j.data;
  if (!d) {
    $done({});
  } else {
    let removed = 0;
    const a = filterTabs(d.second);
    d.second = a.list;
    removed += a.removed;
    const b = filterTabs(d.secondMoreV2);
    d.secondMoreV2 = b.list;
    removed += b.removed;
    console.log("DW du-tab removed=" + removed);
    $done({ body: JSON.stringify(j) });
  }
} else if (/purchase-tab\/list/.test(url)) {
  const j = parse(body);
  const list = j && j.data;
  if (!Array.isArray(list)) {
    $done({});
  } else {
    const before = list.length;
    j.data = list.filter(function (t) {
      return !t || t.tabType !== 1;
    });
    console.log("DW purchase tabs " + before + " -> " + j.data.length);
    $done({ body: JSON.stringify(j) });
  }
} else if (/search\/lexicon\/v3\/background_words/.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    clearWordArrays(j.data);
    j.data.embedWords = [];
    console.log("DW search bg words cleared");
    $done({ body: JSON.stringify(j) });
  }
} else if (/sns-rec\/v1\/search\/word-skip\/new-list/.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    clearWordArrays(j.data);
    j.data.list = [];
    j.data.wantList = [];
    j.data.llmWantList = [];
    j.data.backgroundList = [];
    j.data.requestId = "";
    j.data.backgroundRequestId = "";
    console.log("DW search guess words cleared");
    $done({ body: JSON.stringify(j) });
  }
} else if (/sns-rec\/v1\/search\/content-tabs/.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    const before = (j.data.tabList || []).length;
    j.data.tabList = [];
    console.log("DW search tabs " + before + " -> 0");
    $done({ body: JSON.stringify(j) });
  }
} else if (/sns-rec\/v1\/search\/hotword-list/.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    j.data.list = [];
    j.data.videoList = [];
    j.data.topicList = [];
    console.log("DW hot words cleared");
    $done({ body: JSON.stringify(j) });
  }
} else if (/search\/lexicon\/v1\//.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    clearWordArrays(j.data);
    j.data.rankList = [];
    j.data.searchHotWordList = [];
    j.data.embedWords = [];
    j.data.outWords = [];
    j.data.requestId = "";
    j.data.request_id = "";
    console.log("DW lexicon words cleared: " + url.split("?")[0].split("/").pop());
    $done({ body: JSON.stringify(j) });
  }
} else if (/sns-dp\/v1\/order\/info-agg/.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    delete j.data.freeOrder;
    console.log("DW order freeOrder removed");
    $done({ body: JSON.stringify(j) });
  }
} else if (/biz-aggregate\/order\/buyerOrderList\/agg/.test(url)) {
  const j = parse(body);
  if (!j || !j.data) {
    $done({});
  } else {
    const n = cleanOrderList(j.data);
    console.log("DW order list cleaned, note removed=" + n);
    $done({ body: JSON.stringify(j) });
  }
} else {
  $done({});
}
