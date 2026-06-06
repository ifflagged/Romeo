// 2026-03-09

(() => {
  $done(o($response, $request, globalThis.$argument) || {});

  function o({ body: e }, { url: t }, i) {
    let a = {
      "/resource/show/tab/v2?":  l,   // 首页 tab 定制
      "/v2/splash":              s,   // 启动页去广告
      "/splash/list?":           s,   // 启动页列表接口
      "/splash/show?":           s,   // 启动页展示接口
      "/splash/event/list2?":    s,   // 启动页事件列表接口
      "/feed/index?":            b,   // 推荐首页去广告
      "/feed/index/story?":      r,   // 推荐页 Story 去广告
      "/account/mine":           f,   // "我的"页面定制
      "/account/myinfo?":        _,   // "我的信息"注入 VIP
      "/index/feed?":            F,   // 动态页去广告
      "/index/getInfoByRoom?":   J,   // 直播间处理（去购物/预约/活动）
      "/index/getInfoByUser?":   G    // 直播用户信息处理
    };

    try {
      e = JSON.parse(e);
      if (!e?.data) return null;
      let c = typeof i == "string"
        ? JSON.parse(i)
        : (typeof i == "object" && i !== null ? i : {});
      for (let n in a) {
        if (t.includes(n)) {
          return { body: JSON.stringify(a[n](e, c)) };
        }
      }
      return null;
    } catch (c) {
      console.log(c.toString());
      return null;
    }
  }

  // —— 首页 tab 定制 ——
  // 动画/影视 URI 更新新版接口
  function l(e) {
    e.data.tab = [
      { pos: 1, id: 731,  name: "直播", tab_id: "直播tab",  uri: "bilibili://live/home" },
      { pos: 2, id: 477,  name: "推荐", tab_id: "推荐tab",  uri: "bilibili://pegasus/promo", default_selected: 1 },
      { pos: 3, id: 478,  name: "热门", tab_id: "热门tab",  uri: "bilibili://pegasus/hottopic" },
      // 动画/影视的 URI 更新为 v2 接口
      { pos: 4, id: 3502, name: "动画", tab_id: "bangumi",  uri: "bilibili://pgc/bangumi_v2" },
      { pos: 5, id: 3503, name: "影视", tab_id: "film",     uri: "bilibili://pgc/cinema_v2" }
    ];
    e.data.top = [
      {
        pos: 1, id: 176, name: "消息", tab_id: "消息Top",
        uri: "bilibili://link/im_home",
        icon: "http://i0.hdslb.com/bfs/archive/d43047538e72c9ed8fd8e4e34415fbe3a4f632cb.png"
      }
    ];
    e.data.bottom = [
      {
        pos: 1, id: 177, name: "首页", tab_id: "home",
        uri: "bilibili://main/home/",
        icon: "http://i0.hdslb.com/bfs/archive/63d7ee88d471786c1af45af86e8cb7f607edf91b.png",
        icon_selected: "http://i0.hdslb.com/bfs/archive/e5106aa688dc729e7f0eafcbb80317feb54a43bd.png"
      },
      {
        pos: 2, id: 179, name: "动态", tab_id: "dynamic",
        uri: "bilibili://following/home/",
        icon: "http://i0.hdslb.com/bfs/archive/86dfbe5fa32f11a8588b9ae0fccb77d3c27cedf6.png",
        icon_selected: "http://i0.hdslb.com/bfs/archive/25b658e1f6b6da57eecba328556101dbdcb4b53f.png"
      },
      {
        pos: 5, id: 181, name: "我的", tab_id: "我的Bottom",
        uri: "bilibili://user_center/",
        icon: "http://i0.hdslb.com/bfs/archive/4b0b2c49ffeb4f0c2e6a4cceebeef0aab1c53fe1.png",
        icon_selected: "http://i0.hdslb.com/bfs/archive/a54a8009116cb896e64ef14dcf50e5cade401e00.png"
      }
    ];
    return e;
  }

  // —— 启动页去广告 ——
  // 清空 show / event_list
  // 清空 account / preload，将拉取间隔设为约1年（防重新拉取），禁止广告预下载
  function s(e) {
    // 清空广告展示相关字段
    ["show", "event_list", "account", "preload"].forEach(k => {
      if (e.data[k] !== undefined) e.data[k] = Array.isArray(e.data[k]) ? [] : undefined;
    });
    // 将下次拉取时间设为极大值，避免重复拉取广告
    e.data.max_time      = 0;
    e.data.min_interval  = 31536000; // 1 年（秒）
    e.data.pull_interval = 31536000;
    // 禁止广告预下载，并将现有广告条目时间窗口设为无效范围
    if (Array.isArray(e.data.list)) {
      e.data.list.forEach(item => {
        item.duration             = 0;
        item.begin_time           = 2524579200; // 2049-12-31
        item.end_time             = 2524665599;
        item.enable_pre_download  = false;
      });
    }
    return e;
  }

  // —— 推荐首页去广告 ——
  function b(e) {
    if (Array.isArray(e.data.items)) {
      let t = new Set(["small_cover_v2", "large_cover_single_v9", "large_cover_v1"]);
      e.data.items = e.data.items.filter(i =>
        !i.banner_item &&
        !i.ad_info &&
        i.card_goto === "av" &&
        t.has(i.card_type)
      );
    }
    return e;
  }

  // —— 推荐页 Story 去广告 ——
  // 过滤 ad_info 和 card_goto 以 "ad" 开头的项，删除 story_cart_icon / free_flow_toast
  // 同时过滤 vertical_ad_* 类型，额外删除 image_infos / course_info / game_info
  function r(e) {
    if (Array.isArray(e.data.items)) {
      // 明确列出需要过滤掉的广告 card_goto 类型
      let adTypes = new Set(["vertical_ad_av", "vertical_ad_live", "vertical_ad_picture"]);
      e.data.items = e.data.items.reduce((t, i) => {
        if (
          !i.ad_info &&
          i.card_goto &&
          !i.card_goto.startsWith("ad") &&
          !adTypes.has(i.card_goto)
        ) {
          // 删除购物车、浮层提示、课程/游戏推广等噪音字段
          delete i.story_cart_icon;
          delete i.free_flow_toast;
          delete i.image_infos;
          delete i.course_info;
          delete i.game_info;
          t.push(i);
        }
        return t;
      }, []);
    }
    return e;
  }

  // —— "我的"页面定制 —
  function f(e, t) {
    let i = {
      // 只保留"离线缓存"、"历史记录"、"我的收藏"，删除"稍后再看"和"推荐服务"
      sections_v2: [
        {
          items: [
            {
              id: 396,
              title: "离线缓存",
              uri: "bilibili://user_center/download",
              icon: "http://i0.hdslb.com/bfs/archive/5fc84565ab73e716d20cd2f65e0e1de9495d56f8.png",
              common_op_item: {}
            },
            {
              id: 397,
              title: "历史记录",
              uri: "bilibili://user_center/history",
              icon: "http://i0.hdslb.com/bfs/archive/8385323c6acde52e9cd52514ae13c8b9481c1a16.png",
              common_op_item: {}
            },
            {
              id: 3072,
              title: "我的收藏",
              uri: "bilibili://user_center/favourite",
              icon: "http://i0.hdslb.com/bfs/archive/d79b19d983067a1b91614e830a7100c05204a821.png",
              common_op_item: {}
            }
          ],
          style: 1,
          button: {}
        },
        {
          // "更多服务" 部分，仅保留"设置"，删除"联系客服"
          title: "更多服务",
          items: [
            {
              id: 410,
              title: "设置",
              uri: "bilibili://user_center/setting",
              icon: "http://i0.hdslb.com/bfs/archive/e932404f2ee62e075a772920019e9fbdb4b5656a.png",
              common_op_item: {}
            }
          ],
          style: 2,
          button: {}
        }
      ],

      // iPad 版本同步更新：只保留"离线缓存"、"历史记录"、"我的收藏"，移除"稍后再看"
      ipad_sections: [
        {
          id: 747,
          title: "离线缓存",
          uri: "bilibili://user_center/download",
          icon: "http://i0.hdslb.com/bfs/feed-admin/9bd72251f7366c491cfe78818d453455473a9678.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 748,
          title: "历史记录",
          uri: "bilibili://user_center/history",
          icon: "http://i0.hdslb.com/bfs/feed-admin/83862e10685f34e16a10cfe1f89dbd7b2884d272.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 749,
          title: "我的收藏",
          uri: "bilibili://user_center/favourite",
          icon: "http://i0.hdslb.com/bfs/feed-admin/6ae7eff6af627590fc4ed80c905e9e0a6f0e8188.png",
          mng_resource: { icon_id: 0, icon: "" }
        }
      ],

      // iPad 版的其他区块保持不变
      ipad_upper_sections: [
        {
          id: 752,
          title: "创作首页",
          uri: "/uper/homevc",
          icon: "http://i0.hdslb.com/bfs/feed-admin/d20dfed3b403c895506b1c92ecd5874abb700c01.png",
          mng_resource: { icon_id: 0, icon: "" }
        }
      ],
      ipad_recommend_sections: [
        {
          id: 755,
          title: "我的关注",
          uri: "bilibili://user_center/myfollows",
          icon: "http://i0.hdslb.com/bfs/feed-admin/fdd7f676030c6996d36763a078442a210fc5a8c0.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 756,
          title: "我的消息",
          uri: "bilibili://link/im_home",
          icon: "http://i0.hdslb.com/bfs/feed-admin/e1471740130a08a48b02a4ab29ed9d5f2281e3bf.png",
          mng_resource: { icon_id: 0, icon: "" }
        }
      ],

      // iPad "更多服务" 同步，只保留"设置"，移除"我的客服"
      ipad_more_sections: [
        {
          id: 764,
          title: "设置",
          uri: "bilibili://user_center/setting",
          icon: "http://i0.hdslb.com/bfs/feed-admin/34e8faea00b3dd78977266b58d77398b0ac9410b.png",
          mng_resource: { icon_id: 0, icon: "" }
        }
      ]
    };

    // 覆盖"我的"页面原始返回
    Object.keys(i).forEach(a => {
      if (e.data[a]) {
        e.data[a] = i[a];
      }
    });

    // 如果传参中有 showUperCenter，就插入"创作中心"模块（可选）
    if (t.showUperCenter && e.data.sections_v2) {
      e.data.sections_v2.splice(1, 0, {
        title: "创作中心",
        items: [
          {
            id: 171,
            title: "创作中心",
            uri: "bilibili://uper/homevc",
            icon: "http://i0.hdslb.com/bfs/archive/d3aad2d07538d2d43805f1fa14a412d7a45cc861.png",
            need_login: 1,
            global_red_dot: 0,
            display: 1,
            is_up_anchor: true
          },
          {
            id: 533,
            title: "数据中心",
            uri: "https://member.bilibili.com/york/data-center?navhide=1&from=profile",
            icon: "http://i0.hdslb.com/bfs/feed-admin/367204ba56004b1a78211ba27eef5b4cc53a35.png",
            need_login: 1,
            global_red_dot: 0,
            display: 1
          },
          {
            id: 707,
            title: "直播中心",
            uri: "https://live.bilibili.com/p/html/live-app-anchor-center/index.html?is_live_webview=1#/",
            icon: "http://i0.hdslb.com/bfs/feed-admin/48e17ccd0ce0cfc9c7826422d5e47ce98f064c2a.png",
            need_login: 1,
            display: 1
          },
          {
            id: 2647,
            title: "直播数据",
            uri: "https://live.bilibili.com/p/html/live-app-data/index.html?source_tag=0&foreground=pink&is_live_webview=1&hybrid_set_header=2#/",
            icon: "https://i0.hdslb.com/bfs/legacy/0566b128c51d85b7ec545f318e1fd437d172dfea.png",
            display: 1
          }
        ],
        style: 1,
        button: {
          text: "发布",
          url: "bilibili://uper/user_center/archive_selection",
          icon: "http://i0.hdslb.com/bfs/archive/205f47675eaaca7912111e0e9b1ac94cb985901f.png",
          style: 1
        },
        type: 1,
        up_title: "创作中心"
      });
    }

    // 删除无用字段，并注入 VIP 信息
    delete e.data.answer;
    delete e.data.live_tip;
    delete e.data.vip_section;
    delete e.data.vip_section_v2;
    delete e.data.modular_vip_section;
    e.data.vip_type = 2;
    e.data.vip = d();

    return e;
  }

  // —— 获取"我的信息"时注入 VIP ——
  function _(e) {
    e.data.vip = d();
    return e;
  }

  // ================================================================
  // 新增功能
  // ================================================================

  // —— 动态页去广告 ——
  // 接口：/index/feed
  // 过滤动态列表中的 banner_v2 和 activity_card_v1 类型卡片
  function F(e) {
    if (Array.isArray(e.data.card_list)) {
      let adCardTypes = new Set(["banner_v2", "activity_card_v1"]);
      e.data.card_list = e.data.card_list.filter(i => !adCardTypes.has(i.card_type));
    }
    return e;
  }

  // —— 直播间处理 ——
  // 接口：/index/getInfoByRoom
  // 清理直播间内的购物组件、预约信息、活动横幅、功能卡片及推广 tab
  function J(e) {
    let i = e.data;

    // 清空大卡片、隐藏预约状态
    i.big_card_info        = null;
    i.show_reserve_status  = false;
    if (i.reserve_info)  i.reserve_info.show_reserve_status = false;

    // 隐藏购物组件
    if (i.shopping_info) i.shopping_info.is_show = 0;

    // 清空活动横幅和功能卡片
    if (i.activity_banner_info) h(i.activity_banner_info);
    if (i.function_card)        h(i.function_card);

    // 清理 new_tab_info 中的推广 tab（biz_id 黑名单）
    if (i.new_tab_info) {
      let tabInfo  = i.new_tab_info;
      // 过滤外层 tab 列表中的推广项（biz_id=33 为购物 tab）
      if (Array.isArray(tabInfo.outer_list)) {
        tabInfo.outer_list = tabInfo.outer_list.filter(o => o.biz_id !== 33);
      }
      // 过滤候选列表和 v2 外层列表中的推广 biz_id
      if (Array.isArray(tabInfo.candidate_list) && Array.isArray(tabInfo.v2_outer_list)) {
        let blockedBizIds = new Set([33, 36, 162, 186]);
        tabInfo.candidate_list = tabInfo.candidate_list.filter(n => !blockedBizIds.has(n.biz_id));
        tabInfo.v2_outer_list.forEach(n => {
          n.indices = n.indices.filter(d => !blockedBizIds.has(d));
        });
      }
    }

    // 特殊房间号 255：重置背景图为默认图片（避免商业定制背景）
    if (i.room_info && i.room_info.short_id === 255) {
      i.room_info.background_render_type = 0;
      i.room_info.app_background = "https://i0.hdslb.com/bfs/new_dyn/2dd8a4aa9fde3587b1a716957a07337013999324.png";
    }

    return e;
  }

  // —— 直播用户信息处理 ——
  // 接口：/index/getInfoByUser
  // 清理"一起看"功能入口和功能卡片推广
  function G(e) {
    let i = e.data;
    // 删除"一起看"相关字段
    delete i.play_together_info;
    delete i.play_together_info_v2;
    // 清空功能卡片
    if (i.function_card) h(i.function_card);
    return e;
  }

  // —— 工具函数：将对象所有字段置为 null（用于清空功能卡片/横幅对象）——
  function h(obj) {
    Object.keys(obj).forEach(k => obj[k] = null);
  }

  // ================================================================
  // VIP 相关
  // ================================================================

  // —— 模拟 VIP 信息 ——
  function d() {
    let img = p();
    return {
      status: 1,
      type: 2,
      vip_pay_type: 0,
      due_date: 90052704e5,
      tv_vip_status: 1,
      tv_vip_pay_type: 0,
      tv_due_date: 90052704e5,
      role: 15,
      theme_type: 0,
      nickname_color: "#FB7299",
      avatar_subscript: 1,
      avatar_subscript_url: "",
      avatar_icon: { icon_resource: {} },
      label: {
        path: "",
        text: "百年大会员",
        label_theme: "hundred_annual_vip",
        text_color: "#FFFFFF",
        bg_style: 1,
        bg_color: "#FB7299",
        border_color: "",
        use_img_label: true,
        image: img,
        img_label_uri_hans: "",
        img_label_uri_hant: "",
        img_label_uri_hans_static: img,
        img_label_uri_hant_static: img
      }
    };
  }

  // —— 根据日期返回不同 VIP 图标 ——
  function p() {
    let e = new Date(),
      t = e.getMonth() + 1,
      i = e.getDate();
    switch (`${t}/${i}`) {
      case "6/1":
        // 儿童节专属图标
        return "https://i0.hdslb.com/bfs/bangumi/kt/629e28d4426f1b44af1131ade99d27741cc61d4b.png";
      default:
        return "https://i0.hdslb.com/bfs/vip/52f60c8bdae8d4440edbb96dad72916022adf126.png";
    }
  }
})();
