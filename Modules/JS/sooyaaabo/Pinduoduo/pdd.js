//  2025-07-31
//  树先生
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

try {
  if (url.indexOf("/homepage/hub") != -1) {
    //  底部菜单
    //const tabArray = ["多多视频", "大促会场"];
    const tabArray = ["首页", "聊天", "个人中心"];
    if (obj?.result?.bottom_tabs) {
      obj.result.bottom_tabs = obj.result.bottom_tabs.filter(tab => tabArray.includes(tab.title));
    }

    //  首页顶部菜单频道
    const topArray = [1];
    if (obj?.result?.all_top_opts) {
      //obj.result.all_top_opts = obj.result.all_top_opts.filter(top => topArray.includes(top.tab_id));
      obj.result.all_top_opts = [];
    }

    //  信息流和顶部菜单之间的栏目
    //delete obj.result.icon_set;
    delete obj.result.search_bar_hot_query;
    //delete obj.result.dy_module.irregular_banner_dy.data;
    
    // irregular_banner_dy:首页顶部618横幅广告
    // billion_subsidy_entrance:首页顶部百亿补贴栏目
    // recommend_fresh_info:多多买菜栏目
    // recommend_fresh_info_lite:多多买菜迷你?
    const adArray = [
      "billion_subsidy_entrance",
      "billion_subsidy_entrance_dy",
      "billion_subsidy_entrance_lite",
      "irregular_banner_dy", 
      "irregular_banner", 
      "ad_module", 
      "icon_set",
      "recommend_fresh_info",
      "timeline"
    ];
    if (obj?.result?.module_order) {
      obj.result.module_order = obj.result.module_order.filter(tab => !adArray.includes(tab.module_name));
    }
  }
} catch (error) {
  console.log("脚本执行出错:" + error.message);
  console.log("url:" + url);
}

body = JSON.stringify(obj);
$done({body});
