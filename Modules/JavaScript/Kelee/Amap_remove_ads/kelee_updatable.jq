# 高德运动 data.sportsGroupConfig / data.sportsRouteConfig
def strip_group_banner:
  (try fromjson catch null) as $o
  | if (($o | type) == "object")
    then (if ($o | has("group_banner"))
          then ($o
                | del(.group_banner)
                | tojson)
          else . end)
    else . end;

def on_path($p; $t; f):
  if (try (getpath($p)
           | type == $t)
          catch false)
  then getpath($p) |= f
  else . end;

on_path(["data", "sportsGroupConfig", "value"]; "string"; strip_group_banner)
| on_path(["data", "sportsRouteConfig", "value"]; "string"; strip_group_banner)
# 历史输入提示 data.his_input_tip
| if (try (.data.his_input_tip.value | type == "string") catch false) then
  .data.his_input_tip.value |= (
    if (try (fromjson) catch null) | type == "object"
    then ((fromjson | del(.channel_zhitiao)) | tojson)
    else . end
  )
else . end
# 导航结束广告位与运营按钮 data.navi_end
| def on_path($p; $t; f):
  if (try (getpath($p) | type == $t) catch false)
  then getpath($p) |= f
  else . end;

on_path(["data","navi_end","value"]; "string";
  . as $raw
  | (try ($raw | fromjson) catch null) as $inner
  | (if ($inner | type) == "object" and ($inner | has("operator_btns"))
     then ($inner | del(.operator_btns) | tojson)
     else $raw end))
# 引擎渲染 data.engine_render
| def on_path($p; $t; f):
  if (try (getpath($p) | type == $t) catch false)
  then getpath($p) |= f
  else . end;

on_path(["data","engine_render","value"]; "string";
  . as $raw
  | (try ($raw | fromjson) catch null) as $inner
  | (if ($inner | type) == "object"
     then ($inner | del(.can_show_advert, .advert_note_num)
           | tojson)
     else $raw end))
# 详细配置 data.detail_config
| def drop_inner($k):
  . as $raw
  | (try ($raw | fromjson) catch null) as $o
  | if ($o | type) == "object"
    then ($o | del(.[$k]) | tojson)
    else $raw end;

if (try (.data.detail_config.value | type) catch null) == "string"
then .data.detail_config.value |= drop_inner("shelf_coupon_refresh")
elif (try (.data.detail_config.value | type) catch null) == "object"
then .data.detail_config.value |= del(.shelf_coupon_refresh)
else . end
# 开屏、抽奖、弹窗、积分兑换等 data.amap_basemap_config
| .data.amap_basemap_config.value as $v
| if ($v | type) == "string"
     and ($v | try fromjson catch null | type) == "object"
  then .data.amap_basemap_config.value
       = (
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
  else .
  end
# 长途服务券、ETC 横幅、QQ 音乐推广等 data.navi_cloud
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
      | tojson
    )
else .
end
# 打车券、拼车 banner、工具箱营销等 data.taxi
| if (try (.data.taxi.value | type == "string") catch false) then
  .data.taxi.value as $raw
  | .data.taxi.value = (
      try (
        $raw
        | fromjson
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
        | tojson
      ) catch $raw
    )
else . end