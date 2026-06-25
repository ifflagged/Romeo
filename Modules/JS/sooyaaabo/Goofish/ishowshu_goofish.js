//  2026-05-28
//  树先生
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

if (url.includes("/gw/mtop.taobao.idlehome.home.nextfresh")) {
  // 可能存在的首页标签
  delete obj.data.widgetReturnDO;
  // 删除banner图
  delete obj.data.bannerReturnDO;
  // 信息流广告
  if (obj.data?.sections) {
    obj.data.sections = obj.data.sections.filter(section => {
      return !(section.data && (section.data.bizType === "AD" || section.data.bizType === "homepage"));
    });

    let excludeNames = ['fish_home_yunying_card_d3', 'idlefish_seafood_market', 'fish_home_chat_room'];
    obj.data.sections = obj.data.sections.filter(function(section) {  
      return !excludeNames.includes(section.template.name);  
    });
    
    obj.data.sections = obj.data.sections.filter(section => {
      return (section.data && (section.data.cardTypeValue === "Item"));
    });
  }
  // 首页新的顶部图标菜单
  obj.data.homeTopList = [];
}

if (url.includes("/gw/mtop.taobao.idle.local.home")) {
  if (obj.data?.sections) {
    obj.data.sections = obj.data.sections.filter(section => {
      return !(section.data && section.data.bizType === "AD");
    });
  }
}

if (url.includes("/gw/mtop.taobao.idle.home.whale.modulet")) {
  delete obj.data.container.sections;
}

if (url.includes("/gw/mtop.taobao.idlemtopsearch.search.shade") || url.includes("/gw/mtop.taobao.idle.user.strategy.list")) {
  delete obj.data;
}

if (url.includes("/mtop.idle.user.page.my.adapter")) {
  //  "0"会员等级+我的收藏; "1"我的交易; "2"闲鱼回收; "3"工具栏目; "4"底部大图标菜单; （2026-05-14）

  //  保留 0、1、3
  const indexArr = ["0", "1", "3"];
  obj.data.container.sections = obj.data.container.sections.filter(item => indexArr.includes(item.index));

  //  底部猜你喜欢
  obj.data.ability = [];
  
  //  处理横移菜单item.tool.exContent.tools[].exContent.title: 超级擦亮,拍照看价格,借钱,闲鱼小法庭,闲鱼公约,闲鱼圈子,循环商店,闲鱼体验官,安全中心,皮肤中心,帖子中心,代练入驻
  
  obj.data.container.sections.forEach(section => {
    if (section.index === "3") {
      // 定义要过滤的 toolId 列表
      const targetToolTitle = ["超级擦亮", "闲鱼小法庭", "闲鱼公约", "安全中心", "帖子中心"];
      // 筛选并保留一层数组结构
      if (section.item?.tool?.exContent) {
        const tools = section.item.tool.exContent.tools;
      
        const foundElements = section.item.tool.exContent.tools
          .flat() // 将所有子数组扁平化成一个数组
          .filter(element => 
            element.exContent && 
            element.exContent.title && 
            targetToolTitle.includes(element.exContent.title)
          );
      
        // 将筛选后的工具列表更新到 section 中
        section.item.tool.exContent.tools = [foundElements];
      }
    }
  });


  //  处理闲鱼会员信息
  // obj.data.container.sections.forEach(section => {
  //    if (section.index === "0" && section.item?.level) {
  //      //  右边动画
  //      section.item.level.exContent.bubble = "";
  //      //  中间动画
  //      section.item.level.exContent.image = "";
  //      //  提示文字行
  //      section.item.level.exContent.tips = "";
  //      //  箭头图标
  //      section.item.level.exContent.arrowUrl = "";
  //      //  tag提示
  //      section.item.level.exContent.tag = "";
  //      //  轮播图标
  //      section.item.level.exContent.swiper = [];
  //    }
  //    if (section.index === "0" && section.item?.tip) {
  //      delete section.item.tip;
  //    }
  // });
  
}

if (url.includes("/mtop.taobao.idlehome.home.circle.list")) {
  // 过滤 circleList 数组，只保留 circleId 为 1 和 2 的元素
  obj.data.circleList = obj.data.circleList.filter(circle => circle.circleId === "1" || circle.circleId === "2");
  // 首页顶部列表
  if (obj.data?.next?.headList) {
    obj.data.next.headList = obj.data.next.headList.filter(circle => circle.bizCode === "main" || circle.bizCode === "recycle");
  }
  obj.data.headList = obj.data.headList.filter(circle => circle.bizCode === "main" || circle.bizCode === "recycle");
}

//if (url.indexOf("/mtop.taobao.idlemtopsearch.search") != -1) {
  //obj.data.resultList = obj.data.resultList.filter(item => {  
    // 过滤掉表示为广告的项
    //return item.data.item.main.exContent.isAliMaMaAD !== "true";  
  //});
//}

// 过滤掉搜索结果表示为广告的项
if (url.includes("/gw/mtop.taobao.idlemtopsearch.search")) {
    if (obj.data && Array.isArray(obj.data.resultList)) {  
      // 使用filter方法遍历resultList数组，并过滤掉不符合条件的元素  
      obj.data.resultList = obj.data.resultList.filter(element => {  
          // 检查当前元素是否包含所需的嵌套属性  
          if (element.data && element.data.item && element.data.item.main && element.data.item.main.exContent) {  
              // 检查isAliMaMaAD的值  
              const isAliMaMaAD = element.data.item.main.exContent.isAliMaMaAD;  
              // 如果isAliMaMaAD是true或"true"，则返回false以过滤掉这个元素  
              return !(isAliMaMaAD === true || isAliMaMaAD === "true");  
          }  
          // 如果没有所需的嵌套属性，也可以返回true来保留这个元素（如果你希望的话）  
          // 或者你可以选择返回false来过滤掉没有这些属性的元素  
          // 这里我们假设没有这些属性的元素应该被保留  
          return true;  
      }); 
      
      //obj.data.resultList = obj.data.resultList.filter(element => {  
        //return element.data.template.name !== "idlefish_search_card_category_select";
      //});
      
      const excludeNames = ["idlefish_search_card_category_select", "idlefish_search_spu_market_publish"];
      obj.data.resultList = obj.data.resultList.filter(element => {
        return !excludeNames.includes(element.data.template.name);
      });
    }
    
    if (obj.data?.resultPrefixBar) {
      delete obj.data.resultPrefixBar;
    }
    
    if (obj.data?.topList) {
      obj.data.topList = [];
    }
}


if (url.includes("/mtop.taobao.idle.group.myself.banner")) {
    obj.data.bannerList = [];
}


if (url.includes("/mtop.taobao.idle.playboy.recommend")) {
    obj.data.recommends = [];
    obj.data.items = [];
    obj.data.next = false;
    //obj.ret = ["fail::"];
}


if (url.includes("/mtop.taobao.idle.item.recommend.list")) {
    //obj.data.windCard.itemList = "";
    obj.data.cardList = [];
}

if (url.includes("/mtop.taobao.idle.local.nearby.itemdetail.enter/1.0")) {
   obj.data.targetUrl = "";
   obj.data.trackParams.itemIds = "";
   obj.data.nearbyItemInfoList = [];
   obj.data.name = "";
   obj.data.desc = "";
   obj.data.poiName = "";
}

if (url.includes("/gw/mtop.taobao.idlemessage.session.sync/3.0")) {
    obj.data.sessions = obj.data.sessions.filter(session => session.session.sessionType !== "25");
}

if (url.includes("idle.fun.follow.feed.list")) {
    obj.data.sections = obj.data.sections.filter(session => session.cardType === 9999);
    obj.data.sections.forEach(section => {
    if (section.cardData?.subText) {
        section.cardData.subText = "";
    }
  });
}

if (url.includes("idle.fun.follow.often.visit")) {
    obj.data.sections = [];
}

if (url.includes("idle.circle.myself.banner/1.0")) {
    obj.data.bannerList = [];
}

if (url.includes("idle.circle.visited/1.0")) {
    obj.data.visitedCircleList = [];
}

if (url.includes("follow.recommend.feed.list")) {
  //if (obj.data?.sections) {
    //obj.data.sections = obj.data.sections.filter(section => {
      //return section.cardData.userInfo.attention;
    //});
  //}
  obj.data.needDecryptKeys = [];
  obj.data.nextPage = false;
  obj.data.fitRecommendAB = true;
}

if (url.includes("/mtop.taobao.idle.local.flow.plat.section")) {
  const keyArr = ["fish_home_activity_enter_cardV1"];
  obj.data.data.components = obj.data.data.components.filter(item => !keyArr.includes(item.key));
}

  
body = JSON.stringify(obj);
$done({body});
