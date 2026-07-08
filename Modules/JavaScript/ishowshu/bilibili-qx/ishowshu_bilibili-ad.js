//  2025-06-12
//  Rucu6, 树先生
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;

let obj;
try {
  obj = JSON.parse(body);
} catch (e) {
  console.log("数据返回异常，服务挂了");
  $done({});
}
//let obj = JSON.parse(body);

if (url.includes("/x/v2/search/square")) {
  if (obj?.data) {
    obj.data = { type: "history", title: "搜索历史", search_hotword_revision: 2 };
  }
} else if (url.includes("/resource/top/activity")) {
   var jsonString = '{ "code": -404, "message": "啥都木有", "ttl": 1, "data": null }';
   obj = JSON.parse(jsonString);
} else if (url.includes("/x/v2/feed/index?")) {
  // 首页推荐信息流
  if (obj?.data?.items?.length > 0) {
    // 白名单
    //obj.data.items = obj.data.items.filter((i) => i?.card_goto === "av");

    // 白名单，并且过滤竖频
    obj.data.items = obj.data.items.filter((i) => i?.card_goto === "av");
  }
  if (obj?.data?.config?.toast?.has_toast) {
    obj.data.config.toast.has_toast = false;
  }
} else if (url.includes("/x/resource/show/tab/v2")) {
  // 底部选项卡
  if (obj?.data?.bottom?.length > 0) {
    const sortLists = ["首页", "动态", "关注", "我的"];
    obj.data.bottom = obj.data.bottom
      .filter((i) => sortLists?.includes(i?.name))
      .sort((a, b) => sortLists.indexOf(a?.name) - sortLists.indexOf(b?.name));
  }
  // 首页导航栏
  if (obj?.data?.tab?.length > 0) {
    const sortLists = ["直播","推荐","热门"];
    obj.data.tab = obj.data.tab
      .filter((i) => sortLists?.includes(i?.name))
      .sort((a, b) => sortLists.indexOf(a?.name) - sortLists.indexOf(b?.name));
  }
  // 右上角按钮
  if (obj?.data?.top?.length > 0) {
    obj.data.top = obj.data.top.filter((i) => i?.name === "消息");
    if (obj?.data?.top?.[0]?.pos) {
      obj.data.top[0].pos = 1;
    }
    //obj.data.top = [];
  }
} else if (url.includes("/x/v2/account/mine?")) {
  // 我的页面
  if (obj?.data?.sections_v2?.length > 0) {
    let newSects = [];
    for (let item of obj.data.sections_v2) {
      delete item.button;
      if (item?.style) {
        if (item?.style === 1 || item?.style === 2) {
          if (item?.title) {
            if (item?.title === "创作中心" || item?.title === "推荐服务" || item?.title === "我的服务") {
              // 创作中心 推荐服务
              continue;
            } else if (item?.title === "更多服务") {
              delete item.title;
              if (item?.items?.length > 0) {
                let newItems = [];
                for (let i of item.items) {
                  if (/user_center\/feedback/g.test(i?.uri)) {
                    // 联系客服
                    //newItems.push(i);
                  } else if (/user_center\/setting/g.test(i?.uri)) {
                    // 设置
                    newItems.push(i);
                  } else {
                    continue;
                  }
                }
                item.items = newItems;
              }
            }
          }
        } else {
          // 其他style
          continue;
        }
      }
      newSects.push(item);
    }
    obj.data.sections_v2 = newSects;
  }
  
  //  我的页面 vip会员六一儿童节图标
  obj.data.vip.status = 1;
  obj.data.vip.type = 2;
  obj.data.vip.label.text = "年度大会员";
  obj.data.vip.label.image = "https://i0.hdslb.com/bfs/bangumi/kt/629e28d4426f1b44af1131ade99d27741cc61d4b.png";

  //  删除会员横幅
  delete obj.data.modular_vip_section;
  obj.data.use_modular_vip_section = false;

} else if (url.includes("/x/v2/feed/index/story")) {
  // 竖屏模式信息流
  if (obj?.data?.items?.length > 0) {
    // vertical_live 直播内容
    // vertical_pgc 大会员专享
    let newItems = [];
    for (let item of obj.data.items) {
      if (item?.hasOwnProperty("ad_info")) {
        continue;
      } else if (["vertical_ad_av", "vertical_live", "vertical_pgc"]?.includes(item?.card_goto)) {
        continue;
      } else {
        delete item.creative_entrance; // 推荐话题搜索框
        delete item.story_cart_icon; // 相关话题图标
        delete item.free_flow_toast;
        newItems.push(item);
      }
    }
    obj.data.items = newItems;
  }
} else if (url.includes("/pgc/page/bangumi") || url.includes("/pgc/page/cinema/tab")) {
  // 观影页
  if (obj.result?.modules?.length > 0) {
    obj.result.modules.forEach((i) => {
      if (i?.style?.startsWith("banner")) {
        if (i?.items?.length > 0) {
          i.items = i.items.filter((ii) => ii?.link?.includes("play"));
        }
      } else if (i?.style?.startsWith("function")) {
        if (i?.items?.length > 0) {
          i.items = i.items.filter((ii) => ii?.blink?.startsWith("bilibili"));
        }
      } else if ([241, 1283, 1284, 1441]?.includes(i?.module_id)) {
        if (i?.items?.length > 0) {
          i.items = [];
        }
      } else if (i?.style?.startsWith("tip")) {
        if (i?.items?.length > 0) {
          i.items = [];
        }
      }
    });
  }
} else if (url.includes("/xlive/app-room/v1/index/getInfoByRoom") || url.includes("/xlive/app-room/v1/index/getInfoByUser") || url.includes("/xlive/app-interface/v2/index/feed")) {
  delete obj.data.play_together_info;
  delete obj.data.play_together_info_v2;
  delete obj.data.activity_banner_info;
  
  if (obj?.data?.function_card?.length > 0) {
    obj.data.function_card = null;
  }
  
  const banner_list = ["banner_v2", "activity_card_v1"];
  if (obj?.data?.card_list?.length > 0) {
    obj.data.card_list = obj.data.card_list.filter((item) => !banner_list.includes(item.card_type));
    
    // 直播tab标签
    // 遍历 card_list 数组
    obj.data.card_list.forEach(card => {
      // 找到 card_type 为 area_entrance_v3 的元素
      if (card?.card_type === 'area_entrance_v3') {
        // 确认嵌套的 list 数组存在
        const targetList = card?.card_data?.area_entrance_v3?.list;
        if (targetList && Array.isArray(targetList)) {
          // 过滤保留 id 为 200002 或 6 的元素
          card.card_data.area_entrance_v3.list = targetList.filter(item => 
            item?.id === 6
          );
        }
      }
    });
  }
  
  if (obj?.data?.new_tab_info?.outer_list?.length > 0) {
    obj.data.new_tab_info.outer_list = obj.data.new_tab_info.outer_list.filter((i) => i?.biz_id !== 33);
  }
  
  if (obj?.data?.show_reserve_status !== undefined) {
      obj.data.show_reserve_status = false;
  }
  if (obj?.data?.reserve_info !== undefined) {
      obj.data.reserve_info.show_reserve_status = false;
  }
  if (obj?.data?.shopping_info !== undefined) {
      obj.data.shopping_info.is_show = 0;
  }
} else if (url.includes("/second/getList")) {
  obj.data.banner = [];
}

body = JSON.stringify(obj);
$done({body});
