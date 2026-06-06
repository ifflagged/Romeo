// ccb_ad_clean.js - 建行广告清理脚本

let body = $response.body;

try {
  let obj = JSON.parse(body);

  // ===== 首页推荐、置顶、楼层内容清理 =====
  if (obj?.data?.data?.recList) {
    obj.data.data.recList = [];
  }

  if (obj?.data?.data?.insGroup?.topList) {
    obj.data.data.insGroup.topList = [];
  }

  if (obj?.data?.data?.insGroup?.floorList) {
    obj.data.data.insGroup.floorList = [];
  }

  // 保留必要基础结构（避免页面报错）
  if (obj?.data?.data) {
    obj.data.data = {
      code: 0,
      msg: "success",
      data: {}
    };
  }

  // ===== 各模块广告清理 =====
  const adKeys = [
    "MYSELF_ENTRANCE_AD",      // 我的页面入口广告
    "MEBCT_AD_INFO",           // 个人中心广告
    "THROUGH_COLUMN_INFO",     // 金融页面广告
    "PREFERENCE_AD_INFO",      // 本地优惠广告
    "DAY_BEST_AD_SECOND",      // 精选推荐广告
    "DAY_BEST_AD_FOURTH",      // 养老金广告
    "DAY_BEST_AD_THIRD",       // 互动广场广告
    "HPBANNER_AD_INFO_SECOND", // 精选推荐广告2
    "TAG_AD_INFO",             // 首页悬浮广告
    "NOTICE_AD_INFO",          // 横幅文字广告
    "recList"                  // 种草推荐广告
  ];

  if (obj?.data) {
    adKeys.forEach(key => {
      if (obj.data[key]) {
        obj.data[key] = [];
      }
    });
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  console.log("建行广告清理脚本异常：" + e);
  $done({});
}