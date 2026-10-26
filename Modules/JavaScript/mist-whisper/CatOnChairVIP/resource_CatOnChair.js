// console.log(`🔍 [当前应用特征] UA: ${$request.headers['User-Agent'] || '无'} | 包名: ${$request.headers['X-Client-Bundle-ID'] || $request.headers['x-client-bundle-id'] || '无'}`);

const isQuanX = typeof $task !== "undefined";

const headers = $request.headers;
const bundleId = headers['X-Client-Bundle-ID'] || headers['x-client-bundle-id'] || '';

if (bundleId !== "com.ryanyao.catonchair") {
    $done({});
} else {

    const purchase_time = "2026-06-03T02:08:37Z";
    const entitlement_ids = ["pro", "Pro", "premium", "Premium", "vip", "VIP", "lifetime", "pro_features"];
    const product_id = "lifetime";

    let mockObj = {
        "request_date": purchase_time,
        "request_date_ms": 1780452688321,
        "offerings": [],
        "placements": { "fallback_offering_id": "default" },
        "subscriber": {
            "original_app_user_id": "$RCAnonymousID:cb5a158a06df4879920b73a6ef669ad9",
            "first_seen": purchase_time,
            "last_seen": purchase_time,
            "original_application_version": "3",
            "original_purchase_date": purchase_time,
            "management_url": null,
            "non_subscriptions": {},
            "other_purchases": {},
            "entitlements": {},
            "subscriptions": {}
        }
    };

    entitlement_ids.forEach(id => {
        mockObj.subscriber.entitlements[id] = { "expires_date": null, "original_purchase_date": purchase_time, "purchase_date": purchase_time, "product_identifier": product_id, "ownership_type": "PURCHASED" };
    });
    mockObj.subscriber.subscriptions[product_id] = { "expires_date": null, "original_purchase_date": purchase_time, "purchase_date": purchase_time, "ownership_type": "PURCHASED", "store": "app_store" };

    const responseBody = JSON.stringify(mockObj);

    console.log(`🟢 校验成功！已解锁。当前工具环境: ${isQuanX ? 'Quantumult X' : 'Loon/Surge/Egern/小火箭'}`);

    if (isQuanX) {
        $done({ 
            status: "HTTP/1.1 200 OK", 
            headers: { "Content-Type": "application/json; charset=utf-8" }, 
            body: responseBody 
        });
    } else {

        $done({
            response: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: responseBody
            }
        });
    }
}
