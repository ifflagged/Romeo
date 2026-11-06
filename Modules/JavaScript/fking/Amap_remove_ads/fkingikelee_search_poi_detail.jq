def keep_skeleton:
  IN(
    "baseInfo",                    # 地点本体：名称/坐标/评分/标签/图标
    "poiDetailCommonConfig",       # 详情页通用配置（含上滑引导文案）
    "navbarMore",                  # 右上角更多菜单
    "backToTop",                   # 回到顶部
    "poiDetailBottomBar",          # 底部操作栏（导航/电话/收藏）
    "poiMapModule",                # 地点在哪：地图与静态位置图
    "anchor",                      # 页内锚点跳转
    "reSortContentAndSimilar",     # 内容排序策略开关，本身不是内容
    "comprehensiveEditEntrance",   # 编辑/纠错入口
    "functionZone",                # 功能区（写评价/订座/预约）
    "poiTipBar",                   # 顶部提示条：本店 IM 咨询入口
    "floatTelButton",              # 悬浮电话按钮
    "footer_tel_button",           # 吸底电话按钮
    "footer_retain_button"         # 吸底留存按钮
  );                                                            # end def keep_skeleton

# ---------------------------------------------------------------------
# ② 图集 / 评价 / UGC
#    内容全部由本 POI 决定，换一个地点就全变。
# ---------------------------------------------------------------------
def keep_ugc:
  IN(
    "attractGalleryInfo",          # 顶部图集
    "combineReviews",              # 评价
    "evaluateVO", "reviews",       # 评价数据
    "inviteReview",                # 邀请评价
    "seriousPublicExperience", "societyPublicExperience",
    "poiDetailRankUpCard",         # 榜单/排名
    "travelGuideAndQa",            # 旅行攻略与问答
    "poiDetailAQModule",           # 详情页问答
    "AIStreetTips",                # 扫街锦囊：AI 生成的地点提示
    "expertNote",                  # 达人笔记
    "recommend_food",              # 网友推荐菜：本店菜品
    "shopNews",                    # 本店动态
    "mallNews",                    # 本商场动态
    "shopBaseCase"                 # 本店案例
  );                                                            # end def keep_ugc

# ---------------------------------------------------------------------
# ③ 介绍与百科
#    描述本地点本身。
# ---------------------------------------------------------------------
def keep_intro:
  IN(
    "wikiInfo", "wikiInfoBelow",
    "poiDetailNote", "poiDetailWikiAndLOI"
  );                                                            # end def keep_intro

# ---------------------------------------------------------------------
# ④ 本地点专属数据
#    换 POI 后内容全变，属于该地点独有的经营数据。
# ---------------------------------------------------------------------
def keep_poi_data:
  IN(
    "human_traffic",               # 人流量
    "floorGuideGbf",               # 楼层/商铺导览
    "houseEvaluationInfo",         # 本楼盘测评
    "residentialOwnersVO",         # 本小区业主信息
    "realtorRealStep",             # 本楼盘成交步骤
    "houseOfficeInfo", "houseOfficeService",
    "houseOfficeBrandIntroduction", "houseOfficeNotice",
    "newHouseDetailInfo", "house_apart_info",
    "scenic_mustplay",             # 本景点必玩
    "hotelGraphicDetail", "homestayGraphicDetail",
    "hotelFacilities", "hotelMustRead",
    "shoppingMallEvent"            # 本商场活动
  );                                                            # end def keep_poi_data

# ---------------------------------------------------------------------
# ⑤ 本店服务与经营内容
#    商家自己的服务、人员、课程、招聘、入口与自主渠道。
# ---------------------------------------------------------------------
def keep_service:
  IN(
    "enhanceIMQuestions",          # 本店咨询引导问题
    "enhanceCustomerServicePoiModule",   # 本店 AI 客服
    "aiAgentFooterBar",            # 本店 AI 客服吸底条
    "imBottomGuide",               # 本店 IM 引导
    "enhanceCustomerServiceFixedBottom",
    "shopBasePerson",              # 本店技师/顾问
    "shopServiceBffvo",            # 本店服务
    "service_process",             # 本店服务流程
    "shopCourseList",              # 本店课程
    "poiDetailJobList", "jobRec",  # 本店招聘
    "shop_vip_card",               # 本店会员卡
    "shopStdActivity",             # 本店活动
    "privateSphereChannel",        # 本店私域渠道
    "kaShopService", "ka_not_enter",   # KA 商家服务与状态提示
    "company1688Info",             # 本店的 1688 店铺信息
    "thirdparty_info",             # 本店第三方信息
    "expressEntryCard",            # 快捷入口
    "poi_intercept",               # 地点状态提示（停业/迁址等）
    "aiAgentEntry", "commonAiAgent", "poiCardAiAgentEntryV2"   # AI 助手入口
  );                                                            # end def keep_service

# ---------------------------------------------------------------------
# ⑥ 位置与指引
#    通往本地点。
# ---------------------------------------------------------------------
def keep_guide:
  IN(
    "storeDirections",             # 到店导航
    "shopFindWayGuide"             # 找店指引
  );                                                            # end def keep_guide

# ---------------------------------------------------------------------
# ⑦ 资质与合规
#    本商家的营业执照、资质公示、政府信息。
# ---------------------------------------------------------------------
def keep_compliance:
  IN(
    "shopQualifications", "businessQualifications",
    "legal_document", "home_legal_document", "rec_legal_document",
    "business_scope", "governmentInformation",
    "official_account", "merchantSettlement", "shop_settlement"
  );                                                            # end def keep_compliance

# ---------------------------------------------------------------------
# ⑧ 本地点自有预订
#    票品、影票、房型、包间、场地、订座、预约，
#    卖的都是本地点自己的库存，不是别处的商品或券。
# ---------------------------------------------------------------------
def keep_booking:
  IN(
    "scenic_ticket",               # 本景点门票
    "movieBookingShelf",           # 本影院影票
    "hotelRooms",                  # 本酒店房型
    "ktvBookingShelf",             # 本店包间
    "venueBookingShelfModule",     # 本店场地
    "reserveShelf",                # 本店预订
    "DinnerBottomBar",             # 本店订座底部条
    "poiDetailAppointmentRegister" # 到店预约登记
  );                                                            # end def keep_booking

# 汇总：命中任一组即视为本地点内容
def keep_module:
  keep_skeleton or keep_ugc or keep_intro or keep_poi_data
  or keep_service or keep_guide or keep_compliance or keep_booking;

# 引用值判据：字符串必须命中保留清单
def keep_ref:
  (type == "string") and keep_module;                          # end def keep_ref

# 安全取子路径：任一层不是对象就得到 null，避免在数组/字符串上取键报错
def at($keys):
  reduce $keys[] as $k (.; if type == "object" then .[$k] else null end);

# ---------------------------------------------------------------------
# 名字引用数组（regions 各区域、meta.half_hidden_modules）：
# 只过滤字符串元素，非字符串元素原样保留，相对顺序不变。
# 不能写成 map(select(keep_module))，那会把非字符串元素一并删掉。
# ---------------------------------------------------------------------
def filter_refs:
  if type == "array"
  then map(select((type != "string") or keep_module))
  else . end;                                                  # end def filter_refs

# ---------------------------------------------------------------------
# 锚点项：必须是对象、anchor 是数组、且至少一个目标是保留模块。
# 判据用「是否在保留清单内」，不能用「当前批次是否已有数据」——
# 目标模块的数据常在后续批次才到，首屏只下发位置。
# ---------------------------------------------------------------------
def anchor_item_kept:
  (type == "object")
  and ((.anchor | type) == "array")
  and any(.anchor[]; keep_ref);                                # end def anchor_item_kept

# ---------------------------------------------------------------------
# 上滑面板文案：必须是对象、modulesMap 是数组、且至少一个目标仍在
# 保留清单内才整条保留；modulesMap 缺失或非数组时保持原样。
# ---------------------------------------------------------------------
def panel_item_kept:
  if (type == "object") and ((.modulesMap | type) == "array")
  then any(.modulesMap[]; keep_ref)
  else true end;                                               # end def panel_item_kept

# =====================================================================
# 主流程：对整条响应体做保留裁剪
# =====================================================================
def trim_detail:

  # 顶层守护：data 不是对象（缺失/null/字符串/数组）时原样返回
  if (.data | type) == "object" then

    # ① regions：全部区域按保留清单过滤，保留原相对顺序与区域键
    (if (.data.regions | type) == "object" then
       .data.regions |= with_entries(.value |= filter_refs)
     else . end)

    # ② modules：只留保留清单内的模块，命中的键值对整体不动
    | (if (.data.modules | type) == "object" then
         .data.modules |= with_entries(select(.key | keep_module))
       else . end)

    # ③ meta.half_hidden_modules：与主清单同步裁剪
    | (if (at(["data", "meta", "half_hidden_modules"]) | type) == "array" then
         .data.meta.half_hidden_modules |= filter_refs
       else . end)

    # ④ baseInfo.data.user：移除「用户自己的家/公司/实时周边」三个子块。
    #    它们描述看页面的人，不是本地点，属内容归属问题而非广告判断。
    | (if (at(["data", "modules", "baseInfo", "data", "user"]) | type) == "object" then
         .data.modules.baseInfo.data.user |= del(.userLocRgeo, .homeInfo, .companyInfo)
       else . end)

    # ⑤ anchor.data.items：目标已不在保留清单内的锚点整项移除
    | (if (at(["data", "modules", "anchor", "data", "items"]) | type) == "array" then
         .data.modules.anchor.data.items |= map(select(anchor_item_kept))
       else . end)

    # ⑥ 上滑面板文案：去掉指向未保留模块的引导
    | (if (at(["data", "modules", "poiDetailCommonConfig", "data",
               "swipeUpPanelConfig", "swipeUpPanelTextList"]) | type) == "array" then
         .data.modules.poiDetailCommonConfig.data.swipeUpPanelConfig
           .swipeUpPanelTextList |= map(select(panel_item_kept))
       else . end)

  else . end;                                                  # end def trim_detail

trim_detail