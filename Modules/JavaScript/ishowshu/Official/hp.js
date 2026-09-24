//  2025-07-18
//  树先生, 怎么肥事
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;
let obj = null;

if (body === "undefined") {
  console.log('body的值为undefined，无法解析');
  $done({});
} else if (typeof body === 'string') {
  try {
    obj = JSON.parse(body);
  } catch (e) {
    console.log('JSON解析失败：' + e);
    $done({});
  }
} else {
  console.log('body不是有效的字符串：' + body);
  $done({});
}


//  过滤热榜游戏帖子
if (url.indexOf("/hotRank") != -1) {
  let nicknamesToExclude = ["虎扑电竞资讯"];  
  let topicNamesToExclude = ["英雄联盟", "王者荣耀", "和平精英"];
  obj.result.listV2 = obj.result.listV2.filter(item => !nicknamesToExclude.includes(item.thread.nickname));
  obj.result.listV2 = obj.result.listV2.filter(item => !topicNamesToExclude.includes(item.thread.topic_name));
}

//  赛事直播详情页
if (url.indexOf("/matchallapi/liveTabList") != -1) {
  let tabList = ["live_lottery", "live_game"];
  obj.result.categoryList = obj.result.categoryList.filter(item => !tabList.includes(item.categoryId));
}


//  专区推荐tab
if (url.indexOf("/topics/topicSquareDetail") != -1) {
  let tabList = [-99];
  obj.data.list = obj.data.list.filter(item => !tabList.includes(item.cate_id));
}

// 开屏广告
if (url.includes("/interfaceAd/getOther")) {
  obj.ad_code = -41;
}

// 推荐页横幅广告
if (url.includes("/buffer/hotList")) {
  obj.result.topBanner = {};
}

// 专区顶部横幅
if (url.includes("/topics/")) {
  if (obj?.data?.topicResources) {
    obj.data.topicResources = [];
  }
}

// 主页vip推广
if (url.includes("/bplapi/user/v1/more")) {
  delete obj.result.inviteInfo;
  delete obj.result.vipInfo
}

// 个人主页底部菜单
if (url.includes("/lego/data")) {
  let menuArr = ["multiIcon"];
  obj.data.cards = obj.data.cards.filter(item => !menuArr.includes(item.code));
}

// nba赛事签到活动模块
if (url.includes("/nav/content")) {
  obj.result.components = obj.result.components.filter(item => item.order !== 5);
}

body = JSON.stringify(obj);
$done({body});
