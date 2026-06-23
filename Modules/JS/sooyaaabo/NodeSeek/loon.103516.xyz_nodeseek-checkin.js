/* ====================
- NodeSeek 自动签到脚本
==================== */

const LOG_TAG        = "[NodeSeek]";
const COOKIE_CACHE_KEY   = "NS_COOKIE";          
const COOKIE_EXPIRY_KEY  = "NS_COOKIE_EXPIRY";   
const COOKIE_TTL_MS      = 30 * 24 * 60 * 60 * 1000; 
const COOKIE_NEAR_DAYS   = 3;                    
const ERROR_MSG_MAX_LEN  = 200;                  

let useRandomReward = false;  

if (typeof $argument !== "undefined" && $argument) {
    try {
        const arg = typeof $argument === "string" ? JSON.parse($argument) : $argument;
        const modeRaw = arg["Mode-NodeSeek"];
        if (modeRaw !== undefined) {
            const v = String(modeRaw).trim().toLowerCase();
            useRandomReward = (v === "random");
        }
    } catch (e) {
        console.log(`${LOG_TAG} 参数解析错误: ${e}`);
    }
}

function buildTitle(module, result) {
    return `NodeSeek · ${module} · ${result}`;
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

function notifyFailure({ module = "Task", subtitle, modeLabel, cookieStatus }) {
    const bodyPairs = [];
    if (modeLabel) bodyPairs.push(["模式", modeLabel]);
    if (cookieStatus) bodyPairs.push(["Cookie状态", cookieStatus]);
    
    notify(module, "失败", subtitle, bodyPairs);
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
        notifyFailure({
            module: "Cookie",
            subtitle: "未发现有效 Cookie，请登录并访问个人中心后重试"
        });
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
        notifyFailure({
            module: "Cookie",
            subtitle: "存储失败，持久化数据写入失败"
        });
    }
}

async function handleCheckin() {
    const cookie = $persistentStore.read(COOKIE_CACHE_KEY) || "";
    const expiryRaw = $persistentStore.read(COOKIE_EXPIRY_KEY);
    const expiryAt = expiryRaw ? parseInt(expiryRaw, 10) : 0;
    const now = Date.now();

    if (!cookie || cookie.trim() === "") {
        console.log(`${LOG_TAG} 未找到 Cookie 缓存`);
        notifyFailure({
            subtitle: "未发现 Cookie 缓存，请先完成抓取"
        });
        return;
    }

    const status = getCookieStatus(expiryAt, now);

    if (status.expired) {
        console.log(`${LOG_TAG} Cookie 已过期, 中止签到`);
        notifyFailure({
            subtitle: "Cookie 已过期，请重新登录抓取",
            cookieStatus: status.label
        });
        return;
    }

    const modeLabel = useRandomReward ? "随机鸡腿" : "固定鸡腿";
    console.log(`${LOG_TAG} 模式: ${modeLabel}, Cookie 状态: ${status.label}`);

    const url = `https://www.nodeseek.com/api/attendance?random=${useRandomReward}`;
    const headers = {
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Origin": "https://www.nodeseek.com",
        "Referer": "https://www.nodeseek.com/board",
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
            
            let successMsg = message || "签到成功";
            let taskResult = "成功";

            if (gain !== null && current !== null) {
                successMsg = `获得 ${gain} 个鸡腿，总计 ${current} 个鸡腿`;
            } else if (message && (message.includes("已签到") || message.includes("重复"))) {
                taskResult = "重复";
            }

            console.log(`${LOG_TAG} 签到结果: ${successMsg}`);
            notify("Task", taskResult, successMsg, [
                ["模式", modeLabel],
                ["Cookie 状态", status.label]
            ]);
        }
        else if (httpStatus === 401) {
            console.log(`${LOG_TAG} 登录状态失效`);
            notifyFailure({
                subtitle: "401 登录状态失效，请重新登录抓取",
                modeLabel,
                cookieStatus: status.label
            });
        }
        else if (httpStatus === 403) {
            console.log(`${LOG_TAG} 403 风控拦截原因: ${content}`);
            notifyFailure({
                subtitle: "403 触发风控拦截，请尝试切换网络环境",
                modeLabel,
                cookieStatus: status.label
            });
        }
        else if (httpStatus === 429) {
            console.log(`${LOG_TAG} 429 请求频繁原因: ${content}`);
            notifyFailure({
                subtitle: "429 请求过于频繁，请稍后再试或调整定时",
                modeLabel,
                cookieStatus: status.label
            });
        }
        else if (httpStatus === 500) {
            console.log(`${LOG_TAG} 500 服务器错误内容: ${content}`);
            notifyFailure({
                subtitle: "500 服务器内部错误，服务器可能正在维护",
                modeLabel,
                cookieStatus: status.label
            });
        }
        else {
            console.log(`${LOG_TAG} 未知状态码: ${httpStatus}, 内容: ${content}`);
            notifyFailure({
                subtitle: `${httpStatus} 发生未知异常，请检查脚本日志`,
                modeLabel,
                cookieStatus: status.label
            });
        }

    } catch (err) {
        console.log(`${LOG_TAG} 请求异常: ${err && err.message ? err.message : err}`);
        notifyFailure({
            subtitle: "请求发生异常，请检查网络或代理配置",
            modeLabel,
            cookieStatus: status.label
        });
    }
}

function httpPost(url, headers, body = "{}") {
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