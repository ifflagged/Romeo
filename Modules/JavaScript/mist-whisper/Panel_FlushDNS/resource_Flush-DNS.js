// 引用地址：https://raw.githubusercontent.com/Rabbit-Spec/Surge/Master/Module/Panel/Flush-DNS/Moore/Flush-DNS.js

/*
 *  Flush-DNS.js（增强版 v2.2）
 *  原作者：@zZPiglet
 *  修改：@Rabbit-Spec
 *  二次优化：wish
 *  更新时间：2025.06.02
 *  版本：2.2
 *
 *  功能说明：
 *  - 在 Surge 面板中显示当前 DNS 解析延迟（毫秒）。
 *  - （可选）显示当前已缓存的 DNS 服务器列表及缓存总条目数。
 *  - 点击面板按钮时，执行清空本地 DNS 缓存。
 *  - 支持从 argument 传入自定义面板标题、图标、图标颜色、是否显示服务器列表、是否显示缓存条目数等参数。
 */

!(async () => {
    // -------------------- 1. 准备默认面板对象和参数 --------------------
    // panel 对象会传给 $done，Surge 根据它渲染面板
    let panel = {
        title: "Flush DNS",      // 面板默认标题
        icon: undefined,         // 可选图标
        "icon-color": undefined  // 可选图标颜色
    };

    // 控制是否在面板中展示 DNS 服务器列表和缓存条目数
    let showServer = true;       // 是否显示服务器列表，默认显示
    let showEntryCount = false;  // 是否显示缓存条目数，默认不显示

    // 存放后续读取到的 DNS 缓存数据
    let dnsEntries = [];         // 完整缓存条目列表（每个元素包含 domain/ip/server）
    let uniqueServers = [];      // 去重后的服务器 IP 列表

    // 读取 Surge 配置中传入的 $argument（形如 "key1=val1&key2=val2"）
    if (typeof $argument !== "undefined") {
        // 解析参数成对象
        let arg = Object.fromEntries($argument.split("&").map(item => item.split("=")));
        // 如果用户传入自定义标题
        if (arg.title) {
            panel.title = decodeURIComponent(arg.title);
        }
        // 自定义图标（emoji 或内置图标名称）
        if (arg.icon) {
            panel.icon = decodeURIComponent(arg.icon);
        }
        // 自定义图标颜色（十六进制或关键字）
        if (arg.color) {
            panel["icon-color"] = decodeURIComponent(arg.color);
        }
        // 如果用户传 server=false，则不显示服务器列表
        if (arg.server === "false") {
            showServer = false;
        }
        // 如果用户传 entries=true，则在面板中展示缓存总条目数
        if (arg.entries === "true") {
            showEntryCount = true;
        }
    }

    // -------------------- 2. 如果需要，拉取 DNS 缓存数据 --------------------
    if (showServer || showEntryCount) {
        try {
            // 调用 /v1/dns 接口获取完整缓存信息
            let response = await httpAPI("/v1/dns", "GET");
            // 如果接口返回结构不正确，抛出异常
            if (!response || !Array.isArray(response.dnsCache)) {
                throw new Error("未能获取到合法的 dnsCache 数据");
            }
            dnsEntries = response.dnsCache;  // 保存完整的缓存条目数组

            // 提取出所有 server 字段并去重
            let serverList = dnsEntries.map(item => item.server || "").filter(s => s);
            uniqueServers = Array.from(new Set(serverList));
        } catch (err) {
            // 如果拉取失败，将 showServer 和 showEntryCount 置为 false，并记录错误原因
            showServer = false;
            showEntryCount = false;
            console.error("获取 /v1/dns 接口失败：", err.message);
        }
    }

    // -------------------- 3. 处理按钮点击触发：清空 DNS 缓存 --------------------
    if ($trigger === "button") {
        try {
            // 调用 /v1/dns/flush 接口执行清空操作
            await httpAPI("/v1/dns/flush");
            // 清空后重置本地缓存数据数组
            dnsEntries = [];
            uniqueServers = [];
        } catch (err) {
            console.error("清空 DNS 缓存失败：", err.message);
            // 此处不做进一步处理，后续仍会显示上一次缓存数据
        }
    }

    // -------------------- 4. 获取当前 DNS 延迟 --------------------
    let delayText = "N/A";  // 如果获取失败，保持为 "N/A"
    try {
        // 注意：不要在此处传入 "GET"，要使用默认的 POST 调用
        let delayResp = await httpAPI("/v1/test/dns_delay");
        if (delayResp && typeof delayResp.delay === "number") {
            // delayResp.delay 单位为秒，乘以1000 转换成毫秒，并四舍五入到整数
            delayText = `${Math.round(delayResp.delay * 1000)}ms`;
        } else {
            throw new Error("delay 字段缺失或类型不对");
        }
    } catch (err) {
        console.error("获取 /v1/test/dns_delay 接口失败：", err.message);
    }

    // -------------------- 5. 拼接面板内容 --------------------
    // 先加入延迟信息
    let contentLines = [];
    contentLines.push(`DNS 延迟: ${delayText}`);

    // 如果用户希望展示缓存条目数，则加入
    if (showEntryCount) {
        contentLines.push(`缓存条目数: ${dnsEntries.length}`);
    }

    // 如果用户希望展示服务器列表，则拼接前 5 条并提示总数
    if (showServer) {
        if (uniqueServers.length === 0) {
            contentLines.push("server: （暂无缓存）");
        } else {
            contentLines.push("server:");
            // 显示前 5 个服务器，超出的在末尾提示
            let MAX_SHOW = 5;
            uniqueServers.slice(0, MAX_SHOW).forEach(serverIP => {
                contentLines.push(`  • ${serverIP}`);
            });
            if (uniqueServers.length > MAX_SHOW) {
                contentLines.push(`  …（共 ${uniqueServers.length} 个）`);
            }
        }
    }

    // 最终将多行内容合并为一个字符串
    panel.content = contentLines.join("\n");

    // -------------------- 6. 告诉 Surge 渲染并结束脚本 --------------------
    $done(panel);
})();

/**
 * 使用 Promise 封装 Surge 内置的 $httpAPI，方便以 async/await 调用
 * @param {string} path   - Surge 本地 API 路径，如 "/v1/dns"
 * @param {string} method - HTTP 方法，"GET" 或 "POST"。默认不传则为 "POST"
 * @param {Object|null} body - 可选的请求体（只有 POST 时才需要）
 * @returns {Promise<Object>} - 返回解析后的 JSON 对象
 */
function httpAPI(path = "", method = "POST", body = null) {
    return new Promise((resolve, reject) => {
        try {
            $httpAPI(method, path, body, (result) => {
                resolve(result);
            });
        } catch (e) {
            reject(e);
        }
    });
}