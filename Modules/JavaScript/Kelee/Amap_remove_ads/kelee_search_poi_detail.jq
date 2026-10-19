def keep_content:
  IN(
    "baseInfo", "poiDetailCommonConfig", "poiTipBar",
    "functionZone", "wikiInfo", "wikiInfoBelow",
    "attractGalleryInfo", "combineReviews", "evaluateVO", "reviews",
    "inviteReview", "shopNews", "shopBasePerson",
    "seriousPublicExperience", "societyPublicExperience",
    "travelGuideAndQa", "poiDetailNote", "poiDetailRankUpCard",
    "human_traffic", "floorGuideGbf",
    "houseEvaluationInfo", "residentialOwnersVO", "realtorRealStep",
    "houseOfficeInfo", "houseOfficeService",
    "comprehensiveEditEntrance", "navbarMore", "enhanceIMQuestions",
    "enhanceCustomerServicePoiModule", "storeDirections", "shopFindWayGuide",
    "businessQualifications", "legal_document", "home_legal_document",
    "rec_legal_document", "shopQualifications", "business_scope",
    "governmentInformation", "official_account", "merchantSettlement",
    "poiMapModule", "poiDetailBottomBar", "backToTop", "anchor"
  );
def marketing_name:
  IN(
    "CouponPush", "CouponBanner", "CouponPopup", "CouponWidget",
    "coupon_entrance", "newHouseCptCoupon",
    "combinedBannerAbove", "combinedBannerBelow",
    "adStoreBigBannerModule", "adStoreCustomerService", "brandAdModule",
    "poiDetailAdBookModule", "new_operation_banner", "newEnhanceBannerModule",
    "activityRecommendation", "brandAiAgent", "brand_story", "brandStory",
    "brand_service", "brand_shop_bar", "home_cpt_brand_story",
    "kaMarketingCampaign", "kaProductMixServiceShelf",
    "shopStructGift", "store_gift", "childrenPoiShopGift",
    "poster", "poster_banner", "image_banner",
    "cpt_service_simple", "cpt_service_shop",
    "yellowPageAdRecommendModule", "commercialRecEntrance",
    "similarShopRecommend", "similarShelfRecommend",
    "nearbyRecommendModule", "surroundFacility",
    "surroundOldSellHouse", "surroundRentHouse", "surroundHouseTab",
    "surroundRentOffice", "compareShopRecommend", "recommend_real_case",
    "quickLinksPortal", "waistRecEntrance", "houseServiceZone",
    "newCarCpLive", "commonGoodsShelf", "houseShelf", "houseService",
    "horizontalGoodsShelf", "serviceBookingGoodsShelf", "service_shop",
    "eleSupermarketGoodsShelf", "goodsInMallShelf", "mallGroupBuy",
    "discount_commodity", "freshGoodsWindow", "poiDetailWaterFeed",
    "poiDetailWaterFeedTitle", "poiDetailNewBeltV2", "retainInfo",
    "xicheService", "MarketingGoods", "ggc_entry",
    "platformCustomerCommonModule", "platformCustomerComplianceInfo"
  );
def anchor_item_kept:
  ((.anchor | type) == "array") and any(.anchor[]; (type == "string") and keep_content);
def panel_text_kept:
  if (.modulesMap | type) == "array"
  then any(.modulesMap[]; (type == "string") and marketing_name) | not
  else true end;
def ad_card:
  ((.data | type) == "object")
  and ((.data.cardType | type) == "string")
  and ((.data.cardType | length) > 0)
  and ((.data.cpc | type) == "object")
  and (((.data.cpc.is_ad | tostring) == "1") or (.data.cpc.is_ad == true));
(if ((.data | type) == "object") and ((.data.modules | type) == "object")
 then [ .data.modules | to_entries[] | select(.value | ad_card) | .key ]
 else [] end) as $ad_module
| (if (.data | type) == "object" then
     if (.data.regions | type) == "object" then
       .data.regions |= with_entries(
         .value |= (if type == "array"
                    then map(select((type != "string")
                                    or (keep_content
                                        and (. as $name | ($ad_module | index($name)) == null))))
                    else . end))
     else . end
   else . end)
| (if (.data | type) == "object" then
     if (.data.modules | type) == "object" then
       .data.modules |= with_entries(
         select((.key | keep_content) and ((.value | ad_card) | not)))
     else . end
   else . end)
| (if (.data | type) == "object" then
     if (.data.meta.half_hidden_modules | type) == "array" then
       .data.meta.half_hidden_modules |= map(select((type != "string")
                     or (keep_content
                         and (. as $name | ($ad_module | index($name)) == null))))
     else . end
   else . end)
| (if (.data | type) == "object" then
     if (.data.modules.baseInfo.data.user | type) == "object" then
       del(.data.modules.baseInfo.data.user.userLocRgeo,
           .data.modules.baseInfo.data.user.homeInfo,
           .data.modules.baseInfo.data.user.companyInfo)
     else . end
   else . end)
| (if (.data | type) == "object" then
     if (.data.modules.anchor.data.items | type) == "array" then
       .data.modules.anchor.data.items |= map(select(anchor_item_kept))
     else . end
   else . end)
| (if (.data | type) == "object" then
     if (.data.modules.poiDetailCommonConfig.data.swipeUpPanelConfig.swipeUpPanelTextList | type) == "array" then
       .data.modules.poiDetailCommonConfig.data.swipeUpPanelConfig.swipeUpPanelTextList |= map(select(panel_text_kept))
     else . end
   else . end)