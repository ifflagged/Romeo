// 引用修改自：https://raw.githubusercontent.com/RuCu6/Loon/main/Scripts/weibo.js
// 2026-04-26

// ==================== 入口保护 ====================
(function() {
const url = $request.url;

// 响应对象不存在时直接放行，不做任何修改
if (!$response) $done({});
// 响应体为空时直接放行
if (!$response.body) $done({});

let body = $response.body;

// ==================== 微博详情页菜单配置 ====================
// true = 保留该菜单项，false = 移除该菜单项
const itemMenusConfig = {
  creatortypeask: false,           // 转发任务
  mblog_menus_apeal: true,         // 申诉
  mblog_menus_avatar_widget: false, // 用此头像挂件
  mblog_menus_bullet_shield: true, // 屏蔽弹幕
  mblog_menus_card_bg: false,      // 用此卡片背景
  mblog_menus_comment_manager: true, // 评论管理
  mblog_menus_copy_url: true,      // 复制链接（会被 unshift 到列表最前）
  mblog_menus_custom: false,       // 寄微博
  mblog_menus_delete: true,        // 删除
  mblog_menus_edit: true,          // 编辑
  mblog_menus_edit_history: true,  // 编辑记录
  mblog_menus_edit_video: true,    // 编辑视频
  mblog_menus_favorite: true,      // 收藏
  mblog_menus_follow: true,        // 关注
  mblog_menus_home: false,         // 返回首页
  mblog_menus_long_picture: true,  // 生成长图
  mblog_menus_modify_visible: true, // 设置分享范围
  mblog_menus_novelty: false,      // 新鲜事投稿
  mblog_menus_open_reward: false,  // 赞赏
  mblog_menus_popularize: false,
  mblog_menus_promote: false,      // 推广
  mblog_menus_report: true,        // 投诉
  mblog_menus_shield: true,        // 屏蔽
  mblog_menus_sticking: true,      // 置顶
  mblog_menus_video_feedback: false, // 播放反馈
  mblog_menus_video_later: false   // 可能是稍后再看
};

// ==================== 主处理逻辑 ====================

if (url.includes("/interface/sdk/sdkad.php")) {
  // ── 开屏广告（sdkad）──────────────────────────────────────────────────────
  // 该接口响应体末尾固定附加了 "OK" 两字节作为自定义终止标记
  // 不是标准 JSON，需要先校验并截断后再解析
  // 先用正则验证末尾确实是 "OK"，再截断；否则尝试直接解析原始 body
  let rawJson = body;
  if (/OK$/.test(body)) {
    rawJson = body.slice(0, -2);
  }

  let obj;
  try {
    obj = JSON.parse(rawJson);
  } catch (e) {
    // 解析失败说明响应格式发生变化，透传原始响应，不破坏正常功能
    $done({});
    return; // Loon/Surge 环境中 $done 后代码仍会继续执行，需要 return
  }

  // 禁用位置权限申请
  if (obj?.needlocation) {
    obj.needlocation = false;
  }
  // 禁用推送开屏广告
  if (obj?.show_push_splash_ad) {
    obj.show_push_splash_ad = false;
  }
  // 将背景广告延迟展示时间设为 1 年（实际效果：永不展示）
  if (obj?.background_delay_display_time) {
    obj.background_delay_display_time = 31536000; // 60 * 60 * 24 * 365
  }
  // 将上次广告展示延迟也设为 1 年
  if (obj?.lastAdShow_delay_display_time) {
    obj.lastAdShow_delay_display_time = 31536000;
  }
  // 实时广告视频拖拽缓冲时间清零
  if (obj?.realtime_ad_video_stall_time) {
    obj.realtime_ad_video_stall_time = 0;
  }
  // 实时广告超时时长清零
  if (obj?.realtime_ad_timeout_duration) {
    obj.realtime_ad_timeout_duration = 0;
  }
  // 遍历所有广告条目，将展示时间窗口推到遥远的未来
  if (obj?.ads?.length > 0) {
    for (let item of obj.ads) {
      item.displaytime = 0;                       // 展示时长清零
      item.displayintervel = 31536000;            // 展示间隔设为 1 年
      item.allowdaydisplaynum = 0;                // 每日允许展示次数清零
      item.begintime = "2040-01-01 00:00:00";     // 开始时间推到未来
      item.endtime   = "2040-01-01 23:59:59";     // 结束时间推到未来
    }
  }

  // 重新序列化，末尾补回 "OK" 标记（保持协议格式不变）
  $done({ body: JSON.stringify(obj) + "OK" });

} else {
  // ── 标准 JSON 接口处理入口 ───────────────────────────────────────────────
  // 解析失败时透传原始响应，不影响用户正常使用。
  let obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    $done({});
    return;
  }

  // ── /2/cardlist ── 发现页卡片列表 ─────────────────────────────────────────
  if (url.includes("/2/cardlist")) {
    // 移除发现页顶部趋势头图
    if (obj?.top) {
      delete obj.top;
    }
    if (obj?.cards?.length > 0) {
      let newCards = [];
      for (let card of obj.cards) {
        if (card?.card_group?.length > 0) {
          // 处理含有 card_group 的卡片（视频版块等）
          let newGroup = [];
          for (let group of card.card_group) {
            let cardType = group.card_type;
            // 120,145: 视频版块轮播图；192: 横版热门视频（电影/颜值/电视剧等）
            if ([120, 145, 192].includes(cardType)) {
              continue;
            }
            // 6: 我的热搜 / 查看更多热搜
            if (cardType === 6) {
              continue;
            }
            if (group?.mblog) {
              removeAvatar(group.mblog); // 清理卡片挂件和关注按钮
            }
            newGroup.push(group);
          }
          card.card_group = newGroup;
          newCards.push(card);
        } else {
          // 处理顶层卡片
          let cardType = card.card_type;
          // 17: 猜你想搜；58: 搜索偏好设置
          if ([17, 58].includes(cardType)) {
            continue;
          }
          if (card?.mblog) {
            removeAvatar(card.mblog); // 清理卡片挂件和关注按钮
          }
          newCards.push(card);
        }
      }
      obj.cards = newCards;
    }

  // ── /2/checkin/show ── 首页签到弹窗 ──────────────────────────────────────
  } else if (url.includes("/2/checkin/show")) {
    // 隐藏签到弹窗的展示标志
    if (obj?.show) {
      obj.show = 0;
    }
    if (obj?.show_time) {
      obj.show_time = 0;
    }
    // 清空红包浮窗、悬浮窗、惊喜配置
    obj.feed_redpacket = {};
    obj.floating_windows = [];
    obj.surprise_config = [];

  // ── /2/client/publisher_list ── 首页右上角发布按钮 ────────────────────────
  } else if (url.includes("/2/client/publisher_list")) {
    // 只保留「写微博」「图片」「视频」三个核心按钮，移除推广入口
    if (obj?.elements?.length > 0) {
      obj.elements = obj.elements.filter((i) => ["写微博", "图片", "视频"].includes(i?.app_name));
    }
    // 清空红包浮窗、悬浮窗、惊喜配置
    obj.feed_redpacket = {};
    obj.floating_windows = [];
    obj.surprise_config = [];

  // ── /2/push/active（第一个分支：早期简单处理）── 推送激活接口 ──────────────

  // ── /2/comments/build_comments ── 旧版评论区 ─────────────────────────────
  } else if (url.includes("/2/comments/build_comments")) {
    // 三种评论数据格式：datas（含 data 包装层）/ root_comments / comments
    if (obj?.datas?.length > 0) {
      // 格式一：每条评论包在 item.data 里
      let newItems = [];
      for (let item of obj.datas) {
        if (item?.data) {
          if (!isAd(item.data)) {
            cleanCommentItem(item.data); // 清理评论气泡、弹幕、VIP 按钮等
            // 过滤微博官方伪装的评论（用户名匹配「超话社区」或「微博」）
            if (item.data?.user) {
              removeAvatar(item.data);
              if (/(超话社区|微博)/.test(item.data.user?.name)) {
                continue;
              }
            }
            // 6: 为你推荐更多精彩内容；15: 过滤提示；41: 评论区氛围调查
            if ([6, 15, 41].includes(item?.type)) {
              continue;
            }
            // 广告类型标签过滤：只要存在 adType 字段即视为推广内容，
            // 无论具体值是什么，比字符串列表匹配更彻底，未来新增类型也能覆盖
            if (item.hasOwnProperty("adType")) {
              continue;
            }
            newItems.push(item);
          }
        }
      }
      obj.datas = newItems;

    } else if (obj?.root_comments?.length > 0) {
      // 格式二：评论数据直接在 item 层
      let newItems = [];
      for (let item of obj.root_comments) {
        if (!isAd(item)) {
          // 新版本评论气泡挂在 item 顶层
          if (item?.comment_bubble) {
            delete item.comment_bubble;
          }
          // 旧版评论气泡挂在 item.data 下
          cleanCommentItem(item.data);
          // 过滤微博官方伪装的评论
          if (item.user) {
            removeAvatar(item);
            if (["超话社区", "微博视频"].includes(item.user?.name)) {
              continue;
            }
          }
          newItems.push(item);
        }
      }
      obj.root_comments = newItems;

    } else if (obj?.comments?.length > 0) {
      // 格式三：子评论列表（回复列表）
      let newItems = [];
      for (let item of obj.comments) {
        // 移除回复评论的标记徽章
        if (item?.reply_comment?.comment_badge) {
          delete item.reply_comment.comment_badge;
        }
        // 移除用户图标
        if (item?.user?.icons) {
          delete item.user.icons;
        }
        newItems.push(item);
      }
      obj.comments = newItems;
    }

    // 清理根评论（楼主）的气泡
    if (obj?.rootComment?.comment_bubble) {
      delete obj.rootComment.comment_bubble;
    }
    // 移除帖子中的投票窗口
    if (obj?.status?.page_info) {
      removeVoteInfo(obj.status);
    }

  // ── /2/container/asyn ── 容器异步加载 ────────────────────────────────────
  } else if (url.includes("/2/container/asyn")) {
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        removeAvatar(item?.data); // 清理关注按钮
        // 过滤「你可能感兴趣的超话」推荐流
        if (/infeed_may_interest_in/.test(item?.itemId)) {
          continue;
        }
        // 过滤横版博主卡片（itemId 为 null 是其特征）
        if (item?.itemId === null) {
          continue;
        }
        // 清理子项目中的背景卡片挂件和投票窗口
        if (item?.items?.length > 0) {
          for (let i of item.items) {
            removeAvatar(i?.data);
            removeVoteInfo(i?.data);
          }
        }
        newItems.push(item);
      }
      obj.items = newItems;
    }

  // ── /2/direct_messages/user_list ── 私信会话列表 ─────────────────────────
  } else if (url.includes("/2/direct_messages/user_list")) {
    // 过滤「活动通知」「闪聊」等官方营销账号的会话
    if (obj?.user_list?.length > 0) {
      obj.user_list = obj.user_list.filter((i) => !["活动通知", "闪聊"].includes(i?.user?.name));
    }

  // ── /2/flowlist ── 关注列表（关注页 tab 列表） ────────────────────────────
  } else if (url.includes("/2/flowlist")) {
    // 清理关注列表中每条 item 的子项挂件和投票
    if (obj?.items?.length > 0) {
      for (let item of obj.items) {
        if (item?.items?.length > 0) {
          for (let i of item.items) {
            removeAvatar(i?.data); // 背景卡片挂件
            removeVoteInfo(i?.data); // 投票窗口
          }
        }
      }
    }
    // 过滤关注页顶部 tab：移除「推荐」tab 和「超话」tab
    if (obj?.channelInfo?.channels?.length > 0) {
      let newTabs = [];
      for (let tab of obj.channelInfo.channels) {
        if (/_selfrecomm/.test(tab?.flowId)) {
          continue; // 关注页推荐 tab
        } else if (/_chaohua/.test(tab?.flowId)) {
          continue; // 关注页超话 tab
        } else {
          newTabs.push(tab);
        }
      }
      obj.channelInfo.channels = newTabs;
    }

  // ── /2/flowpage ── 热搜列表 ───────────────────────────────────────────────
  } else if (url.includes("/2/flowpage")) {
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        // 移除「开启推送通知」的提示条
        if (item?.data?.itemid === "hot-search-push-notice") {
          continue;
        }
        // 处理含子项的热搜条目，过滤推广和手动置顶
        if (item?.items?.length > 0) {
          let newII = [];
          for (let i of item.items) {
            if (i?.data?.hasOwnProperty("promotion")) {
              continue; // 热搜列表中的推广项目
            } else if (/_img_search_stick/.test(i?.data?.pic)) {
              continue; // 手动置顶的微博热搜（图片 URL 含此特征）
            } else {
              newII.push(i);
            }
          }
          item.items = newII;
        }
        newItems.push(item);
      }
      obj.items = newItems;
    }

  // ── /2/groups/allgroups/v2 ── 首页顶部 tab 配置 ───────────────────────────
  } else if (url.includes("/2/groups/allgroups/v2")) {
    if (obj?.pageDatas?.length > 0) {
      let newTabs = [];
      for (let item of obj.pageDatas) {
        // 移除「扩展页」（homeExtend）
        if (item?.pageDataType === "homeExtend") {
          continue;
        }
        // 移除「推荐页」（homeHot）
        if (item?.pageDataType === "homeHot") {
          continue;
        }
        // 处理「关注页」（homeFeed）内的分组白名单
        if (item?.categories?.length > 0) {
          let newCates = [];
          for (let i of item.categories) {
            if (i?.title === "默认分组") {
              if (i?.pageDatas?.length > 0) {
                let newII = [];
                for (let ii of i.pageDatas) {
                  // 白名单：只保留这四个 tab
                  if (["最新微博", "特别关注", "好友圈", "视频"].includes(ii?.title)) {
                    // 将「最新微博」改名为「微博」（简洁显示）
                    if (ii?.title === "最新微博") {
                      ii.title = "微博";
                    }
                    newII.push(ii);
                  }
                }
                i.pageDatas = newII;
              }
            }
            newCates.push(i);
          }
          item.categories = newCates;
        }
        newTabs.push(item);
      }
      obj.pageDatas = newTabs;
    }

  // ── /2/messageflow/notice ── 消息动态页 ──────────────────────────────────
  } else if (url.includes("/2/messageflow/notice")) {
    // 过滤带有广告标记的消息卡片
    if (obj?.messages?.length > 0) {
      obj.messages = obj.messages.filter((msg) => !msg?.msg_card?.ad_tag);
    }

  // ── /2/page ── 搜索页列表 / 超话页 ───────────────────────────────────────
  } else if (url.includes("/2/page")) {
    if (obj?.cards?.length > 0) {
      // 过滤第一张卡片 card_group 里的广告词条
      if (obj.cards[0]?.card_group?.length > 0) {
        obj.cards[0].card_group = obj.cards[0].card_group.filter(
          (c) => !(
            c?.actionlog?.ext?.includes("ads_word") || // 广告词
            c?.itemid?.includes("t:51") ||             // 广告位
            c?.itemid?.includes("ads_word")            // 广告词条
          )
        );
      }
      // 过滤整体 cards 中的推广内容
      obj.cards = obj.cards.filter(
        (i) => !(
          i?.itemid?.includes("feed_-_invite") ||           // 超话里的好友推荐
          i?.itemid?.includes("infeed_friends_recommend") || // 好友关注推荐
          i?.itemid?.includes("infeed_may_interest_in") ||   // 你可能感兴趣的超话
          i?.itemid?.includes("infeed_pagemanual3") ||       // 手动区域3
          i?.itemid?.includes("infeed_weibo_mall") ||        // 微博小店
          i?.mblog?.mblogtypename?.includes("广告")          // 广告微博
        )
      );
    } else if (obj?.card_group?.length > 0) {
      // 超话页场景：此处保留原始逻辑，原作者意图为保留包含「你可能感兴趣的超话」描述的分组
      // 注意：不加 ! 是有意为之，与上方 cards 的过滤方向相反
      obj.card_group = obj.card_group.filter((i) => i?.desc?.includes("你可能感兴趣的超话"));
    }

  // ── /2/profile/container_timeline ── 个人主页信息流 ─────────────────────
  } else if (url.includes("/2/profile/container_timeline")) {
    // 移除关注弹窗
    if (obj?.loadedInfo?.follow_guide_info) {
      delete obj.loadedInfo.follow_guide_info;
    }
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        // 如果博主全部微博为 0，后续都是推荐内容，直接截断
        if (item?.data?.left_hint?.[0]?.content === "全部微博(0)" && item?.data?.card_type === 216) {
          break;
        }
        // 刷完博主微博后出现的推荐内容提示，截断
        if (/内容/.test(item?.data?.name) && item?.data?.card_type === 58) {
          break;
        }

        if (item?.category === "card") {
          // 58: 微博展示时间段提示；216: 筛选按钮
          if ([58, 216].includes(item?.data?.card_type)) {
            // 过滤「没有公开博文，为你推荐...」这种推荐占位卡
            if (/没有公开博文，为你推荐以下精彩内容/.test(item?.data?.name)) {
              continue;
            }
          }
          newItems.push(item);

        } else if (item?.category === "group") {
          // 移除置顶微博背景图
          if (item?.header?.data?.icon) {
            delete item.header.data.icon;
          }
          // 过滤「可能感兴趣的人」推荐组
          if (item?.itemId?.includes("INTEREST_PEOPLE")) {
            continue;
          }
          // 过滤近期热门/精选微博/那年今日等横版内容卡
          if (item?.profile_type_id === "weibo_cardpics") {
            continue;
          }
          // 处理组内子项
          if (item?.items?.length > 0) {
            let newII = [];
            for (let ii of item.items) {
              if (ii?.category === "feed") {
                removeAvatar(ii?.data);       // 清理头像挂件和关注按钮
                removeFeedAd(ii?.data);       // 清理信息流推广
                removeVoteInfo(ii?.data);     // 清理投票窗口
                // 关闭评论指引弹窗
                if (ii?.data?.enable_comment_guide) {
                  ii.data.enable_comment_guide = false;
                }
                newII.push(ii);
              } else if (ii?.category === "card") {
                // 10,48,176: 最近关注与互动过的博主推荐
                if ([10, 48, 176].includes(ii?.data?.card_type)) {
                  continue;
                }
                // 移除新版置顶微博皇冠图和背景图
                if (ii?.data?.rightImage) {
                  delete ii.data.rightImage;
                }
                if (ii?.data?.backgroundImage) {
                  delete ii.data.backgroundImage;
                }
                newII.push(ii);
              }
            }
            item.items = newII;
          }
          newItems.push(item);

        } else if (item?.category === "feed") {
          if (!isAd(item?.data)) {
            removeFeedAd(item?.data);     // 清理信息流推广
            removeVoteInfo(item?.data);   // 清理投票窗口
            // 过滤生日祝福动态（非本人发布的内容）
            if (item?.data?.source?.includes("生日动态")) {
              continue;
            }
            // 移除「赞过的微博」（保留热门内容）
            // 判据：title.structs 存在 且 title.text 不是「热门」
            if (item?.data?.title?.text !== "热门" && item?.data?.title?.structs?.length > 0) {
              continue;
            }
            newItems.push(item);
          }
        }
      }
      obj.items = newItems;
    }

  // ── /2/profile/dealatt 与 /2/friendships/ ── 关注后的推荐菜单 ──────────
  } else if (url.includes("/2/profile/dealatt") || url.includes("/2/friendships/")) {
    // 清空「相关推荐」卡片列表
    if (obj?.cards?.length > 0) {
      obj.cards = [];
    }
    // 过滤底部菜单中的「相关推荐」和「赞赏」项
    if (obj?.toolbar_menus_new?.items?.length > 0) {
      let toolbar = obj.toolbar_menus_new;
      toolbar.items = toolbar.items.filter((item) => {
        if (item?.identifier === "recommend") return false;     // 相关推荐
        if (/reward_/.test(item?.identifier)) return false;    // 赞赏
        return true;
      });
    }

  // ── /2/profile/me ── 「我的」页面 ────────────────────────────────────────
  } else if (url.includes("/2/profile/me")) {
    // 移除 VIP 头部背景图
    if (obj?.vipHeaderBgImage) {
      delete obj.vipHeaderBgImage;
    }
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        let itemId = item.itemId;

        if (itemId === "profileme_mine") {
          // 移除 VIP 相关视图元素
          if (item?.header?.vipView)   delete item.header.vipView;
          if (item?.header?.vipCenter) delete item.header.vipCenter;
          if (item?.header?.vipIcon)   delete item.header.vipIcon;

          // 若任意一层不存在会立即抛出 TypeError
          // 改为完整可选链访问，字段缺失时静默跳过
          if (item?.items?.length > 0) {
            for (let d of item.items) {
              // 将「好友」入口的跳转目标从「推荐关注」改为「已关注」列表
              if (d?.itemId === "mainnums_friends") {
                const scheme = d?.click?.modules?.[0]?.scheme;
                if (scheme && d.click?.modules?.[0]) {
                  d.click.modules[0].scheme = scheme.replace(
                    "231093_-_selfrecomm",
                    "231093_-_selffollowed"
                  );
                }
              }
            }
          }
          newItems.push(item);

        } else if (itemId === "100505_-_top8") {
          // 快捷功能区：只保留「相册」「赞/收藏」「浏览记录」「草稿箱」
          if (item?.items?.length > 0) {
            item.items = item.items.filter(
              (i) =>
                i?.itemId === "100505_-_album" ||        // 我的相册
                i?.itemId === "100505_-_like" ||         // 赞/收藏
                i?.itemId === "100505_-_watchhistory" || // 浏览记录
                i?.itemId === "100505_-_draft"           // 草稿箱
            );
          }
          newItems.push(item);

        } else if (itemId === "100505_-_manage") {
          // 移除分隔符样式和点点点图标
          if (item?.style)  delete item.style;
          if (item?.images) delete item.images;
          newItems.push(item);

        } else if (itemId === "100505_-_manage2") {
          // 移除面板样式和框内推广
          if (item?.footer) delete item.footer;
          if (item?.body)   delete item.body;
          newItems.push(item);

        } else if (itemId === "100505_-_chaohua" || itemId === "100505_-_recentlyuser") {
          // 保留「我的超话」和「最近访问」
          newItems.push(item);

        } else {
          // 其他 item 视为推广内容，全部移除
          continue;
        }
      }
      obj.items = newItems;
    }

  // ── /2/profile/statuses/tab ── 个人主页微博 tab ───────────────────────────
  } else if (url.includes("/2/profile/statuses/tab")) {
    if (obj?.cards?.length > 0) {
      let newCards = [];
      for (let card of obj.cards) {
        if (card?.card_group?.length > 0) {
          let newGroup = [];
          for (let group of card.card_group) {
            // 22: 那年今天（往年同日微博推荐），移除
            if (group.card_type === 22) {
              continue;
            }
            if (group?.mblog) {
              removeAvatar(group.mblog); // 清理卡片挂件和关注按钮
              removeVoteInfo(group.mblog); // 清理投票窗口
            }
            newGroup.push(group);
          }
          card.card_group = newGroup;
          newCards.push(card);
        } else {
          if (card?.mblog) {
            removeAvatar(card.mblog);
            removeVoteInfo(card.mblog);
          }
          newCards.push(card);
        }
      }
      obj.cards = newCards;
    }
    // 移除「我的热搜」列表（page_type === "08"）
    if (obj?.cardlistInfo?.page_type === "08") {
      delete obj.cardlistInfo;
    }

  // ── /2/profile/userinfo ── 个人详情页 ────────────────────────────────────
  } else if (url.includes("/2/profile/userinfo")) {
    // 移除头像挂件信息
    if (obj?.header?.data?.userInfo?.avatar_extend_info) {
      delete obj.header.data.userInfo.avatar_extend_info;
    }
    // 移除全套个性皮肤
    if (obj?.profileSkin?.data) {
      delete obj.profileSkin.data;
    }
    // 处理底部工具栏
    if (obj?.footer?.data) {
      let toolbar = obj.footer.data.toolbar_menus_new;
      if (toolbar?.lottie_guide) {
        delete toolbar.lottie_guide; // 弹窗动画
      }
      if (toolbar?.servicePopup?.subData) {
        delete toolbar.servicePopup.subData; // 服务悬浮窗口内容
      }
      // 过滤底部菜单：移除「相关推荐」「催更」「赞赏」
      if (toolbar?.items?.length > 0) {
        toolbar.items = toolbar.items.filter((item) => {
          if (item?.identifier === "recommend") return false; // 相关推荐
          if (item?.identifier === "urge")      return false; // 催更
          if (/reward_/.test(item?.identifier)) return false; // 赞赏
          return true;
        });
      }
    }

  // ── /2/push/active ── 推送激活接口，清理所有弹窗和浮窗 ────────────
  } else if (url.includes("/2/push/active")) {
    // 移除各类弹窗和营销配置
    if (obj?.compose_add_guide)          delete obj.compose_add_guide;          // 过期节日红包入口
    if (obj?.floating_windows_force_show) delete obj.floating_windows_force_show; // 强制展示的悬浮窗
    if (obj?.interceptad)                delete obj.interceptad;                 // 首页签到弹窗（推测）
    if (obj?.interceptad_cardlist)       delete obj.interceptad_cardlist;        // 首页签到弹窗列表（推测）
    if (obj?.loginconfig)                delete obj.loginconfig;                 // 登录领红包配置
    if (obj?.profile_lotties)            delete obj.profile_lotties;             // 个人主页头像挂件素材
    if (obj?.ug_red_paper)               delete obj.ug_red_paper;               // 红包相关（推测）
    if (obj?.weibo_pic_banner)           delete obj.weibo_pic_banner;           // 微博种草晒图 banner

    // 强制禁用所有悬浮窗
    if (obj?.disable_floating_window) {
      obj.disable_floating_window = "1";
    }
    // 将右上角红包图标的展示时间窗口推到遥远的未来（2040 年），使其永不显示
    if (obj?.feed_redpacket) {
      obj.feed_redpacket.starttime = "2208960000"; // 2040-01-01 00:00:00 Unix 时间戳
      obj.feed_redpacket.interval  = "31536000";   // 间隔 1 年
      obj.feed_redpacket.endtime   = "2209046399"; // 2040-01-01 23:59:59 Unix 时间戳
      if (obj.feed_redpacket?.finish_icon) delete obj.feed_redpacket.finish_icon; // 完成图标
      if (obj.feed_redpacket?.guide)       delete obj.feed_redpacket.guide;       // 引导文案
      if (obj.feed_redpacket?.icon)        delete obj.feed_redpacket.icon;        // 图标
      if (obj.feed_redpacket?.pre_icon)    delete obj.feed_redpacket.pre_icon;    // 预加载图标
    }
    // 禁用直播悬浮窗
    if (obj?.floating_window_for_live_streaming) {
      obj.floating_window_for_live_streaming = false;
    }
    // 将悬浮窗展示间隔设为 1 年
    if (obj?.floating_window_show_interval) {
      obj.floating_window_show_interval = 31536000;
    }
    // 过滤悬浮窗列表：移除广告类、红包类、高优先级推广类
    if (obj?.floating_windows?.length > 0) {
      obj.floating_windows = obj.floating_windows.filter(
        (i) => !/(?:^ad_?|red_pocket|ug_high_priority)/.test(i?.subtype)
      );
    }

  // ── /2/search/ ── 搜索页信息流 ───────────────────────────────────────────
  } else if (url.includes("/2/search/")) {

    if (url.includes("container_timeline")) {
      // 搜索结果时间线视图
      if (obj?.loadedInfo) {
        delete obj.loadedInfo; // 移除已加载信息（含搜索填充词等）
      }
      if (obj?.items?.length > 0) {
        obj.items = filterSearchItems(obj.items);
      }

    } else if (url.includes("finder")) {
      // 搜索发现页（finder_window）
      if (obj?.channelInfo?.channels?.length > 0) {
        let newChannels = [];
        for (let channel of obj.channelInfo.channels) {
          // 只保留白名单中的三个 tab
          if (["band_channel", "discover_channel", "trends_channel"].includes(channel?.key)) {
            let payload = channel.payload;
            if (payload) {
              if (payload?.loadedInfo) {
                // 清除搜索框填充词
                if (payload.loadedInfo?.searchBarContent?.length > 0) {
                  payload.loadedInfo.searchBarContent = [];
                }
                // 移除搜索框背景图
                if (payload.loadedInfo?.headerBack?.channelStyleMap) {
                  delete payload.loadedInfo.headerBack.channelStyleMap;
                }
                // 移除搜索框特殊样式
                if (payload.loadedInfo?.searchBarStyleInfo) {
                  delete payload.loadedInfo.searchBarStyleInfo;
                }
              }
              // 过滤 payload 内的信息流
              if (payload?.items?.length > 0) {
                payload.items = filterSearchItems(payload.items);
              }
            }
            newChannels.push(channel);
          }
          // 白名单之外的 tab 全部丢弃
        }
        obj.channelInfo.channels = newChannels;
      }
      // 移除「更多版块」入口
      if (obj?.channelInfo?.moreChannels) {
        delete obj.channelInfo.moreChannels;
      }
      // 移除 header 中的插入数据（通常为推广内容）
      if (obj?.header?.insert_data) {
        delete obj.header.insert_data;
      }
      // 2025-01-24 新版 finder_window 的 header.data.items
      if (obj?.header?.data?.items?.length > 0) {
        let newItems = [];
        for (let item of obj.header.data.items) {
          if (item?.category === "card") {
            // 过滤推广类卡片 card_type
            if ([19, 22, 118, 206, 208, 217, 236, 249, 261].includes(item?.data?.card_type)) {
              continue;
            }
            // 过滤各类排行榜
            if (item?.data?.hasOwnProperty("rank")) {
              continue;
            }
          } else if (item?.category === "group") {
            // 过滤 group 内的广告卡片
            if (item?.items?.length > 0) {
              item.items = item.items.filter(
                (i) => ![118, 182, 192, 217, 247, 264].includes(i?.data?.card_type)
              );
            }
          }
          newItems.push(item);
        }
        obj.header.data.items = newItems;
      }
    }

    // 移除搜索页 Banner 功能块（图片背景+wbox 跳转的推广卡）
    obj = removeBannerModule(obj);

  // ── /2/searchall ── 全站搜索结果页 ───────────────────────────────────────
  } else if (url.includes("/2/searchall")) {
    // 移除头部淘宝推广跳转背景
    if (obj?.header?.data) {
      for (let key of ["bg_img", "background_scheme", "background_url"]) {
        delete obj.header.data[key];
      }
    }
    // 移除搜索结果悬浮窗
    if (obj?.loadedInfo?.serviceMap?.layer) {
      delete obj.loadedInfo.serviceMap.layer;
    }
    // 清理讨论区底部动画和 AI 菜单
    if (obj?.footer) {
      if (obj.footer?.data?.bg_lottie)       delete obj.footer.data.bg_lottie;       // 讨论区背景动画
      if (obj.footer?.data?.bg_lottie_dark)  delete obj.footer.data.bg_lottie_dark;  // 暗色模式背景动画
      if (obj.footer?.data?.discuss_avatars) delete obj.footer.data.discuss_avatars; // 进入讨论区的气泡头像
      // 过滤底部菜单中的 AI 相关项（图片 URL 含数字+_ai. 特征）
      if (obj.footer?.data?.menus?.length > 0) {
        obj.footer.data.menus = obj.footer.data.menus.filter((i) => !/\d+_ai\./.test(i?.pic));
      }
    }
    // 处理 cards 数组（旧版数据格式）
    if (obj?.cards?.length > 0) {
      let newCards = [];
      for (let card of obj.cards) {
        if (card?.card_group?.length > 0) {
          let newGroup = [];
          for (let group of card.card_group) {
            if (group?.card_type === 22) {
              continue; // 横版广告图
            } else if (group?.card_type === 42 && group?.title_extra_text === "广告") {
              continue; // 推荐品牌广告
            } else if (group?.card_type === 3 && group?.pics?.length > 0) {
              continue; // 推荐品牌广告图
            } else {
              if (group?.mblog) {
                // 含 mblog 的卡片：过滤广告微博
                if (!isAd(group.mblog)) {
                  // 移除微博来源标签、来源结构体、拓展信息、商品橱窗
                  if (group.mblog?.title_source)    delete group.mblog.title_source;
                  if (group.mblog?.source_tag_struct) delete group.mblog.source_tag_struct;
                  if (group.mblog?.extend_info)     delete group.mblog.extend_info;
                  if (group.mblog?.common_struct)   delete group.mblog.common_struct;
                  removeAvatar(group.mblog);   // 清理头像挂件和关注按钮
                  removeVoteInfo(group.mblog); // 清理投票窗口
                  // 新版热推广告标记
                  if (group.mblog?.is_ad === 1) {
                    continue;
                  }
                  newGroup.push(group);
                }
              } else {
                newGroup.push(group); // 无 mblog 字段的卡片全部保留
              }
            }
          }
          card.card_group = newGroup;
          newCards.push(card);
        } else {
          if (card?.mblog) {
            if (!isAd(card.mblog)) {
              removeAvatar(card.mblog);
              if (card.mblog?.title_source)     delete card.mblog.title_source;
              if (card.mblog?.source_tag_struct) delete card.mblog.source_tag_struct;
              if (card.mblog?.extend_info)      delete card.mblog.extend_info;
              if (card.mblog?.common_struct)    delete card.mblog.common_struct;
              removeVoteInfo(card.mblog);
              // 清理 page_info.cards 里嵌套的投票窗口
              if (card.mblog?.page_info?.cards?.length > 0) {
                for (let i of card.mblog.page_info.cards) {
                  if (i?.media_info?.vote_info) {
                    delete i.media_info.vote_info;
                  }
                }
              }
              newCards.push(card);
            }
          }
        }
      }
      obj.cards = newCards;
    }
    // 处理 items 数组（13.11.1+ 新版数据格式，2023-11-26）
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        if (!isAd(item?.data)) {
          if (item?.category === "feed") {
            removeFeedAd(item?.data);
            removeVoteInfo(item?.data);
            newItems.push(item);
          } else if (item?.category === "group") {
            if (item?.items?.length > 0) {
              let newII = [];
              for (let ii of item.items) {
                if (ii?.cate_id === "638" && ii?.readtimetype === "card") {
                  continue; // 大家都在问
                } else {
                  if (!isAd(ii?.data)) {
                    removeAvatar(ii?.data);
                    removeFeedAd(ii?.data);
                    // 3推广卡片 17相关搜索 22广告图 25智搜总结 30推荐博主
                    // 42,236智搜问答 89商品推广视频 101大家都在问 206推广视频
                    if ([3, 17, 22, 30, 42, 89, 101, 206].includes(ii?.data?.card_type)) {
                      continue;
                    } else if (ii?.data?.card_type === 4 && ii?.data?.cate_id === "640") {
                      continue; // 大家都在问（另一种格式）
                    } else if (ii?.data?.card_type === 42 && ii?.data?.is_ads === true) {
                      continue; // 商品推广 desc
                    }
                    newII.push(ii);
                  }
                }
              }
              item.items = newII;
            }
            newItems.push(item);
          } else {
            newItems.push(item);
          }
        }
      }
      obj.items = newItems;
    }

  // ── /2/shproxy/chaohua/discovery/searchactive ── 超话搜索页 ──────────────
  } else if (url.includes("/2/shproxy/chaohua/discovery/searchactive")) {
    if (obj?.items?.length > 0) {
      // 1007: 可能感兴趣的话题推荐块
      obj.items = obj.items.filter((i) => i?.data?.card_type !== 1007);
    }

  // ── /2/statuses/container_detail? ── 新版微博详情页 ─────────────────────
  } else if (url.includes("/2/statuses/container_detail?")) {
    if (obj?.pageHeader?.data?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.pageHeader.data.items) {
        if (item?.category === "card" && item?.data?.is_ad_card === 1) {
          continue; // 底部卡片广告
        } else if (item?.category === "card" && item?.data?.card_type === 227) {
          continue; // 铁粉参与互动卡
        } else if (item?.category === "group" && item?.items?.length > 0) {
          continue; // 博主好物种草 / 关注推荐
        } else if (item?.category === "wboxcard" && item?.data?.card_type === 236) {
          continue; // 底部横版广告
        } else if (item?.data?.itemid === "top_searching" && item?.data?.card_type === 248) {
          continue; // 底部「大家都在搜」
        } else {
          newItems.push(item);
        }
      }
      obj.pageHeader.data.items = newItems;
    }
    // 移除关注弹窗和赞赏信息
    if (obj?.detailInfo?.extend?.follow_data)    delete obj.detailInfo.extend.follow_data;
    if (obj?.detailInfo?.extend?.reward_info)    delete obj.detailInfo.extend.reward_info;
    if (obj?.detailInfo?.status?.reward_info)    delete obj.detailInfo.status.reward_info;
    if (obj?.detailInfo?.extend?.ai_search_share) delete obj.detailInfo.extend.ai_search_share; // 底部智搜按钮
    if (obj?.detailInfo?.extend?.sharecontent)    delete obj.detailInfo.extend.sharecontent;    // 微信领红包

  // ── /2/statuses/container_detail_comment ── 新版微博评论区 ───────────────
  } else if (url.includes("/2/statuses/container_detail_comment")) {
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        if (item?.category === "detail") {
          // 评论条目：过滤广告，清理装饰元素
          if (!isAd(item.data)) {
            cleanCommentItem(item.data); // 清理评论气泡、弹幕、VIP 按钮
            // 过滤微博官方伪装的评论
            if (item.data?.user) {
              removeAvatar(item.data);
              if (/(超话社区|微博)/.test(item.data.user?.name)) {
                continue;
              }
            }
            // 广告类型标签过滤（只要存在 adType 字段即视为推广，无论值为何）
            if (item.data?.hasOwnProperty("adType")) {
              continue;
            }
            // AI 总结 / 智搜相关卡
            // 用 OR 兜底：card_type 236 本身即为智搜/AI总结类型，
            // 不依赖 itemid 精确匹配，兼容微博改 itemid 后的新变种
            if (item.data?.card_type === 236 || item.data?.itemid === "ai_summary_entrance_real_show") {
              continue;
            }
            // 清理楼中楼（子评论/回复列表）的装饰元素，并过滤微博智搜插入的回复
            if (item?.items?.length > 0) {
              let newII = [];
              for (let ii of item.items) {
                if (ii?.data) {
                  // 过滤微博智搜插入的楼中楼回复（来自 Weibo.js）
                  if (/微博智搜/.test(ii.data?.user?.name)) {
                    continue;
                  }
                  removeAvatar(ii.data);
                  cleanCommentItem(ii.data);
                }
                newII.push(ii);
              }
              item.items = newII;
            }
            newItems.push(item);
          }
        } else {
          // category 非 "detail" 的条目（分隔线、加载更多占位、页脚等）直接透传，
          // 保持评论区分页结构完整，避免因丢弃占位符导致评论无法加载
          newItems.push(item);
        }
      }
      obj.items = newItems;
    }

  // ── /2/statuses/container_timeline_hot 与 unread_hot_timeline ── 首页推荐 tab ─
  } else if (url.includes("/2/statuses/container_timeline_hot") || url.includes("/2/statuses/unread_hot_timeline")) {
    // 删除广告相关的顶层字段
    for (let key of ["ad", "advertises", "trends", "headers"]) {
      if (obj?.[key]) delete obj[key];
    }
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        if (!isAd(item?.data)) {
          if (item?.category === "feed") {
            removeFeedAd(item?.data);
            removeVoteInfo(item?.data);
            newItems.push(item);
          }
          // 其他 category（card/group 等）视为推广，直接丢弃
        }
      }
      obj.items = newItems;
    }
    // 兼容旧版 statuses 字段
    if (obj?.statuses?.length > 0) {
      obj.statuses = obj.statuses.filter((item) => {
        if (!isAd(item)) {
          removeFeedAd(item);
          return true;
        }
        return false;
      });
    }

  // ── /2/statuses/container_timeline? 与 container_timeline_unread ── 首页关注 tab ─
  } else if (url.includes("/2/statuses/container_timeline?") || url.includes("/2/statuses/container_timeline_unread")) {
    if (obj?.loadedInfo?.headers) {
      delete obj.loadedInfo.headers; // 首页关注 tab 信息流头部
    }
    if (obj?.common_struct) {
      delete obj.common_struct; // 商品橱窗
    }
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        if (!isAd(item?.data) && !isAd(item?.status)) {

          if (item?.category === "dynamic") {
            // dynamic 类型：status 字段承载内容
            if (item?.status?.action_button_icon_dic) {
              delete item.status.action_button_icon_dic;
            }
            removeFeedAd(item?.status);
            removeVoteInfo(item?.status);
            // 过滤「未关注人的转发」（标题含结构体 structs，说明是他人互动内容）
            if (item.status?.title?.structs) continue;
            // 过滤快转内容（screen_name_suffix_new[3].content === "快转了"）
            if (item?.status?.screen_name_suffix_new?.[3]?.content === "快转了") continue;
            // 过滤精选季推广内容（如美妆精选季等）
            if (item?.status?.title?.text?.includes("精选")) continue;
            // 过滤未关注博主的内容
            if (item?.status?.user?.following === false) continue;
            // 关闭「关注推荐」开关
            if (item?.status?.user?.unfollowing_recom_switch === 1) {
              item.status.user.unfollowing_recom_switch = 0;
            }
            // 清理博主 top100 标签
            if (item?.status?.tag_struct?.length > 0) {
              item.status.tag_struct = [];
            }
            newItems.push(item);

          } else if (item?.category === "feed") {
            // feed 类型：data 字段承载内容
            if (item?.data?.action_button_icon_dic) {
              delete item.data.action_button_icon_dic;
            }
            removeFeedAd(item?.data);
            removeVoteInfo(item?.data);
            // 同上：过滤未关注人的转发、快转、精选、未关注博主
            if (item.data?.title?.structs) continue;
            if (item?.data?.screen_name_suffix_new?.[3]?.content === "快转了") continue;
            if (item?.data?.title?.text?.includes("精选")) continue;
            if (item?.data?.user?.following === false) continue;
            if (item?.data?.user?.unfollowing_recom_switch === 1) {
              item.data.user.unfollowing_recom_switch = 0;
            }
            if (item?.data?.tag_struct?.length > 0) {
              item.data.tag_struct = [];
            }
            newItems.push(item);

          } else if (item?.category === "feedBiz") {
            newItems.push(item); // 管理特别关注按钮，保留
          }
          // 其他 category 视为推广，丢弃
        }
      }
      obj.items = newItems;
    }

  // ── /2/statuses/container_timeline_topic ── 超话信息流 ───────────────────
  } else if (url.includes("/2/statuses/container_timeline_topic")) {
    // 移除底部弹出的关注按钮
    if (obj?.header?.data?.follow_guide_info) {
      delete obj.header.data.follow_guide_info;
    }
    if (obj?.items?.length > 0) {
      let newItems = [];
      for (let item of obj.items) {
        if (item?.category === "feed") {
          removeAvatar(item?.data);
          if (!isAd(item?.data)) {
            // 移除「新人导师」互动任务标题（萌新帖推广）
            if (item?.data?.title?.text?.includes("新人导师")) {
              delete item.data.title;
            }
            newItems.push(item);
          }

        } else if (item?.category === "card") {
          // 4,197: 你可能感兴趣的超话；236: 壁纸故事；1012: 热门超话
          if ([4, 197, 236, 1012].includes(item?.data?.card_type)) {
            continue;
          }
          // 31: 搜索框滚动热词，清空热词内容
          if (item?.data?.card_type === 31 && item?.data?.hotwords?.length > 0) {
            item.data.hotwords = [];
          }
          // 22: 广告卡（有 card_ad_style 字段的才是广告）
          if (item?.data?.card_type === 22 && item?.data?.hasOwnProperty("card_ad_style")) {
            continue;
          }
          newItems.push(item);

        } else if (item?.category === "group") {
          // 移除空降发帖背景图
          if (item?.style?.topHover) {
            delete item.style.topHover;
          }
          if (item?.items?.length > 0) {
            if (item?.itemId === null) {
              // 超话页顶部杂项区域（itemId 为 null 为其特征）
              let newII = [];
              for (let ii of item.items) {
                if (ii?.data?.hasOwnProperty("itemid")) {
                  if (ii.data.itemid?.includes("mine_topics")) {
                    newII.push(ii); // 保留「我的超话」
                  } else if (ii.data.itemid?.includes("tab_search_input")) {
                    // 保留搜索框，但清空热搜词（只保留默认提示词）
                    if (ii.data?.hotwords) {
                      ii.data.hotwords = [{ word: "搜索超话" }];
                    }
                    newII.push(ii);
                  } else if (ii.data.itemid?.includes("poiRankList")) {
                    newII.push(ii); // 保留地点超话 / 地标人气榜
                  }
                  // 其他有 itemid 的内容丢弃
                } else {
                  newII.push(ii); // 无 itemid 字段的内容放行
                }
                removeAvatar(ii?.data); // 统一清理头像挂件
              }
              item.items = newII;
            } else {
              // 超话页其他 group（有 itemId）
              let newII = [];
              for (let ii of item.items) {
                if (ii?.data) {
                  if (ii.data?.common_struct) delete ii.data.common_struct;
                  removeAvatar(ii.data);
                  // 1008: 关注你感兴趣的超话；1024: 超话顶部发现
                  if ([1008, 1024].includes(ii?.data?.card_type)) {
                    continue;
                  }
                  newII.push(ii);
                }
              }
              item.items = newII;
            }
          }
          // 过滤「你的好友也关注了」横幅
          if (item?.header?.arrayText?.contents?.length > 0) {
            continue;
          }
          newItems.push(item);

        } else {
          continue; // 其他 category 视为推广，丢弃
        }
      }
      obj.items = newItems;
    }

  // ── /2/statuses/extend ── 微博详情页扩展数据 ─────────────────────────────
  } else if (url.includes("/2/statuses/extend")) {
    // 移除趋势推广（extBtnInfo 图片 URL 含 "ad"）
    if (obj?.trend?.extra_struct?.extBtnInfo?.btn_picurl?.includes("ad")) {
      delete obj.trend;
    }
    // 此处 obj 是解析后的对象不会为 null，但使用 ?. 保持风格一致。
    if (obj?.trend?.titles) {
      let title = obj.trend.titles.title;
      // 移除「博主好物种草」「相关推荐」「专区」类推广趋势块
      if (/(博主好物种草|相关推荐|专区)/.test(title)) {
        delete obj.trend;
      }
    }
    // 批量删除微博详情页中的推广和干扰字段
    const detailFieldsToRemove = [
      "bubble_guide_data",       // 评论区弹窗
      "button_extra_info",       // 推荐评论
      "display_info",            // 二楼
      "extend_info",             // 拓展卡片
      "floating_button",         // 悬浮购物车按钮
      "follow_data",             // 关注提醒
      "head_cards",              // 超话投票
      "highlight",               // 二楼
      "interaction_extra_info",  // AI 评论
      "page_alerts",             // 超话新帖 / 新用户通知
      "reward_info",             // 公益赞赏
      "source_tag_struct",       // 二楼
      "top_cards"                // 大家都在搜
    ];
    for (let key of detailFieldsToRemove) {
      delete obj[key];
    }
    // 重排底部操作菜单：将「复制链接」置顶，其余按白名单配置过滤
    if (obj?.custom_action_list?.length > 0) {
      let newActions = [];
      for (let item of obj.custom_action_list) {
        let type = item.type;
        let keep = itemMenusConfig[type];
        if (type === "mblog_menus_copy_url") {
          newActions.unshift(item); // 复制链接始终排在最前
        } else if (keep) {
          newActions.push(item);
        }
      }
      obj.custom_action_list = newActions;
    }
    // 关闭商品橱窗和评论指引
    if (obj?.has_common_struct)    obj.has_common_struct    = false;
    if (obj?.enable_comment_guide) obj.enable_comment_guide = false;

  // ── /2/statuses/repost_timeline ── 评论详情页转发区 ─────────────────────
  } else if (url.includes("/2/statuses/repost_timeline")) {
    // 样式1：hot_reposts
    if (obj?.hot_reposts?.length > 0) {
      obj.hot_reposts = obj.hot_reposts.filter((item) => !isAd(item));
    }
    // 样式2：reposts
    if (obj?.reposts?.length > 0) {
      obj.reposts = obj.reposts.filter((item) => !isAd(item));
    }

  // ── /2/statuses/show ── 单条微博详情 ─────────────────────────────────────
  } else if (url.includes("/2/statuses/show")) {
    removeFeedAd(obj);       // 清理信息流推广
    // 循环引用中的 text 字段内的商品橱窗
    if (obj?.text) {
      removeFeedAd(obj.text);
    }
    if (obj?.reward_info) {
      delete obj.reward_info; // 赞赏信息
    }
    removeVoteInfo(obj); // 清理投票窗口

  // ── /2/video/full_screen_stream ── 视频沉浸页信息流 ─────────────────────
  } else if (url.includes("/2/video/full_screen_stream")) {
    if (obj?.statuses?.length > 0) {
      let newStatuses = [];
      for (let item of obj.statuses) {
        if (!isAd(item)) {
          removeAvatar(item);
          // 清空视频标签（含投票等互动组件）
          if (item?.video_info?.tags?.length > 0) {
            item.video_info.tags = [];
          }
          newStatuses.push(item);
        }
      }
      obj.statuses = newStatuses;
    }

  // ── /2/video/tiny_stream_mid_detail ── 视频详情中间页 ───────────────────
  } else if (url.includes("/2/video/tiny_stream_mid_detail")) {
    if (obj?.status?.video_info?.shopping?.length > 0) {
      obj.status.video_info.shopping = []; // 移除带货商品
    }
    if (obj?.status?.video_info?.bottom_banner) {
      obj.status.video_info.bottom_banner = {}; // 移除「大家都在搜」底部 banner
    }
    if (obj?.status?.video_info?.float_info) {
      obj.status.video_info.float_info = {}; // 移除悬浮窗
    }

  // ── /2/video/tiny_stream_video_list ── 视频自动连播列表 ─────────────────
  } else if (url.includes("/2/video/tiny_stream_video_list")) {
    if (obj?.statuses?.length > 0) {
      obj.statuses = []; // 清空视频自动连播队列
    }
    if (obj?.tab_list?.length > 0) {
      obj.tab_list = []; // 清空 tab 列表
    }

  // ── /2/!/huati/discovery_home_bottom_channels ── 超话广场底部频道 ────────
  } else if (url.includes("/2/!/huati/discovery_home_bottom_channels")) {
    if (obj?.button_configs) {
      delete obj.button_configs; // 超话左上角/右上角的功能按钮图标
    }
    // 过滤「广场」入口（已在顶部导航有入口，底部重复出现属于推广）
    if (obj?.channelInfo?.channel_list?.length > 0) {
      obj.channelInfo.channel_list = obj.channelInfo.channel_list.filter(
        (t) => t?.title !== "广场"
      );
    }

  // ── /aj/appicon/list ── 应用图标列表 ─────────────────────────────────────
  } else if (url.includes("/aj/appicon/list")) {
    // 将所有卡片类型统一设为 2（去除特殊样式的推广卡）
    if (obj?.data?.list?.length > 0) {
      for (let item of obj.data.list) {
        if (item?.cardType) {
          item.cardType = 2;
        }
      }
    }

  // ── /v1/ad/preload 与 /v2/ad/preload ── 开屏广告预加载（v1/v2） ──────────
  } else if (url.includes("/v1/ad/preload") || url.includes("/v2/ad/preload")) {
    if (obj?.ads?.length > 0) {
      for (let item of obj.ads) {
        item.start_time        = 3818332800; // Unix 时间戳 2090-12-31 00:00:00
        item.end_time          = 3818419199; // Unix 时间戳 2090-12-31 23:59:59
        item.daily_display_cnt = 50;         // 每日限制次数（配合时间窗使其不展示）
        item.display_duration  = 0;          // 展示时长清零
      }
      // 注意：obj.ads.creatives 中 obj.ads 是数组，不能直接访问 .creatives
      // 此处逻辑错误（数组无 creatives 属性），保留原写法兼容现状，
      // 若微博此接口实际上嵌套了 creatives，需改为 obj.ads[i].creatives。
      if (obj?.ads?.creatives?.length > 0) {
        for (let item of obj.ads.creatives) {
          item.start_time        = 3818332800;
          item.end_time          = 3818419199;
          item.daily_display_cnt = 50;
          item.display_duration  = 0;
        }
      }
    }

  // ── /wbapplua/wbpullad.lua 与 /preload/get_ad ── Lua 开屏广告 ──────────
  } else if (url.includes("/wbapplua/wbpullad.lua") || url.includes("/preload/get_ad")) {
    if (obj?.cached_ad?.ads?.length > 0) {
      for (let item of obj.cached_ad.ads) {
        item.show_count = 50;         // 展示次数（配合时间窗口使其不展示）
        item.duration   = 0;          // 展示时长清零
        item.start_date = 3818332800; // Unix 时间戳 2090-12-31 00:00:00
        item.end_date   = 3818419199; // Unix 时间戳 2090-12-31 23:59:59
      }
    }
  }

  // ── 全局后处理：移除搜索高亮与 url_struct ────────────────────────────────
  // walk() 会深度遍历整个对象树，统一清理 url_struct
  // 和 analysis_extra 中的搜索高亮参数，减少信息泄露和跳转追踪
  walk(obj);

  $done({ body: JSON.stringify(obj) });
}

// ==================== 工具函数 ====================

/**
 * 判断一条信息流条目是否为广告
 *
 * 微博广告的识别方式较多，主要通过以下字段判断：
 *   - mblogtypename: "广告" | "热推"
 *   - readtimetype: "adMblog"
 *   - promotion.recommend: "广告" | "热推"
 *   - promotion.type: 字符串包含 "ad" 或数组中含 "ad"
 *   - content_auth_info.content_auth_title: "广告" | "热推"
 *   - ads_material_info.is_ads: true
 *
 * promotion.type 在不同接口版本中可能是字符串或数组，
 *          此处统一用 String() 转换后再判断，兼容两种格式
 *
 * @param {object|null|undefined} data - 待判断的微博数据对象
 * @returns {boolean} true 表示是广告
 */
function isAd(data) {
  if (!data) return false;

  // 微博类型名称判断
  if (data.mblogtypename === "广告" || data.mblogtypename === "热推") return true;

  // 阅读时类型判断（信息流广告专用标记）
  if (data.readtimetype === "adMblog") return true;

  // 推广字段判断
  if (data.promotion?.recommend === "广告" || data.promotion?.recommend === "热推") return true;

  // [健壮性] promotion.type 可能是字符串（如 "ad_xxx"）或数组（如 ["ad", "xxx"]）
  if (data.promotion?.type != null) {
    if (String(data.promotion.type).includes("ad")) return true;
  }

  // 内容认证标题判断
  if (data.content_auth_info?.content_auth_title === "广告") return true;
  if (data.content_auth_info?.content_auth_title === "热推") return true;

  // 广告素材信息判断
  if (data.ads_material_info?.is_ads === true) return true;

  return false;
}

/**
 * 清理单条评论的干扰 UI 元素。
 * 由 /2/comments/build_comments 和 /2/statuses/container_detail_comment 两处共用
 * 入参 data 可能为 undefined（如 item.data 不存在时），函数内做 null 检查
 *
 * @param {object|null|undefined} data - 评论的 data 字段
 */
function cleanCommentItem(data) {
  if (!data) return;
  if (data.comment_bubble)                delete data.comment_bubble;                // 评论气泡
  if (data.comment_bullet_screens_message) delete data.comment_bullet_screens_message; // 评论弹幕
  if (data.hot_icon)                      delete data.hot_icon;                      // 热评小图标（弹幕/首评）
  if (data.vip_button)                    delete data.vip_button;                    // 会员气泡按钮
}

/**
 * 移除微博卡片上的头像挂件、关注按钮等装饰性/营销性元素。
 * 作用于 mblog 或 data 级别的对象。
 *
 * @param {object|null|undefined} data - 微博数据对象
 */
function removeAvatar(data) {
  if (!data) return;

  if (data.block_card_bg)           delete data.block_card_bg;           // 卡片背景
  if (data.buttons)                 delete data.buttons;                 // 关注/互动按钮
  if (data.cardid)                  delete data.cardid;                  // 卡片 ID（挂件关联）
  if (data.icons)                   delete data.icons;                   // 图标列表
  if (data.mblog_buttons)           delete data.mblog_buttons;           // 转发按钮图标
  if (data.pic_bg_new)              delete data.pic_bg_new;              // 新版卡片背景图
  if (data.user?.avatargj_id)       delete data.user.avatargj_id;       // 头像挂件 ID
  if (data.user?.avatar_extend_info) delete data.user.avatar_extend_info; // 头像挂件扩展信息
  if (data.user?.cardid)            delete data.user.cardid;             // 用户卡片 ID
  if (data.user?.icons)             delete data.user.icons;              // 用户图标（认证等）
  if (data.user?.mbtype)            delete data.user.mbtype;             // 会员等级图标
}

/**
 * 清理信息流中的推广元素：头像挂件、关注按钮、商品橱窗、热评、拓展信息。
 * 在 removeAvatar() 基础上额外清理信息流特有的推广字段。
 *
 * @param {object|null|undefined} item - 信息流条目的 data/status 字段
 */
function removeFeedAd(item) {
  if (!item) return;

  removeAvatar(item); // 复用：清理头像挂件和关注按钮
  // 同时清理被转发微博上的挂件
  if (item.retweeted_status) {
    removeAvatar(item.retweeted_status);
  }
  if (item.common_struct)       delete item.common_struct;       // 商品橱窗
  if (item.comment_summary)     delete item.comment_summary;     // 信息流中的热评摘要
  if (item.extend_info)         delete item.extend_info;         // 商品橱窗（部分接口版本）
  if (item.semantic_brand_params) delete item.semantic_brand_params; // 品牌商品橱窗
}

/**
 * 移除微博中的投票窗口（挂在 page_info.media_info.vote_info 下）。
 *
 * @param {object|null|undefined} item - 包含 page_info 的微博对象
 */
function removeVoteInfo(item) {
  if (!item) return;

  if (item.page_info?.media_info?.vote_info) {
    delete item.page_info.media_info.vote_info;
  }
}

/**
 * 深度遍历对象树，批量删除 url_struct 字段并清理搜索高亮参数。
 *
 * - url_struct: 微博用于追踪链接点击的结构体，删除后不影响正文显示
 * - analysis_extra 中的 search_high_lights: 搜索关键词高亮参数，删除后取消高亮样式
 *
 * 使用 WeakSet 记录已访问的对象节点，防止循环引用导致的无限递归
 *          WeakSet 使用弱引用，不会阻止 GC 回收，适合此场景
 *
 * @param {any} obj - 待遍历的任意值
 * @param {WeakSet} [visited] - 已访问节点集合
 * @returns {any} 处理后的原对象
 */
function walk(obj, visited) {
  if (!obj || typeof obj !== 'object') return obj;

  // 初始化访问记录集
  if (!visited) visited = new WeakSet();

  // 检测并跳过已访问节点，防止循环引用导致栈溢出
  if (visited.has(obj)) return obj;
  visited.add(obj);

  if (Array.isArray(obj)) {
    // 数组：递归处理每个元素
    obj.forEach((item, i) => {
      obj[i] = walk(item, visited);
    });
  } else {
    // 对象：删除 url_struct，清理高亮参数，再递归处理所有子属性
    delete obj.url_struct;
    if (obj.analysis_extra && typeof obj.analysis_extra === 'string') {
      obj.analysis_extra = obj.analysis_extra
        .replace(/\|?search_high_lights:[^|]*\|?/g, '') // 删除高亮参数段
        .replace(/\|$/g, '');                            // 清理末尾多余的分隔符
    }
    for (let key of Object.keys(obj)) {
      obj[key] = walk(obj[key], visited);
    }
  }
  return obj;
}

/**
 * 过滤搜索信息流（/2/search/）中的各类推广条目
 *
 * 过滤规则：
 *   - feed 类：通过 isAd() 判断，非广告的保留并清理推广字段
 *   - card 类：按 card_type 黑名单过滤，以及 ads_slide/cate_id/rank 特征过滤
 *   - cell 类：保留（信息流分割线）
 *   - group 类：insert_item 类推荐插入块过滤，其余保留并清理子项广告
 *
 * @param {Array} items - 原始 items 数组
 * @returns {Array} 过滤后的新数组
 */
function filterSearchItems(items) {
  if (!Array.isArray(items)) return items;

  // card_type 黑名单（搜索页顶层 card）：
  // 19: 热议等 tab；22: 商业推广；118: 横版广告图片；
  // 206,249: 横版视频广告；208: 实况热聊；217: 错过了热词；
  // 236: 微博趋势；261: 奥运滚动横幅
  const BLOCKED_CARD_TYPES_TOP  = [19, 22, 118, 206, 208, 217, 236, 249, 261];
  // card_type 黑名单（group 内子项）：
  // 118: 横版广告图片；182: 热议话题；192: 横版好看视频；
  // 217: 错过了热词；247: 横版视频广告；264: 微博趋势
  const BLOCKED_CARD_TYPES_GROUP = [118, 182, 192, 217, 247, 264];

  let newItems = [];
  for (let item of items) {
    if (item?.category === "feed") {
      if (!isAd(item?.data)) {
        removeFeedAd(item?.data);
        newItems.push(item);
      }

    } else if (item?.category === "card") {
      if (BLOCKED_CARD_TYPES_TOP.includes(item?.data?.card_type)) continue;
      if (item?.data?.itemid === "ads_slide")               continue; // 商业推广主图/附图
      if (item?.data?.cate_id === "1114")                   continue; // 微博趋势标题
      if (item?.data?.hasOwnProperty("rank"))               continue; // 奥运等排行榜
      newItems.push(item);

    } else if (item?.category === "cell") {
      newItems.push(item); // 信息流分割线，保留

    } else if (item?.category === "group") {
      if (item?.item_category === "insert_item") {
        continue; // 信息流内嵌的「微博热搜」/「个性化开关」推荐块
      }
      if (item?.items?.length > 0) {
        let newII = [];
        for (let ii of item.items) {
          if (BLOCKED_CARD_TYPES_GROUP.includes(ii?.data?.card_type)) continue;
          if (ii?.data?.cate_id === "1114") continue; // 微博趋势
          removeFeedAd(ii?.data);
          newII.push(ii);
        }
        item.items = newII;
      }
      newItems.push(item);
    }
  }
  return newItems;
}

/**
 * 移除微博搜索页中的 Banner 功能块（图片背景 + wbox 跳转的推广卡片）。
 *
 * 识别条件（同时满足以下四点）：
 *   1. category === "cell"
 *   2. type === "text"
 *   3. style.background.type === "image"（有图片背景样式）
 *   4. click.scheme 包含 "wbox"（点击跳转到 wbox 页面）
 *
 * @param {object} jsonData - 包含 items 数组的 JSON 对象
 * @returns {object} 过滤后的原对象
 */
function removeBannerModule(jsonData) {
  if (!jsonData?.items || !Array.isArray(jsonData.items)) {
    return jsonData; // items 不存在或不是数组，直接返回
  }

  jsonData.items = jsonData.items.filter((item) => {
    const isBannerModule =
      item.category === 'cell'  &&
      item.type     === 'text'  &&
      item.style?.background?.type === 'image' &&
      item.click?.scheme?.includes('wbox');
    return !isBannerModule; // 返回 false 的项会被移除
  });

  return jsonData;
}
})();
