/**
 * IP 纯净度检测 — Scamalytics 真实评分 + 多源兜底（v7）
 *
 * 架构：
 *  Phase 1: 多源并发获取出口 IP（ip-api/ipinfo/ipwho/ip.sb/ifconfig）
 *  Phase 2: 若有 key 参数，调 Scamalytics API 取真实评分
 *  Phase 3: 无 key 时降级到 ip-api 布尔信号估算（旧逻辑）
 *
 * 规则法：不指定 policy，靠模块 [Rule] 段 RULE-SET 让检测域名走 {{{GROUP}}}
 *
 * v7（2026-10-01 审查修复）：
 *  - 超时兜底 19s 对齐模块 timeout=20（原 16s 晚于 timeout=15，极端情况兜底来不及触发）
 *  - x4b 交叉验证结果并入 proxyStatus 显示（原在 proxyStatus 计算后才 push，不生效）
 *  - clearTimeout 加 typeof 防护（engine=jsc 时不可用）
 *  - 清理未生效的黑名单死代码；Scamalytics user 为空时直接跳过
 *  - 估算分数标注"纯净度"（Scamalytics 分数高=危险，估算分数高=安全，语义区分）
 */

const META = "IP 纯净度检测";

// ---------- 参数解析 ----------
let groupName = "PROXY", scamKey = "", scamUser = "";
if (typeof $argument !== "undefined" && $argument) {
  for (const p of String($argument).split("&")) {
    const i = p.indexOf("=");
    const k = p.slice(0, i).trim(), v = p.slice(i + 1).trim();
    if (k === "group") groupName = v;
    if (k === "key") scamKey = v;
    if (k === "user") scamUser = v;
  }
}
if (scamKey === "选填") scamKey = "";
if (scamUser === "选填") scamUser = "";
const SCAM_KEY = scamKey;
const SCAM_USER = scamUser;

// ---------- 单次完成守卫 ----------
let settled = false;
function done(obj) {
  if (settled) return;
  settled = true;
  try { $done(obj); } catch (e) {}
}

// ---------- Surge HTTP API 辅助（照网络信息模块写法） ----------
function httpAPI(path, method = "GET") {
  return new Promise((resolve) => {
    $httpAPI(method, path, null, (result) => resolve(result));
  });
}
// 抓最近请求里目标域名的真实出口节点名（originalPolicyName 才是叶节点，照网络信息模块 getRequestInfo 逻辑）
async function getCurrentNode() {
  try {
    const { requests } = await httpAPI("/v1/requests/recent", "GET");
    if (!requests || !requests.length) return null;
    const hit = requests.slice(0, 30).find(r => /ip-api\.com|ipinfo\.io|ipwho\.is|api\.ip\.sb|ifconfig|ip\.me|ipify/.test(r.URL || ""));
    if (!hit) return null;
    const n = hit.originalPolicyName || hit.policyName;
    return n && n !== "None" ? n : null;
  } catch (e) { return null; }
}

// ---------- 超时兜底（19s，配合模块 timeout=20，留 1s 给 $done 收尾） ----------
setTimeout(() => done({
  title: META + " · 超时",
  content: "策略组: " + groupName + "\n所有源均超时，检查节点或规则集是否生效",
  icon: "exclamationmark.triangle", "icon-color": "#FF9500"
}), 19000);

// ---------- 工具函数 ----------
function safeClearTimeout(t) { if (typeof clearTimeout === "function") clearTimeout(t); }

// ---------- 国旗 ----------
const FLAG = { CN:"🇨🇳",HK:"🇭🇰",TW:"🇹🇼",JP:"🇯🇵",SG:"🇸🇬",US:"🇺🇸",KR:"🇰🇷",GB:"🇬🇧",DE:"🇩🇪",FR:"🇫🇷",CA:"🇨🇦",AU:"🇦🇺",IN:"🇮🇳",RU:"🇷🇺",BR:"🇧🇷",NL:"🇳🇱",TR:"🇹🇷",TH:"🇹🇭",VN:"🇻🇳",PH:"🇵🇭",MY:"🇲🇾",ID:"🇮🇩",AE:"🇦🇪",AR:"🇦🇷",ES:"🇪🇸",IT:"🇮🇹",SE:"🇸🇪",CH:"🇨🇭",UA:"🇺🇦",PL:"🇵🇱",MX:"🇲🇽",CL:"🇨🇱" };
const flag = c => (c && c.length === 2) ? (FLAG[c.toUpperCase()] || "🌐") : "🌐";

// ---------- 请求封装 ----------
function fetchJson(url) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(null), 9000);
    $httpClient.get(url, (err, resp, data) => {
      safeClearTimeout(t);
      if (err || !data) return resolve(null);
      try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
    });
  });
}
function fetchText(url) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve(null), 7000);
    $httpClient.get(url, (err, resp, data) => {
      safeClearTimeout(t);
      resolve(err || !data ? null : String(data).trim());
    });
  });
}

// ---------- Scamalytics API ----------
function fetchScamalytics(ip) {
  if (!SCAM_KEY || !SCAM_USER || !ip) return Promise.resolve(null);
  const url = "https://api11.scamalytics.com/v3/" + SCAM_USER + "/?key=" + SCAM_KEY + "&ip=" + encodeURIComponent(ip);
  return fetchJson(url).then(d => {
    if (!d || !d.scamalytics || d.scamalytics.status !== "ok") return null;
    return d.scamalytics;
  });
}

// ---------- Scamalytics 数据解析 ----------
function parseScamalytics(s) {
  const score = parseInt(s.scamalytics_score) || 0;
  const riskLabel = s.scamalytics_risk || "";
  // 4 档风险（score 越低越安全）
  let riskEmoji;
  if (score >= 90) riskEmoji = "🔴 极高风险";
  else if (score >= 60) riskEmoji = "🟠 高风险";
  else if (score >= 20) riskEmoji = "🟡 中风险";
  else riskEmoji = "🟢 低风险";

  // 代理/VPN 状态（scamalytics_proxy 对象）
  const p = s.scamalytics_proxy || {};
  const proxyFlags = [];
  if (p.is_vpn) proxyFlags.push("VPN");
  if (p.is_datacenter) proxyFlags.push("机房");
  if (p.is_apple_icloud_private_relay) proxyFlags.push("iCloud中继");
  if (p.is_amazon_aws) proxyFlags.push("AWS");
  if (p.is_google) proxyFlags.push("Google");

  // 外部数据源交叉验证（先合并再计算状态，x4b 结果要能显示在面板上）
  const ext = s.external_datasources || {};
  const x4b = ext.x4bnet || {};
  if (x4b.is_datacenter && !p.is_datacenter) proxyFlags.push("机房(x4b)");
  if (x4b.is_vpn && !p.is_vpn) proxyFlags.push("VPN(x4b)");
  const proxyStatus = proxyFlags.length > 0 ? "⚠️ " + proxyFlags.join("/") : "✅ 无";

  // 黑名单（外部黑名单仅作记录，不参与分数计算）
  const blacklisted = !!s.is_blacklisted_external;

  // 类型判定
  let type;
  if (p.is_datacenter || x4b.is_datacenter) type = "🏢 数据中心";
  else if (p.is_vpn || x4b.is_vpn) type = "🔀 代理/VPN";
  else type = "🏠 住宅 IP";

  return {
    type: type,
    risk: riskEmoji,
    score: score,
    riskLabel: riskLabel,
    proxyStatus: proxyStatus,
    blacklisted: blacklisted
  };
}

// ---------- 旧逻辑：ip-api 布尔信号估算（降级用）----------
function riskLevelLegacy(d) {
  const hosting = !!d.hosting, proxy = !!d.proxy, mobile = !!d.mobile;
  let type, risk, score = 100;
  if (hosting && proxy) { type = "🏢🔀 机房+代理"; risk = "🔴 极高风险"; score = 25; }
  else if (proxy)       { type = "🔀 代理/VPN";    risk = "🟠 高风险"; score = 55; }
  else if (hosting)     { type = "🏢 数据中心";   risk = "🟡 中风险"; score = 60; }
  else if (mobile)     { type = "📱 移动网络";    risk = "🟢 低风险"; score = 90; }
  else                  { type = "🏠 住宅 IP";     risk = "🟢 低风险"; score = 95; }
  return { type, risk, score };
}

// ---------- 源定义 ----------
const SOURCES = {
  ipapi:  "http://ip-api.com/json?fields=status,query,country,countryCode,regionName,city,isp,org,as,proxy,hosting,mobile",
  ipinfo: "https://ipinfo.io/json",
  ipwho:  "https://ipwho.is/",
  ipsb:   "https://api.ip.sb/ip",
  ipcfg:  "https://ifconfig.me/ip"
};

function normIpapi(d) {
  if (!d || d.status === "fail") return null;
  return { ip: d.query, country: d.country, code: d.countryCode, region: d.regionName, city: d.city, isp: d.isp, org: d.org, as: d.as, proxy: d.proxy, hosting: d.hosting, mobile: d.mobile };
}
function normIpinfo(d) {
  if (!d || !d.ip) return null;
  const m = (d.org || "").match(/^(AS\d+)\s+(.*)/);
  return { ip: d.ip, country: d.country, code: (d.country || "").toUpperCase(), region: d.region, city: d.city, isp: m ? m[2] : d.org, org: d.org, as: m ? m[1] : "" };
}
function normIpwho(d) {
  if (!d || !d.success || !d.ip) return null;
  const c = d.connection || {};
  return { ip: d.ip, country: d.country, code: d.country_code, region: d.region, city: d.city, isp: c.isp || c.org, org: c.org, as: c.asn ? "AS" + c.asn : "" };
}

// ---------- 主流程 ----------
(async () => {
  // Phase 1: 多源并发取出口 IP
  const [ipapi, ipinfo, ipwho, ipsb, ipcfg] = await Promise.all([
    fetchJson(SOURCES.ipapi).then(normIpapi),
    fetchJson(SOURCES.ipinfo).then(normIpinfo),
    fetchJson(SOURCES.ipwho).then(normIpwho),
    fetchText(SOURCES.ipsb),
    fetchText(SOURCES.ipcfg)
  ]);

  let main = ipapi || ipinfo || ipwho;
  const bareIP = ipsb || ipcfg;
  if (!main && bareIP) {
    done({ title: META + " · 仅 IP", content: "策略组: " + groupName + "\nIP: " + bareIP + "\n（结构化源全部失败）", icon: "exclamationmark.triangle", "icon-color": "#FF9500" });
    return;
  }
  if (!main) {
    done({ title: META + " · 失败", content: "策略组: " + groupName + "\n所有源均无响应", icon: "xmark.circle", "icon-color": "#FF3B30" });
    return;
  }

  // Phase 1.5: 取策略组当前选中的真实节点名（抓最近请求 originalPolicyName，照网络信息模块逻辑）
  let nodeName = groupName;
  let cur = null;
  for (let i = 0; i < 3 && !cur; i++) {
    cur = await getCurrentNode();
    if (!cur) await new Promise(r => setTimeout(r, 300));
  }
  if (cur && typeof cur === "string" && cur !== groupName && !cur.includes("DIRECT")) nodeName = cur;
  // 节点名自带国旗则直接用(不重复加)，回退到策略组名时再补归属国旗
  if (nodeName === groupName && !/^[\uD83C][\uDDE6-\uDDFF]/.test(nodeName)) nodeName = f + " " + nodeName;

  // Phase 2: 交叉验证（v4/v6 分组）
  const allIPs = [ipapi && ipapi.ip, ipinfo && ipinfo.ip, ipwho && ipwho.ip, ipsb, ipcfg].filter(Boolean);
  const v4 = allIPs.filter(x => x && x.includes("."));
  const v6 = allIPs.filter(x => x && x.includes(":"));
  const dualStack = v4.length > 0 && v6.length > 0;
  const realMismatch = new Set(v4).size > 1 || new Set(v6).size > 1;
  const ipMismatch = realMismatch ? " ⚠️IP不一致" : (dualStack ? " 🔀双栈" : "");

  // 归属
  const geo = ipinfo || ipwho || {};
  const country = main.country || geo.country || "未知";
  const code = main.code || geo.code || "";
  const isp = main.isp || geo.isp || "未知";
  const as = main.as || (geo.as ? ("" + geo.as).startsWith("AS") ? geo.as : "AS" + geo.as : "未知");
  const f = flag(code);
  const loc = [country, main.region || geo.region || "", main.city || geo.city || ""].filter(Boolean).join(" · ");
  const sources = [ipapi && "ip-api", ipinfo && "ipinfo", ipwho && "ipwho", ipsb && "ip.sb", ipcfg && "ifconfig"].filter(Boolean).join("/");

  // Phase 3: Scamalytics 真实评分（优先 v4，回退 v6）
  const queryIP = v4[0] || v6[0];
  const scamData = await fetchScamalytics(queryIP);
  let r, scamDisplay;

  if (scamData) {
    const s = parseScamalytics(scamData);
    r = { type: s.type, risk: s.risk, score: s.score };
    scamDisplay = {
      proxyStatus: s.proxyStatus,
      blacklisted: s.blacklisted,
      scoreLabel: s.score + "/100",
      riskLabel: s.riskLabel || ""
    };
  } else if (SCAM_KEY) {
    r = riskLevelLegacy(ipapi || {});
    scamDisplay = { proxyStatus: "API失败", blacklisted: false, scoreLabel: "纯净度 " + r.score + "/100(估算)", riskLabel: "" };
  } else {
    r = ipapi ? riskLevelLegacy(ipapi) : { type: "无信号", risk: "未知", score: 0 };
    scamDisplay = { proxyStatus: "", blacklisted: false, scoreLabel: (r.score > 0 ? "纯净度 " + r.score + "/100" : "无数据"), riskLabel: "" };
  }

  // 面板详细版
  const panelLines = [
    "策略组: " + groupName,
    "IP: " + main.ip + ipMismatch,
    "归属: " + f + loc + (code ? " (" + code + ")" : ""),
    "ISP: " + isp,
    "AS: " + as,
    "类型: " + r.type,
    "风险: " + r.risk + " | " + scamDisplay.scoreLabel
  ];
  if (scamDisplay.proxyStatus && scamDisplay.proxyStatus !== "API失败") {
    panelLines.push("代理/VPN: " + scamDisplay.proxyStatus);
  }
  if (scamDisplay.blacklisted) panelLines.push("黑名单: ⚠️ 已收录");
  else if (scamDisplay.proxyStatus !== "" && scamDisplay.proxyStatus !== "API失败") panelLines.push("黑名单: 未收录");

  // 通知完整版
  const notifyLines = [
    "策略组: " + groupName,
    "IP: " + main.ip + ipMismatch,
    "归属: " + f + loc + (code ? " (" + code + ")" : ""),
    "ISP: " + isp,
    "AS: " + as,
    "类型: " + r.type,
    "风险: " + r.risk + " | 评分: " + scamDisplay.scoreLabel,
    "代理/VPN: " + scamDisplay.proxyStatus,
    "黑名单: " + (scamDisplay.blacklisted ? "⚠️ 已收录" : "未收录"),
    "数据源: " + (scamDisplay.proxyStatus ? "Scamalytics" : sources)
  ];
  try { $notification.post(META, main.ip + " " + r.risk, notifyLines.join("\n")); } catch (e) {}

  // 图标 4 色盾牌跟随风险等级（🔴🟠🟡🟢）
  const riskStr = String(r.risk || "");
  let iconColor, iconName;
  if (riskStr.includes("🔴")) { iconColor = "#FF3B30"; iconName = "xmark.shield.fill"; }
  else if (riskStr.includes("🟠")) { iconColor = "#FF9500"; iconName = "exclamationmark.shield.fill"; }
  else if (riskStr.includes("🟡")) { iconColor = "#FFCC00"; iconName = "exclamationmark.shield"; }
  else if (riskStr.includes("🟢")) { iconColor = "#34C759"; iconName = "checkmark.shield.fill"; }
  else { iconColor = "#8E8E93"; iconName = "questionmark.shield"; }

  done({
    title: "代理策略: " + nodeName + (realMismatch ? " ⚠️" : ""),
    content: panelLines.join("\n"),
    icon: iconName,
    "icon-color": iconColor
  });
})();
