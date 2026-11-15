// 合并 RuCu6 (myinfo 清晰度) 与 mine_Bilibili_remove_ads (我的页面去广告)

const url = $request.url;
if (!$response.body) $done({});

let obj = JSON.parse($response.body);

if (obj && obj.data) {
  // 1. 处理 /x/v2/account/myinfo 接口（仅保留会员专属清晰度）
  if (url.includes("/x/v2/account/myinfo")) {
    if (obj.data.vip && obj.data.vip.status === 0) {
      obj.data.vip.type = 2;
      obj.data.vip.status = 1;
      obj.data.vip.due_date = 3818419199; // 2090-12-31 23:59:59
      obj.data.vip.role = 3;
    }
  }

  // 2. 处理 /x/v2/account/mine 接口（"我的"页面精简与去广告）
  else if (url.includes("/x/v2/account/mine")) {
    // 删除多余模块
    const keysToDelete = [
      "answer",
      "live_tip",
      "vip_section",
      "vip_section_v2",
      "modular_vip_section",
      "ipad_upper_sections"
    ];
    keysToDelete.forEach((key) => delete obj.data[key]);

    obj.data.use_modular_vip_section = false;
    obj.data.vip_type = 2;

    // 修改 VIP 状态与角标样式
    if (obj.data.vip && obj.data.vip.status === 0) {
      Object.assign(obj.data.vip, {
        status: 1,
        type: 2,
        due_date: 9005270400000,
        role: 15,
        vip_type: 2,
        vip_pay_type: 1,
        label: {
          bg_color: "#FB7299",
          border_color: "",
          bg_style: 1,
          text: "年度大会员",
          path: "",
          image: "https://i0.hdslb.com/bfs/activity-plat/static/20230907/e41bd47e5579cfff81770e41f5107ba2/WIOlCPa1Ch.png",
          label_theme: "annual_vip",
          text_color: "#FFFFFF"
        },
        nickname_color: "#FB7299"
      });
    }

    // 重构手机端 sections_v2
    if (obj.data.sections_v2) {
      obj.data.sections_v2 = [
        {
          items: [
            {
              id: 397,
              title: "历史记录",
              uri: "bilibili://user_center/history",
              icon: "http://i0.hdslb.com/bfs/archive/8385323c6acde52e9cd52514ae13c8b9481c1a16.png",
              common_op_item: {}
            },
            {
              id: 396,
              title: "离线缓存",
              uri: "bilibili://user_center/download",
              icon: "http://i0.hdslb.com/bfs/archive/5fc84565ab73e716d20cd2f65e0e1de9495d56f8.png",
              common_op_item: {}
            },
            {
              id: 3072,
              title: "我的收藏",
              uri: "bilibili://user_center/favourite?version=2",
              icon: "http://i0.hdslb.com/bfs/archive/d79b19d983067a1b91614e830a7100c05204a821.png",
              common_op_item: {}
            },
            {
              id: 2830,
              title: "稍后再看",
              uri: "bilibili://user_center/watch_later_v2",
              icon: "http://i0.hdslb.com/bfs/archive/63bb768caa02a68cb566a838f6f2415f0d1d02d6.png",
              need_login: 1,
              common_op_item: {}
            }
          ],
          style: 1,
          button: {}
        },
        {
          title: "更多服务",
          items: [
            {
              id: 407,
              title: "联系客服",
              uri: "bilibili://user_center/feedback",
              icon: "http://i0.hdslb.com/bfs/archive/7ca840cf1d887a45ee1ef441ab57845bf26ef5fa.png",
              common_op_item: {}
            },
            {
              id: 410,
              title: "设置",
              uri: "bilibili://user_center/setting",
              icon: "http://i0.hdslb.com/bfs/archive/e932404f2ee62e075a772920019e9fbdb4b5656a.png",
              common_op_item: {}
            },
            {
              id: 129515498,
              title: "Biliverse 哔哩万象",
              uri: "bilibili://web/general?url=https%3A%2F%2Fapp.bilibili.com%2Fsettings%2F",
              icon: "https://biliverse.github.io/settings/assets/Biliverse_subject.png",
              common_op_item: {}
            }
          ],
          style: 2,
          button: {}
        }
      ];
    }

    // 重构 iPad 端 ipad_sections
    if (obj.data.ipad_sections) {
      obj.data.ipad_sections = [
        {
          id: 748,
          title: "历史记录",
          uri: "bilibili://user_center/history",
          icon: "http://i0.hdslb.com/bfs/feed-admin/83862e10685f34e16a10cfe1f89dbd7b2884d272.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 747,
          title: "离线缓存",
          uri: "bilibili://user_center/download",
          icon: "http://i0.hdslb.com/bfs/feed-admin/9bd72251f7366c491cfe78818d453455473a9678.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 749,
          title: "我的收藏",
          uri: "bilibili://user_center/favourite",
          icon: "http://i0.hdslb.com/bfs/feed-admin/6ae7eff6af627590fc4ed80c905e9e0a6f0e8188.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 750,
          title: "稍后再看",
          uri: "bilibili://user_center/watch_later",
          icon: "http://i0.hdslb.com/bfs/feed-admin/928ba9f559b02129e51993efc8afe95014edec94.png",
          mng_resource: { icon_id: 0, icon: "" }
        }
      ];
    }

    // 重构 iPad 端 ipad_recommend_sections
    if (obj.data.ipad_recommend_sections) {
      obj.data.ipad_recommend_sections = [
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
      ];
    }

    // 重构 iPad 端 ipad_more_sections
    if (obj.data.ipad_more_sections) {
      obj.data.ipad_more_sections = [
        {
          id: 763,
          title: "我的客服",
          uri: "bilibili://user_center/feedback",
          icon: "http://i0.hdslb.com/bfs/feed-admin/7801a6180fb67cf5f8ee05a66a4668e49fb38788.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 764,
          title: "设置",
          uri: "bilibili://user_center/setting",
          icon: "http://i0.hdslb.com/bfs/feed-admin/34e8faea00b3dd78977266b58d77398b0ac9410b.png",
          mng_resource: { icon_id: 0, icon: "" }
        },
        {
          id: 129515498,
          title: "Biliverse 哔哩万象",
          uri: "bilibili://web/general?url=https%3A%2F%2Fapp.bilibili.com%2Fsettings%2F",
          icon: "https://biliverse.github.io/settings/assets/Biliverse_subject.png",
          mng_resource: { icon_id: 0, icon: "" }
        }
      ];
    }
  }
}

$done({ body: JSON.stringify(obj) });
