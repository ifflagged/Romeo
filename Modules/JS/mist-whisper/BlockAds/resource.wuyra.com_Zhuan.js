/**
 * @type http-response
 * @rule ^https:\/\/app\.zhuanzhuan\.com\/zz\/(?:transfer\/getpersonalcenter\?entChanl=&uiType=1&from=1089|v2\/zzlogic\/mywxcontinenthomepage\?from=1089)
 * @tag 转转全量去广告（个人中心 + 首页）
 */
(function () {
  try {
    const url = $request.url;
    const obj = JSON.parse($response.body);
    const d = obj.respData || {};

    if (url.includes('/transfer/getpersonalcenter')) {
      // —— 转转个人中心 去广告 —— 
      if (d.pendantInfo && d.pendantInfo.source === 'ad_tuia') {
        delete d.pendantInfo;
      }
      if (d.resources && d.resources.bmInfo && typeof d.resources.bmInfo.tagText === 'string') {
        delete d.resources.bmInfo;
      }

    } else if (url.includes('/v2/zzlogic/mywxcontinenthomepage')) {
      // —— 转转首页 去广告 —— 
      if (d.bmArea) {
        delete d.bmArea.subtitle;
        delete d.bmArea.subtitleD2D;
        delete d.bmArea.extraCard;
      }
      delete d.carouselArea;
      delete d.recommendCard;
      if (d.bmAreaV2) {
        delete d.bmAreaV2.secondLeafInfo;
        delete d.bmAreaV2.thirdLeafInfo;
        delete d.bmAreaV2.bmCardInfo;
      }
      delete d.leftPendant;
    }

    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $done($response);
  }
})();