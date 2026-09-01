const url = $request.url;
let body = $response.body;

try {
  let obj = JSON.parse(body);

  // ==================== 1. 打车 content_info ====================
  if (url.includes("/car/order/content_info")) {
    if (obj?.data?.lubanData) {
      // 清空营销皮肤
      if (obj.data.lubanData.skin?.dataList) {
        obj.data.lubanData.skin.dataList = [];
      }

      // 过滤金刚位工具箱（只保留指定4个）
      if (obj.data.lubanData.kingToolBox?.dataList) {
        const keep = [
          "dache_toolbox_taxi_overseas_channel",
          "dache_toolbox_hitch",
          "dache_toolbox_GDIntercity",
          "dache_toolbox_chauffeur"
        ];

        obj.data.lubanData.kingToolBox.dataList =
          obj.data.lubanData.kingToolBox.dataList.filter(item => {
            return item?.biz?.id && keep.includes(item.biz.id);
          });
      }
    }
  }

  // ==================== 2. POI 详情页去广告 ====================
  else if (url.includes("/shield/search/poi/detail")) {
    if (obj?.data) {
      const adModules = [
        "CouponBanner",
        "CouponWidget",
        "CouponMiddleBanner",
        "CouponDetailMiddleBanner",
        "CouponFooterStickBanner",
        "CouponPopup",
        "MarketingGoods",
        "poiDetailNewBeltV2",
        "adStoreBigBannerModule",
        "shopStructGift",
        "quickFlashSaleGoodsShelf",
        "poiDetailHotSaleShelf",
        "group_buying_shelf",
        "commonGoodsShelf",
        "kaProductMixServiceShelf",
        "packageShelf",
        "dayTripList",
        "scenic_ticket",
        "movie_info",
        "ktvBookingShelf",
        "carRentGroupBuy",
        "carRentNorm",
        "carRentalKaNorm",
        "standardGasPriceShelf",
        "housesShelf",
        "mallNews",
        "brand_shop_bar",
        "enhanceCustomerServicePoiModule",
        "imBottomGuide",
        "image_banner",
        "nearbyRecommendModule",
        "poiDetailWaterFeed",
        "poiDetailWaterFeedTitle",
        "similarShelfRecommend",
        "yellowPageAdRecommendModule",
        "similarShopRecommend",
        //"combineReviews",
        "poiDetailNote",
        "commonHkfMiniPortal",
        "activityRecommendation",
        "waterFallFeedTitle",
        "cityCardFeed",
        "hotelList"
      ];

      // 删除广告模块
      if (obj.data.modules) {
        adModules.forEach(key => {
          if (obj.data.modules[key]) {
            delete obj.data.modules[key];
          }
        });
      }

      // 清理 regions 引用
      if (obj.data.regions) {
        for (let region in obj.data.regions) {
          if (Array.isArray(obj.data.regions[region])) {
            obj.data.regions[region] =
              obj.data.regions[region].filter(
                item => !adModules.includes(item)
              );
          }
        }
      }

      // 清理优惠券刷新列表
      if (obj.data.meta?.vo_meta_info?.couponRefreshModules) {
        obj.data.meta.vo_meta_info.couponRefreshModules = [];
      }

      // 清理 half_hidden_modules
      if (obj.data.meta?.half_hidden_modules) {
        obj.data.meta.half_hidden_modules =
          obj.data.meta.half_hidden_modules.filter(
            item => !adModules.includes(item)
          );
      }

      // 处理地图 main_point
      if (obj.data.modules?.poiMapModule?.data?.map?.main_point) {
        const mainPoint =
          obj.data.modules.poiMapModule.data.map.main_point;

        // 删除营销纹理
        if (mainPoint.dynamic_texture) {
          delete mainPoint.dynamic_texture;
        }

        // 修改 card_id
        mainPoint.card_id = "normal_lottie";

        // 清空 logo
        mainPoint.logo = "";
      }
    }
  }

  // ==================== 3. 搜索列表页去广告 ====================
  else if (url.includes("/shield/search_poi/search/sp")) {
    if (obj?.data) {
      const searchAdModules = [
        "BrandBannerCard",
        "CustomerServiceAdEntrances",
        "PrecisionEntrances",
        "CouponBanner",
        "HeaderTipInfo",
        "HeaderTipSection"
      ];

      // 删除顶部广告模块
      if (obj.data.modules) {
        searchAdModules.forEach(key => {
          if (obj.data.modules[key]) {
            delete obj.data.modules[key];
          }
        });
      }

      // 清理 regions.listManage
      if (obj.data.regions?.listManage) {
        obj.data.regions.listManage =
          obj.data.regions.listManage.filter(
            item => !searchAdModules.includes(item)
          );
      }

      if (Array.isArray(obj?.data?.modules?.listResult?.data?.list) &&
        obj.data.modules.listResult.data.list.length > 0) {
        obj.data.modules.listResult.data.list = obj.data.modules.listResult.data.list.filter(
          item => item?.card_id === "PoiCardUniversal"
        );
      }
      
    }
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log("高德去广告脚本错误: " + e);
}

$done({ body });
