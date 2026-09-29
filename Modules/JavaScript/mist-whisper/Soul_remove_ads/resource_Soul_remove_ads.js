// 引用地址：https://klraw.pages.dev/kelv1n1n/script/refs/heads/main/js/soul.js
// 优化版本：2025-10-18
// 功能完全保留，增强健壮性 + 兼容性 + 调试支持

(() => {
  try {
    const url = $request.url;
    const body = $response.body;
    let obj;

    try {
      obj = JSON.parse(body);
    } catch (e) {
      console.log("❌ JSON 解析失败：" + e);
      return $done({ body });
    }

    // 🔧 调试开关（Surge/Loon 参数控制：#!arguments=debug=true）
    const toBool = v => v === true || v === "true";
    const debug = toBool($argument?.debug);

    const log = (...msg) => {
      if (debug) console.log("[Soul.js]", ...msg);
    };

    log("📡 请求URL:", url);

    // ========== [1] 聊天限制 ==========
    if (url.includes("/chat/limitInfo")) {
      log("模块: 聊天限制 /chat/limitInfo");
      if (obj?.data) {
        delete obj.data.subMsg;
        delete obj.data.extMsg;
        delete obj.data.abValue;
        delete obj.data.freeEquityStatus;
        delete obj.data.msg;
        delete obj.data.remainFreeCount;
        delete obj.data.type;
        obj.data.limit = false;
      }

    // ========== [2] 首页星球入口配置 ==========
    } else if (url.includes("/planet/config")) {
      log("模块: 星球配置 /planet/config");

      const args = $argument || {};
      const sortIdMap = {
        soulMatch: 1,
        voiceMatch: 2,
        partyMatch: 3,
        masked: 4,
        maskedMatch: 9,
        planet: 10
      };

      const resultArray = Object.keys(sortIdMap)
        .filter(k => toBool(args[k]))
        .map(k => sortIdMap[k]);

      if (obj?.data) {
        obj.data.showRedMind = false;
        if (obj.data.chatRoomInfo) obj.data.chatRoomInfo.showChatRoom = false;
        if (obj.data.gameInfo) {
          obj.data.gameInfo.showGameCard = false;
          obj.data.gameInfo.gameCards = [];
        }

        if (Array.isArray(obj.data.coreCards)) {
          obj.data.coreCards = obj.data.coreCards.filter(card =>
            resultArray.includes(card.sortId)
          );

          obj.data.coreCards.forEach(card => {
            card.showLuckyBag = false;
            card.showRedMind = false;
            card.style = 1;
            delete card.bgImg;
            delete card.iconUrl;
          });
        }

        obj.data.showLuckyBag = false;
      }

    // ========== [3] 派对广告横幅 ==========
    } else if (url.includes("/chatroom/chatClassifyRoomList")) {
      log("模块: 派对列表广告");
      if (obj?.data) obj.data.positionContentRespList = [];

    // ========== [4] 广场 Tab ==========
    } else if (url.includes("/square/header/tabs")) {
      log("模块: 广场 Tabs");
      if (Array.isArray(obj?.data)) {
        obj.data.forEach(card => (card.unreadFlag = 0));
        obj.data = obj.data.filter(item => item.pageId === "PostSquare_Recommend");
      }

    // ========== [5] 主页指标 ==========
    } else if (url.includes("/homepage/metrics")) {
      log("模块: 主页指标");
      if (obj?.data) {
        obj.data.recentViewNum = 0;
        obj.data.showTipsCard = false;
        obj.data.showMetric = false;
        obj.data.hasHomePageLiked = false;
        if (obj.data.homePageLikedMetric) {
          obj.data.homePageLikedMetric.addNum = 0;
          obj.data.homePageLikedMetric.likedTotalNum = 0;
          obj.data.homePageLikedMetric.hasShowHistoryDynamic = false;
        }
      }

    // ========== [6] 引导关注 ==========
    } else if (url.includes("relation/guideUserList")) {
      log("模块: 引导关注列表");
      if (obj?.data) obj.data.userDTOList = [];

    // ========== [7] 主页标签 ==========
    } else if (url.includes("/homepage/tabs/v2")) {
      log("模块: 主页标签");
      if (obj?.data?.headTabDTOList) {
        const tab = ["STAR_TRAILS"];
        obj.data.selectedTagPool = {};
        obj.data.headTabDTOList = obj.data.headTabDTOList.filter(
          t => !tab.includes(t.tabCode)
        );
      }

    // ========== [8] 聊天房间标签 ==========
    } else if (url.includes("/chatroom/getRoomTagInfo")) {
      log("模块: 聊天房间标签 /chatroom/getRoomTagInfo");

      const args = $argument || {};
      const idMap = {
        hot: 11,
        all: 0,
        emotion: 43,
        personal: 44,
        play: 12,
        interest: 10,
        argue: 6,
        story: 5,
        chat: 4,
        heart: 2
      };

      const resultArray = Object.keys(idMap)
        .filter(k => toBool(args[k]))
        .map(k => idMap[k]);

      if (obj?.data?.res && Array.isArray(obj.data.res)) {
        obj.data.res = obj.data.res.filter(t => resultArray.includes(t.id));
        obj.data.res.forEach(card => {
          if (card.iconConfig != null) card.iconConfig = null;
        });
      }

    // ========== [9] 图片通知 ==========
    } else if (url.includes("/snapchat/url")) {
      log("模块: 图片通知");
      try {
        const imageUrl = obj?.data?.url;
        if (imageUrl && typeof imageUrl === "string") {
          const attach = {
            openUrl: imageUrl,
            mediaUrl: imageUrl
          };
          $notification.post("图片通知", "查看图片", "点击查看详情", attach);
          log("图片地址:", imageUrl);
        }
      } catch (e) {
        console.log("⚠️ 图片通知处理异常:", e);
      }
    }

    $done({ body: JSON.stringify(obj) });

  } catch (e) {
    console.log("❌ 脚本执行异常:", e);
    $done({});
  }
})();