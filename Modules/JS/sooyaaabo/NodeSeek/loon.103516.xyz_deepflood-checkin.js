/* ====================
- DeepFlood 自动签到脚本
==================== */

const LOG_TAG        = "[DeepFlood]";
const COOKIE_CACHE_KEY   = "DF_COOKIE";          
const COOKIE_EXPIRY_KEY  = "DF_COOKIE_EXPIRY";   
const COOKIE_TTL_MS      = 30 * 24 * 60 * 60 * 1000; 
const COOKIE_NEAR_DAYS   = 3;                    
const ERROR_MSG_MAX_LEN  = 200;                  

let useRandomReward = false;  

if (typeof $argument !== "undefined" && $argument) {
    try {
        const arg = typeof $argument === "string" ? JSON.parse($argument) : $argument;
        const modeRaw = arg["Mode-DeepFlood"];
        if (modeRaw !== undefined) {
            const v = String(modeRaw).trim().toLowerCase();
            useRandomReward = (v === "random");
        }
    } catch (e) {
        console.log(`${LOG_TAG} 参数解析错误: ${e}`);
    }
}

function buildTitle(module, result) {
    return `DeepFlood · ${module} · ${result}`;
}

function buildBody(pairs) {
    return pairs
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
        .map(([k, v]) => `${k}：${v}`)
        .join("\n");
}

function notify(module, result, subtitle, bodyPairs) {
    const title = buildTitle(module, result);
    const body  = Array.isArray(bodyPairs) ? buildBody(bodyPairs) : String(bodyPairs || "");
    $notification.post(title, subtitle, body);
}

function safeMsg(s) {
    return String(s == null ? "" : s).slice(0, ERROR_MSG_MAX_LEN);
}

function formatDate(ts) {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getCookieStatus(expiryAt, now) {
    if (!expiryAt || expiryAt <= 0) {
        return { label: "未知", expired: false, remainDays: -1 };
    }
    const remainMs   = expiryAt - now;
    const remainDays = Math.floor(remainMs / (24 * 60 * 60 * 1000));

    if (remainMs <= 0) {
        return { label: "已过期", expired: true, remainDays: 0 };
    }
    if (remainDays <= COOKIE_NEAR_DAYS) {
        return { label: `临期(剩余 ${remainDays} 天)`, expired: false, remainDays };
    }
    return { label: "正常", expired: false, remainDays };
}

const isGetHeader = typeof $request !== "undefined";

(async () => {
    if (isGetHeader) {
        handleCaptureCookie();
    } else {
        await handleCheckin();
    }
})().finally(() => {
    $done({});
});

function handleCaptureCookie() {
    const allHeaders = $request.headers || {};
    const headerKeys = Object.keys(allHeaders);
    const getHeader  = (name) => {
        const key = headerKeys.find(k => k.toLowerCase() === name.toLowerCase());
        return key ? allHeaders[key] : "";
    };

    const cookie = getHeader("Cookie");

    if (!cookie || cookie.trim() === "") {
        console.log(`${LOG_TAG} 请求头中未发现 Cookie`);
        notify("Cookie", "失败", "未发现 Cookie", [
            ["建议", "登录 DeepFlood 并访问个人中心后重试"],
        ]);
        return;
    }

    const now      = Date.now();
    const expiryAt = now + COOKIE_TTL_MS;

    const okCookie = $persistentStore.write(cookie, COOKIE_CACHE_KEY);
    const okExpiry = $persistentStore.write(String(expiryAt), COOKIE_EXPIRY_KEY);

    if (okCookie && okExpiry) {
        console.log(`${LOG_TAG} Cookie 已保存, 长度=${cookie.length}`);
        notify("Cookie", "成功", `已保存 Cookie(长度 ${cookie.length})`, [
            ["有效期至", formatDate(expiryAt)],
            ["说明",    "已可进行每日签到"],
        ]);
    } else {
        console.log(`${LOG_TAG} Cookie 写入持久化失败`);
        notify("Cookie", "失败", "保存失败", [
            ["原因", "持久化写入失败"],
            ["建议", "检查脚本权限"],
        ]);
    }
}

async function handleCheckin() {
    const cookie = $persistentStore.read(COOKIE_CACHE_KEY) || "";
    const expiryRaw = $persistentStore.read(COOKIE_EXPIRY_KEY);
    const expiryAt = expiryRaw ? parseInt(expiryRaw, 10) : 0;
    const now = Date.now();

    if (!cookie || cookie.trim() === "") {
        console.log(`${LOG_TAG} 未找到 Cookie 缓存`);
        notify("Task", "提示", "无 Cookie 缓存", [
            ["建议", "开启 Cookie 抓取并访问个人中心"]
        ]);
        return;
    }

    const status = getCookieStatus(expiryAt, now);

    if (status.expired) {
        console.log(`${LOG_TAG} Cookie 已过期, 中止签到`);
        notify("Task", "失败", "Cookie 已过期", [
            ["建议", "重新抓取 Cookie 后再试"]
        ]);
        return;
    }

    const modeLabel = useRandomReward ? "随机鸡腿" : "固定鸡腿";
    console.log(`${LOG_TAG} 模式: ${modeLabel}, Cookie 状态: ${status.label}`);

    const url = `https://www.deepflood.com/api/attendance?random=${useRandomReward}`;
    const headers = {
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Origin": "https://www.deepflood.com",
        "Referer": "https://www.deepflood.com/board",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
    };

    try {
        const resp = await httpPost(url, headers);
        const httpStatus = resp.status || 0;
        const body = resp.body || "";

        let data = {};
        let message = "";

        console.log(`${LOG_TAG} HTTP status=${httpStatus}`);

        try {
            data = typeof body === "string" ? JSON.parse(body) : body;
            message = String(data?.message || data?.msg || "");
            console.log(`${LOG_TAG} JSON解析 message: ${message || "无"}`);
        } catch (e) {
            console.log(`${LOG_TAG} 响应体非 JSON 格式`);
        }

        const content = message || String(body).substring(0, 150) || "服务端无返回";

        if (httpStatus >= 200 && httpStatus < 300) {
            const gain = data?.gain !== undefined ? data.gain : null;
            const current = data?.current !== undefined ? data.current : null;
            let successMsg = message || "您已签到成功或已经签过到了";

            if (gain !== null && current !== null) {
                successMsg = `获得 ${gain} 个鸡腿，总计 ${current} 个鸡腿`;
            }

            console.log(`${LOG_TAG} 签到成功: ${successMsg}`);
            notify("Task", "成功", successMsg, [
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }
        else if (httpStatus === 401) {
            console.log(`${LOG_TAG} 登录状态失效`);
            notify("Task", "失败", "登录状态失效", [
                ["建议", "重新抓取 Cookie"],
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }
        else if (httpStatus === 403) {
            console.log(`${LOG_TAG} 403 风控拦截: ${content}`);
            notify("Task", "失败", "403 风控拦截", [
                ["原因", content],
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }
        else if (httpStatus === 429) {
            console.log(`${LOG_TAG} 请求过于频繁: ${content}`);
            notify("Task", "失败", "请求过于频繁", [
                ["原因", content],
                ["建议", "稍后重试"],
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }
        else if (httpStatus === 500) {
            console.log(`${LOG_TAG} 500 服务器错误: ${content}`);
            notify("Task", "失败", "服务器内部错误", [
                ["原因", content],
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }
        else {
            console.log(`${LOG_TAG} 未知状态码: ${httpStatus}, 内容: ${content}`);
            notify("Task", "异常", `未知状态码 (${httpStatus})`, [
                ["内容", safeMsg(content)],
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }

    } catch (err) {
        console.log(`${LOG_TAG} 请求异常: ${err}`);
        notify("Task", "异常", safeMsg(err && err.message ? err.message : err), [
            ["模式", modeLabel],
            ["Cookie 状态", status.label],
            ["建议", "检查网络或脚本配置"]
        ]);
    }
}

function httpPost(url, headers, body = "") {
    return new Promise((resolve, reject) => {
        if (typeof $task !== "undefined" && $task.fetch) {
            $task.fetch({ url, method: "POST", headers, body }).then(
                (resp) => resolve({
                    status: resp.statusCode || 0,
                    body:   resp.body || "",
                }),
                (reason) => reject(reason && reason.error ? reason.error : reason)
            );
            return;
        }

        if (typeof $httpClient !== "undefined" && $httpClient.post) {
            $httpClient.post({ url, headers, body }, (error, response, data) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({
                    status: (response && response.status) || 0,
                    body:   data || "",
                });
            });
            return;
        }

        reject(new Error("不支持当前环境"));
    });
}