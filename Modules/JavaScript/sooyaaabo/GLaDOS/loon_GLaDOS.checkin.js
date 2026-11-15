/****************************** 
脚本功能：GLaDOS 自动签到 + 积分兑换
参考链接：https://raw.githubusercontent.com/curtinp118/Scripthub/main/scripts/glados/glados.js
作者：Curtinp118
更新时间：2026-10-19
使用说明：
  访问 GLaDOS 任意域名的 /console/account 页面抓包保存 Cookie，定时任务自动对已保存 Cookie 的域名执行签到。
  支持 glados.cloud、glados.network、glados.one、glados.space、glados.vip，各域名支持多账号。
  同一域名多次抓包可保存不同账号的 Cookie。
*******************************/

var isQX = typeof $task !== "undefined";
var isLoon = typeof $loon !== "undefined";
var isSurge = typeof $httpClient !== "undefined" && !isLoon;

var $http = {
  fetch: (opts) => {
    if (isQX) return $task.fetch(opts);
    return new Promise((resolve, reject) => {
      var method = (opts.method || "GET").toUpperCase();
      var handler = (err, resp, data) => {
        if (err) reject(err);
        else resolve({ statusCode: resp.status || resp.statusCode || 0, headers: resp.headers, body: data });
      };
      if (method === "POST") $httpClient.post(opts, handler);
      else $httpClient.get(opts, handler);
    });
  }
};

var $store = {
  read: (key) => isQX ? $prefs.valueForKey(key) : $persistentStore.read(key),
  write: (val, key) => isQX ? $prefs.setValueForKey(val, key) : $persistentStore.write(val, key)
};

var notify = isQX
  ? (t, s, b) => $notify(t, s, b)
  : (t, s, b) => $notification.post(t, s, b);

var COOKIES_KEY_PREFIX = "GLaDOS_Cookies";
var ACCOUNT_META_PREFIX = "GLaDOS_AccountMeta";
var DOMAINS_LIST_KEY = "GLaDOS_Domains";
var DOMAINS = ["glados.network", "glados.vip", "glados.one", "glados.space", "glados.cloud"];
var EXCHANGE_PLAN = "plan500";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
var isGetHeader = typeof $request !== "undefined";

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch (_) { return null; }
}

function readHeader(headers, name) {
  var keys = Object.keys(headers || {});
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === name.toLowerCase()) return headers[keys[i]];
  }
  return "";
}

function isSupportedDomain(domain) {
  return /^(glados\.(cloud|network|one|space|vip))$/i.test(domain || "");
}

function cookiesKeyFor(domain) {
  return COOKIES_KEY_PREFIX + ":" + domain;
}

function getSavedDomains() {
  try {
    var raw = $store.read(DOMAINS_LIST_KEY);
    if (!raw) return [];
    var list = safeJsonParse(raw) || [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch (e) {
    console.log("[GLaDOS] Error reading domains: " + e);
    return [];
  }
}

function addDomain(domain) {
  try {
    var list = getSavedDomains();
    if (list.indexOf(domain) === -1) {
      list.push(domain);
      $store.write(JSON.stringify(list), DOMAINS_LIST_KEY);
    }
  } catch (e) {
    console.log("[GLaDOS] Error adding domain: " + e);
  }
}

function getCookiesForDomain(domain) {
  try {
    var raw = $store.read(cookiesKeyFor(domain));
    if (!raw) return [];
    var list = safeJsonParse(raw);
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch (e) {
    console.log("[GLaDOS] Error reading cookies: " + e);
    return [];
  }
}

function getAccountMeta(domain) {
  try {
    var raw = $store.read(ACCOUNT_META_PREFIX + ":" + domain);
    var list = safeJsonParse(raw || "[]");
    return Array.isArray(list) ? list.filter(function (item) {
      return item && typeof item.cookie === "string";
    }) : [];
  } catch (_) {
    return [];
  }
}

function findAccountMeta(domain, cookie) {
  var list = getAccountMeta(domain);
  for (var i = 0; i < list.length; i++) {
    if (list[i].cookie === cookie) return list[i];
  }
  return {};
}

function removeCookie(domain, cookie) {
  try {
    var cookies = getCookiesForDomain(domain);
    var index = cookies.indexOf(cookie);
    if (index === -1) return false;
    cookies.splice(index, 1);
    $store.write(JSON.stringify(cookies), cookiesKeyFor(domain));
    console.log("[GLaDOS] 已删除失效 Cookie " + formatDomainLabel(domain));
    return true;
  } catch (e) {
    console.log("[GLaDOS] 删除失效 Cookie 失败: " + e);
    return false;
  }
}

async function saveCookie(domain, cookie, userAgent) {
  try {
    if (!cookie) return { isNew: false, index: -1 };
    var identity = await getAccountInfo(cookie, domain, userAgent);
    if (identity.unauthorized || !identity.accountName) {
      throw new Error("无法验证账号，请确认已登录后重试");
    }

    var email = identity.accountName.toLowerCase();
    var cookies = getCookiesForDomain(domain);
    var metadata = getAccountMeta(domain);
    var nextCookies = [];
    var nextMetadata = [];
    var replaced = false;

    for (var i = 0; i < cookies.length; i++) {
      var saved = cookies[i];
      var meta = findAccountMeta(domain, saved);
      var savedEmail = typeof meta.email === "string" ? meta.email.toLowerCase() : "";
      if (saved === cookie || (savedEmail && savedEmail === email)) {
        replaced = true;
        continue;
      }
      if (nextCookies.indexOf(saved) !== -1) continue;
      nextCookies.push(saved);
      nextMetadata.push({ cookie: saved, email: savedEmail, userAgent: meta.userAgent || "" });
    }

    nextCookies.push(cookie);
    nextMetadata.push({ cookie: cookie, email: email, userAgent: userAgent || "" });
    if (!$store.write(JSON.stringify(nextCookies), cookiesKeyFor(domain)) ||
        !$store.write(JSON.stringify(nextMetadata), ACCOUNT_META_PREFIX + ":" + domain)) {
      throw new Error("本地存储写入失败");
    }
    addDomain(domain);
    return { isNew: !replaced, index: nextCookies.length - 1, accountName: identity.accountName };
  } catch (e) {
    console.log("[GLaDOS] Error saving cookie: " + e);
    return { isNew: false, index: -1, error: String(e) };
  }
}

function getHostFromRequest() {
  var url = ($request && $request.url) || "";
  var m = url.match(/^https:\/\/([^\/:?#]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function request(url, method, cookie, domain, body, userAgent) {
  var headers = {
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://" + domain,
    "Referer": "https://" + domain + "/console/checkin",
    "User-Agent": userAgent || findAccountMeta(domain, cookie).userAgent || UA,
    "Cookie": cookie
  };
  var opts = { url: url, method: method, headers: headers };
  if (isLoon) {
    opts["auto-cookie"] = false;
    opts["auto-redirect"] = false;
    opts.insecure = false;
  }
  if (body !== undefined) opts.body = typeof body === "string" ? body : JSON.stringify(body);

  return $http.fetch(opts).then(
    function (resp) {
      var statusCode = resp.statusCode || resp.status || 0;
      if (statusCode >= 300 && statusCode < 400) {
        return { statusCode: statusCode, data: null, raw: resp.body || "", error: "接口返回 HTTP " + statusCode + " 重定向" };
      }
      return { statusCode: statusCode, data: safeJsonParse(resp.body || ""), raw: resp.body || "" };
    },
    function (reason) {
      return { statusCode: 0, data: null, raw: "", error: reason ? String(reason) : "Network error" };
    }
  );
}

function firstNonEmptyString(list) {
  if (!Array.isArray(list)) return "";
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (typeof item === "string") {
      var trimmed = item.trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
}

function pickAccountNameFromObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 3) return "";

  var direct = firstNonEmptyString([
    obj.email,
    obj.mail,
    obj.username,
    obj.userName,
    obj.nickname,
    obj.nickName,
    obj.name
  ]);
  if (direct) return direct;

  var nestedKeys = ["data", "userInfo", "user", "profile", "account", "info", "details"];
  for (var i = 0; i < nestedKeys.length; i++) {
    var nested = obj[nestedKeys[i]];
    if (nested && typeof nested === "object") {
      var nestedName = pickAccountNameFromObject(nested, depth + 1);
      if (nestedName) return nestedName;
    }
  }

  return "";
}

function extractAccountName(respData) {
  return pickAccountNameFromObject(respData, 0);
}

function formatAccountLabel(accountName) {
  var name = typeof accountName === "string" ? accountName.trim() : "";
  return name || "未识别账户";
}

function formatDomainLabel(domain) {
  return "[" + domain + "]";
}

async function getAccountInfo(cookie, domain, userAgent) {
  var resp = await request("https://" + domain + "/api/user/status", "GET", cookie, domain, undefined, userAgent);
  if (resp.error || !resp.data) {
    console.log("[GLaDOS] 查询账户信息失败 " + formatDomainLabel(domain) + ": " + (resp.error || resp.raw));
    // 网络错误不等于 Cookie 失效，不自动删除
    return { accountName: "", unauthorized: false, networkError: true };
  }
  var authFailed = resp.statusCode === 401 || resp.statusCode === 403 || resp.data.code === -2 ||
    resp.data.code === 401 || resp.data.code === 403 || resp.data.message === "没有权限";
  if (authFailed) {
    console.log("[GLaDOS] Cookie 已失效 " + formatDomainLabel(domain) + ": " + JSON.stringify(resp.data));
    return { accountName: "", unauthorized: true };
  }
  var accountName = extractAccountName(resp.data);
  if (accountName) {
    console.log("[GLaDOS] 账户标识 " + formatDomainLabel(domain) + ": " + accountName);
  } else {
    console.log("[GLaDOS] 账户信息响应 " + formatDomainLabel(domain) + ": 未提取到账户标识");
  }
  return { accountName: accountName, unauthorized: false };
}

async function checkin(cookie, domain) {
  var url = "https://" + domain + "/api/user/checkin";
  var resp = await request(url, "POST", cookie, domain, { token: domain });

  if (resp.error) {
    console.log("[GLaDOS] 签到网络错误 " + formatDomainLabel(domain) + ": " + resp.error);
    return { status: "签到失败", code: -2, message: resp.error, points: "0" };
  }
  if (!resp.data) {
    console.log("[GLaDOS] 签到响应解析失败 " + formatDomainLabel(domain) + ": " + resp.raw);
    return { status: "签到失败", code: -2, message: resp.raw, points: "0" };
  }

  var data = resp.data;
  var code = data.code !== undefined ? data.code : -2;
  var message = data.message || "";
  var points = String(data.points !== undefined ? data.points : 0);

  if (code === 0) {
    console.log("[GLaDOS] 签到成功 " + formatDomainLabel(domain) + ": +" + points + " 积分, " + message);
    return { status: "签到成功", code: 0, message: message, points: points };
  } else if (code === 1 && /^today['’]s observation logged\.\s+return tomorrow for more points\.?$/i.test(message)) {
    console.log("[GLaDOS] 签到成功 " + formatDomainLabel(domain) + ": +" + points + " 积分, " + message);
    return { status: "签到成功", code: 0, message: message, points: points };
  } else if (code === 1 && /^checkin repeats[!.]?\s+please try tomorrow[!.]?$/i.test(message)) {
    console.log("[GLaDOS] 重复签到 " + formatDomainLabel(domain) + ": " + message);
    return { status: "重复签到", code: 1, message: message, points: "0" };
  } else {
    console.log("[GLaDOS] 签到失败 " + formatDomainLabel(domain) + ": code=" + code + ", " + message);
    return { status: "签到失败", code: code, message: message, points: "0" };
  }
}

async function getStatus(cookie, domain) {
  var resp = await request("https://" + domain + "/api/user/status", "GET", cookie, domain);
  if (resp.error || !resp.data) {
    console.log("[GLaDOS] 查询状态失败 " + formatDomainLabel(domain) + ": " + (resp.error || resp.raw));
    return { leftDays: "N/A" };
  }
  var leftDays = resp.data.data && resp.data.data.leftDays;
  if (leftDays !== undefined && leftDays !== null) {
    var days = parseInt(parseFloat(leftDays), 10);
    console.log("[GLaDOS] 剩余天数 " + formatDomainLabel(domain) + ": " + days + " 天");
    return { leftDays: days + " 天" };
  }
  console.log("[GLaDOS] 状态响应 " + formatDomainLabel(domain) + ": " + JSON.stringify(resp.data));
  return { leftDays: "N/A" };
}

async function getPoints(cookie, domain) {
  var resp = await request("https://" + domain + "/api/user/points", "GET", cookie, domain);
  if (resp.error || !resp.data) {
    console.log("[GLaDOS] 查询积分失败 " + formatDomainLabel(domain) + ": " + (resp.error || resp.raw));
    return { points: "N/A", pointsNum: 0 };
  }
  var points = resp.data.points;
  if (points !== undefined && points !== null) {
    var pointsInt = parseInt(parseFloat(points), 10);
    console.log("[GLaDOS] 总积分 " + formatDomainLabel(domain) + ": " + pointsInt);
    return { points: "" + pointsInt, pointsNum: pointsInt };
  }
  console.log("[GLaDOS] 积分响应 " + formatDomainLabel(domain) + ": " + JSON.stringify(resp.data));
  return { points: "N/A", pointsNum: 0 };
}

async function exchange(cookie, domain, plan) {
  var resp = await request("https://" + domain + "/api/user/exchange", "POST", cookie, domain, { planType: plan });
  if (resp.error || !resp.data) {
    console.log("[GLaDOS] 兑换失败 " + formatDomainLabel(domain) + ": " + (resp.error || resp.raw));
    return "兑换失败: " + (resp.error || resp.raw);
  }
  var code = resp.data.code !== undefined ? resp.data.code : -2;
  var message = resp.data.message || "";
  if (code === 0) {
    console.log("[GLaDOS] 兑换成功 " + formatDomainLabel(domain) + ": " + plan + ", " + message);
    return "兑换成功(" + plan + ")";
  } else {
    console.log("[GLaDOS] 兑换失败 " + formatDomainLabel(domain) + ": code=" + code + ", " + message);
    return "兑换失败: " + message;
  }
}

async function checkinForAccount(cookie, domain, accountLabel) {
  var accountInfo = await getAccountInfo(cookie, domain);
  if (accountInfo.unauthorized) {
    removeCookie(domain, cookie);
    return {
      accountLabel: "失效 Cookie",
      domain: domain,
      status: "已删除失效 Cookie",
      code: -3,
      message: "没有权限",
      earnedPoints: "0",
      totalPoints: "N/A",
      daysBefore: "N/A",
      daysAfter: "N/A",
      exchange: "跳过"
    };
  }
  var statusBefore = await getStatus(cookie, domain);
  var resolvedLabel = formatAccountLabel(accountInfo.accountName);
  console.log("[GLaDOS] " + resolvedLabel + " | " + formatDomainLabel(domain));
  var checkinResult = await checkin(cookie, domain);
  var pointsResult = await getPoints(cookie, domain);
  var exchangeResult = "跳过(积分不足)";
  if (pointsResult.pointsNum >= 500) {
    exchangeResult = await exchange(cookie, domain, EXCHANGE_PLAN);
  } else {
    console.log("[GLaDOS] 积分 " + pointsResult.pointsNum + " < 500，跳过兑换");
  }
  var statusAfter = await getStatus(cookie, domain);
  return {
    accountLabel: resolvedLabel,
    domain: domain,
    status: checkinResult.status,
    code: checkinResult.code,
    message: checkinResult.message,
    earnedPoints: checkinResult.points,
    totalPoints: pointsResult.points,
    daysBefore: statusBefore.leftDays,
    daysAfter: statusAfter.leftDays,
    exchange: exchangeResult
  };
}

if (isGetHeader) {
  (async function () {
    var allHeaders = $request.headers || {};
    var cookie = readHeader(allHeaders, "Cookie");
    var userAgent = readHeader(allHeaders, "User-Agent");
    var host = getHostFromRequest();
    if (!cookie || !isSupportedDomain(host)) {
      console.log("[GLaDOS] Cookie or Host not found in request headers");
      notify("GLaDOS", "抓包失败", "未获取到 Cookie 或 Host，请检查重写配置");
      return $done({});
    }

    var result = await saveCookie(host, cookie, userAgent);
    if (result.error) {
      console.log("[GLaDOS] Cookie verification failed: " + result.error);
      notify("GLaDOS", "抓包失败", "未能验证账号，请确认已登录后重新访问 /console/account");
      return $done({});
    }
    var label = formatAccountLabel(result.accountName);
    if (result.isNew) {
      console.log("[GLaDOS] " + label + " Cookie saved for " + formatDomainLabel(host));
      notify("GLaDOS", label + " 已保存 " + formatDomainLabel(host), "新账号 Cookie 已记录，将用于自动签到");
    } else {
      console.log("[GLaDOS] " + label + " Cookie already exists for " + formatDomainLabel(host));
      notify("GLaDOS", label + " 已存在 " + formatDomainLabel(host), "该 Cookie 已保存过，无需重复抓包");
    }
    $done({});
  })();
} else {
  var delay = Math.floor(Math.random() * 11);
  console.log("[GLaDOS] 随机延迟 " + delay + "s");
  setTimeout(async function () {
    var savedDomains = getSavedDomains();
    if (savedDomains.length === 0) {
      var cookieDomains = [];
      for (var ci = 0; ci < DOMAINS.length; ci++) {
        if (getCookiesForDomain(DOMAINS[ci]).length > 0) {
          cookieDomains.push(DOMAINS[ci]);
        }
      }
      if (cookieDomains.length > 0) {
        console.log("[GLaDOS] 检测到 Cookie，但 GLaDOS_Domains 域名索引丢失: " + JSON.stringify(cookieDomains));
        notify("GLaDOS 签到", "域名索引丢失", "检测到已有 Cookie，但域名索引 GLaDOS_Domains 丢失，请重新访问 /console/account 获取 Cookie");
      } else {
        console.log("[GLaDOS] 未找到已保存的 Cookie");
        notify("GLaDOS 签到", "无 Cookie", "请先访问 /console/account 抓包获取 Cookie");
      }
      return $done();
    }
    var allResults = [];
    var totalAccounts = 0;
    for (var d = 0; d < savedDomains.length; d++) {
      var domain = savedDomains[d];
      var cookies = getCookiesForDomain(domain);
      if (cookies.length === 0) {
        console.log("[GLaDOS] " + formatDomainLabel(domain) + " 无 Cookie，跳过");
        continue;
      }
      for (var i = 0; i < cookies.length; i++) {
        totalAccounts++;
        allResults.push(await checkinForAccount(cookies[i], domain, ""));
      }
    }
    console.log("[GLaDOS] 共 " + totalAccounts + " 个账号");
    var ok = allResults.filter(function (r) { return r.code === 0; }).length;
    var dup = allResults.filter(function (r) { return r.code === 1; }).length;
    var fail = allResults.filter(function (r) { return r.code !== 0 && r.code !== 1; }).length;
    var lines = allResults.map(function (r) {
      var pts = r.earnedPoints !== "0" ? " +" + r.earnedPoints : "";
      return r.accountLabel + " " + formatDomainLabel(r.domain) + " | " + r.status + pts + " | " + r.daysBefore + "->" + r.daysAfter + " | " + r.totalPoints + "积分";
    });
    var title = "GLaDOS | " + totalAccounts + "账号 成" + ok + " 重" + dup + " 败" + fail;
    var content = lines.join("\n");
    console.log("\n[GLaDOS] 签到结果\n" + content + "\n");
    notify(title, "", content);
    $done();
  }, delay * 1000);
}
