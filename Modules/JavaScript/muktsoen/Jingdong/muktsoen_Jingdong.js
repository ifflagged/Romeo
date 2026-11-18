// 京东去广告（Surge 移植版）
// 原作者：ccyykk666、RuCu6（Loon 插件，2026-10-04）
// 来源：https://raw.githubusercontent.com/ccyykk666/Loon-Plugin/main/plugins/jingdong/Jingdong_remove_ads.js
// 移植改动：
//   1. $argument 由对象改为分号分隔字符串解析，模块 #!arguments 保留 4 个开关。
//   2. 补 Loon 脚本规则的两处门禁：响应 status 须为 200、Content-Encoding 须为空或 identity/gzip/deflate/br。
//   3. 其余逻辑与原脚本一致；异常时原脚本自带 catch 放行。
// 注意：Surge 的 http-response 脚本没有 $request.body，主脚本 uniformRecommend 分支里靠请求体判断的那两路
// （订单/物流推荐）在 Surge 下退化，仅靠 adIds/tabs 判断；其余分支不受影响。
// Surge 移植：$argument 解析。Loon 传对象，Surge 传字符串（模块 argument 参数）。
// 字符串格式为分号分隔的 k:v（模块里拼，不含逗号，避免 [Script] 行解析问题）。
// 无法识别的值不写入，交给脚本内默认值兜底（占位符未替换时也安全）。
function __parseSurgeArgs() {
  var a = (typeof $argument !== "undefined") ? $argument : undefined;
  if (a && typeof a === "object") return a;
  var o = {};
  if (typeof a === "string") {
    var parts = a.split(";");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split(":");
      if (kv.length === 2) {
        if (kv[1] === "true" || kv[1] === "1") o[kv[0]] = true;
        else if (kv[1] === "false" || kv[1] === "0") o[kv[0]] = false;
      }
    }
  }
  return o;
}

// Surge 移植：Loon 脚本规则要求 Content-Encoding 为空或 identity/gzip/deflate/br；
// 其他编码直接放行（与 Loon 条件一致）。
function __badEncoding() {
  if (typeof $response === "undefined" || !$response || !$response.headers) return false;
  var h = $response.headers;
  for (var k in h) {
    if (Object.prototype.hasOwnProperty.call(h, k) && k.toLowerCase() === "content-encoding") {
      return !/^(?:identity|gzip|deflate|br)$/i.test(String(h[k]));
    }
  }
  return false;
}

const url = $request.url;
const functionId = url.match(/[?&]functionId=([^&#]*)/)?.[1] || "";
const options = {
  HomeClean: true,
  OrderAds: true,
  ProfileClean: true,
  ProductClean: true
};
var __ARGS = __parseSurgeArgs();
for (const name of Object.keys(options)) {
  if (!Object.prototype.hasOwnProperty.call(__ARGS, name)) continue;
  const value = __ARGS[name];
  options[name] =
    value === true || value === "true" || value === 1 || value === "1";
}
const clearRecommendResponse = (obj) => {
  if (Array.isArray(obj?.wareInfoList)) obj.wareInfoList = [];
  if (Array.isArray(obj?.tabs)) obj.tabs = [];
  if (obj?.tabTnInfo) obj.tabTnInfo = {};
  if (Object.prototype.hasOwnProperty.call(obj, "adIds")) obj.adIds = "";
  if (Object.prototype.hasOwnProperty.call(obj, "title")) delete obj.title;
  if (Object.prototype.hasOwnProperty.call(obj, "dmTitle")) delete obj.dmTitle;
};

if (!$response.body || Number($response.status) !== 200 || __badEncoding()) {
  $done({});
} else {
  try {
    let obj = JSON.parse($response.body);

  if (
    options.OrderAds &&
    ["deliverLayer", "orderTrackBusiness"].includes(functionId)
  ) {
    if (obj?.bannerInfo) delete obj.bannerInfo;
    if (obj?.floors?.length > 0) {
      obj.floors = obj.floors.filter(
        (floor) =>
          !["banner", "jdDeliveryBanner", "noticeFloorTrack"].includes(
            floor?.mId
          )
      );
      for (const floor of obj.floors) {
        if (floor?.mId === "orderTrackList" && floor?.data?.allPackages) {
          delete floor.data.allPackages;
        }
      }
    }
  } else if (options.OrderAds && functionId === "myOrderInfo") {
    const cleanOrderFloors = (floors) => {
      if (!Array.isArray(floors)) return floors;

      let newFloors = [];
      for (let floor of floors) {
        if (
          [
            "async_circleTopicFloor",
            "async_takeoutCrossFloor",
            "async_taro_contentGrassUpFloor",
            "bannerFloor",
            "bpDynamicFloor",
            "plusFloor"
          ].includes(floor?.mId)
        ) {
          continue;
        }

        if (floor?.mId === "customerServiceFloor" && floor?.data?.moreText) {
          if (floor.data.moreIcon) delete floor.data.moreIcon;
          if (floor.data.moreIcon_dark) delete floor.data.moreIcon_dark;
          floor.data.moreText = " ";
        }

        newFloors.push(floor);
      }
      return newFloors;
    };

    obj.floors = cleanOrderFloors(obj?.floors);
    if (obj?.data) obj.data.floors = cleanOrderFloors(obj.data.floors);
    if (obj?.data?.ctx) {
      delete obj.data.ctx.lotteryMap;
      delete obj.data.ctx.adBannerInfo;
      delete obj.data.ctx.orderDetailGuide;
    }
  } else if (options.OrderAds && functionId === "queryFloorDetailInfo") {
    const removeFloorIds = [
      "async_circleTopicFloor",
      "async_recommendFloor",
      "async_takeoutCrossFloor",
      "async_taro_contentGrassUpFloor",
      "bpDynamicFloor",
      "plusFloor"
    ];
    const keepFloor = (floor) => !removeFloorIds.includes(floor?.mId);
    if (obj?.floors?.length > 0) obj.floors = obj.floors.filter(keepFloor);
    if (obj?.data?.floors?.length > 0) {
      obj.data.floors = obj.data.floors.filter(keepFloor);
    }
  } else if (options.OrderAds && functionId === "newUserAllOrderList") {
    const navigationTabs = obj?.listNavigationTabList;
    if (Array.isArray(navigationTabs)) {
      for (const tab of navigationTabs) {
        if (String(tab?.tabId) === "2") {
          tab.tabIconUrl = "";
          tab.tabIconDarkUrl = "";
          tab.tabIconWidth = 0;
          tab.tabIconHeight = 0;
          tab.deliveryLottieMap = {};
          tab.deliveryLottieUrl = "";
          tab.iosDeliveryLottieUrl = "";
          tab.showDeliveryClose = false;
        } else if (String(tab?.tabId) === "3") {
          tab.tabIconUrl = "";
          tab.tabIconDarkUrl = "";
          tab.tabIconWidth = 0;
          tab.tabIconHeight = 0;
          tab.carouselIconList = [];
          tab.carouselIconDarkList = [];
          tab.carouselNum = 0;
        }
      }
    }

    for (const order of obj?.orderList || []) {
      const guide = order?.operateGuideFloor;
      if (
        guide?.clickPoint === "OrderList_InsuranceTip" ||
        guide?.exPoint === "OrderList_InsuranceTipExpo" ||
        guide?.clickPoint === "OrderList_QuickEvaluate" ||
        guide?.exPoint === "OrderList_QuickEvaluateExpo"
      ) {
        delete order.operateGuideFloor;
      }

      for (const button of order?.buttons || []) {
        if (
          button?.btnEvent?.clickPoint === "OrderList_CommentsShare" &&
          button?.businessMap &&
          Object.prototype.hasOwnProperty.call(
            button.businessMap,
            "cancelDetainText"
          )
        ) {
          delete button.businessMap.cancelDetainText;
        }
      }
    }
  } else if (options.ProfileClean && functionId === "personinfoBusiness") {
    const removeFloorIds = [
      "bigSaleFloor",
      "buyOften",
      "marketTNFloor",
      "newAttentionCard",
      "newBigSaleFloor",
      "newCardFloor",
      "newStyleAttentionCard",
      "newsFloor",
      "noticeFloor",
      "recommendfloor",
      "simpleCardFloor"
    ];

    const cleanFloors = (floors) => {
      if (!Array.isArray(floors)) return floors;

      let newFloors = [];
      for (let floor of floors) {
        if (removeFloorIds.includes(floor?.mId)) continue;

        if (floor?.mId === "marketTNFloorNew") {
          const tnData = floor?.data?.tnData;

          if (Array.isArray(tnData?.nodes) || Array.isArray(tnData?.cardListStatic)) {
            continue;
          }

          if (tnData?.concisePlusInfo) delete tnData.concisePlusInfo;
          if (tnData?.newsInfo) delete tnData.newsInfo;
          if (tnData?.commentRemindInfo?.infos?.length > 0) {
            tnData.commentRemindInfo.infos = [];
          }
        } else if (floor?.mId === "basefloorinfo") {
          if (floor?.data?.commonPopup) delete floor.data.commonPopup;
          if (floor?.data?.commonPopup_dynamic) delete floor.data.commonPopup_dynamic;
          if (floor?.data?.floatLayer) delete floor.data.floatLayer;
          if (floor?.data?.commonTips?.length > 0) floor.data.commonTips = [];
          if (floor?.data?.commonWindows?.length > 0) floor.data.commonWindows = [];
        } else if (floor?.mId === "orderIdFloor") {
          if (floor?.data?.commentRemindInfo?.infos?.length > 0) {
            floor.data.commentRemindInfo.infos = [];
          }
        } else if (floor?.mId === "userinfo") {
          if (floor?.data?.newPlusBlackCard) delete floor.data.newPlusBlackCard;
        }

        newFloors.push(floor);
      }
      return newFloors;
    };

    obj.floors = cleanFloors(obj?.floors);
    if (obj?.others) obj.others.floors = cleanFloors(obj.others.floors);
  } else if (
    options.ProfileClean &&
    functionId === "myjdSetBusiness"
  ) {
    if (Array.isArray(obj?.floors)) {
      obj.floors = obj.floors.filter((floor) => {
        const nodes = floor?.data?.nodes;
        return (
          floor?.refId !== "TN_settingsToolFloors" &&
          !nodes?.some((node) => node?.functionId === "changyonggongju")
        );
      });

      for (const floor of obj.floors) {
        const templateId = String(floor?.tnConfig?.templateId || "");
        if (!templateId.includes("jdmine_setting_menu")) continue;

        for (const node of floor?.data?.nodes || []) {
          if (node?.functionId === "i18n") continue;
          if (node?.subtitle && typeof node.subtitle === "object") {
            node.subtitle.value = "";
          }
          if (Object.prototype.hasOwnProperty.call(node, "showRedDot")) {
            node.showRedDot = 0;
          }
          if (Object.prototype.hasOwnProperty.call(node, "redDotType")) {
            node.redDotType = 0;
          }
        }
      }
    }
  } else if (
    options.HomeClean &&
    functionId === "welcomeHome"
  ) {
    const removeTypes = [
      "bottomXview",
      "dynamicIcon",
      "float",
      "hybrid",
      "photoCeiling",
      "ruleFloat",
      "searchIcon",
      "tabBarAtmosphere",
      "topRotate"
    ];

    if (obj?.floorList?.length > 0) {
      obj.floorList = obj.floorList.filter(
        (floor) => !removeTypes.includes(floor?.type)
      );
    }
    if (obj?.webViewFloorList?.length > 0) obj.webViewFloorList = [];
    if (obj?.promotionTabs) delete obj.promotionTabs;

    const topTabs = obj?.multipleTabs?.content?.data;
    if (Array.isArray(topTabs)) {
      const deliveryTab = topTabs.find(
        (tab) => Number(tab?.id) === 495057
      );
      if (deliveryTab) {
        deliveryTab.labelNormal = "";
        deliveryTab.labelDark = "";
        deliveryTab.labelDeep = "";
        deliveryTab.keepLabel = 0;
        deliveryTab.labelWidth = 40;
      }

      obj.multipleTabs.content.data = topTabs.filter(
        (tab) =>
          Number(tab?.id) !== 482858 &&
          Number(tab?.tabType) !== 3
      );
    }
  } else if (options.HomeClean && functionId === "clickRecommend") {
    if (obj?.data?.length > 0) {
      obj.data = obj.data.filter(
        (item) => !(item?.insertBizData && item?.tnTemplate)
      );
    }
  } else if (options.ProductClean && functionId === "wareBusiness") {
    const data = obj?.commonBaseInfo?.data;
    if (data?.liveInfo) delete data.liveInfo;
    if (data?.floatingAssistant) delete data.floatingAssistant;
    if (data) {
      if (Object.prototype.hasOwnProperty.call(data, "aigcFlag")) {
        data.aigcFlag = false;
      }
      if (Object.prototype.hasOwnProperty.call(data, "aigcFlagV2")) {
        data.aigcFlagV2 = false;
      }
      if (Object.prototype.hasOwnProperty.call(data, "aigcFloorId")) {
        delete data.aigcFloorId;
      }
      if (Object.prototype.hasOwnProperty.call(data, "aigcBizInfo")) {
        delete data.aigcBizInfo;
      }
    }
    if (obj?.shareData?.statusInfo) {
      obj.shareData.statusInfo.livewindow = false;
    }

    if (data?.daJiaPing?.floorQoList?.length > 0) {
      for (let item of data.daJiaPing.floorQoList) {
        if (Object.prototype.hasOwnProperty.call(item, "aiOverview")) {
          item.aiOverview = "0";
        }
      }
    }
    if (obj?.floors?.length > 0) {
      const removeFloorIds = [
        "ActivityFloor",
        "bpGiveGifts",
        "bpGjhs2",
        "bpdarenping14",
        "bpyxlc14",
        "cardBenefitLx",
        "preferenceMore"
      ];
      obj.floors = obj.floors.filter(
        (floor) => !removeFloorIds.includes(floor?.mId)
      );
    }
  } else if (options.ProductClean && functionId === "queryEvaluateFloors") {
    const result = obj?.result;
    if (result && typeof result === "object") {
      for (let section of Object.values(result)) {
        if (!section || typeof section !== "object") continue;
        if (Object.prototype.hasOwnProperty.call(section, "AIcomment")) {
          section.AIcomment = "0";
        }
        if (section.aiCommentInfo) delete section.aiCommentInfo;
        if (section?.commentIconInfo?.aiTitleIcon) {
          delete section.commentIconInfo.aiTitleIcon;
        }
        if (section?.commentIconInfo?.darkAiTitleIcon) {
          delete section.commentIconInfo.darkAiTitleIcon;
        }
        for (let listName of ["semanticTagList", "tagStatisticsinfoList"]) {
          for (let item of section?.[listName] || []) {
            if (item?.aiCommentInfo) delete item.aiCommentInfo;
          }
        }
      }
    }
  } else if (functionId === "uniformRecommend6") {
    clearRecommendResponse(obj);
  } else if (functionId === "uniformRecommend") {
    const rawRequestBody =
      typeof $request.body === "string" ? $request.body : "";
    let decodedRequestBody = rawRequestBody;
    try {
      decodedRequestBody = decodeURIComponent(rawRequestBody);
    } catch (_) {}
    const requestContext = `${rawRequestBody}\n${decodedRequestBody}`;
    const headers = $request.headers || {};
    const refererKey = Object.keys(headers).find(
      (name) => name.toLowerCase() === "x-referer-page"
    );
    const requestRefererPage = String(headers[refererKey] || "");
    const isOrderRecommend =
      requestContext.includes("JDOrderTest_p_detail") ||
      requestContext.includes("JDOrderTest_p_orderlist") ||
      ["2338", "4262"].includes(String(obj?.adIds || ""));
    const isLogisticsRecommend =
      requestRefererPage === "JDOrderTrackBigMapViewController" ||
      (requestContext.includes('"source":4') &&
        requestContext.includes('"newUIStyle":true') &&
        requestContext.includes('"dlvAddr"'));
    const isMessageRecommend =
      requestContext.includes("NavigationBar_DeployButton") ||
      requestContext.includes('"source":101') ||
      String(obj?.adIds || "") === "50840" ||
      (Array.isArray(obj?.tabs) && obj?.tabTnInfo);

    if (
      (options.OrderAds && (isOrderRecommend || isLogisticsRecommend)) ||
      isMessageRecommend
    ) {
      clearRecommendResponse(obj);
    }
  }

    $done({ body: JSON.stringify(obj) });
  } catch (error) {
    console.log("京东净化失败，放行原响应: " + error);
    $done({});
  }
}
