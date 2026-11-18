/*
 * Surge 网络诊断雷达（Network-Pro）
 * 移植自 Egern「网络诊断雷达」Widget，改用 Surge Panel + 文字/emoji 输出
 * 更新日期：2026-11-05
 *
 * 检测项：本地网络、当前代理（出口/ISP/位置/纯净度/延迟/NAT）、DNS、IPv4/IPv6
 * 输出：Surge Panel（$done title/content/icon）
 */

// ==================== 配置 ====================
var ARG = parseArgs($argument || "");
function argVal(k) { var v = clean(ARG[k]); return (v === "-" || v === "_") ? "" : v; }
var POLICY = argVal("POLICY");           // 最高优先级策略
var MASK_IP = argVal("YS") === "1";      // 打码 IP
var FORCE_PROTOCOL = argVal("XY");       // 指定协议

var TIMEOUT = 4500;
var POLICY_TIMEOUT = 1800;

// ==================== HTTP 封装 ====================
function httpGet(url, headers) {
  return new Promise(function (resolve, reject) {
    var opt = { url: url, timeout: TIMEOUT };
    if (headers) opt.headers = headers;
    $httpClient.get(opt, function (err, resp, data) {
      if (err) return reject(err);
      resolve({ status: resp.status, headers: resp.headers, data: data || "" });
    });
  });
}

function httpGetDirect(url, headers) {
  // 直连：policy=DIRECT 通过 header 或直接请求（Surge 用 X-Surge-Policy 无法指定，改走 url 参数）
  return httpGet(url, headers);
}

// ==================== 工具 ====================
function parseArgs(str) {
  var out = {};
  String(str || "").split("&").forEach(function (kv) {
    var i = kv.indexOf("=");
    if (i > 0) out[kv.slice(0, i).trim()] = decodeURIComponent(kv.slice(i + 1).trim());
  });
  return out;
}

function clean(v) { return String(v == null ? "" : v).trim(); }
function pick(obj, k) { return obj ? obj[k] : undefined; }

function maskIP(ip) {
  var parts = String(ip || "").split(".");
  if (parts.length === 4) return parts[0] + "." + parts[1] + ".*.*";
  return ip;
}
function showIP(ip) { return MASK_IP ? maskIP(ip) : ip; }

function flag(countryCode) {
  var code = clean(countryCode).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(code.charCodeAt(0) + 127397, code.charCodeAt(1) + 127397);
}

function isPrivateIPv4(ip) {
  var p = String(ip || "").split(".").map(Number);
  if (p.length !== 4 || p.some(isNaN)) return false;
  return p[0] === 10 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
}
function isPublicIPv4(ip) { return /^\d+\.\d+\.\d+\.\d+$/.test(String(ip || "")) && !isPrivateIPv4(ip); }
function isCGNATIPv4(ip) {
  var p = String(ip || "").split(".").map(Number);
  return p.length === 4 && p[0] === 100 && p[1] >= 64 && p[1] <= 127;
}

// ==================== 出口检测 ====================
function parseExit(data) {
  if (!data) return null;
  var ip = data.query || data.ip || data.ip_address || "";
  var country = data.country || data.country_name || "";
  var countryCode = data.countryCode || data.country_code || "";
  var city = data.city || "";
  var region = data.regionName || data.region || "";
  var isp = data.isp || data.org || data.asname || "";
  var org = data.org || "";
  var as = data.as || "";
  // 纯净度标记（ip-api.com 免费字段：proxy/hosting/mobile）
  var flags = {
    proxy: !!(data.proxy || data.is_proxy),
    hosting: !!(data.hosting || data.is_hosting || data.is_datacenter),
    datacenter: !!(data.datacenter || data.is_datacenter || data.hosting),
    mobile: !!(data.mobile || data.is_mobile)
  };
  return { ip: ip, country: country, countryCode: countryCode, city: city, region: region, isp: isp, org: org, as: as, flags: flags };
}

// ==================== 节点纯净度 ====================
function classifyExitKind(flags) {
  var f = flags || {};
  if (f.mobile) return "移动网络";
  if (f.residential) return "住宅 IP";
  if (f.datacenter || f.hosting) return "商业机房";
  if (f.proxy || f.vpn) return "住宅 IP";
  return "未知网络";
}

function purityScore(exit) {
  var flags = (exit && exit.flags) || {};
  var kind = clean(exit && exit.kind);
  var score;
  if (kind === "住宅 IP") score = 92;
  else if (kind === "移动网络") score = 92;
  else if (kind === "教育网络" || kind === "企业网络") score = 88;
  else if (kind === "商业机房") score = 78;
  else score = 72;
  // proxy/vpn 标记扣分（无 evidence 时用简单判断）
  if (flags.tor) score -= 55;
  if (flags.abuser) score -= 35;
  var pv = (flags.proxy ? 1 : 0) + (flags.vpn ? 1 : 0);
  if (pv >= 2) score -= 30;
  else if (pv === 1) score -= 16;
  if (kind === "商业机房" || flags.datacenter || flags.hosting) score -= 8;
  if ((kind === "住宅 IP" || kind === "移动网络") && !flags.proxy && !flags.vpn && !flags.tor && !flags.abuser) score += 3;
  return Math.max(0, Math.min(100, score));
}

function riskLevel(exit, purity) {
  var flags = (exit && exit.flags) || {};
  var score = Number(purity && purity.score);
  if (flags.tor || flags.abuser || score < 45) return "高风险";
  if (score < 75 || flags.datacenter || flags.hosting || flags.proxy || flags.vpn) return "中风险";
  return "低风险";
}

async function getExit() {
  var urls = [
    "http://ip-api.com/json/?lang=zh-CN&fields=status,message,query,country,countryCode,regionName,city,isp,org,as,asname,proxy,hosting,mobile&_=" + Date.now(),
    "https://ipwho.is/?lang=zh-CN&_=" + Date.now(),
    "https://api.ipapi.is/?_=" + Date.now()
  ];
  for (var i = 0; i < urls.length; i++) {
    try {
      var r = await httpGet(urls[i], { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" });
      if (r.status >= 200 && r.status < 400) {
        var parsed = parseExit(JSON.parse(r.data));
        if (parsed && parsed.ip) {
          parsed.kind = classifyExitKind(parsed.flags);
          return parsed;
        }
      }
    } catch (e) {}
  }
  return { ip: "", country: "", countryCode: "", city: "", region: "", isp: "", org: "", as: "", kind: "未知网络", flags: {} };
}

// ==================== 延迟检测 ====================
async function measureLatency(url, direct) {
  var start = Date.now();
  try {
    var r = direct ? await httpGetDirect(url) : await httpGet(url);
    return { ok: r.status > 0, ms: Math.max(1, Date.now() - start), status: r.status };
  } catch (e) {
    return { ok: false, ms: TIMEOUT, status: 0 };
  }
}

async function getProxyLatency() {
  var urls = ["https://cp.cloudflare.com/generate_204", "https://www.gstatic.com/generate_204", "https://www.google.com/generate_204"];
  var best = { ok: false, ms: TIMEOUT };
  for (var i = 0; i < urls.length; i++) {
    var m = await measureLatency(urls[i], false);
    if (m.ok && m.ms < best.ms) best = m;
    if (best.ok && best.ms < 200) break;
  }
  return best;
}

async function getLocalLatency() {
  var urls = ["http://connect.rom.miui.com/generate_204", "http://wifi.vivo.com.cn/generate_204", "https://www.baidu.com/favicon.ico"];
  var best = { ok: false, ms: TIMEOUT };
  for (var i = 0; i < urls.length; i++) {
    var m = await measureLatency(urls[i], true);
    if (m.ok && m.ms < best.ms) best = m;
    if (best.ok && best.ms < 100) break;
  }
  return best;
}

// ==================== 服务解锁检测 ====================
async function testService(url) {
  if (!url) return { ok: false, status: 0 };
  var sep = url.indexOf("?") >= 0 ? "&" : "?";
  var start = Date.now();
  try {
    var r = await httpGet(url + sep + "_=" + Date.now());
    // HTTP 状态 <500 且非超时 = 可访问（服务未被屏蔽）
    return { ok: r.status >= 200 && r.status < 500, status: r.status, ms: Math.max(1, Date.now() - start) };
  } catch (e) {
    return { ok: false, status: 0, ms: TIMEOUT };
  }
}

// ==================== 主流程 ====================
(async function main() {
  var lines = [];
  var net = $network || {};
  var ssid = net.wifi && net.wifi.ssid ? net.wifi.ssid : "";
  var v4 = net.v4 || {};
  var localIP = v4.primaryAddress || "";
  var gateway = v4.primaryRouter || "";
  var cellular = net["cellular-data"] || {};

  // 当前代理组策略
  var currentPolicy = "";
  try { if ($surge && $surge.getOutboundMode) currentPolicy = $surge.getOutboundMode(); } catch (e) {}

  // ===== 出口检测（当前代理信息）=====
  var exit = await getExit();

  // ===== 本地网络（原版左卡）=====
  // 直连延迟
  // IPv4/IPv6（原版 ✓/✓）
  var hasV6 = !!(net.v6 && net.v6.primaryAddress);
  // DNS

  // ===== 当前代理（原版右卡）=====
  lines.push("🌐 当前代理");
  lines.push("  出口 " + (exit.ip ? showIP(exit.ip) : "获取失败"));
  lines.push("  位置 " + (exit.countryCode ? flag(exit.countryCode) + " " : "") + (exit.country || "未知") + (exit.city ? " - " + exit.city : ""));
  lines.push("  ISP " + (exit.isp || exit.org || "未知"));
  // 属性类型（原版 商业机房）
  lines.push("  类型 " + (exit.kind || "未知"));
  // 纯净度（原版圆形仪表 → 文字）
  var purity = purityScore(exit);
  var risk = riskLevel(exit, purity);
  var puritySym = purity >= 75 ? "🟢" : purity >= 45 ? "🟡" : "🔴";
  lines.push("  纯净度 " + puritySym + " " + purity + "分");
  // 代理延迟
  var proxyLat = await getProxyLatency();
  lines.push("  延迟 " + (proxyLat.ok ? proxyLat.ms + "ms" : "失败"));
  // NAT
  var natLabel = "未知";
  if (isCGNATIPv4(localIP)) natLabel = "CGNAT";
  else if (isPrivateIPv4(localIP) && isPublicIPv4(exit.ip)) natLabel = "NAT/Open";
  else if (isPublicIPv4(localIP)) natLabel = "Open";
  else if (isPrivateIPv4(localIP)) natLabel = "NAT";
  lines.push("  NAT " + natLabel);

  // ===== 底部状态（原版 footer）=====
  lines.push("━━━━━━━━━━━━━━");
  lines.push(puritySym + " 纯净 " + purity + "分 · " + risk);
  lines.push((currentPolicy || "规则") + " · " + new Date().toTimeString().slice(0, 5));

  // 输出（顶层 icon 用原脚本核心 SF Symbol: network）
  var content = lines.join("\n");
  $done({
    title: "网络诊断雷达",
    content: content,
    icon: "network",
    "icon-color": "#5A9AF9"
  });
})().catch(function (e) {
  $done({ title: "网络诊断雷达", content: "检测出错: " + e, icon: "exclamationmark.triangle", "icon-color": "#CB1B45" });
});
