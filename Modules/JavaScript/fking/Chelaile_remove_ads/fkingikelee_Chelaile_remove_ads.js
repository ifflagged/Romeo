/*
https://t.me/ibilibili
2026-07-04 19:20:23
*/

(() => {
    if (!$response?.body) return $done({});

    const PREFIX = "**YGKJ";
    const SUFFIX = "YGKJ##";

    let rawBody = $response.body;
    let jsonText = rawBody;

    const hasWrapper = rawBody.startsWith(PREFIX) && rawBody.endsWith(SUFFIX);

    if (hasWrapper) {
        jsonText = rawBody.slice(PREFIX.length, rawBody.length - SUFFIX.length);
    }

    let body;
    try {
        body = JSON.parse(jsonText);
    } catch (e) {
        console.log(`JSON解析失败: ${e.message}`);
        return $done({});
    }

    const data = body?.jsonr?.data;
    if (!data || typeof data !== "object") {
        return $done({});
    }

    let modified = false;

    const deleteKeys = [
        "newYear",
        "splashGray",
        "enableSplashGray",
        "splashAdType",
        "splashCloseTime",
        "sadt",
        "dynamicSplashTime",
        "splashCoverBar",
        "splashSkipShowType",
        "skipPopType",
        "skipPopTime",
        "skipStopDis",
        "adPopExhibitTime",
        "isAdPopExhibit",
        "adStrategy",
        "adConfigTriggerDelayTime",
        "adNeedAnimate",
        "needFetchInterstitialAd",
        "intersitialAdPre",
        "nativeAdFetchType",
        "preloadAds",
        "searchAdPos",
        "searchPageAdType",
        "searchPageAdAnimation",
        "showTopSearchAd",
        "feedAdClickSlipRegionType",
        "feedAdClickSlipShowType",
        "feedInfoSource",
        "feedBackCutType",
        "feedBackShakeType",
        "expressAdDelayRefreshTime",
        "disableAdAutoRefresh",
        "reportAdNumLimit",
        "shakeLeve",
        "bdCloseDownloadDisplay",
        "bdShowSplashDialog",
        "sat",
        "ldrAdAnimal",
        "newKuaishouPicUrl",
        "newKuaishouShowType",
        "newKuaishouHigh",
        "newKuaishouFeedId",
        "kuaishouFeedId",
        "showKSVideoHeader",
        "ttSplashUsePhonePixel",
        "supportMiniGame",
        "welfareColor",
        "welfareAllPage",
        "welfareUrl",
        "welfareSignUrl",
        "oneLoginType",
        "oneLoginPopType",
        "oneLoginCheck",
        "douyinLoginType",
        "appInstallExhibitInterval",
        "aiSpeakKeywords",
        "aiSpeakTime",
        "aiSpeakPreTime",
        "aiSpeakAfterTime",
        "voiceSearchMode",
        "favGrayForAI",
        "scanCodeTipType",
        "blacklistDomains",
        "appBackupDomains",
        "useHttpDns",
        "weatherGrayFlag"
    ];

    for (const key of deleteKeys) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            delete data[key];
            modified = true;
        }
    }

    if (!modified) {
        return $done({});
    }

    const result = JSON.stringify(body);
    const finalBody = hasWrapper ? `${PREFIX}${result}${SUFFIX}` : result;

    $done({ body: finalBody });
})();