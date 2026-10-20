# 高德运动 data.sportsGroupConfig / data.sportsRouteConfig
def on_path($p; $t; f):
  if (try (getpath($p) | type == $t) catch false)
  then getpath($p) |= f
  else . end;
def keep: IN("enhanceIMQuestions", "platformCustomerCommonModule", "platformCustomerComplianceInfo", "evaluateVO");
def shelf: if type == "array" then map(select(keep)) else . end;
def strip_group_banner:
  (try fromjson catch null) as $o
  | if (($o | type) == "object")
    then (if ($o | has("group_banner"))
          then ($o | del(.group_banner) | tojson)
          else . end)
    else . end;

on_path(["data", "sportsGroupConfig", "value"]; "string"; strip_group_banner)
| on_path(["data", "sportsRouteConfig", "value"]; "string"; strip_group_banner)

# 搜索历史 - 推荐榜单、附近热词 data.his_input_tip
| .data.his_input_tip.value |= (
    . as $raw
    | (if type == "string" then (try fromjson catch null) else null end) as $o
    | (if ($o | type) == "object" then ($o | del(.channel_zhitiao) | tojson) else $raw end) as $s
    | (try ($s | fromjson) catch empty) as $p
    | if ($p | type) == "object"
      then ($p | .his_recommend_bangdan = 0 | .nearby_hotword.search_detail = 0 | tojson)
      else $s end
  )

# 导航结束广告位与运营按钮 data.navi_end
| on_path(["data","navi_end","value"]; "string";
    . as $raw
    | (try ($raw | fromjson) catch null) as $inner
    | (if ($inner | type) == "object" and ($inner | has("operator_btns"))
       then ($inner | del(.operator_btns) | tojson)
       else $raw end))

# 引擎渲染 data.engine_render
| on_path(["data","engine_render","value"]; "string";
    . as $raw
    | (try ($raw | fromjson) catch null) as $inner
    | (if ($inner | type) == "object"
       then ($inner | del(.can_show_advert, .advert_note_num) | tojson)
       else $raw end))

# 详情页 - 商品货架、周边搜索优化、第二屏锚点不再指向货架 data.detail_config
| .data.detail_config.value |= (
      . as $raw
    | (try {ok: fromjson} catch {failed: true}) as $p
    | if ($p | has("failed")) then empty
      elif ($p.ok | type) == "object"
      then ($p.ok
            | del(.shelf_coupon_refresh)
            | .isGoodsShelfPerfV2 = 0
            | .NearbySearchOptimization = 0
            | .poiDetailScreenCacheConfig.secondScreenAnchorModule = ""
            | .poiDetailScreenCacheOtherConfig.secondScreenAnchorModule = ""
            | tojson)
      else $raw end
  )

# 开屏、抽奖、弹窗、积分兑换等 data.amap_basemap_config
| .data.amap_basemap_config.value as $v
| if ($v | type) == "string" and ($v | try fromjson catch null | type) == "object"
  then .data.amap_basemap_config.value = (
         $v | fromjson
            | del(
              .splash, .ai_splash, .ipSquare_window_video_config,
              .usercenter_lottery_switch, .coins_lottery, .coins_wish,
              .newYearLotteryTips, .mileage_coin_scene, .licheng_coin_mine_entry,
              .member_grabbing, .vip_checkout_welfare_dialog_config, .task_poi_card_coupon_switch,
              .jay_act, .pointExchangeCenter, .pointExchangeGoCommentUrl,
              .batchCheckIn, .batchCheckIn_new, .fireworks,
              .fireworkFeatureCodes, .setFireworksNightMode, .fireworks_click_change_night,
              ."2024greetingTofireworks", .greeting_widget_switch, .newYearSystemScreenRecordListenSwitch,
              .ugcActivityH5, .study_create_url, .asset_space_pilot,
              .ipSquare_goods_tab_desc, .vip_member_config, .recently_activity,
              .business_position, .carLogos, .voiceLogos,
              .increase_product_name_account, .invite_poi_share_pic, .block_increase_product_detail_share_button,
              .mainIcon, .mainBubble, .blueBar,
              .presetWord, .homepage_tabguide, .suit_set_popup,
              .pop_selection, .ipsqure_free_pop_hours, .desk_card_footprint_check_in,
              .desk_card_searchtool, .arLayerDialogConfig, .geochoBackConfirmDialogConfig,
              .followGuidePopupConfig, .growth_bubble_guide_config, .bottom_login_guide_config,
              .frequent_location_login_guide_config, .login_guide_show_rules, .show_landmark_exploration_card,
              .reachFrequency, .reachTaskFrequency, .msgbox_show_popwindow,
              .aiqs_pull_up_guide, .new_aiqs_pull_up_guide, .full_screen_guide_video_config,
              .ai_guideo_video_map, .feature_guide_switch, .geoechoGuideLottieConfig,
              .level_page_slide, .level_page_tips, .garage_top_button,
              .ThemeSquareSwiperCanJumpUrlList
            )
            | tojson
       )
  else . end

# 导航 - 到达后自动探索、极限推荐条数、长途服务券、ETC 横幅、QQ 音乐推广等 data.navi_cloud
| if (((try .data.navi_cloud.value catch null) | type) == "string")
     and (((try (.data.navi_cloud.value | fromjson) catch null) | type) == "object")
  then
    .data.navi_cloud.value |= (
        fromjson
        | del(.long_trip_service_coupon,
              .long_trip_service_coupon_enter,
              .long_trip_service_coupon_links,
              .QQMusicVipText,
              .QQMusicMembershipVoice,
              .ETCGuide,
              .etc_banner,
              .music_config,
              .music_sdk_recommend_title,
              .music_ai_guide_fatigue,
              .music_ai_next_login_rate,
              .music_source,
              .DownloadQQplayerSDK,
              .voicePlayground,
              .route_search_Starbucks,
              .Starbucksfinish,
              .H5guidelottie,
              .route_search_guide_lottie,
              .via_result_bottomtext,
              .planHomeGuideConfig,
              .energy_add_plate_list,
              .operation_consumer_bubble,
              .bubble_priority,
              .desk_card_commute,
              .consumeAfterPopup_days,
              .Rescue_popup_service,
              .smart_drive_tips,
              .city_drive_tips,
              .BackCar,
              .customized_navigation,
              .TabRecommend,
              .newTabRecommendSwitch,
              .ExtremelyRecommendCount,
              .tab_recommend_filter,
              .tab_recommend_switch_third_schema,
              .dropby_scroll,
              .gas_path_bubble,
              .carowner,
              .operation_chat_add_group,
              .noInternetCardSwitch)
        | .end_auto_foot_explore = 0
        | .ExtremelyRecommendCount = 0
        | tojson
      )
  else
    .data.navi_cloud.value |= (
      if (fromjson? | type) == "object"
      then
        fromjson
        | .end_auto_foot_explore = 0
        | .ExtremelyRecommendCount = 0
        | tojson
      else . end
    )
  end

# 打车 - 打车券、拼车 banner、工具箱营销、推荐终点、推荐点服务、顺风车途经点默认等 data.taxi
| .data.taxi.value |= (
    (try {parsed: fromjson} catch {failed: true}) as $probe
    | if ($probe | has("failed")) then empty
      elif (($probe.parsed) | type) == "object" then
        ($probe.parsed
          | del(
              .denghuo_ad, .banner_picture_url, .carpool_city, .carpool_intercity,
              .intercity_index_page_header, .skin_show, .hq_112background,
              .chauffeurBannerSort, .hitch_other_tab, .hitch_other_tab_v2,
              .dache_toolbox_promo, .dache_toolbox_marketing, .dache_toolbox_remote,
              .dache_toolbox_carpool, .dache_toolbox_chauffeur,
              .PaymentOneClickLayerInfo, .s_reward_center_config,
              .taxi_personal_virtual_gold_url, .student_url, .student_icon,
              .student_title, .student_describe, .chauffeurTabKingToolConfig_left,
              .chauffeurTabBubbleText, .discount_bubble, .coupon_traction_bubble_v3,
              .intercity_entrance_tag, ."long-dis_preferential", .taxi_shortcut_manager,
              .vip_88_guide_fatigue, ."vip-h5", .taxi_commercialization,
              .isUseChauffeurNewMarketingSlot, .operation_module_render_new,
              .retainPopupDiscount, .taxi_coupon_entry_new,
              .thailandCouponRedirectAimap, .isChauffeurUseNewCouponCenter,
              .chauffeurComboCouponSwitch, .couponNewStyleV730, .is_favorable_show,
              .taxi_personal_virtual_gold, .taxi_personal_virtual_gold_title,
              .student_entry, .unionvip_white_list, .premium_customer_card_config,
              .chauffeurTabKingToolConfig_alternative,
              .chauffeurTabKingToolConfig_right, .chauffeur_fatigue_config,
              .hitch_101_popup_polling, .ChauffeurViaPoisConfig,
              .driveDiversionCardHitchTab, .pinzhi_daoliu, .CancelRetentionTec,
              .intercity_atmosphere_config, .carpool_waiting_config
            )
          | .recommend_point_optimization = 0
          | .recommend_point_service_overview = 0
          | .end_point_optimization = 0
          | .hitch_way_point_nav_default = 0
          | tojson
        )
      elif $probe.parsed == null then "null"
      else . end
  )

# 兴趣点 data.poi_folder_modules
| if ((try (.data.poi_folder_modules.value | type) catch null) == "string")
  then
    .data.poi_folder_modules.value |= (
      . as $raw
      | (try fromjson catch null) as $src
      | if ($src | type) == "object" then
          ($src
           | (if (.folder_modules | type) == "array" then .folder_modules |= shelf else . end)
           | (if (.newFolderModules | type) == "array" then .newFolderModules |= shelf else . end)
          ) as $new
          | if $new == $src then $raw else ($new | tojson) end
        else $raw end
    )
  else . end

# 收藏夹 - 周边图片 data.favorites_info
| .data.favorites_info.value |= (if (fromjson? | type) == "object" then
      (fromjson | .nearby_picture_on = 0 | .nearby_picture_distance = 0 | tojson) else . end)

# 附近信息流 POI 卡片多图 data.container_isolation
| .data.container_isolation.value |= (if (fromjson? | type) == "object" then
      (fromjson | .nearby_feed_poi_card_v2_multi_img = 0 | tojson) else . end)

# 附近推荐总开关 data.nore_rec
| .data.nore_rec.value |= (if (fromjson? | type) == "object" then
      (fromjson | .recommend = 0 | tojson) else . end)

# 景区/机场到达后「找停车场 / 换乘摆渡车」推荐气泡 data.engine_eyrie
| .data.engine_eyrie.value |= (if (fromjson? | type) == "object" then
      (fromjson | del(.poi_area_bubble) | tojson) else . end)

# 地图小程序引导教程 data.WIA
| if ((try (
      .data.WIA.value
      | type
    ) catch null) == "string")
then .data.WIA.value
  |= (. as $raw
      | (try fromjson catch null) as $o
      | if ($o | type) == "object"
          and ($o | has("orgGuideVideoConfig"))
        then ($o
              | del(.orgGuideVideoConfig)
              | tojson)
        else $raw end)
else . end