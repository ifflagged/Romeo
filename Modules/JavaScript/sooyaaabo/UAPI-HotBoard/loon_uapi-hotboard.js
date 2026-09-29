const SCRIPT_ID = "uapi.hotboard.notify";
const HOTBOARD_URL = "https://uapis.cn/api/v1/misc/hotboard";
const HOTBOARD_WEB_URL = "https://uapis.cn/hotboard";
const HOTBOARD_SAFARI_PREFIX = "x-safari-";
const DEFAULT_TOP = 5;
const DEFAULT_TYPES = ["weibo"];
const isQX = typeof $task !== "undefined";
const isLoon = typeof $loon !== "undefined";
const isEgern = typeof Egern !== "undefined";
const isSurge = typeof $httpClient !== "undefined" && !isLoon && !isEgern;

const PLATFORM_LABELS = {
  "bilibili": "哔哩哔哩",
  "acfun": "A站",
  "weibo": "微博热搜",
  "zhihu": "知乎热榜",
  "zhihu-daily": "知乎日报",
  "douyin": "抖音",
  "xiaohongshu": "小红书",
  "kuaishou": "快手",
  "douban-movie": "豆瓣电影",
  "douban-group": "豆瓣小组",
  "tieba": "百度贴吧",
  "hupu": "虎扑",
  "ngabbs": "NGA论坛",
  "v2ex": "V2EX",
  "52pojie": "吾爱破解",
  "hostloc": "全球主机交流",
  "coolapk": "酷安",
  "baidu": "百度热搜",
  "thepaper": "澎湃新闻",
  "toutiao": "今日头条",
  "qq-news": "腾讯新闻",
  "sina": "新浪热搜",
  "sina-news": "新浪新闻",
  "netease-news": "网易新闻",
  "huxiu": "虎嗅",
  "ifanr": "爱范儿",
  "sspai": "少数派",
  "ithome": "IT之家",
  "ithome-xijiayi": "IT之家喜加一",
  "juejin": "掘金",
  "jianshu": "简书",
  "guokr": "果壳",
  "36kr": "36氪",
  "51cto": "51CTO",
  "csdn": "CSDN",
  "nodeseek": "NodeSeek",
  "hellogithub": "HelloGitHub",
  "lol": "英雄联盟",
  "genshin": "原神",
  "honkai": "崩坏3",
  "starrail": "星穹铁道",
  "netease-music": "网易云音乐热歌榜",
  "qq-music": "QQ音乐热歌榜",
  "weread": "微信读书",
  "weatheralarm": "天气预警",
  "earthquake": "地震速报",
  "history": "历史上的今天"
};

const PLATFORM_TYPE_ALIASES = Object.entries(PLATFORM_LABELS).reduce((result, [type, label]) => {
  result[type] = type;
  result[type.toLowerCase()] = type;
  result[label] = type;
  return result;
}, {});

function isObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function parseArgument(rawArgument) {
  if (!rawArgument) {
    return {};
  }

  if (isObject(rawArgument)) {
    return rawArgument;
  }

  const input = String(rawArgument).trim();
  if (!input) {
    return {};
  }

  if (input.startsWith("{") && input.endsWith("}")) {
    try {
      const json = JSON.parse(input);
      if (isObject(json)) {
        return json;
      }
    } catch (error) {
      console.log(`${SCRIPT_ID}: failed to parse JSON argument: ${error.message}`);
    }
  }

  return input
    .split("&")
    .filter(Boolean)
    .reduce((result, part) => {
      const index = part.indexOf("=");
      const key = index >= 0 ? part.slice(0, index) : part;
      const value = index >= 0 ? part.slice(index + 1) : "";
      if (!key) {
        return result;
      }
      result[decodeURIComponent(key)] = decodeURIComponent(value);
      return result;
    }, {});
}

function normalizeTypes(value) {
  const source = Array.isArray(value) ? value.join(",") : String(value || "");
  const items = source
    .split(/[,，;；|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const normalized = (items.length ? items : DEFAULT_TYPES).map((item) => {
    const lowered = item.toLowerCase();
    return PLATFORM_TYPE_ALIASES[item] || PLATFORM_TYPE_ALIASES[lowered] || item;
  });

  return Array.from(new Set(normalized));
}

function normalizeTop(value) {
  const parsed = parseInt(String(value || DEFAULT_TOP), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TOP;
  }
  return Math.min(parsed, 10);
}

function normalizeAuthHeader(apiValue) {
  const token = String(apiValue || "").trim();
  if (!token) {
    return "";
  }
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}

function buildNotificationOptions(openUrl) {
  if (!openUrl) {
    return undefined;
  }

  if (isQX) {
    return { "open-url": openUrl };
  }

  if (isLoon) {
    return { openUrl: openUrl };
  }

  if (isSurge) {
    return { action: "open-url", url: openUrl };
  }

  if (isEgern) {
    return { url: openUrl };
  }

  return undefined;
}

function notify(title, subtitle, message, openUrl) {
  if (isQX) {
    const options = buildNotificationOptions(openUrl);
    $notify(title, subtitle, message, options);
    return;
  }

  if (isSurge || isLoon || isEgern) {
    if (typeof $notification !== "undefined") {
      const options = buildNotificationOptions(openUrl);
      $notification.post(title, subtitle, message, options);
    }
  }
}

function buildHeaders(authHeader) {
  const runtimeName = isQX
    ? "Quantumult X"
    : (isLoon ? "Loon" : (isEgern ? "Egern" : (isSurge ? "Surge" : "UAPI-Hotboard")));
  const headers = {
    "Accept": "application/json",
    "User-Agent": runtimeName
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  return headers;
}

function httpGet(options) {
  return new Promise((resolve, reject) => {
    if (isQX) {
      $task.fetch({
        url: options.url,
        method: "GET",
        headers: options.headers
      }).then(
        (response) => {
          const statusCode = parseInt(response.status || response.statusCode, 10);
          resolve({
            response: {
              status: statusCode,
              headers: response.headers || {}
            },
            data: response.body
          });
        },
        (error) => {
          const errorMsg = error && typeof error === "object" ? (error.error || JSON.stringify(error)) : String(error);
          reject(new Error(errorMsg));
        }
      );
      return;
    }

    if (isLoon || isSurge || isEgern) {
      $httpClient.get(options, (error, response, data) => {
        if (error) {
          const errorMsg = error && typeof error === "object" ? (error.error || JSON.stringify(error)) : String(error);
          reject(new Error(errorMsg));
          return;
        }
        if (response) {
          response.status = parseInt(response.status || response.statusCode, 10);
        }
        resolve({ response, data });
      });
      return;
    }

    reject(new Error("不支持的运行环境"));
  });
}

function labelFor(type) {
  return PLATFORM_LABELS[type] || type;
}

function hotValueLabel(item) {
  const value = item && item.hot_value ? String(item.hot_value).trim() : "";
  return value ? ` (${value})` : "";
}

function formatUpdateTime(utcValue) {
  if (!utcValue) {
    return "未知时间";
  }

  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) {
    return String(utcValue);
  }

  const beijing = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

function formatUpdateHm(utcValue) {
  const formatted = formatUpdateTime(utcValue);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(formatted)
    ? formatted.slice(11, 16)
    : formatted;
}

function validatePayload(type, payload) {
  if (!isObject(payload)) {
    throw new Error(`${labelFor(type)} 返回内容不是对象`);
  }

  if (!Array.isArray(payload.list)) {
    throw new Error(`${labelFor(type)} 缺少 list 数组`);
  }

  if (!payload.list.length) {
    throw new Error(`${labelFor(type)} 当前没有可通知的热榜条目`);
  }
}

function buildNotificationBody(payload, top) {
  return payload.list
    .slice(0, top)
    .map((item, index) => {
      const rank = item && item.index ? item.index : index + 1;
      const title = item && item.title ? item.title : "无标题";
      return `${rank}. ${title}`;
    })
    .join("\n");
}

function buildLogBody(payload, top) {
  return payload.list
    .slice(0, top)
    .map((item, index) => {
      const rank = item && item.index ? item.index : index + 1;
      const title = item && item.title ? item.title : "无标题";
      const url = item && item.url ? String(item.url).trim() : HOTBOARD_URL;
      return `${rank}. ${title}${hotValueLabel(item)}\n${url}`;
    })
    .join("\n");
}

function buildPlatformHotboardUrl(type) {
  const safeType = String(type || "").trim();
  const webUrl = safeType ? `${HOTBOARD_WEB_URL}/${encodeURIComponent(safeType)}` : HOTBOARD_WEB_URL;
  return `${HOTBOARD_SAFARI_PREFIX}${webUrl}`;
}

function postNotification(payload, top) {
  const type = payload.type || "unknown";
  const label = labelFor(type);
  const title = `[UAPI热榜] ${label} ${formatUpdateHm(payload.update_time)}`;
  const body = buildNotificationBody(payload, top);
  const openUrl = buildPlatformHotboardUrl(type);

  notify(title, "", body, openUrl);
}

function logHotboard(payload, top) {
  const type = payload.type || "unknown";
  const label = labelFor(type);
  const body = buildLogBody(payload, top);

  console.log(
    [
      `[UAPI热榜]${label} ${formatUpdateTime(payload.update_time)}`,
      body,
      ""
    ].join("\n")
  );
}

async function fetchHotboard(type, authHeader) {
  const url = `${HOTBOARD_URL}?type=${encodeURIComponent(type)}`;
  const { response, data } = await httpGet({
    url,
    headers: buildHeaders(authHeader)
  });

  const status = response && response.status;
  if (status && status >= 400) {
    throw new Error(`${labelFor(type)} 请求失败，HTTP ${status}`);
  }

  let payload;
  try {
    payload = JSON.parse(data);
  } catch (error) {
    throw new Error(`${labelFor(type)} 返回 JSON 解析失败: ${error.message}`);
  }

  if (payload && payload.code && !payload.list) {
    throw new Error(`${labelFor(type)} 接口返回错误: ${payload.message || payload.code}`);
  }

  validatePayload(type, payload);
  return payload;
}

async function run() {
  if (!isQX && !isLoon && !isSurge && !isEgern) {
    throw new Error("仅支持 Loon、Quantumult X、Surge、Egern 运行环境");
  }

  const args = parseArgument(typeof $argument === "undefined" ? "" : $argument);
  const types = normalizeTypes(args.uapi_type);
  const top = normalizeTop(args.uapi_top);
  const authHeader = normalizeAuthHeader(args.uapi_api);
  const summary = [];

  for (const type of types) {
    try {
      const payload = await fetchHotboard(type, authHeader);

      postNotification(payload, top);
      logHotboard(payload, top);
      summary.push(`${labelFor(type)}: 已通知`);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      console.log(`${SCRIPT_ID}: ${message}`);
      notify("UAPI 热榜通知异常", labelFor(type), message);
      summary.push(`${labelFor(type)}: 异常`);
    }
  }

  console.log(`[UAPI热榜]: ${summary.join(" | ")}`);
}

run()
  .catch((error) => {
    const message = error && error.message ? error.message : String(error);
    console.log(`${SCRIPT_ID}: fatal error: ${message}`);
    notify("UAPI 热榜通知异常", "脚本执行失败", message);
  })
  .finally(() => {
    $done({});
  });
