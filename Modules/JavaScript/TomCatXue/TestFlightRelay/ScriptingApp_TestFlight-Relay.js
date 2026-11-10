// ===== 平台适配层：请求 / 永久存储 / 结束执行 =====
// 当前适配 Surge；更换平台只替换本区 API 实现，不放账号、签名或缓存策略。
/** 通用 HTTP：首次调用探测并缓存适配器；GET/POST、Promise、超时（秒）。 */
const http = (() => {
  /** @type {Array<(options:Object, complete:Function) => void>} */
  const adapters = [
    ({ cookies, redirects, ...op }, complete) =>
      $task.fetch({ ...op, opts: { redirection: redirects } }).then(complete, error => complete({ error })),
    ({ method, cookies, redirects, ...op }, complete) =>
      $httpClient[method.toLowerCase()](
        { ...op, "auto-cookie": cookies, "auto-redirect": redirects },
        (error, response, body) => complete({ ...response, error, body })
      ),
  ]
  /** @type {(options:Object, complete:Function) => void} */
  let send = (options, complete) => {
    for (const adapter of adapters) {
      try {
        adapter(options, complete)
        send = adapter
        return
      } catch {}
    }
    throw new Error("No supported HTTP adapter")
  }
  /** @param {string} method @param {Object|string} options @param {number} [timeout] */
  const request = (method, options, timeout = 20) => {
    /** @type {Object} */
    const { timeout: seconds = timeout, ...op } = typeof options === "string" ? { url: options } : options
    const { promise, resolve, reject } = Promise.withResolvers()
    /** @type {ReturnType<typeof setTimeout>} */
    const timer = setTimeout(() => reject(Object.assign(new Error("HTTP timeout"), { code: "HTTP_TIMEOUT" })), seconds * 1000)
    try {
      // 业务层统一秒制；只有 Surge 原生请求使用秒，其他平台使用毫秒。
      send({ ...op, method, timeout: globalThis.$environment?.["surge-version"] ? seconds : seconds * 1000 }, response => {
        if (response.error) return reject(response.error)
        resolve({ status: response.status ?? response.statusCode, headers: response.headers || {}, body: response.body ?? "" })
      })
    } catch (error) {
      reject(error)
    }
    return promise.finally(() => clearTimeout(timer))
  }
  return {
    /** @param {Object|string} options @param {number} [timeout] */
    get: (options, timeout) => request("GET", options, timeout),
    /** @param {Object|string} options @param {number} [timeout] */
    post: (options, timeout) => request("POST", options, timeout),
  }
})()

/** 通用永久存储；保持业务侧现有名称与参数顺序。 */
const storage = {
  /** @param {string} name @returns {*} */
  get: name => (globalThis.$prefs?.valueForKey ?? $persistentStore.read)(name),
  /** @param {string} name @param {*} [alt] @returns {*} */
  readJSON: (name, alt = null) => {
    try {
      return JSON.parse(storage.get(name))
    } catch {
      return alt
    }
  },
  /** @param {string} name @param {*} value @returns {boolean} */
  set: (name, value) =>
    (globalThis.$prefs?.setValueForKey ?? $persistentStore.write)(value, name),
  /** @param {string} name @param {*} value @returns {boolean} */
  writeJSON: (name, value) => storage.set(name, JSON.stringify(value)),
  /** @param {string} name @returns {*} */
  remove: name => {
    if (globalThis.$prefs) return globalThis.$prefs.removeValueForKey(name)
    return storage.set(name, null)
  },
}

/** 原样交付平台执行结果；无参数用于定时任务结束。
 * @param {Object} [result]
 */
const finish = result => {
     if (globalThis.$task && result)  {
         const { response = result } = result
         $done({ ...response, status: `HTTP/1.1 ${response.status} OK` });
     } else {
         $done(result)
     }
}

/** 通用系统通知；通知不可用不妨碍本地错误响应和脚本结束。 */
const notify = (title, message) => {
  try {
    if (globalThis.$notification?.post) $notification.post(title, "", message);
    else if (typeof globalThis.$notify === "function") $notify(title, "", message);
  } catch { console.log("[TF-Relay] notification unavailable"); }
};

// ===== 平台适配层结束 =====

// ===== 常量区 =====
/** @type {{accounts:string,apps:string,details:string,tasks:string}} */
const STORAGE_KEYS = {
  accounts: "tf.accounts",
  apps: "tf.apps",
  details: "tf.details",
  tasks: "tf.tasks",
};
// 常量与类型：仅四个固定集合；revision 不是锁，跨实例无原子保证。
/** @type {Record<string,string>} */
const COLLECTION_BY_KIND = {
  context: STORAGE_KEYS.accounts,
  registry: STORAGE_KEYS.accounts,
  session: STORAGE_KEYS.accounts,
  headers: STORAGE_KEYS.accounts,
  "startup-cache": STORAGE_KEYS.accounts,
  "history-page": STORAGE_KEYS.apps,
  "account-index": STORAGE_KEYS.apps,
  current: STORAGE_KEYS.apps,
  snapshot: STORAGE_KEYS.apps,
  selection: STORAGE_KEYS.apps,
  detail: STORAGE_KEYS.details,
  task: STORAGE_KEYS.tasks,
};
// 接口文档约定的固定摘要后缀，不是账号秘密。
const SESSION_DIGEST_SUFFIX =
  "LWzxL71nAUJTbK9X54DDQU5KC6oTcBFuibEJXIZglPRkhCSmh68PREebiNDZXctOKXpIcOfbnndI2FjMveKfRYOLPfYFRTgua1vg";
// 分类与推送注册成功记录按请求条件复用，不设置时间过期。
/** 账号间详情请求并发上限。 */
const DETAIL_CONCURRENCY = 10;
const POLICY = "v6-single-trigger-full-details";
/** @typedef {Record<string, any>} RequestContext */

// ===== 工具函数区 =====
// 仅记录 catch 错误，不记录认证材料或正文。
/** 只输出脱敏错误摘要，不展开 response、headers 或正文。 @param {*} error */
const logError = error =>
  console.log(
    "[TF-Relay] catch " +
      String(error?.message || error)
        .replace(/https?:\/\/\S+/g, "[URL]")
        .replace(
          /(?:token|cookie|session|authorization)\s*[:=]\s*\S+/gi,
          "[hidden]"
        )
        .slice(0, 500)
  );
// 基础工具：精确 DSID、纯 JS 摘要与兼容字段处理。
/**
 * @param {*} value
 */
const clone = value => JSON.parse(JSON.stringify(value));
/**
 * @param {*} headers
 * @param {*} name
 */
const header = (headers, name) => {
  const found = Object.keys(headers).find(
    item => item.toLowerCase() === name.toLowerCase()
  );
  return found ? String(headers[found]) : "";
};
/**
 * @param {*} headers
 * @param {*} extra
 */
/** @param {Object} headers @returns {string[]} */
const hopHeaders = headers => [
  "connection",
  "transfer-encoding",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
  ...header(headers, "connection")
    .toLowerCase()
    .split(",")
    .map(name => name.trim()),
];
const clean = (headers, extra = []) => {
  const denied = [
    "host",
    "content-length",
    "connection",
    "transfer-encoding",
    "content-encoding",
    ...extra,
  ];
  const result = {};
  for (const name of Object.keys(headers)) {
    if (!denied.includes(name.toLowerCase())) result[name] = headers[name];
  }
  return result;
};
// 解析前识别字符串以外的整数，避免不安全整数 ID 先转成 Number 丢失精度。
/**
 * @param {*} text
 */
const exactParse = text => {
  const tokens = /"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  try {
    return JSON.parse(
      text.replace(tokens, token => {
        if (token[0] === '"' || !/^-?\d+$/.test(token)) return token;
        if (Number.isSafeInteger(Number(token))) return token;
        return JSON.stringify(token);
      })
    );
  } catch (error) {
    logError(new Error("Malformed JSON"));
    throw new Error("Malformed JSON");
  }
};
/**
 * @param {*} value
 */
const dsid = value => {
  if (typeof value === "number" && !Number.isSafeInteger(value))
    throw new Error("Unsafe DSID Number");
  const decimal = String(value);
  if (!/^[1-9][0-9]{0,19}$/.test(decimal)) throw new Error("Invalid DSID");
  if (decimal.length === 20 && decimal > "18446744073709551615")
    throw new Error("DSID exceeds uint64");
  return decimal;
};
// 使用纯 JS 对 UTF-8 计算 SHA-1，不依赖 Node crypto、BigInt 或 JSON.rawJSON。
/** @param {string} text */
const sha1 = text => {
  const bytes = [];
  const utf8 = unescape(encodeURIComponent(text));
  for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
  const length = bytes.length;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const high = Math.floor(length / 0x20000000);
  const low = (length * 8) >>> 0;
  for (const word of [high, low]) {
    for (let shift = 24; shift >= 0; shift -= 8)
      bytes.push((word >>> shift) & 255);
  }
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  /**
   * @param {*} value
   * @param {*} bits
   */
  const rol = (value, bits) => (value << bits) | (value >>> (32 - bits));
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w = [];
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4;
      w[i] =
        (bytes[j] << 24) |
        (bytes[j + 1] << 16) |
        (bytes[j + 2] << 8) |
        bytes[j + 3];
    }
    for (let i = 16; i < 80; i++)
      w[i] = rol(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let [a, b, c, d, e] = h;
    for (let i = 0; i < 80; i++) {
      let f = b ^ c ^ d;
      let k = 0xca62c1d6;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      }
      if (i >= 20 && i < 40) k = 0x6ed9eba1;
      if (i >= 40 && i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      }
      const temp = (rol(a, 5) + f + e + k + w[i]) | 0;
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = temp;
    }
    const values = [a, b, c, d, e];
    for (let i = 0; i < 5; i++) h[i] = (h[i] + values[i]) | 0;
  }
  return h.map(word => (word >>> 0).toString(16).padStart(8, "0")).join("");
};
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, c => {
      const r = Math.floor(Math.random() * 16);
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    })
    .toUpperCase();
/**
 * @param {*} payload
 * @param {*} status
 */
const jsonReply = (payload, status = 200) => ({
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(payload),
});
/** 本地业务错误采用客户端已验证的消息协议；整数码不是 Apple 官方码。
 * @param {number} code @param {string} message @param {number} status
 */
const businessErrorReply = (code, message, status) =>
  jsonReply({ messages: [{ messageType: "ERROR", code, message }] }, status);
/** @param {*} payload @returns {boolean} */
const hasBusinessError = payload =>
  Array.isArray(payload?.messages) &&
  payload.messages.some(message => message?.messageType === "ERROR");
/** 上游 HTTP 200 也可能是业务失败；必须保留其状态和原始正文。
 * @param {*} reply
 */
const requireOK = reply => {
  if (reply.status !== 200)
    throw Object.assign(new Error("Upstream response failure"), {
      response: reply,
    });
  let payload;
  try {
    payload = exactParse(reply.body);
  } catch (error) {
    logError(error);
    throw new Error("Malformed upstream JSON");
  }
  if (hasBusinessError(payload))
    throw Object.assign(new Error("Upstream business failure"), {
      response: reply,
    });
  return payload;
};
/** 对对象键排序，但保留候选优先级等数组顺序，避免对象属性顺序改变验证器。
 * @param {*} value @returns {*}
 */
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(name => [name, canonical(value[name])])
  );
};
/** @param {*} build */
const available = build =>
  !!build &&
  !build.buildRemovalType &&
  Number(build.fileSize) > 0 &&
  (!build.expiration || Date.parse(build.expiration) > Date.now());
/** 只按实际构建判断下架、过期；不按下载、安装或 previouslyTested 标记排除。
 * 共用于索引展示与本批详情筛选，多个账号先筛有效来源再按 appId 去重。
 * @param {*} detail @returns {boolean}
 */
const validDetail = detail =>
  !!detail &&
  detail.previouslyTested !== true &&
  Array.isArray(detail.platforms) &&
  detail.platforms.some(platform => available(platform.build));
/** 仅同官方 etag 的详情能作为已知状态；旧版本缓存不能排除变化条目。
 * @param {*} cache @param {*} etag @returns {boolean}
 */
/** 仅比较仍可用的真实构建，不把 etag 抖动或下架当作新版本。 @param {*} detail */
const buildVersionSignature = detail =>
  JSON.stringify(
    (detail?.platforms || [])
      .filter(platform => available(platform.build))
      .map(platform => [
        platform.name,
        String(platform.build.id),
        platform.build.cfBundleShortVersion,
        platform.build.cfBundleVersion,
      ])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  );

const matchingDetail = (cache, etag) =>
  !!cache &&
  etag !== null &&
  JSON.stringify(cache.upstreamEtag) === JSON.stringify(etag);
/**
 * @param {*} build
 */
const patchBuild = build => {
  if (!available(build)) return;
  for (const name of [
    "compatible",
    "platformCompatible",
    "hardwareCompatible",
    "osCompatible",
  ]) {
    if (build[name] === false) build[name] = true;
  }
};
/**
 * @param {*} detail
 */
const patchDetail = detail => {
  const result = clone(detail);
  if (detail.previouslyTested === true) return result;
  for (const platform of result.platforms || []) {
    if (platform.build) patchBuild(platform.build);
  }
  return result;
};

// ===== 持久化：四集合与快照回收 =====
/**
 * @param {*} parts
 */
const key = (...parts) => JSON.stringify(parts);
/**
 * @param {*} logicalKey
 */
const bucketFor = logicalKey => {
  const name = COLLECTION_BY_KIND[JSON.parse(logicalKey)[0]];
  if (!name) throw new Error("Unknown logical record category");
  return name;
};
/**
 * @param {*} name
 */
const collection = name => {
  const raw = storage.readJSON(name);
  if (!raw) return { schema: 4, revision: 0, records: {} };
  if (
    raw.schema !== 4 ||
    !Number.isSafeInteger(raw.revision) ||
    !raw.records ||
    typeof raw.records !== "object" ||
    Array.isArray(raw.records)
  )
    throw new Error("Invalid collection");
  return raw;
};
/**
 * @param {*} logicalKey
 */
const read = logicalKey => {
  const records = collection(bucketFor(logicalKey)).records;
  return Object.prototype.hasOwnProperty.call(records, logicalKey)
    ? records[logicalKey]
    : null;
};
/**
 * @param {*} logicalKey
 * @param {*} value
 */
const save = (logicalKey, value) => {
  if (value === null)
    return mergeRecords(bucketFor(logicalKey), {}, [logicalKey]);
  return mergeRecords(bucketFor(logicalKey), { [logicalKey]: value });
};
/** 批量修改前重新读取集合；同步合并后只序列化一次，不代表跨实例原子操作。
 * @param {string} name @param {Object} updates @param {string[]} removals
 * @returns {Object}
 */
const mergeRecords = (name, updates = {}, removals = []) => {
  const latest = collection(name);
  let changed = false;
  for (const logicalKey of removals) {
    if (!Object.prototype.hasOwnProperty.call(latest.records, logicalKey))
      continue;
    delete latest.records[logicalKey];
    changed = true;
  }
  for (const [logicalKey, value] of Object.entries(updates)) {
    if (JSON.stringify(latest.records[logicalKey]) === JSON.stringify(value))
      continue;
    latest.records[logicalKey] = value;
    changed = true;
  }
  if (!changed) return latest.records;
  latest.revision++;
  if (!storage.writeJSON(name, latest))
    throw new Error("Collection write failed");
  return latest.records;
};
const pruneSnapshots = () => {
  const apps = collection(STORAGE_KEYS.apps);
  const tasks = collection(STORAGE_KEYS.tasks);
  const retained = new Set();
  for (const [logicalKey, value] of Object.entries(apps.records)) {
    const parts = JSON.parse(logicalKey);
    if (parts[0] === "current") retained.add(key("snapshot", parts[1], value));
  }
  for (const [logicalKey, task] of Object.entries(tasks.records)) {
    const parts = JSON.parse(logicalKey);
    retained.add(key("snapshot", parts[1], task.snapshot));
  }
  let changed = false;
  for (const logicalKey of Object.keys(apps.records)) {
    if (JSON.parse(logicalKey)[0] !== "snapshot" || retained.has(logicalKey))
      continue;
    delete apps.records[logicalKey];
    changed = true;
  }
  if (!changed) return;
  apps.revision++;
  if (!storage.writeJSON(STORAGE_KEYS.apps, apps))
    throw new Error("Snapshot pruning failed");
};

// ===== 网络业务：认证、签名与会话恢复 =====
/** 透明转发不读账号、不解析正文、不重签；保留业务头。 */
const requestAuthentication = async (url, timeout = 20) => {
  const headers = Object.fromEntries(
    Object.entries($request.headers).filter(
      ([name]) =>
        !["host", "content-length", ...hopHeaders($request.headers)].includes(
          name.toLowerCase()
        )
    )
  );
  const reply = await http[$request.method.toLowerCase()]({
    url: "https://testflight.apple.com" + url.pathname + url.search,
    headers,
    body: $request.body,
    cookies: false,
    redirects: false,
    timeout,
  });
  reply.headers = clean(reply.headers, hopHeaders(reply.headers));
  return reply;
};
// ===== 实现代码区 =====
// 账号摘要与请求、认证登记、目录 diff、详情缓存及安装归属。
/** @param {RequestContext} req @param {*} ctx @param {boolean} session */
const headersFor = (req, ctx, session) => {
  const headers = {
    ...accountPublicHeaders(req, ctx),
    "X-Apple-Store-Front": ctx.storeFrontIdentifier,
    ...(!header(accountPublicHeaders(req, ctx), "X-Apple-AMD-M") && ctx.loginAMD?.machine ? { "X-Apple-AMD-M": ctx.loginAMD.machine } : {}),
  };
  if (!session || !ctx.sessionId) return headers;
  const requestId = uuid();
  headers["X-Session-Id"] = ctx.sessionId;
  headers["X-Request-Id"] = requestId;
  headers["X-Session-Digest"] = sha1(
    ctx.sessionId + requestId + dsid(ctx.dsId) + SESSION_DIGEST_SUFFIX
  );
  return headers;
};
/**
 * @param {RequestContext} req
 * @param {*} ctx
 * @param {*} requestPath
 * @param {*} verb
 * @param {*} requestBody
 * @param {*} session
 */
const send = async (
  req,
  ctx,
  requestPath,
  verb,
  requestBody,
  session = true,
  extraHeaders = {}
) => {
  const reply = await http[verb.toLowerCase()]({
    url: "https://testflight.apple.com" + requestPath,
    headers: {
      ...clean(headersFor(req, ctx, session), [
        "if-none-match",
        "if-modified-since",
        "etag",
      ]),
      ...extraHeaders,
    },
    body: requestBody,
    cookies: false,
    redirects: false,
    timeout: req.config.timeout || 20,
  });
  reply.headers = clean(reply.headers);
  if (reply.status === 200 && reply.body) {
    let payload;
    try {
      payload = exactParse(reply.body);
    } catch (error) {
      logError(error);
      /* 非 JSON 正文仍交具体接口处理。 */
    }
    if (hasBusinessError(payload))
      throw Object.assign(new Error("Upstream business failure"), {
        response: reply,
      });
  }
  return reply;
};
/** @param {*} source */
const authMaterials = source => ({
  storeFrontIdentifier: source.storeFrontIdentifier,
  deviceModel: source.deviceModel,
  deviceName: source.deviceName,
  deviceVendorId: source.deviceVendorId,
  storeCookies: source.storeCookies,
});
/** @param {*} payload */
const usableAuth = payload =>
  !hasBusinessError(payload) &&
  !!payload?.data?.accountId &&
  !!payload.data.sessionId &&
  payload.data.hasNewTermsAndConditions !== true;
/**
 * @param {RequestContext} req
 * @param {*} ctx
 */
const performRecovery = async (req, ctx) => {
  assertCurrentAccount(ctx);
  const expectedVersion = ctx.version;
  const rest = authMaterials(ctx);
  const encoded =
    '{"dsId":' + dsid(ctx.dsId) + "," + JSON.stringify(rest).slice(1);
  // 会话恢复按客户端协议选择，不能套用当前业务接口的 v 数字。
  const response = await send(
    req,
    ctx,
    clientInterfacePath(req, "authenticate"),
    "POST",
    encoded,
    false
  );
  const payload = clientResponse(req, "authenticate", response);
  if (!usableAuth(payload))
    throw new Error("Authentication identity/terms validation failed");
  if (ctx.accountId && ctx.accountId !== String(payload.data.accountId))
    throw new Error("Authentication account mismatch");
  assertCurrentAccount({ ...ctx, version: expectedVersion });
  ctx.accountId = String(payload.data.accountId);
  ctx.sessionId = String(payload.data.sessionId);
  ctx.authResponse = response;
  ctx.version = (ctx.version || 0) + 1;
  commitAccountContext(ctx);
};
/**
 * @param {RequestContext} req
 * @param {*} ctx
 */
const recover = (req, ctx) => {
  const pending = req.recoveries[ctx.ownerAccountKey];
  if (pending) return pending;
  req.recoveries[ctx.ownerAccountKey] = performRecovery(req, ctx)
    .catch(error => {
      logError(error);
      delete ctx.authResponse;
      invalidateCurrentAccount(ctx);
      throw error;
    })
    .finally(() => {
      delete req.recoveries[ctx.ownerAccountKey];
    });
  return req.recoveries[ctx.ownerAccountKey];
};
/**
 * @param {RequestContext} req
 * @param {*} ctx
 * @param {*} route
 * @param {*} verb
 * @param {*} requestBody
 */
const business = async (
  req,
  ctx,
  route,
  verb,
  requestBody,
  extraHeaders = {}
) => {
  if (!ctx.sessionId || !ctx.accountId) await recover(req, ctx);
  assertCurrentAccount(ctx);
  const version = ctx.version;
  let response = await send(
    req,
    ctx,
    route(ctx.accountId),
    verb,
    requestBody,
    true,
    extraHeaders
  );
  if (response.status !== 401) return response;
  const latest = latestAccountContexts().find(value => value.dsId === ctx.dsId);
  if (!latest || latest.ownerAccountKey !== ctx.ownerAccountKey) throw accountChanged();
  if (latest && latest.version > version) Object.assign(ctx, latest);
  else await recover(req, ctx);
  response = await send(
    req,
    ctx,
    route(ctx.accountId),
    verb,
    requestBody,
    true,
    extraHeaders
  );
  if (response.status === 401) {
    delete ctx.authResponse;
    invalidateCurrentAccount(ctx);
  }
  return response;
};
/**
 * @param {*} accountId
 * @param {*} suffix
 * @param {*} version
 */
const accountRoute = (accountId, suffix, version) =>
  "/" + version + "/accounts/" + encodeURIComponent(accountId) + "/" + suffix;
/**
 * @param {RequestContext} req
 */
const handleAuthenticate = async req => {
  const { url, config } = req;
  // 只复用同设备、精确 DSID 的真实认证结果；新入站材料仍要保存。
  try {
    const body = exactParse($request.body || "");
    const device = String(body.deviceVendorId || "");
    if (
      device &&
      body.storeFrontIdentifier &&
      body.storeCookies &&
      typeof body.storeCookies === "object" &&
      !Array.isArray(body.storeCookies)
    ) {
      const identity = dsid(body.dsId);
      const owner = JSON.stringify([device, identity]);
      const logicalKey = key("context", device, owner);
      const cached = read(logicalKey);
      const response = cached?.authResponse;
      const payload =
        response?.status === 200 ? exactParse(response.body) : null;
      if (
        cached?.accountId &&
        cached.sessionId &&
        usableAuth(payload) &&
        String(payload.data.accountId) === cached.accountId &&
        String(payload.data.sessionId) === cached.sessionId
      ) {
        const existing = read(key("session", cached.sessionId));
        if (
          !existing ||
          (existing.device === device && existing.owner === owner)
        ) {
          Object.assign(cached, authMaterials(body));
          commitAccountContext(cached, importDeviceHeaders(device, $request.headers));
          return response;
        }
      }
    }
  } catch (error) {
    logError(error);
    // 缓存不可用时走真实认证。
  }
  const response = await requestAuthentication(url, config.timeout || 20);
  if (response.status !== 200) return response;
  // 账号登记尽力完成；校验失败、待处理条款、解析或存储失败均保留 Apple 原响应。
  try {
    const requestBody = exactParse($request.body || "");
    const payload = clientResponse(req, "authenticate", response);
    if (hasBusinessError(payload)) return response;
    const device = String(requestBody.deviceVendorId || "");
    if (
      !device ||
      !requestBody.storeCookies ||
      typeof requestBody.storeCookies !== "object" ||
      Array.isArray(requestBody.storeCookies) ||
      !requestBody.storeFrontIdentifier
    )
      return response;
    if (!usableAuth(payload)) return response;
    const identity = dsid(requestBody.dsId);
    const owner = JSON.stringify([device, identity]);
    const contextKey = key("context", device, owner);
    const previous = read(contextKey);
    if (
      previous?.accountId &&
      previous.accountId !== String(payload.data.accountId)
    )
      return response;
    const sessionId = String(payload.data.sessionId);
    const existing = read(key("session", sessionId));
    if (existing && (existing.device !== device || existing.owner !== owner))
      return response;
    const captured = {
      ownerAccountKey: owner,
      dsId: identity,
      ...authMaterials(requestBody),
      accountId: String(payload.data.accountId),
      sessionId,
      authResponse: response,
      version: (previous?.version || 0) + 1,
    };
    commitAccountContext(captured, importDeviceHeaders(device, $request.headers));
  } catch (error) {
    logError(error);
    /* 登记失败仍返回 Apple 原响应。 */
  }
  return response;
};

// ===== 目录：账号索引 diff、详情补齐与合并快照 =====
/**
 * @param {RequestContext} req
 */
/** GET 专用刷新：按 owner+DSID+App 隔离，仅拉缺失或 etag 变化项；无 etag 每轮重取。
 * @param {RequestContext} req @param {Object} indexes @returns {Promise<Object>}
 */
const refreshAccountDetails = async (req, indexes) => {
  const cached = collection(STORAGE_KEYS.details).records;
  const groups = {};
  for (const owner of req.orderedOwners) {
    for (const item of indexes[owner].items) {
      const id = String(item.appId);
      const logicalKey = key(
        "detail",
        accountDevice(owner),
        owner,
        req.contexts[owner].dsId,
        id
      );
      if (matchingDetail(cached[logicalKey], indexes[owner].etags[id]))
        continue;
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push({ id, appId: item.appId, logicalKey });
    }
  }
  const updates = {};
  const owners = Object.keys(groups);
  // 每个账号的详情缺口一次请求，不人为按 ID 数量拆分。
  const batches = owners.map(owner => ({ owner, entries: groups[owner] }));
  for (let offset = 0; offset < batches.length; offset += DETAIL_CONCURRENCY) {
    const results = await Promise.all(
      batches
        .slice(offset, offset + DETAIL_CONCURRENCY)
        .map(async ({ owner, entries }) => {
          try {
            const reply = await business(
              req,
              req.contexts[owner],
              id => clientInterfacePath(req, "appDetails", id),
              "POST",
              JSON.stringify({
                apps: entries.map(entry => ({ appId: entry.appId })),
              })
            );
            const payload = clientResponse(req, "appDetails", reply);
            if (!Array.isArray(payload.data))
              throw new Error("Missing detail array");
            const requested = new Set(entries.map(entry => entry.id));
            const received = {};
            for (const detail of payload.data) {
              const id = String(detail.appAdamId);
              if (
                !requested.has(id) ||
                received[id] ||
                !Array.isArray(detail.platforms)
              )
                throw new Error("Invalid detail coverage");
              received[id] = detail;
            }
            if (entries.some(entry => !received[entry.id]))
              throw new Error("Incomplete detail coverage");
            return { owner, entries, received };
          } catch (error) {
            logError(error);
            return { error };
          }
        })
    );
    const failure = results.find(result => result.error);
    if (failure) throw failure.error;
    for (const result of results) {
      for (const entry of result.entries) {
        const previous = cached[entry.logicalKey];
        const detail = result.received[entry.id];
        const changed =
          previous?.detail &&
          validDetail(detail) &&
          buildVersionSignature(previous.detail) !==
            buildVersionSignature(detail);
        updates[entry.logicalKey] = {
          upstreamEtag: indexes[result.owner].etags[entry.id],
          indexVersion: indexes[result.owner].version,
          detail,
          buildChangedAt: changed ? Date.now() : previous?.buildChangedAt || 0,
        };
      }
    }
  }
  const accounts = collection(STORAGE_KEYS.accounts).records;
  for (const owner of req.orderedOwners) {
    if (accounts[accountRecordKey("context", owner)]?.dsId !== req.contexts[owner].dsId)
      throw new Error("Account changed during refresh");
  }
  return updates;
};
const handleIndex = async req => {
  const { device, incomingOwner, orderedOwners, contexts } = req;
  const candidates = {};
  const index = {};
  let envelope = {};
  const catalogs = {};
  const upstreamIndexes = {};
  // 每批最多五个账号并发；失败时也等待本批全部结束，避免 $done 后仍有工作。
  for (let offset = 0; offset < orderedOwners.length; offset += 5) {
    const results = await Promise.all(
      orderedOwners.slice(offset, offset + 5).map(async owner => {
        try {
          const ctx = contexts[owner];
          const previous = read(accountRecordKey("account-index", owner));
          const requestContext = {
            version: clientInterfaces(req).apps.version,
            accountId: ctx.accountId,
          };
          const complete =
            previous &&
            Array.isArray(previous.items) &&
            previous.etags &&
            previous.version &&
            Array.isArray(previous.envelope?.data?.apps) &&
            !hasBusinessError(previous.envelope) &&
            JSON.stringify(previous.requestContext) ===
              JSON.stringify(requestContext) &&
            JSON.stringify(canonical(previous.items)) ===
              JSON.stringify(canonical(previous.envelope.data.apps)) &&
            Object.keys(previous.etags).length === previous.items.length &&
            new Set(previous.items.map(item => String(item?.appId))).size ===
              previous.items.length &&
            previous.items.every(
              item =>
                item &&
                /^[1-9][0-9]*$/.test(String(item.appId)) &&
                Object.prototype.hasOwnProperty.call(
                  previous.etags,
                  String(item.appId)
                ) &&
                JSON.stringify(previous.etags[String(item.appId)]) ===
                  JSON.stringify(item.etag === undefined ? null : item.etag)
            );
          const conditional = !!(complete && previous.upstreamHttpEtag);
          const extraHeaders = conditional
            ? { "If-None-Match": previous.upstreamHttpEtag }
            : {};
          let response = await business(
            req,
            ctx,
            id => clientInterfacePath(req, "apps", id),
            "GET",
            undefined,
            extraHeaders
          );
          if (response.status === 304 && !complete) {
            // 缺完整原始目录时不能把 304 当空目录；只无条件重试一次。
            response = await business(
              req,
              ctx,
              id => clientInterfacePath(req, "apps", id),
              "GET"
            );
            if (response.status === 304)
              throw new Error("Unexpected 304 without cached index");
          }
          const reused = response.status === 304;
          const payload = reused
            ? clone(previous.envelope)
            : clientResponse(req, "apps", response);
          if (!Array.isArray(payload.data?.apps)) {
            // 只记录类型，不输出账号 ID、任意字段名或 Apple 响应正文。
            const type = value => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
            throw Object.assign(new Error(
              "Index response missing apps array; version=" + req.version +
              " status=" + response.status + " reused=" + reused +
              " payload=" + type(payload) + " data=" + type(payload?.data) +
              " apps=" + type(payload?.data?.apps)
            ), { response: businessErrorReply(900009, "上游应用列表格式异常，本次未更新缓存", 502) });
          }
          return {
            owner,
            payload,
            upstreamHttpEtag: reused
              ? header(response.headers, "etag") ||
                previous.upstreamHttpEtag ||
                null
              : header(response.headers, "etag") || null,
            requestContext: { version: clientInterfaces(req).apps.version, accountId: ctx.accountId },
          };
        } catch (error) {
          logError(error);
          return { owner, error };
        }
      })
    );
    const failure = results.find(result => result.error !== undefined);
    if (failure) throw failure.error;
    for (const result of results) {
      catalogs[result.owner] = result.payload;
      upstreamIndexes[result.owner] = result;
    }
  }
  const baselineIndexes = collection(STORAGE_KEYS.apps).records;
  const nextIndexes = {};
  const invalidations = [];
  // 全部账号与 ID 验证完成后才失效缓存、提交索引；索引刷新不得与详情重叠。
  for (const owner of orderedOwners) {
    const indexKey = accountRecordKey("account-index", owner);
    const previous = baselineIndexes[indexKey];
    const etags = Object.create(null);
    const items = catalogs[owner].data.apps;
    for (const item of items) {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw new Error("Invalid index item");
      if (typeof item.appId !== "string" && typeof item.appId !== "number")
        throw new Error("Invalid index appId type");
      const id = String(item.appId);
      if (
        !/^[1-9][0-9]*$/.test(id) ||
        (typeof item.appId === "number" && !Number.isSafeInteger(item.appId))
      )
        throw new Error("Invalid index appId");
      if (Object.prototype.hasOwnProperty.call(etags, id))
        throw new Error("Duplicate index appId");
      etags[id] = item.etag === undefined ? null : item.etag;
    }
    const oldEtags = previous?.etags || {};
    for (const id of Object.keys(etags)) {
      if (!Object.prototype.hasOwnProperty.call(oldEtags, id)) continue;
      if (JSON.stringify(oldEtags[id]) === JSON.stringify(etags[id])) continue;
      const detailKey = accountRecordKey("detail", owner, contexts[owner].dsId, id);
      invalidations.push(detailKey);
    }
    for (const id of Object.keys(oldEtags)) {
      if (Object.prototype.hasOwnProperty.call(etags, id)) continue;
      invalidations.push(
        accountRecordKey("detail", owner, contexts[owner].dsId, id)
      );
    }
    const version = sha1(
      JSON.stringify(
        canonical(
          items
            .slice()
            .sort((a, b) => String(a.appId).localeCompare(String(b.appId)))
        )
      )
    );
    nextIndexes[owner] = {
      version,
      items: clone(items),
      etags,
      upstreamHttpEtag: upstreamIndexes[owner].upstreamHttpEtag,
      envelope: clone(catalogs[owner]),
      requestContext: upstreamIndexes[owner].requestContext,
    };
  }
  // 网络与覆盖校验全部成功后提交；多集合不是事务，不能承诺跨实例原子性。
  const pendingDetails = await refreshAccountDetails(req, nextIndexes);
  const latestIndexes = collection(STORAGE_KEYS.apps).records;
  for (const owner of orderedOwners) {
    const logicalKey = accountRecordKey("account-index", owner);
    if (
      JSON.stringify(latestIndexes[logicalKey] || null) !==
      JSON.stringify(baselineIndexes[logicalKey] || null)
    )
      throw Object.assign(new Error("Index changed during GET"), {
        response: businessErrorReply(900003, "目录刷新发生竞争，请重试", 409),
      });
  }
  if (invalidations.length || Object.keys(pendingDetails).length)
    mergeRecords(STORAGE_KEYS.details, pendingDetails, invalidations);
  const indexUpdates = {};
  const refreshedAt = new Date().toISOString();
  const refreshedDetails = collection(STORAGE_KEYS.details).records;
  for (const owner of orderedOwners)
    indexUpdates[accountRecordKey("account-index", owner)] = { ...nextIndexes[owner], ...accountAppStatus(contexts[owner], nextIndexes[owner], refreshedDetails, Date.parse(refreshedAt)), updatedAt: refreshedAt };
  mergeRecords(STORAGE_KEYS.apps, indexUpdates);
  if (req.controlRefresh) return jsonReply(catalogs[incomingOwner]);
  for (const owner of orderedOwners) {
    const payload = catalogs[owner];
    if (owner === incomingOwner) envelope = clone(payload);
    for (const item of payload.data.apps) {
      const id = String(item.appId);
      if (!candidates[id]) candidates[id] = [];
      candidates[id].push({
        owner,
        item: clone(item),
        etag: item.etag === undefined ? null : item.etag,
      });
      if (!index[id]) index[id] = clone(item);
    }
  }
  // 内部保留完整索引，历史和下架状态交给客户端归类。
  for (const id of Object.keys(index)) {
    index[id].etag =
      "local-" + sha1(JSON.stringify(canonical([POLICY, candidates[id]])));
  }
  const rows = Object.keys(index)
    .sort()
    .map(id => index[id]);
  const accountVersions = {};
  for (const owner of orderedOwners)
    accountVersions[owner] = nextIndexes[owner].version;
  const snapshotId = sha1(
    JSON.stringify(
      canonical([POLICY, device, rows, candidates, accountVersions])
    )
  );
  envelope.data.apps = rows;
  const snapshot = {
    id: snapshotId,
    device,
    candidates,
    index,
    envelope,
    accountVersions,
  };
  // 先保存不可变快照，再发布当前指针；这里不提供跨实例锁。
  const snapshotKey = key("snapshot", device, snapshotId);

  if (!read(snapshotKey)) save(snapshotKey, snapshot);
  save(key("current", device, incomingOwner), snapshotId);
  pruneSnapshots();
  // 客户端固定 200 单项触发；完整快照供后续 POST 返回全部详情。
  // 快照保留完整目录；只有客户端响应使用一个真实索引项触发详情请求。
  const cached = collection(STORAGE_KEYS.details).records;
  let trigger = null;
  for (const row of rows) {
    const id = String(row.appId);
    const selected = candidates[id].find(candidate =>
      validDetail(
        cached[
          key(
            "detail",
            accountDevice(candidate.owner),
            candidate.owner,
            contexts[candidate.owner].dsId,
            id
          )
        ]?.detail
      )
    );
    if (!selected) continue;
    trigger = clone(selected.item);
    break;
  }
  if (!trigger && rows.length) trigger = clone(rows[0]);
  if (trigger) delete trigger.etag;
  const clientEnvelope = clone(envelope);
  clientEnvelope.data.apps = trigger ? [trigger] : [];
  const reply = jsonReply(clientEnvelope);
  reply.headers.ETag = JSON.stringify("local-" + snapshotId);
  return reply;
};

// ===== 客户端详情：本地完整交付与来源选择 =====
/**
 * @param {RequestContext} req
 */
const handleDetails = req => {
  const { device, incomingOwner, contexts, body, snapshot } = req;
  if (!snapshot?.candidates)
    throw new Error("No candidate snapshot; refresh index first");
  if (!Array.isArray(body.apps))
    throw new Error("appDetails requires apps array");
  const ids = Object.keys(snapshot.candidates).sort();
  const cached = collection(STORAGE_KEYS.details).records;
  const details = {};
  const involved = new Set();
  for (const id of ids) {
    if (!snapshot.candidates[id]?.length)
      throw new Error("Requested app has no candidates");
    for (const candidate of snapshot.candidates[id]) {
      const { owner, etag } = candidate;
      if (!contexts[owner]) throw new Error("Candidate owner missing");
      involved.add(owner);
      const logicalKey = accountRecordKey("detail", owner, contexts[owner].dsId, id);
      const cache = cached[logicalKey];
      // 以官方单项 etag 判断详情是否变化，不设置时间刷新期限。
      if (
        matchingDetail(cache, etag) ||
        (cache &&
          etag === null &&
          cache.upstreamEtag === null &&
          cache.indexVersion === snapshot.accountVersions[owner])
      ) {
        details[logicalKey] = cache.detail;
        continue;
      }
      throw Object.assign(new Error("GET refresh required"), {
        response: businessErrorReply(
          900007,
          "详情缺失或变化，请先刷新应用索引",
          409
        ),
      });
    }
  }
  const envelope = { data: [], error: null };
  // POST 不做网络请求，仍校验当前快照及各账号索引版本。
  const apps = collection(STORAGE_KEYS.apps).records;
  const accounts = collection(STORAGE_KEYS.accounts).records;
  if (apps[key("current", device, incomingOwner)] !== snapshot.id)
    throw Object.assign(new Error("Snapshot changed"), {
      response: businessErrorReply(900003, "应用目录已更新，请刷新后重试", 409),
    });
  for (const owner of involved) {
    const liveIndex = apps[accountRecordKey("account-index", owner)];
    const liveContext = accounts[accountRecordKey("context", owner)];
    const valid =
      liveIndex &&
      liveContext &&
      liveContext.dsId === contexts[owner].dsId &&
      liveIndex.version === snapshot.accountVersions[owner] &&
      ids.every(id =>
        snapshot.candidates[id]
          .filter(candidate => candidate.owner === owner)
          .every(
            candidate =>
              Object.prototype.hasOwnProperty.call(liveIndex.etags, id) &&
              JSON.stringify(liveIndex.etags[id]) ===
                JSON.stringify(candidate.etag)
          )
      );
    if (!valid)
      throw Object.assign(new Error("Index changed"), {
        response: businessErrorReply(
          900003,
          "应用目录已更新，请刷新后重试",
          409
        ),
      });
  }
  const selections = {};
  const removals = [];
  const output = [];
  for (const id of ids) {
    const selectionKey = key("selection", device, incomingOwner, id);
    const selected = snapshot.candidates[id].find(candidate => {
      const detail =
        details[
          key(
            "detail",
            accountDevice(candidate.owner),
            candidate.owner,
            contexts[candidate.owner].dsId,
            id
          )
        ];
      return validDetail(detail);
    });
    if (!selected) {
      removals.push(selectionKey);
      const original = snapshot.candidates[id]
        .map(
          candidate =>
            details[
              key(
                "detail",
                accountDevice(candidate.owner),
                candidate.owner,
                contexts[candidate.owner].dsId,
                id
              )
            ]
        )
        .find(Boolean);
      if (original) output.push(clone(original));
      continue;
    }
    selections[selectionKey] = {
      owner: selected.owner,
      dsId: contexts[selected.owner].dsId,
      snapshot: snapshot.id,
      version: snapshot.accountVersions[selected.owner],
    };
    output.push(
      patchDetail(
        details[
          key(
            "detail",
            accountDevice(selected.owner),
            selected.owner,
            contexts[selected.owner].dsId,
            id
          )
        ]
      )
    );
  }
  // 原始缓存不改；有效响应副本可补兼容字段。选择记录按最新集合差量提交，无 CAS 保证。
  if (ids.length) mergeRecords(STORAGE_KEYS.apps, selections, removals);
  // 只对实际输出选中的来源排序；同优先级维持原 App ID 顺序。
  const priority = detail => {
    const id = String(detail.appAdamId);
    const selected = selections[key("selection", device, incomingOwner, id)];
    if (!selected) return 0;
    return (
      cached[
        accountRecordKey("detail", selected.owner, contexts[selected.owner].dsId, id)
      ]?.buildChangedAt || 0
    );
  };
  output.sort((a, b) => priority(b) - priority(a));
  envelope.data = output;
  return jsonReply(envelope);
};

/** 历史版本跟随当前详情选择的来源账号；不创建安装任务。 @param {RequestContext} req */
const handleTrains = async req => {
  const match = req.path.match(
    /^\/v\d+\/accounts\/[^/]+\/apps\/([^/]+)\/platforms\/([^/]+)\/trains(?:\/([^/]+)\/builds)?$/
  );
  const appId = decodeURIComponent(match[1]);
  const platform = decodeURIComponent(match[2]);
  const selection = read(
    key("selection", req.device, req.incomingOwner, appId)
  );
  const owner = selection?.owner;
  const ctx = req.contexts[owner];
  const liveIndex = owner
    ? read(accountRecordKey("account-index", owner))
    : null;
  if (
    !ctx ||
    !req.snapshot ||
    selection.snapshot !== req.snapshot.id ||
    selection.dsId !== ctx.dsId ||
    selection.version !== liveIndex?.version ||
    selection.version !== req.snapshot.accountVersions[owner]
  )
    throw Object.assign(new Error("History requires current selection"), {
      response: businessErrorReply(
        900003,
        "应用目录已更新或缺少来源账号，请刷新后重试",
        409
      ),
    });
  const suffix =
    "apps/" +
    encodeURIComponent(appId) +
    "/platforms/" +
    encodeURIComponent(platform) +
    "/trains" +
    (match[3] ? "/" + match[3] + "/builds" : "");
  const pageKey = key(
    "history-page",
    req.device,
    req.incomingOwner,
    req.version,
    appId,
    platform,
    match[3] || ""
  );
  // 仅对 Apple 返回过的完整 Query 绑定来源；不解析或重编码游标。
  if (match[3] && req.url.search) {
    const pinned = read(key("history-page", pageKey, req.url.search));
    if (
      pinned &&
      (pinned.owner !== owner || pinned.version !== selection.version)
    )
      throw Object.assign(new Error("History page owner changed"), {
        response: businessErrorReply(
          900003,
          "历史版本来源已变化，请重新打开版本列表",
          409
        ),
      });
  }
  const reply = await business(
    req,
    ctx,
    id => clientInterfacePath(req, req.operation, id, suffix) + req.url.search,
    "GET"
  );
  if (reply.status !== 200) return reply;
  const payload = clientResponse(req, req.operation, reply);
  if (!Array.isArray(payload.data))
    throw new Error("History response missing array");
  if (match[3]) {
    for (const build of payload.data) patchBuild(build);
    reply.body = JSON.stringify(payload);
  }
  const link = header(reply.headers, "link");
  if (!link) return reply;
  const expectedPath = clientInterfacePath(req, req.operation, ctx.accountId, suffix);
  const incomingAccount = req.path.split("/")[3];
  const clientPath =
    "/" + req.version + "/accounts/" + incomingAccount + "/" + suffix;
  const rewritten = link.replace(/<([^>]+)>/g, (_whole, target) => {
    const url = new URL(target, "https://testflight.apple.com" + expectedPath);
    if (
      url.origin !== "https://testflight.apple.com" ||
      url.pathname !== expectedPath
    )
      throw new Error("Unexpected history pagination URL");
    save(key("history-page", pageKey, url.search), {
      owner,
      version: selection.version,
    });
    return "<" + req.url.origin + clientPath + url.search + ">";
  });
  for (const name of Object.keys(reply.headers)) {
    if (name.toLowerCase() === "link") delete reply.headers[name];
  }
  reply.headers.Link = rewritten;
  return reply;
};

// ===== 构建与安装：固定任务归属，转交真实授权 =====
/**
 * @param {RequestContext} req
 */
const handleInstallation = async req => {
  const {
    device,
    incomingOwner,
    contexts,
    body,
    path,
    method,
    url,
    snapshot,
    buildMatch,
    statusMatch,
  } = req;
  const match = buildMatch || statusMatch;
  const appId = decodeURIComponent(match[1]);
  const buildId = decodeURIComponent(match[2]);
  const taskKey = key("task", device, incomingOwner, appId, buildId);
  let task = read(taskKey);
  if (!task && statusMatch)
    throw new Error("Install status has no pinned task");
  if (!task) {
    const selection = read(key("selection", device, incomingOwner, appId));
    const owner = selection?.owner;
    const liveIndex = owner ? read(accountRecordKey("account-index", owner)) : null;
    if (
      !snapshot ||
      !selection ||
      selection.snapshot !== snapshot.id ||
      !liveIndex ||
      selection.version !== liveIndex.version ||
      selection.version !== snapshot.accountVersions[owner] ||
      !contexts[owner] ||
      contexts[owner].dsId !== selection.dsId
    )
      throw new Error("Build requires current validated selection");
    task = {
      snapshot: snapshot.id,
      appId,
      buildId,
      owner,
      dsId: contexts[owner].dsId,
      incomingOwner,
    };

    save(taskKey, task);
  }
  const ctx = contexts[task.owner];
  if (!ctx || ctx.dsId !== task.dsId || task.incomingOwner !== incomingOwner)
    throw Object.assign(new Error("Relay response failure"), {
      response: businessErrorReply(
        900004,
        "安装任务所属账号不可用，请重新选择构建",
        409
      ),
    });
  let requestBody = $request.body;
  if (buildMatch?.[3]) {
    if (typeof body.udid !== "string" || !body.udid)
      throw Object.assign(new Error("Install device identifier missing"), {
        response: businessErrorReply(900005, "安装请求缺少当前设备标识", 409),
      });
    // 设备材料沿用本次入站；账号路径、会话、摘要和商店仍属于任务 owner。
    const installBody = {
      ...body,
      storefrontId: ctx.storeFrontIdentifier,
      deviceName: ctx.deviceName,
    };
    // 同账号旧会话也可能已被新设备覆盖；按目标上下文选密钥，不能只替换会话头。
    if (ctx.kbSync) {
      installBody.kbSync = ctx.kbSync;
      const guid = ctx.deviceGuid || ctx.loginGuid;
      if (guid) installBody.deviceGuid = guid;
      else delete installBody.deviceGuid;
    } else if (task.owner !== incomingOwner || header($request.headers, "X-Session-Id") !== ctx.sessionId) {
      throw Object.assign(new Error("Target download credentials missing"), {
        response: businessErrorReply(900009, "目标账号缺少下载凭据，请重新登录或由商店捕获安装材料", 409),
      });
    }
    // purchaseKbSync 同样按账号取材，缺失时省略，不把入站账号的材料带给目标账号。
    for (const name of ["purchaseKbSync", "sbSync"]) {
      if (ctx[name]) installBody[name] = ctx[name];
      else delete installBody[name];
    }
    requestBody = JSON.stringify(installBody);
  }
  /**
   * @param {*} id
   */
  const route = id => {
    if (statusMatch) return path + url.search;
    return (
      clientInterfacePath(
        req, req.operation, id,
        "apps/" +
          encodeURIComponent(appId) +
          "/builds/" +
          encodeURIComponent(buildId) +
          (buildMatch?.[3] || "")
      ) + url.search
    );
  };
  const response = await business(req, ctx, route, method, requestBody);
  if (statusMatch || buildMatch?.[3] || response.status !== 200)
    return response;
  const payload = clientResponse(req, req.operation, response);
  const builds = [...(payload.data?.builds || [])];
  if (payload.data?.currentBuild) builds.push(payload.data.currentBuild);
  if (!builds.some(build => String(build.id) === buildId))
    throw new Error("Selected build missing in upstream response");
  for (const build of builds) patchBuild(build);
  return jsonReply(payload);
};

// 请求上下文：显式传递依赖；入站材料只登记到入站账号。
/**
 * @param {RequestContext} req
 */
const mergePublicHeaders = req => {
  const { device } = req;
  const publicHeaders = {};
  const excluded = [
    "cookie",
    "authorization",
    "x-session-id",
    "x-request-id",
    "x-session-digest",
    "x-apple-store-front",
    "if-none-match",
    "if-modified-since",
    "etag",
  ];
  const oldHeaders = read(key("headers", device)) || {};
  for (const source of [oldHeaders, $request.headers]) {
    const safeHeaders = clean(source, excluded);
    for (const name of Object.keys(safeHeaders)) {
      const previousName = Object.keys(publicHeaders).find(
        candidate => candidate.toLowerCase() === name.toLowerCase()
      );
      if (previousName) delete publicHeaders[previousName];
      publicHeaders[name] = safeHeaders[name];
    }
  }
  save(key("headers", device), publicHeaders);
  return publicHeaders;
};
/**
 * @param {RequestContext} req
 */
const loadAccounts = req => {
  const { device, incomingOwner, path, method, body } = req;
  const registryKey = key("registry", device);
  const records = collection(STORAGE_KEYS.accounts).records;
  const registry = records[registryKey] || [];
  if (!incomingOwner || !registry.includes(incomingOwner))
    throw new Error("Session owner is not registered");
  const orderedOwners = [
    incomingOwner,
    ...mergedAccountOwners(records).filter(owner => owner !== incomingOwner),
  ];
  const contexts = {};
  for (const owner of orderedOwners) {
    const ctx = records[accountRecordKey("context", owner)];
    if (
      !ctx ||
      ctx.deviceVendorId !== accountDevice(owner) ||
      JSON.stringify([ctx.deviceVendorId, dsid(ctx.dsId)]) !== owner ||
      ctx.ownerAccountKey !== owner
    )
      throw new Error("Registered context identity mismatch");
    contexts[owner] = ctx;
  }
  const incoming = contexts[incomingOwner];
  // 在选择任务所属账号前捕获材料；即使路由到其他账号，原材料仍仅属于入站账号。
  if (
    /^\/v\d+\/accounts\/[^/]+\/apps\/[^/]+\/builds\/[^/]+\/install$/.test(
      path
    ) &&
    method === "POST" &&
    header($request.headers, "X-Session-Id") === incoming.sessionId
  ) {
    if (typeof body.kbSync === "string" && body.kbSync) {
      incoming.kbSync = body.kbSync;
      // 一起捕获同一请求实际提供的安装密钥组，不能残留上次设备的配套字段。
      for (const name of ["purchaseKbSync", "sbSync", "deviceGuid"]) {
        if (typeof body[name] === "string" && body[name]) incoming[name] = body[name];
        else delete incoming[name];
      }
      if (!incoming.deviceGuid || incoming.deviceGuid.toUpperCase() !== incoming.loginGuid?.toUpperCase()) delete incoming.loginGuid;
    }
    if (typeof body.udid === "string" && body.udid) incoming.udid = body.udid;
    save(accountRecordKey("context", incomingOwner), incoming);
  }
  return { orderedOwners, contexts };
};
const createRequestContext = () => {
  const config =
    typeof $argument === "string" && $argument.trim()
      ? exactParse($argument)
      : {};
  if (Object.keys(config).some(name => name !== "timeout"))
    throw new Error("Only timeout policy is supported");
  if (
    config.timeout !== undefined &&
    (typeof config.timeout !== "number" ||
      !Number.isFinite(config.timeout) ||
      config.timeout <= 0 ||
      config.timeout > 120)
  )
    throw new Error("Invalid timeout");
  const url = new URL($request.url);
  const path = url.pathname;
  const method = $request.method.toUpperCase();
  return {
    config,
    url,
    path,
    method,
    version: path.match(/^\/(v\d+)\//)?.[1],
    recoveries: {},
  };
};
/** 续发 framing 只使用显式字符串正文；不读取或输出正文内容。
 * @returns {Object}
 */
const forwardingBody = () => {
  if (typeof $request.body === "string") return { body: $request.body };
  const hasDeclaredBody = Object.entries($request.headers).some(
    ([name, value]) =>
      name.toLowerCase() === "content-length" &&
      String(value)
        .split(",")
        .some(length => Number(length.trim()) > 0)
  );
  if (hasDeclaredBody) {
    throw Object.assign(new Error("Request body unavailable"), {
      response: businessErrorReply(
        900008,
        "请求声明包含正文但脚本未取得字符串正文，已停止转发",
        502
      ),
    });
  }
  return {};
};
/** Surge 交付续发请求，QX 代发后交付响应。 @param {RequestContext} req */
const forwardRequest = async req => {
  const url = "https://testflight.apple.com" + req.path + req.url.search;
  const request = {
    url,
    headers: { ...clean($request.headers), host: "testflight.apple.com" },
    ...forwardingBody(),
  };
  if (!globalThis.$task) return request;
  const response = await http[req.method.toLowerCase()]({
    ...request,
    cookies: false,
    redirects: false,
    timeout: req.config.timeout || 20,
  });
  response.headers = clean(response.headers, hopHeaders(response.headers));
  return { response };
};
// 路由处理：账号检查独立于路由匹配；未知会话仍透明转发。
/** @param {RequestContext} req @param {Function} handler */
const withAccount = async (req, handler) => {
  const session = header($request.headers, "x-session-id");
  const binding = session ? latestSessionBinding(read(key("session", session))) : null;
  if (!binding?.device || !binding.owner) {
    return forwardRequest(req);
  }
  req.body = $request.body ? exactParse($request.body) : {};
  req.device = binding.device;
  req.incomingOwner = binding.owner;
  req.publicHeaders = mergePublicHeaders(req);
  Object.assign(req, loadAccounts(req));
  const apps = collection(STORAGE_KEYS.apps).records;
  const snapshotId = apps[key("current", req.device, req.incomingOwner)];
  req.snapshot = snapshotId
    ? apps[key("snapshot", req.device, snapshotId)]
    : null;
  return { response: await handler(req) };
};
/** @param {RequestContext} req */
const handleBuild = req => {
  req.buildMatch = req.path.match(
    /^\/v\d+\/accounts\/[^/]+\/apps\/([^/]+)\/builds\/([^/]+)$/
  );
  return withAccount(req, handleInstallation);
};
/** @param {RequestContext} req */
const handleInstall = req => {
  req.buildMatch = req.path.match(
    /^\/v\d+\/accounts\/[^/]+\/apps\/([^/]+)\/builds\/([^/]+)(\/install)$/
  );
  return withAccount(req, handleInstallation);
};
/** @param {RequestContext} req */
const handleInstallStatus = req => {
  req.statusMatch = req.path.match(
    /^\/v\d+\/apps\/([^/]+)\/([^/]+)\/install\/status$/
  );
  return withAccount(req, handleInstallation);
};

// 错误响应：不输出凭据，保留上游状态和正文。
// 本地错误采用已核实的 messages/ERROR 结构，手机端显示仍需实测。
/** @param {*} error */
const createErrorResponse = error => {
  if (error?.response) return error.response;
  if (error?.code === "HTTP_TIMEOUT")
    return businessErrorReply(900006, "请求上游服务超时，请稍后重试", 504);
  return businessErrorReply(900001, "当前请求无法完成，请刷新后重试", 502);
};

/** 对象键排序只用于缓存比较，不改变真实发往 Apple 的正文。 @param {*} value */
/** 分类缓存与 APNS 注册成功去重；未登记会话仍走原透明转发。 @param {RequestContext} req */
// ===== 启动接口：账号级共享分类与 APNS 缓存 =====
const handleStartupCache = async req => {
  const session = header($request.headers, "x-session-id");
  const binding = session ? latestSessionBinding(read(key("session", session))) : null;
  if (!binding?.device || !binding.owner) {
    return forwardRequest(req);
  }
  const apns = req.method === "POST";
  const body = forwardingBody();
  if (apns && typeof body.body !== "string")
    throw new Error("APNS body unavailable");
  const parameters = apns
    ? JSON.stringify(canonical(exactParse(body.body)))
    : "";
  // 分类与推送按账号、设备、会话复用；推送额外比较注册正文，防止漏掉 Token 变化。
  const variant = [req.path, req.url.search, binding.device, binding.owner];
  if (apns) variant.push(parameters);
  const fingerprint = sha1(JSON.stringify(variant));
  const logicalKey = key(
    "startup-cache",
    binding.device,
    binding.owner,
    req.path
  );
  const cached = read(logicalKey);
  if (cached?.fingerprint === fingerprint) {
    return { response: cached.response };
  }
  const response = await http[req.method.toLowerCase()]({
    url: "https://testflight.apple.com" + req.path + req.url.search,
    headers: startupAccountHeaders(req, binding),
    ...body,
    cookies: false,
    redirects: false,
    timeout: req.config.timeout || 20,
  });
  let success = false;
  if (response.status === 200) {
    try {
      success = !hasBusinessError(exactParse(response.body));
    } catch (error) {
      logError(error);
      success = apns && response.body === "";
    }
  }
  response.headers = clean(response.headers);
  if (success) save(logicalKey, { fingerprint, response });
  return { response };
};

/** 仅清理目标账号；混合快照整体失效，其他账号原始索引和详情保留。 @param {string} device @param {string} owner */
// ===== 显式账号删除：清理上下文及关联缓存 =====
const removeAccountData = (device, owner) => {
  /** @type {Object} */
  const apps = collection(STORAGE_KEYS.apps).records;
  /** @type {Set<string>} */
  const snapshots = new Set(
    Object.entries(apps)
      .filter(([k, v]) => {
        const p = JSON.parse(k);
        return (
          p[0] === "snapshot" &&
          Object.prototype.hasOwnProperty.call(v.accountVersions || {}, owner)
        );
      })
      .map(([, v]) => v.id)
  );
  for (const name of Object.values(STORAGE_KEYS)) {
    /** @type {Object} */
    const records = collection(name).records;
    /** @type {Array<string>} */
    const removals = [];
    /** @type {Object} */
    const updates = {};
    for (const [k, v] of Object.entries(records)) {
      /** @type {Array<string>} */
      const p = JSON.parse(k);
      if (p[0] === "registry" && p[1] === device) {
        updates[k] = v.filter(candidate => candidate !== owner);
        continue;
      }
      if (p[0] === "session" && v.device === device && v.owner === owner)
        removals.push(k);
      if (
        ["context", "startup-cache", "account-index", "detail"].includes(
          p[0]
        ) &&
        p[1] === device &&
        p[2] === owner
      )
        removals.push(k);
      if (p[0] === "snapshot" && snapshots.has(v.id))
        removals.push(k);
      if (
        p[0] === "current" &&
        ((p[1] === device && p[2] === owner) || snapshots.has(v))
      )
        removals.push(k);
      if (
        ["selection", "task"].includes(p[0]) &&
        (p[2] === owner ||
          v.owner === owner ||
          v.incomingOwner === owner ||
          snapshots.has(v.snapshot))
      )
        removals.push(k);
      if (p[0] !== "history-page") continue;
      /** @type {Array<string>} */
      let scope = p;
      if (p[1]?.startsWith("[")) scope = JSON.parse(p[1]);
      if (!(scope[1] === device && scope[2] === owner) && v.owner !== owner) continue;
      removals.push(k);
    }
    mergeRecords(name, updates, removals);
  }
};
// ===== 外部控制：Scripting 只交付商店登录材料，不接收原始密码 =====
const controlReply = (status, payload, headers = {}) => ({
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  body: JSON.stringify(payload),
});
const importError = (status, code, message) => Object.assign(new Error(message), { status, code });
const importObject = value => !!value && typeof value === "object" && !Array.isArray(value);
const importText = value => typeof value === "string" && value.trim().length > 0 && !/[\r\n\0]/.test(value);

/** 编码变体也属于本地控制空间，不允许带认证正文落入 Apple 透传。 */
const rejectControlPath = req => {
  // 此假域名的原 App 使用 TF 会话头；Bearer 只属于外部控制，路径写错也不能外发。
  if (/^Bearer\s/i.test(header($request.headers, "Authorization")) && !/^\/api(?:\/|$)/.test(req.path))
    return true;
  let normalized = req.path;
  for (let i = 0; i < 16; i++) {
    const decoded = normalized.replace(/%([a-f0-9]{2})/gi, (_, value) => String.fromCharCode(parseInt(value, 16))).replace(/\\/g, "/");
    if (decoded === normalized) break;
    normalized = decoded;
  }
  if (!/^\/+api/i.test(normalized)) return false;
  return normalized !== req.path || /[%\\]/.test(req.path) || /^\/\//.test(req.path);
};

/** Cookie 包保留完整 storefront，AMD 只保留实际登录返回值，不自行生成。 */
const parseAccountImport = () => {
  let body;
  try { body = exactParse($request.body || ""); }
  catch { throw importError(400, "invalid_request", "请求正文必须是 JSON 对象"); }
  if (!importObject(body) || Object.keys(body).some(name => !["ck", "amd", "guid", "device", "appleId", "kbSync"].includes(name)))
    throw importError(400, "invalid_request", "只接受 CK、AMD、GUID、kbSync 和可选设备、账号标识");
  const { ck, amd, guid } = body;
  if (!importObject(ck) || !importText(ck.storeFrontIdentifier) || !importObject(ck.storeCookies) || !Object.keys(ck.storeCookies).length)
    throw importError(400, "invalid_request", "CK 缺少商店 Cookie 或完整 storefront");
  let identity;
  try { identity = dsid(ck.dsId); }
  catch { throw importError(400, "invalid_request", "CK 缺少有效的精确 DSID"); }
  if (Object.entries(ck.storeCookies).some(([name, value]) => !importText(name) || !importText(value)))
    throw importError(400, "invalid_request", "商店 Cookie 必须是非空字符串映射");
  const cookieDSID = header(ck.storeCookies, "X-Dsid");
  if (cookieDSID && cookieDSID !== identity)
    throw importError(400, "invalid_request", "Cookie 与 DSID 不一致");
  if (!importObject(amd) || !importText(amd.machine) || (amd.oneTimePassword !== undefined && !importText(amd.oneTimePassword)))
    throw importError(400, "invalid_request", "AMD 缺少有效的 machine 值");
  if (guid !== undefined && (typeof guid !== "string" || !/^(?:[0-9a-f]{12}|[0-9a-f]{8}-[0-9a-f]{16})$/i.test(guid)))
    throw importError(400, "invalid_request", "GUID 格式不正确");
  if (body.kbSync !== undefined && (typeof guid !== "string" || !/^[0-9a-f]{12}$/i.test(guid) ||
      typeof body.kbSync !== "string" || body.kbSync.length < 4 || body.kbSync.length > 16384 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.kbSync)))
    throw importError(400, "invalid_request", "kbSync 必须是与本次 GUID、DSID 匹配的 Base64 下载凭据");
  if (body.appleId !== undefined && !importText(body.appleId))
    throw importError(400, "invalid_request", "账号标识不能为空");
  return { ...body, identity };
};

/** 提交前也重新读取设备头，保留网络等待期间 App 捕获的更新。 */
const importDeviceHeaders = (device, overrides = {}, fallback = {}) => {
  const allowed = ["user-agent", "accept", "accept-language", "content-type", "x-apple-ta-device", "x-apple-product-type", "x-apple-device-model", "x-apple-testflight-ios", "x-apple-rosetta-available", "x-apple-amd-m"];
  const headers = {};
  for (const source of [fallback, read(key("headers", device)) || {}, overrides]) {
    if (!importObject(source)) throw importError(400, "invalid_request", "设备请求头格式不正确");
    for (const [name, value] of Object.entries(source)) {
      if (!allowed.includes(name.toLowerCase())) continue;
      if (!importText(value)) throw importError(400, "invalid_request", "设备请求头值不正确");
      const oldName = Object.keys(headers).find(item => item.toLowerCase() === name.toLowerCase());
      if (oldName) delete headers[oldName];
      headers[name] = value;
    }
  }
  return headers;
};

/** 优先复用已初始化的控制设备；没有绑定时，多设备必须明确指定。 */
const importDevices = records => Object.keys(records).map(value => JSON.parse(value)).filter(parts => parts[0] === "registry").map(parts => parts[1]);
const resolveImportDevice = body => {
  const records = collection(STORAGE_KEYS.accounts).records;
  const devices = importDevices(records);
  if (body.device !== undefined && !importObject(body.device))
    throw importError(400, "invalid_request", "设备资料格式不正确");
  // 首次接入只复用中转配置的公开设备描述，不携带旧 Cookie 或会话。
  const configured = storage.readJSON("tf.management.device");
  const initial = devices.length === 0 ? configured : null;
  const supplied = body.device ? { ...initial, ...body.device } : initial;
  const device = supplied?.deviceVendorId || configured?.deviceVendorId || (devices.length === 1 ? devices[0] : null);
  if (!importText(device))
    throw importError(409, "device_required", "请先绑定中转设备，或明确传入设备资料");
  const owner = JSON.stringify([device, body.identity]);
  const previous = records[key("context", device, owner)];
  const template = previous || (records[key("registry", device)] || []).map(value => records[key("context", device, value)]).find(Boolean);
  // 最后一个账号删除后 registry/公开头仍在；从同设备配置补足名称，不借用其他设备。
  const fallback = configured?.deviceVendorId === device ? configured : undefined;
  const profile = { ...fallback, ...template, ...supplied, deviceVendorId: device };
  const headers = importDeviceHeaders(device, supplied?.headers, fallback?.headers);
  if (!importText(profile.deviceModel) || !importText(profile.deviceName) || !header(headers, "User-Agent"))
    throw importError(409, "device_required", "缺少设备型号、名称或已验证的 TestFlight User-Agent");
  return { device, owner, profile, headers, supplied, fallback };
};

/** 先用新 Cookie 真实创建 TF 会话，成功后一次提交账号登记和设备头；失败不覆盖旧资料。 */
const importStoreAccount = async req => {
  const body = parseAccountImport();
  const { device, owner, profile, headers, supplied, fallback } = resolveImportDevice(body);
  const materials = { ...authMaterials(body.ck), dsId: body.identity,
    deviceVendorId: device, deviceModel: profile.deviceModel, deviceName: profile.deviceName };
  const publicHeaders = { ...headers, "Content-Type": "application/json", "X-Apple-AMD-M": body.amd.machine };
  const request = '{"dsId":' + body.identity + ',' + JSON.stringify(authMaterials(materials)).slice(1);
  const response = await send({ ...req, publicHeaders }, materials, clientInterfacePath(req, "authenticate"), "POST", request, false);
  const payload = clientResponse(req, "authenticate", response);
  if (!usableAuth(payload) || !importText(payload.data.accountId) || !importText(payload.data.sessionId))
    throw importError(422, "authentication_required", "商店凭据未取得有效 TF 会话，或需要确认条款");
  // 网络等待后重新读取目标，保留期间捕获的安装材料，不覆盖其他账号。
  const previous = latestAccountContexts().find(value => value.dsId === body.identity);
  if (previous?.accountId && previous.accountId !== payload.data.accountId)
    throw importError(409, "account_conflict", "新会话与已登记账号身份不一致");
  const binding = read(key("session", payload.data.sessionId));
  if (binding && accountIdentity(binding.owner) !== body.identity)
    throw importError(409, "account_conflict", "新会话已绑定其他账号");
  const updatedAt = new Date().toISOString();
  const context = { ...materials, ownerAccountKey: owner,
    accountId: payload.data.accountId, sessionId: payload.data.sessionId, authResponse: response,
    ...(body.kbSync ? { kbSync: body.kbSync, deviceGuid: body.guid } : {}),
    ...(body.guid ? { loginGuid: body.guid } : {}), loginAMD: { machine: body.amd.machine,
      ...(body.amd.oneTimePassword ? { oneTimePassword: body.amd.oneTimePassword } : {}) },
    ...(body.appleId ? { appleId: body.appleId } : {}), updatedAt, version: (previous?.version || 0) + 1 };
  commitAccountContext(context, { ...clean(importDeviceHeaders(device, supplied?.headers, fallback?.headers), ["x-apple-amd-m"]), "X-Apple-AMD-M": body.amd.machine });
  return controlReply(previous ? 200 : 201, { data: { id: managedAccountId(body.identity), created: !previous, updatedAt } });
};

/** 管理错误只返回固定文案，不回显 Apple 正文、Cookie、AMD 或会话值。 */
const handleAccountImport = async req => {
  try { return await importStoreAccount(req); }
  catch (error) {
    if (typeof error?.status === "number" && typeof error.code === "string")
      return controlReply(error.status, { error: { code: error.code, message: error.message } });
    if (error?.code === "HTTP_TIMEOUT")
      return controlReply(504, { error: { code: "upstream_timeout", message: "创建 TF 会话超时" } });
    if (error?.response)
      return controlReply(422, { error: { code: "authentication_failed", message: "商店凭据未通过 TF 认证" } });
    return controlReply(502, { error: { code: "import_failed", message: "账号导入未完成，请重试" } });
  }
};



// ===== 账号读取与定向刷新：不发布原版 App 的合并快照 =====
const managedAccountId = identity => sha1(dsid(identity)).slice(0, 24);
// 地区只由账号登录后的 storefront 决定；未知商店保留编号，不猜测邮箱。
const managedRegion = storefront => {
  const id = typeof storefront === "string" ? storefront.split("-")[0] : "";
  if (!/^[0-9]+$/.test(id)) return null;
  const regions = { "143441": ["US", "美国"], "143465": ["CN", "中国大陆"], "143470": ["TW", "中国台湾"],
    "143463": ["HK", "中国香港"], "143462": ["JP", "日本"], "143464": ["SG", "新加坡"], "143444": ["GB", "英国"] };
  const region = regions[id];
  return region ? { code: region[0], name: region[1] } : { code: id, name: "商店 " + id };
};
const managedAccount = ctx => {
  const index = managedAccountIndex(ctx);
  const apps = (index?.items || []).map(item => {
    const detail = read(key("detail", ctx.deviceVendorId, ctx.ownerAccountKey, ctx.dsId, String(item.appId)))?.detail;
    const version = detail?.platforms?.map(platform => platform.build?.cfBundleShortVersion).find(importText) || null;
    return { id: String(item.appId), name: item.name || detail?.name || null, version, expirationState: index.appStates[String(item.appId)] };
  });
  return { id: managedAccountId(ctx.dsId), dsId: dsid(ctx.dsId), accountId: ctx.accountId, appleId: ctx.appleId || null,
    monogram: ctx.appleId?.[0]?.toUpperCase() || "A", region: managedRegion(ctx.storeFrontIdentifier),
    state: index ? "ready" : "pending", appCount: apps.length, appCounts: index?.appCounts || { unexpired: 0, expired: 0, unknown: 0 },
    updatedAt: index?.updatedAt || ctx.appsUpdatedAt || null, apps };
};
const findManagedAccount = req => {
  const id = req.path.split("/")[4];
  const peers = registeredContexts();
  const previous = peers.find(value => [value.ownerAccountKey, ...(value.aliasOwners || [])].some(owner => sha1(owner).slice(0, 24) === id));
  const ctx = latestAccountContexts().find(value => managedAccountId(value.dsId) === id || value.dsId === previous?.dsId);
  req.managedId = id;
  if (!ctx) throw importError(404, "account_not_found", "账号不存在");
  return ctx;
};
const listStoreAccounts = () => {
  return controlReply(200, { data: latestAccountContexts().map(managedAccount) });
};
const refreshStoreAccount = async req => {
  const ctx = findManagedAccount(req);
  const device = ctx.deviceVendorId, owner = ctx.ownerAccountKey;
  const refresh = { ...req, device, incomingOwner: owner, orderedOwners: [owner], contexts: { [owner]: ctx },
    // 控制刷新自行构造 JSON 详情请求，不能依赖原 App 曾经捕获的正文类型。
    publicHeaders: { ...clean(read(key("headers", device)) || {}, ["content-type"]), "Content-Type": "application/json" },
    version: clientInterfaces(req).apps.version, controlRefresh: true };
  await handleIndex(refresh);
  const latest = read(key("context", device, owner));
  if (!latest || latest.dsId !== ctx.dsId) throw importError(409, "account_changed", "账号已变化，请重新读取");
  return controlReply(200, { data: { ...managedAccount(latest), id: req.managedId } });
};

// 与原中转维护共用清理逻辑，删除账号全部上下文，不动其他账号和设备公共头。
const deleteStoreAccount = req => {
  const ctx = findManagedAccount(req);
  for (const peer of registeredContexts().filter(value => value.dsId === ctx.dsId))
    for (const owner of new Set([...(peer.aliasOwners || []), peer.ownerAccountKey]))
      removeAccountData(accountDevice(owner), owner);
  return controlReply(200, { data: { id: req.managedId, deleted: true } });
};

/** 与导入共用固定错误文案，外部控制接口不泄露原版 Apple 错误正文。 */
const handleControl = async (req, action) => {
  try { return { response: await action(req) }; }
  catch (error) {
    if (typeof error?.status === "number" && typeof error.code === "string")
      return { response: controlReply(error.status, { error: { code: error.code, message: error.message } }) };
    if (error?.code === "HTTP_TIMEOUT")
      return { response: controlReply(504, { error: { code: "upstream_timeout", message: "账号服务请求超时" } }) };
    return { response: controlReply(error?.response?.status === 401 ? 409 : 502, { error: {
      code: error?.response?.status === 401 ? "authentication_expired" : "upstream_failed",
      message: error?.response?.status === 401 ? "商店凭据已失效，请重新登录" : "账号数据暂未更新，请重试",
    } }) };
  }
};


// DSID 是账号身份；设备标识只属于当前登录材料，不参与账号去重。
const accountDevice = owner => JSON.parse(owner)[0];
const accountIdentity = owner => dsid(JSON.parse(owner)[1]);
const accountRecordKey = (kind, owner, ...parts) => key(kind, accountDevice(owner), owner, ...parts);
const registeredContexts = (records = collection(STORAGE_KEYS.accounts).records) => Object.entries(records)
  .filter(([name, ctx]) => {
    const parts = JSON.parse(name);
    return parts[0] === "context" && ctx.ownerAccountKey === parts[2] && ctx.deviceVendorId === parts[1] &&
      JSON.stringify([ctx.deviceVendorId, dsid(ctx.dsId)]) === ctx.ownerAccountKey &&
      (records[key("registry", ctx.deviceVendorId)] || []).includes(ctx.ownerAccountKey);
  }).map(([, ctx]) => ctx);
const latestAccountContexts = (records = collection(STORAGE_KEYS.accounts).records) => {
  const accounts = new Map();
  for (const ctx of registeredContexts(records)) {
    const previous = accounts.get(ctx.dsId);
    if (!previous || (Date.parse(ctx.updatedAt) || 0) >= (Date.parse(previous.updatedAt) || 0)) accounts.set(ctx.dsId, ctx);
  }
  return [...accounts.values()];
};
const mergedAccountOwners = records => latestAccountContexts(records).map(ctx => ctx.ownerAccountKey);
const latestSessionBinding = binding => {
  if (!binding?.owner) return binding;
  const ctx = latestAccountContexts().find(value => value.dsId === accountIdentity(binding.owner));
  return ctx ? { device: ctx.deviceVendorId, owner: ctx.ownerAccountKey } : null;
};
const accountChanged = () => Object.assign(new Error("Account changed during request"), {
  status: 409, code: "account_changed", response: businessErrorReply(900003, "账号材料已更新，请刷新后重试", 409),
});
const assertCurrentAccount = ctx => {
  const current = latestAccountContexts().find(value => value.dsId === ctx.dsId);
  if (!current || current.ownerAccountKey !== ctx.ownerAccountKey || current.version !== ctx.version) throw accountChanged();
};
const invalidateCurrentAccount = ctx => {
  assertCurrentAccount(ctx);
  save(accountRecordKey("context", ctx.ownerAccountKey), ctx);
};

// 同 DSID 只保留一份上下文；本次实际提供的属性覆盖，缺失属性（包括邮箱）保留。
// Cookie、AMD 等已提供的对象整份替换，不能逐项拼出新旧混合材料。
// 旧会话仅作为本地账号入口继续识别；真正发往 Apple 的请求使用新上下文的会话和摘要。
const commitAccountContext = (ctx, publicHeaders) => {
  const records = collection(STORAGE_KEYS.accounts).records;
  const peers = registeredContexts(records).filter(value => value.dsId === ctx.dsId);
  const previous = latestAccountContexts(records).find(value => value.dsId === ctx.dsId);
  if (peers.some(value => value.accountId && value.accountId !== ctx.accountId)) throw new Error("Authentication account mismatch");
  const collision = records[key("session", ctx.sessionId)];
  if (collision && accountIdentity(collision.owner) !== ctx.dsId) throw new Error("Ambiguous session binding");
  const email = ctx.appleId || peers.find(value => value.appleId)?.appleId;
  const provided = Object.fromEntries(Object.entries(ctx).filter(([, value]) => value !== undefined));
  const headers = importDeviceHeaders(ctx.deviceVendorId, publicHeaders || ctx.publicHeaders, previous?.publicHeaders);
  const incomingAMD = header(publicHeaders || {}, "X-Apple-AMD-M");
  const aliases = [...new Set(peers.flatMap(value => [value.ownerAccountKey, ...(value.aliasOwners || [])]))];
  const saved = { ...previous, ...provided, ...(email ? { appleId: email } : {}),
    ...(incomingAMD ? { loginAMD: ctx.loginAMD?.machine === incomingAMD ? ctx.loginAMD : { machine: incomingAMD } } : {}),
    aliasOwners: aliases, publicHeaders: headers,
    updatedAt: new Date().toISOString(), version: Math.max(0, ...peers.map(value => value.version || 0)) + 1 };
  // 下载密钥只属于同一 DSID/GUID/设备上下文；缺字段保留不适用于换设备后的旧密钥。
  const changedDevice = previous && previous.deviceVendorId !== ctx.deviceVendorId;
  const changedGuid = previous && ctx.loginGuid &&
    (previous.loginGuid || previous.deviceGuid)?.toUpperCase() !== ctx.loginGuid.toUpperCase();
  if (changedDevice || changedGuid) {
    for (const name of ["kbSync", "purchaseKbSync", "sbSync", "deviceGuid", "udid", "loginGuid"]) {
      if (ctx[name] === undefined) delete saved[name];
    }
  }
  const updates = { [accountRecordKey("context", saved.ownerAccountKey)]: saved };
  const removals = [];
  for (const [name, value] of Object.entries(records)) {
    const parts = JSON.parse(name);
    if (parts[0] === "registry") updates[name] = value.filter(owner => accountIdentity(owner) !== ctx.dsId);
    if (parts[0] === "context" && value.dsId === ctx.dsId && name !== accountRecordKey("context", saved.ownerAccountKey)) removals.push(name);
    if (parts[0] === "session" && accountIdentity(value.owner) === ctx.dsId) updates[name] = { device: saved.deviceVendorId, owner: saved.ownerAccountKey };
  }
  const registry = key("registry", saved.deviceVendorId);
  updates[registry] = [...(updates[registry] || records[registry] || []), saved.ownerAccountKey];
  updates[key("session", saved.sessionId)] = { device: saved.deviceVendorId, owner: saved.ownerAccountKey };
  if (publicHeaders) updates[key("headers", saved.deviceVendorId)] = publicHeaders;
  mergeRecords(STORAGE_KEYS.accounts, updates, removals);
  // 新账号已登记后才清旧设备缓存；旧会话入口已经指向新账号，不会被误删。
  for (const owner of aliases) {
    if (owner !== saved.ownerAccountKey) removeAccountData(accountDevice(owner), owner);
  }
  Object.assign(ctx, saved);
};

const startupAccountHeaders = (req, binding) => {
  const ctx = read(accountRecordKey("context", binding.owner));
  if (!ctx) throw accountChanged();
  const publicHeaders = clean($request.headers, ["cookie", "authorization", "x-session-id", "x-session-digest", "x-request-id"]);
  return { ...headersFor({ ...req, device: binding.device, publicHeaders }, ctx, true), host: "testflight.apple.com" };
};

// 请求头与 AMD 使用当前上下文；入站旧连接的设备验证材料不能盖过它。
const accountPublicHeaders = (req, ctx) => {
  if (!req.device) return req.publicHeaders;
  const incomingHeaders = typeof $request === "object" && $request ? $request.headers : {};
  const currentConnection = header(incomingHeaders, "X-Session-Id") === ctx.sessionId;
  const headers = currentConnection && ctx.deviceVendorId === req.device ? req.publicHeaders :
    ctx.publicHeaders || read(key("headers", ctx.deviceVendorId)) || req.publicHeaders;
  return { ...clean(headers, ["content-type", "x-apple-amd-m"]),
    "Content-Type": header(req.publicHeaders, "Content-Type") || "application/json",
    ...(ctx.loginAMD?.machine ? { "X-Apple-AMD-M": ctx.loginAMD.machine } : header(headers, "X-Apple-AMD-M") ? { "X-Apple-AMD-M": header(headers, "X-Apple-AMD-M") } : {}) };
};


// App 生命周期由 Surge 根据真实构建判定，Scripting 不重复推算时间或统计。
// 多平台只要有一个未过期构建就归入未过期；所有构建明确过期才归入已过期。
// 缺少详情、构建或有效到期时间时保留待确认；下架与过期是不同含义。
const accountAppStatus = (ctx, index, details, now = Date.now()) => {
  const appCounts = { unexpired: 0, expired: 0, unknown: 0 }, appStates = {};
  let nextChange = Infinity;
  for (const item of index.items || []) {
    const id = String(item.appId);
    const cached = details[accountRecordKey("detail", ctx.ownerAccountKey, ctx.dsId, id)];
    const current = cached && (cached.indexVersion === index.version || matchingDetail(cached, index.etags?.[id] ?? null));
    const builds = current && Array.isArray(cached.detail?.platforms) ? cached.detail.platforms.map(platform => platform.build).filter(Boolean) : [];
    const dates = builds.map(build => typeof build.expiration === "string" ? Date.parse(build.expiration) : NaN);
    const future = dates.filter(time => Number.isFinite(time) && time > now);
    const state = future.length ? "unexpired" : dates.length && dates.every(time => Number.isFinite(time) && time <= now) ? "expired" : "unknown";
    appStates[id] = state;
    appCounts[state]++;
    for (const time of future) nextChange = Math.min(nextChange, time);
  }
  return { appCounts, appStates, appStatusVersion: 1, appStatusNextChangeAt: Number.isFinite(nextChange) ? nextChange : null };
};

// 扫描只读本地缓存；到期后在 Surge 内重新归类，不请求 Apple，也不改变刷新时间。
const managedAccountIndex = ctx => {
  const index = read(accountRecordKey("account-index", ctx.ownerAccountKey));
  if (!index) return null;
  if (index.appStatusVersion === 1 && (index.appStatusNextChangeAt === null || index.appStatusNextChangeAt > Date.now())) return index;
  return { ...index, ...accountAppStatus(ctx, index, collection(STORAGE_KEYS.details).records) };
};


// cron 和控制接口共用这一执行器；每轮每个 DSID 只续会话一次。
const scheduledReportKey = key("maintenance-refresh", "latest");
const readScheduledReport = () => collection(STORAGE_KEYS.tasks).records[scheduledReportKey] || null;
const logScheduledRefresh = (event, fields) => console.log("[TF refresh] " + JSON.stringify({ event, ...fields }));
const saveScheduledReport = (report, initial = false) => {
  // 较早批次结束不能盖过另一个实例已经开始的新批次。
  if (!initial && readScheduledReport()?.id !== report.id) return;
  mergeRecords(STORAGE_KEYS.tasks, { [scheduledReportKey]: report });
};
const scheduledFailure = error => {
  const status = typeof error?.response?.status === "number" ? error.response.status : null;
  if (error?.code === "account_changed") return { code: "account_changed", status: 409, message: "账号材料已变化，本轮未覆盖新上下文" };
  if (error?.code === "HTTP_TIMEOUT") return { code: "upstream_timeout", status, message: "TF 会话刷新超时，账号及缓存已保留" };
  if (status === 401 || status === 403) return { code: "authentication_failed", status, message: "当前材料未通过 TF 认证，账号及缓存已保留" };
  return { code: "refresh_failed", status, message: "TF 会话刷新未完成，账号及缓存已保留" };
};
const refreshScheduledAccount = async (ctx, task, report) => {
  logScheduledRefresh("account-start", { runId: report.id, taskId: task.id, dsId: task.dsId, attempt: 1 });
  try {
    const req = { device: ctx.deviceVendorId, incomingOwner: ctx.ownerAccountKey,
      publicHeaders: ctx.publicHeaders || read(key("headers", ctx.deviceVendorId)) || {},
      config: { timeout: 15 }, recoveries: {} };
    // 普通业务恢复会在失败时使旧认证响应失效；维护失败必须完整保留原材料。
    await performRecovery(req, ctx);
    task.state = "succeeded";
    task.contextVersion = ctx.version;
    task.contextUpdatedAt = ctx.updatedAt;
  } catch (error) {
    task.state = "failed";
    task.preserved = true;
    task.error = scheduledFailure(error);
  }
  task.finishedAt = new Date().toISOString();
  task.durationMs = Math.max(0, Date.parse(task.finishedAt) - Date.parse(task.startedAt));
  logScheduledRefresh(task.state === "succeeded" ? "account-succeeded" : "account-failed", {
    runId: report.id, taskId: task.id, dsId: task.dsId, attempts: task.attempts,
    durationMs: task.durationMs, ...(task.error ? { error: task.error } : {}),
  });
  saveScheduledReport(report);
};
const runScheduledRefresh = async (trigger = "cron") => {
  // 批次开始前拒绝；不能逐账号报错或发起任何续期请求。
  resolveClientInterfaces(storedClientVersion());
  const contexts = latestAccountContexts(), startedAt = new Date().toISOString();
  const report = { id: uuid(), trigger, state: "running", startedAt, finishedAt: null, durationMs: null,
    totals: { total: contexts.length, succeeded: 0, failed: 0 },
    tasks: contexts.map(ctx => ({ id: uuid(), accountId: managedAccountId(ctx.dsId), dsId: ctx.dsId,
      stage: "session", state: "running", attempts: 1, startedAt, finishedAt: null, durationMs: null,
      contextVersion: ctx.version, contextUpdatedAt: ctx.updatedAt || null })) };
  saveScheduledReport(report, true);
  logScheduledRefresh("run-start", { runId: report.id, trigger, total: contexts.length });
  await Promise.all(contexts.map((ctx, index) => refreshScheduledAccount(ctx, report.tasks[index], report)));
  report.totals.succeeded = report.tasks.filter(task => task.state === "succeeded").length;
  report.totals.failed = report.tasks.filter(task => task.state === "failed").length;
  report.state = !report.totals.failed ? "complete" : report.totals.succeeded ? "partial" : "failed";
  report.finishedAt = new Date().toISOString();
  report.durationMs = Math.max(0, Date.parse(report.finishedAt) - Date.parse(startedAt));
  saveScheduledReport(report);
  logScheduledRefresh("run-finished", { runId: report.id, trigger, state: report.state, ...report.totals, durationMs: report.durationMs });
  return report;
};


// 中转模块安装后直接使用；仅初始化公开设备模板，不读取或要求管理令牌。
const controlStatus = () => controlReply(200, { data: { version: 1, client: storage.readJSON(CLIENT_PROTOCOL_KEY) } });
const controlBody = names => {
  let body;
  try { body = exactParse($request.body || ""); } catch { /* 错误不回显正文。 */ }
  if (!importObject(body) || Object.keys(body).some(name => !names.includes(name)))
    throw importError(400, "invalid_request", "控制请求格式不正确");
  return body;
};
const saveControl = (name, value) => {
  if (!storage.writeJSON(name, value)) throw importError(503, "storage_failed", "无法保存中转设备配置，请重试");
};
// 仅清本模块固定存储键；使用现有平台适配，不调用平台专属清库 API。
const resetControl = () => {
  if (controlBody(["confirm"]).confirm !== true)
    throw importError(400, "confirmation_required", "请确认清空全部中转数据");
  const names = [...Object.values(STORAGE_KEYS), "tf.management.device", "tf.management.token"];
  console.log("[TF reset] start");
  for (const name of names) {
    storage.remove(name);
    if (storage.get(name) != null) {
      console.log("[TF reset] failed");
      throw importError(503, "storage_failed", "中转数据未全部清空，请重试");
    }
  }
  console.log("[TF reset] complete");
  return controlReply(200, { data: { reset: true } });
};
const initializeControl = () => {
  const body = controlBody(["device", "client"]);
  if (!importObject(body.device)) throw importError(400, "invalid_request", "缺少公开设备资料");
  const client = configureClientProtocol(body.client);
  const configured = storage.readJSON("tf.management.device");
  if (configured?.deviceVendorId && importText(configured.deviceModel) && importText(configured.deviceName) && header(configured.headers, "User-Agent"))
    return controlReply(200, { data: { initialized: true, client } });
  const records = collection(STORAGE_KEYS.accounts).records;
  const devices = importDevices(records);
  if (devices.length > 1) throw importError(409, "device_required", "中转存在多个设备，请先明确使用的设备");
  const device = configured?.deviceVendorId || devices[0] || uuid();
  const previous = (records[key("registry", device)] || []).map(owner => records[key("context", device, owner)]).find(Boolean);
  const headers = importDeviceHeaders(device, {}, { ...body.device.headers, ...configured?.headers });
  const profile = { deviceVendorId: device, deviceModel: previous?.deviceModel || configured?.deviceModel || body.device.deviceModel,
    deviceName: previous?.deviceName || configured?.deviceName || body.device.deviceName, headers };
  if (!importText(profile.deviceModel) || !importText(profile.deviceName) || !header(headers, "User-Agent"))
    throw importError(400, "invalid_request", "设备资料缺少型号、名称或 TestFlight User-Agent");
  saveControl("tf.management.device", profile);
  return controlReply(200, { data: { initialized: true, client } });
};


// 外部控制路由独立声明；入口只负责与 appRoutes 合并，不混写 App 协议。
const controlRoutes = [
  { method: "POST", path: /^\/api\/v1\/control\/reset$/, callback: req => handleControl(req, resetControl) },
  { method: "*", path: /^\/api\/v1\/control\/reset$/, callback: () => ({ response: controlReply(405, { error: { code: "method_not_allowed", message: "请使用 POST 重置中转" } }, { Allow: "POST" }) }) },
  { method: "POST", path: /^\/api\/v1\/maintenance\/refresh$/, callback: req => handleControl(req, async () => controlReply(200, { data: await runScheduledRefresh("control") })) },
  { method: "GET", path: /^\/api\/v1\/maintenance\/refresh$/, callback: req => handleControl(req, () => controlReply(200, { data: readScheduledReport() })) },
  { method: "*", path: /^\/api\/v1\/maintenance\/refresh$/, callback: () => ({ response: controlReply(405, { error: { code: "method_not_allowed", message: "请使用 POST 执行或 GET 读取定时刷新任务" } }, { Allow: "GET, POST" }) }) },
  { method: "GET", path: /^\/api\/v1\/control\/status$/, callback: req => handleControl(req, controlStatus) },
  { method: "POST", path: /^\/api\/v1\/control\/initialize$/, callback: req => handleControl(req, initializeControl) },
  { method: "POST", path: /^\/api\/v1\/store-accounts\/import$/, callback: async req => ({ response: await handleAccountImport(req) }) },
  { method: "GET", path: /^\/api\/v1\/store-accounts$/, callback: req => handleControl(req, listStoreAccounts) },
  { method: "POST", path: /^\/api\/v1\/store-accounts\/[a-f0-9]{24}\/refresh$/, callback: req => handleControl(req, refreshStoreAccount) },
  { method: "DELETE", path: /^\/api\/v1\/store-accounts\/[a-f0-9]{24}$/, callback: req => handleControl(req, deleteStoreAccount) },
  { method: "*", path: /^\/api\/v1\/store-accounts\/import$/, callback: () => ({ response: controlReply(405, { error: { code: "method_not_allowed", message: "请使用 POST 导入账号" } }, { Allow: "POST" }) }) },
  { method: "*", path: /^\/api\/v1\/store-accounts$/, callback: () => ({ response: controlReply(405, { error: { code: "method_not_allowed", message: "请使用 GET 读取账号" } }, { Allow: "GET" }) }) },
  { method: "*", path: /^\/api\/v1\/store-accounts\/[a-f0-9]{24}\/refresh$/, callback: () => ({ response: controlReply(405, { error: { code: "method_not_allowed", message: "请使用 POST 刷新账号" } }, { Allow: "POST" }) }) },
  { method: "*", path: /^\/api\/v1\/store-accounts\/[a-f0-9]{24}$/, callback: () => ({ response: controlReply(405, { error: { code: "method_not_allowed", message: "请使用 DELETE 删除账号" } }, { Allow: "DELETE" }) }) },
  { method: "*", path: /^\/api/i, callback: () => ({ response: controlReply(404, { error: { code: "not_found", message: "账号控制接口不存在" } }) }) },
];


// 官方客户端协议：实现按用途独立登记，只有接口改变时才新增 since 规则。
// 独立于账号、索引、详情和任务集合；不能从请求 URL 的 v 数字推导客户端版本。
const CLIENT_PROTOCOL_KEY = "tf.client.protocol";
const MIN_CLIENT_VERSION = "4.4.1";
// 没有上报结果时使用已验证基线；明确上报的低版本仍按最低版本规则拒绝。
const storedClientVersion = () => storage.readJSON(CLIENT_PROTOCOL_KEY)?.version ?? MIN_CLIENT_VERSION;
const clientVersionParts = value => {
  if (typeof value !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))
    throw clientProtocolError("client_version_invalid", "无法确认 TestFlight 版本，请从 Scripting 重新读取");
  const parts = value.split(".").map(Number);
  if (!parts.every(Number.isSafeInteger)) throw clientProtocolError("client_version_invalid", "TestFlight 版本号无效");
  return parts;
};
const compareClientVersions = (left, right) => {
  const a = clientVersionParts(left), b = clientVersionParts(right);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
};
const clientProtocolError = (code, message) => Object.assign(new Error(message), {
  status: 426, code, response: businessErrorReply(900010, message, 426),
});
const assertClientVersion = version => {
  clientVersionParts(version);
  if (compareClientVersions(version, MIN_CLIENT_VERSION) < 0)
    throw clientProtocolError("client_version_unsupported", "请将 TestFlight 更新至 4.4.1 或更高版本");
};
// path 匹配去掉 /vN 后的路径；version、callback 和请求路径一起选择。
const CLIENT_INTERFACES = {
  authenticate: [{ since: "4.4.1", version: "v1", method: "POST", path: /^\/session\/authenticate$/, suffix: "session/authenticate",
    callback: async req => ({ response: await handleAuthenticate(req) }) }],
  categories: [{ since: "4.4.1", version: "v1", method: "GET", path: /^\/appCategories$/, callback: handleStartupCache }],
  apns: [{ since: "4.4.1", version: "v1", method: "POST", path: /^\/devices\/apns$/, callback: handleStartupCache }],
  apps: [{ since: "4.4.1", version: "v4", method: "GET", path: /^\/accounts\/[^/]+\/apps$/, suffix: "apps",
    decode: requireOK,
    callback: req => withAccount(req, handleIndex) }],
  appDetails: [{ since: "4.4.1", version: "v4", method: "POST", path: /^\/accounts\/[^/]+\/appDetails$/, suffix: "appDetails",
    decode: requireOK,
    callback: req => withAccount(req, handleDetails) }],
  trains: [{ since: "4.4.1", version: "v2", method: "GET", path: /^\/accounts\/[^/]+\/apps\/[^/]+\/platforms\/[^/]+\/trains$/,
    callback: req => withAccount(req, handleTrains) }],
  trainBuilds: [{ since: "4.4.1", version: "v2", method: "GET", path: /^\/accounts\/[^/]+\/apps\/[^/]+\/platforms\/[^/]+\/trains\/[^/]+\/builds$/,
    callback: req => withAccount(req, handleTrains) }],
  build: [{ since: "4.4.1", version: "v2", method: "GET", path: /^\/accounts\/[^/]+\/apps\/[^/]+\/builds\/[^/]+$/, callback: handleBuild }],
  install: [{ since: "4.4.1", version: "v2", method: "POST", path: /^\/accounts\/[^/]+\/apps\/[^/]+\/builds\/[^/]+\/install$/, callback: handleInstall }],
  installStatus: [{ since: "4.4.1", version: "v1", method: "POST", path: /^\/apps\/[^/]+\/[^/]+\/install\/status$/, callback: handleInstallStatus }],
};
const resolveClientInterfaces = (version, definitions = CLIENT_INTERFACES) => {
  assertClientVersion(version);
  return Object.fromEntries(Object.entries(definitions).map(([purpose, variants]) => {
    const selected = variants.filter(item => compareClientVersions(version, item.since) >= 0)
      .reduce((latest, item) => !latest || compareClientVersions(item.since, latest.since) > 0 ? item : latest, null);
    if (!selected) throw clientProtocolError("client_interface_missing", "当前 TestFlight 版本缺少已支持的接口实现");
    return [purpose, selected];
  }));
};
const clientInterfaces = req => req.clientInterfaces ||= resolveClientInterfaces(storedClientVersion());
// 变更响应格式的实现可在同一条规则提供 decode，向业务层输出约定的内部格式。
const clientResponse = (req, purpose, response) => (clientInterfaces(req)[purpose].decode || requireOK)(response, req);
const configureClientProtocol = client => {
  client ??= { version: MIN_CLIENT_VERSION };
  if (!client || typeof client !== "object" || Array.isArray(client) ||
      Object.keys(client).some(name => !["version", "build"].includes(name)))
    throw clientProtocolError("client_version_invalid", "请由 Scripting 提交当前 TestFlight 版本");
  clientVersionParts(client.version);
  if (client.build !== undefined && (typeof client.build !== "string" || !/^[0-9]+(?:\.[0-9]+)*$/.test(client.build)))
    throw clientProtocolError("client_version_invalid", "TestFlight 构建号无效");
  const info = { version: client.version, ...(client.build === undefined ? {} : { build: client.build }) };
  // 即使降级到了不支持的版本，也保存实际版本，禁止继续沿用之前的高版本。
  if (JSON.stringify(storage.readJSON(CLIENT_PROTOCOL_KEY)) !== JSON.stringify(info) && !storage.writeJSON(CLIENT_PROTOCOL_KEY, info))
    throw importError(503, "storage_failed", "无法保存 TestFlight 版本，请重试");
  assertClientVersion(info.version);
  return info;
};
const clientInterfacePath = (req, purpose, accountId, suffix) => {
  const implementation = clientInterfaces(req)[purpose];
  if (!implementation) throw clientProtocolError("client_interface_missing", "未登记 TestFlight 接口");
  return accountId === undefined ? "/" + implementation.version + "/" + implementation.suffix
    : accountRoute(accountId, suffix || implementation.suffix, implementation.version);
};
const routeClientRequest = req => {
  const implementations = clientInterfaces(req);
  const suffix = req.path.replace(/^\/v\d+/, "");
  const matches = item => item.method === req.method && item.path.test(suffix);
  if (!Object.values(CLIENT_INTERFACES).some(variants => variants.some(matches))) return;
  const selected = Object.entries(implementations).find(([, item]) => matches(item));
  if (!selected || req.version !== selected[1].version)
    throw clientProtocolError("client_interface_unsupported", "此接口版本不属于当前 TestFlight 协议，请更新客户端后重试");
  req.operation = selected[0];
  return selected[1].callback(req);
};


// ===== 入口路由 =====
/** 路由表仅在闭包内保存；定时执行时不创建请求上下文。 */
const routeRequest = (() => {
  /** @type {Array<{method: string, path: RegExp, callback: function(RequestContext): *}>} */
  const routes = controlRoutes
  return async req => {
    if (rejectControlPath(req)) return { response: controlReply(400, { error: { code: "invalid_request", message: "控制接口路径无效" } }) }
    /** @type {typeof routes[number] | undefined} */
    const route = routes.find((item) => (item.method === "*" || item.method === req.method) && item.path.test(req.path))
    return route ? route.callback(req) : routeClientRequest(req)
  }
})()

// main 只负责执行类型、路由交付与默认转发；错误出口保持不变。
const main = async () => {
  try {
    const req = this.$request ? createRequestContext() : null;
    // 入口先检查；控制接口仍可上报新版本、读取或清理本地数据。
    if (!req || !req.path.startsWith("/api/"))
      assertClientVersion(storedClientVersion());
    if (!req) {
      await runScheduledRefresh();
      return finish();
    }

    const response = await routeRequest(req)
    if (response) {
      if (response.response?.status === 426)
        notify("TestFlight 中转：版本不支持", exactParse(response.response.body).error?.message || "请检查 TestFlight 版本，最低支持 4.4.1");
      return finish(response)
    }

    finish(await forwardRequest(req))
  } catch (error) {
    if (error?.status === 426) notify("TestFlight 中转：版本不支持", error.message);
    logError(error);
    finish(this.$request ? { response: createErrorResponse(error) } : undefined);
  }
};

main();
