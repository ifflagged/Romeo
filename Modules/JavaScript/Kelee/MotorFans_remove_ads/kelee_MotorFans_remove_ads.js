// Loon 响应体修改脚本模板
// 适用于 Loon 的 HTTP 响应脚本

(() => {
    // 快速失败检查
    if (!$response?.body) return $done({});

    let body;
    try {
        body = JSON.parse($response.body);
    } catch (e) {
        console.log(`JSON解析失败: ${e.message}`);
        return $done({});
    }

    let modified = false;

    // 预定义过滤类型（避免重复创建数组）
    const UNWANTED_TAB_TYPES = new Set([2, 3]);

    // 命中关键字即移除对应字段（区分大小写）
    const REMOVED_KEYWORDS = [
        "_ad_",
        "splash",
        "adPatch",
        "AdFree",
        "adFeed",
        "AdTime",
        "AdAlert",
        "AdConfig",
        "cancelInspire",
        "financeAvoidChannel",
        "_popup_",
        "HomeKingKong",
        "MyWalletConfig",
        "insurance_product_url",
        "insurance_order_url",
    ];

    // 服务端 data 为空/null 时兜底为 3 个 Tab，避免客户端继续使用旧缓存
    const FALLBACK_TITLES = {
        0: "首页",
        1: "玩圈",
        4: "我的",
    };
    const FALLBACK_TAB_TYPES = [0, 1, 4];

    const fallbackTab = (type, light) => {
        const index = type === 4 ? 5 : type + 1;
        return {
            titleColor: light ? "#333333" : "#C7C9D0",
            imageUrl: light
                ? `https://imgs3.58moto.com/img/app/${index}@3x.png`
                : `https://imgs3.58moto.com/img/icon2/black_${index}@3x.png`,
            type,
            title: FALLBACK_TITLES[type],
            selectedImageUrl: light
                ? `https://imgs3.58moto.com/img/app/${index}_s@3x.png`
                : `https://imgs3.58moto.com/img/icon2/black_${index}_s@3x.png`,
            selectedTitleColor: light ? "#111111" : "#C7C9D0",
        };
    };

    const getFallbackData = () => ({
        dymaicTabBar: FALLBACK_TAB_TYPES.map((type) => fallbackTab(type, true)),
        blackDymaicTabBar: FALLBACK_TAB_TYPES.map((type) => fallbackTab(type, false)),
    });

    const shouldRemoveTab = (item) => {
        const type = item?.type;
        return UNWANTED_TAB_TYPES.has(type) || UNWANTED_TAB_TYPES.has(Number(type));
    };

    const shouldRemoveField = (key) => {
        return REMOVED_KEYWORDS.some((keyword) => key.includes(keyword));
    };

    // 递归移除命名字段
    const cleanFields = (node) => {
        if (Array.isArray(node)) {
            node.forEach(cleanFields);
            return;
        }
        if (!node || typeof node !== "object") return;

        for (const key of Object.keys(node)) {
            if (shouldRemoveField(key)) {
                delete node[key];
                modified = true;
            } else {
                cleanFields(node[key]);
            }
        }
    };

    // API路径处理映射
    const processData = () => {
        let dataPath = body?.data;
        if (dataPath === null || dataPath === undefined) {
            body.data = JSON.stringify(getFallbackData());
            modified = true;
            return;
        }

        if (typeof dataPath === "string") {
            try {
                dataPath = JSON.parse(dataPath);
            } catch (e) {
                console.log(`data JSON解析失败: ${e.message}`);
                return;
            }
        }
        if (typeof dataPath !== "object" || dataPath === null) return;

        // 数组过滤优化
        for (const tabKey of ["dymaicTabBar", "blackDymaicTabBar"]) {
            const items = dataPath[tabKey];
            if (!Array.isArray(items) || items.length === 0) continue;

            const filteredItems = items.filter((item) => !shouldRemoveTab(item));
            if (filteredItems.length !== items.length) {
                dataPath[tabKey] = filteredItems;
                modified = true;
            }
        }

        // 移除命名字段
        cleanFields(dataPath);

        // data 原本是字符串时同步写回
        if (typeof body.data === "string") {
            body.data = JSON.stringify(dataPath);
        }
    };

    // 返回结果
    processData();
    $done(modified ? { body: JSON.stringify(body) } : {});
})();