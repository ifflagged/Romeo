# —— 根据当前日期返回不同 VIP 图标 ——
def p:
  (now | strftime("%Y-%m-%d %H:%M") as $debug_time
   | strftime("%-m/%-d")) as $md
  | if $md == "6/1" then
      "https://i0.hdslb.com/bfs/bangumi/kt/629e28d4426f1b44af1131ade99d27741cc61d4b.png"
    else
      "https://i0.hdslb.com/bfs/vip/52f60c8bdae8d4440edbb96dad72916022adf126.png"
    end;

def d:
  (p) as $vip_icon  # 保存图标URL避免重复计算
  | {
      status: 1,
      type: 2,
      vip_pay_type: 0,
      due_date: 9005270400000,
      tv_vip_status: 1,
      tv_vip_pay_type: 0,
      tv_due_date: 9005270400000,
      role: 15,
      theme_type: 0,
      nickname_color: "#FB7299",
      avatar_subscript: 1,
      avatar_subscript_url: $vip_icon,  # 修复：使用正确的图标URL
      avatar_icon: {
        icon_resource: {
          icon_url: $vip_icon  # 添加图标URL
        }
      },
      label: {
        path: "",
        text: "百年大会员",
        label_theme: "hundred_annual_vip",
        text_color: "#FFFFFF",
        bg_style: 1,
        bg_color: "#FB7299",
        border_color: "",
        use_img_label: true,
        image: $vip_icon,
        img_label_uri_hans: $vip_icon,  # 修复：添加缺失的中文图标
        img_label_uri_hant: $vip_icon,  # 修复：添加缺失的繁体图标
        img_label_uri_hans_static: $vip_icon,
        img_label_uri_hant_static: $vip_icon
      }
    };

.data |= (
  del(.answer, .live_tip, .vip_section, .vip_section_v2, .modular_vip_section)
  | .vip_type = 2
  
  # 修复VIP处理逻辑：确保始终应用自定义VIP数据
  | .vip = d  # 直接覆盖，不保留原始VIP数据
  
  # 如果存在 sections_v2，覆盖为指定数组
  | if .sections_v2 then
      .sections_v2 =
      [
        {
          "items": [
            {
              "id": 396,
              "title": "离线缓存",
              "uri": "bilibili://user_center/download",
              "icon": "http://i0.hdslb.com/bfs/archive/5fc84565ab73e716d20cd2f65e0e1de9495d56f8.png",
              "common_op_item": {}
            },
            {
              "id": 397,
              "title": "历史记录",
              "uri": "bilibili://user_center/history",
              "icon": "http://i0.hdslb.com/bfs/archive/8385323c6acde52e9cd52514ae13c8b9481c1a16.png",
              "common_op_item": {}
            },
            {
              "id": 3072,
              "title": "我的收藏",
              "uri": "bilibili://user_center/favourite",
              "icon": "http://i0.hdslb.com/bfs/archive/d79b19d983067a1b91614e830a7100c05204a821.png",
              "common_op_item": {}
            }
          ],
          "style": 1,
          "button": {}
        },
        {
          "title": "更多服务",
          "items": [
            {
              "id": 410,
              "title": "设置",
              "uri": "bilibili://user_center/setting",
              "icon": "http://i0.hdslb.com/bfs/archive/e932404f2ee62e075a772920019e9fbdb4b5656a.png",
              "common_op_item": {}
            }
          ],
          "style": 2,
          "button": {}
        }
      ]
    else
      .
    end
  # 如果存在 ipad_sections，覆盖为指定数组
  | if .ipad_sections then
      .ipad_sections =
      [
        {
          "id": 747,
          "title": "离线缓存",
          "uri": "bilibili://user_center/download",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/9bd72251f7366c491cfe78818d453455473a9678.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        },
        {
          "id": 748,
          "title": "历史记录",
          "uri": "bilibili://user_center/history",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/83862e10685f34e16a10cfe1f89dbd7b2884d272.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        },
        {
          "id": 749,
          "title": "我的收藏",
          "uri": "bilibili://user_center/favourite",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/6ae7eff6af627590fc4ed80c905e9e0a6f0e8188.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        }
      ]
    else
      .
    end
  # 如果存在 ipad_upper_sections，覆盖为指定数组
  | if .ipad_upper_sections then
      .ipad_upper_sections =
      [
        {
          "id": 752,
          "title": "创作首页",
          "uri": "/uper/homevc",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/d20dfed3b403c895506b1c92ecd5874abb700c01.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        }
      ]
    else
      .
    end
  # 如果存在 ipad_recommend_sections，覆盖为指定数组
  | if .ipad_recommend_sections then
      .ipad_recommend_sections =
      [
        {
          "id": 755,
          "title": "我的关注",
          "uri": "bilibili://user_center/myfollows",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/fdd7f676030c6996d36763a078442a210fc5a8c0.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        },
        {
          "id": 756,
          "title": "我的消息",
          "uri": "bilibili://link/im_home",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/e1471740130a08a48b02a4ab29ed9d5f2281e3bf.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        }
      ]
    else
      .
    end
  # 如果存在 ipad_more_sections，覆盖为指定数组
  | if .ipad_more_sections then
      .ipad_more_sections =
      [
        {
          "id": 764,
          "title": "设置",
          "uri": "bilibili://user_center/setting",
          "icon": "http://i0.hdslb.com/bfs/feed-admin/34e8faea00b3dd78977266b58d77398b0ac9410b.png",
          "mng_resource": { "icon_id": 0, "icon": "" }
        }
      ]
    else
      .
    end
)
