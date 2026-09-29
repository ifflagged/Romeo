/**
 * @小红书去广告、净化、解除下载限制、画质增强
 * @author fmz200, Baby, RuCu6, wish
 * @date 2026-06-04
 * @version 3.6
 */

const $ = new Env('小红书');

// ==================== 常量定义 ====================
const CACHE_KEYS = {
  VIDEO_FEED: 'redBookVideoFeed',
  IMAGE_FEED: 'fmz200.xiaohongshu.feed.rsp',
  COMMENTS: 'fmz200.xiaohongshu.comments.rsp',
  COMMENT_VIDEOS: 'fmz200.xiaohongshu.comments.videos.rsp',
  IMAGE_QUALITY: 'fmz200.xiaohongshu.imageQuality',
  EMOJI_TO_PIC: 'fmz200.xiaohongshu.comments.emojiToPic',
  CACHE_VERSION: 'fmz200.xiaohongshu.cacheVersion'
};

const CACHE_VERSION = '3.6'; // 缓存版本号，数据结构改变时需要更新

const IMAGE_QUALITY_OPTIONS = {
  ORIGINAL: 'original',
  HIGH: 'high',
  DEFAULT: 'default'
};

const UNIX_TIMESTAMP_2090 = {
  START: 3818332800,  // 2090-12-31 00:00:00
  END: 3818419199     // 2090-12-31 23:59:59
};

// 预编译正则表达式
const IMAGE_ENHANCE_REGEX = {
  ORIGINAL: /\?imageView2\/2[^&]*(?:&redImage\/frame\/0)/,
  WIDTH: /imageView2\/2\/w\/\d+\/format/g,
  HEIGHT: /imageView2\/2\/h\/\d+\/format/g
};

// ==================== 初始化和验证 ====================
const url = $request.url;
let rsp_body = $response.body;

let isEmojiToPicEnabled = true; // 默认开启，else 块内会根据配置重新赋值

if (!rsp_body) {
  $done({});
} else {

// JSON解析异常保护
let obj;
try {
  obj = JSON.parse(rsp_body);
} catch (e) {
  console.error('❌ 响应体JSON解析失败:', e.message);
  $done({body: rsp_body}); // 返回原始数据
}

// 验证缓存版本，如果版本不匹配则清理旧缓存
validateCacheVersion();

// ==================== 参数配置 ====================
isEmojiToPicEnabled = getEmojiToPicConfig();
console.log(`📝 评论区表情包转图片功能：${isEmojiToPicEnabled ? '已开启' : '已关闭'}`);

const urlHandlers = new Map([
  // 搜索功能净化
  ['/search/banner_list', cleanSearchBanner],
  ['/search/hot_list', cleanSearchHotList],
  ['/search/hint', cleanSearchHint],
  ['/search/trending?', cleanSearchTrending],
  ['/search/notes?', filterSearchNotes],
  
  // 系统配置净化
  ['/system_service/config?', cleanSystemConfig],
  ['/system_service/splash_config', disableSplashAds],
  
  // 信息流处理
  ['/note/imagefeed?', processImageFeed],
  ['/note/feed?', processImageFeed],
  ['/note/live_photo/save', processLivePhotoSave],
  ['/note/widgets', cleanNoteWidgets],
  ['/v3/note/videofeed?', processVideoFeedV3],
  ['/v4/note/videofeed', processVideoFeedV4],
  ['/v10/note/video/save', processVideoSave],
  
  // 关注页净化
  ['/user/followings/followfeed', cleanFollowFeed],
  ['/v4/followfeed', cleanFollowFeedV4],
  ['/recommend/user/follow_recommend', cleanUserRecommend],
  
  // 首页信息流净化
  ['/v6/homefeed', cleanHomeFeed],
  
  // 评论区处理
  ['/api/sns/v5/note/comment/list?', processComments],
  ['/api/sns/v3/note/comment/sub_comments?', processComments],
  ['/api/sns/v1/interaction/comment/video/download?', processCommentVideoDownload]
]);

// 执行路由匹配（单次遍历，性能优化）
for (const [pattern, handler] of urlHandlers) {
  if (url.includes(pattern)) {
    try {
      handler(obj);
    } catch (e) {
      console.error(`❌ 处理 ${pattern} 时出错:`, e.message);
    }
    break; // 找到匹配的处理器后立即退出
  }
}

// ==================== 返回处理后的数据 ====================
$done({body: JSON.stringify(obj)});

} // end else (rsp_body 非空)

// ==================== URL处理函数 ====================

function cleanSearchBanner(obj) {
  if (obj.data) {
    obj.data = {};
    console.log('✅ 已清理搜索横幅广告');
  }
}

function cleanSearchHotList(obj) {
  if (obj.data?.items) {
    obj.data.items = [];
    console.log('✅ 已清理热搜列表');
  }
}

function cleanSearchHint(obj) {
  if (obj.data?.hint_words) {
    obj.data.hint_words = [];
    console.log('✅ 已清理搜索填充词');
  }
}

function cleanSearchTrending(obj) {
  if (obj.data) {
    obj.data.queries = [];
    obj.data.hint_word = {};
    console.log('✅ 已清理搜索推荐');
  }
}

function filterSearchNotes(obj) {
  if (obj.data?.items?.length > 0) {
    const originalCount = obj.data.items.length;
    obj.data.items = obj.data.items.filter((i) => i.model_type === "note");
    console.log(`✅ 搜索结果过滤完成，${originalCount} → ${obj.data.items.length} 条`);
  }
}

function cleanSystemConfig(obj) {
  if (obj.data) {
    const items = ["app_theme", "loading_img", "splash", "store"];
    items.forEach(item => delete obj.data[item]);
    console.log('✅ 已清理系统配置');
  }
}

function disableSplashAds(obj) {
  if (obj?.data?.ads_groups?.length > 0) {
    for (let group of obj.data.ads_groups) {
      group.start_time = UNIX_TIMESTAMP_2090.START;
      group.end_time = UNIX_TIMESTAMP_2090.END;
      
      if (group?.ads?.length > 0) {
        for (let ad of group.ads) {
          ad.start_time = UNIX_TIMESTAMP_2090.START;
          ad.end_time = UNIX_TIMESTAMP_2090.END;
        }
      }
    }
    console.log('✅ 已禁用开屏广告');
  }
}

function processImageFeed(obj) {
  console.log('🖼️ 处理图片信息流');
  
  if (!obj?.data?.length > 0 || !obj.data[0]?.note_list?.length > 0) {
    return;
  }
  
  // 预先收集全部 note 的 images_list
  let allImages = [];
  
  for (let item of obj.data[0].note_list) {
    unlockMediaSave(item);
    addDownloadButton(item);
    enableImageDownload(item);
    addCopyPermission(item);
    filterHashTags(item);
    
    // 收集每条 note 的图片列表
    if (Array.isArray(item.images_list)) {
      allImages = allImages.concat(item.images_list);
    }
  }
  
  // 画质增强
  if (obj.data[0]?.note_list[0]?.images_list) {
    const images_list = obj.data[0].note_list[0].images_list;
    obj.data[0].note_list[0].images_list = imageEnhance(JSON.stringify(images_list));
  }
  
  // 将全部 note 图片信息写入缓存
  if (allImages.length > 0) {
    saveToCache(CACHE_KEYS.IMAGE_FEED, allImages);
    console.log(`♻️ 已存储无水印信息，共 ${allImages.length} 张图`);
  }
}

function processLivePhotoSave(obj) {
  console.log('📷 处理Live Photo保存请求');
  
  const cachedData = getFromCache(CACHE_KEYS.IMAGE_FEED);
  if (!cachedData) {
    console.log('⚠️ 缓存无内容，返回原body');
    $done({body: $response.body});
    return;
  }
  
  const cache_body = cachedData;
  let new_data = [];
  
  for (const images of cache_body) {
    if (!images.live_photo_file_id) continue;
    
    const stream = images.live_photo?.media?.stream;
    const urlEntry = stream?.h265?.[0] || stream?.h264?.[0];
    if (!urlEntry?.master_url) {
      console.log(`⚠️ ${images.live_photo_file_id} 无可用流地址（h265/h264 均缺失），跳过`);
      continue;
    }
    
    // feed 缓存的 master_url 携带时效 CDN 签名（x-expires）
    // 用户浏览 feed 到点击保存之间若签名已过期，CDN 返回 403，App 降级显示静态图
    // 过期则跳过替换，让 App 使用自己的响应，总优于写入一个必然 403 的地址
    if (isUrlExpired(urlEntry.master_url)) {
      console.log(`⚠️ ${images.live_photo_file_id} 的 URL 签名已过期，跳过替换避免 403`);
      continue;
    }
    
    new_data.push({
      file_id: images.live_photo_file_id,
      video_id: images.live_photo.media.video_id,
      url: urlEntry.master_url
    });
  }
  
  // 若全部 URL 均已过期，直接透传原始响应
  if (new_data.length === 0) {
    console.log('⚠️ 无有效无水印URL（均已过期或流缺失），返回原始响应');
    $done({body: $response.body});
    return;
  }
  
  if (obj.data?.datas) {
    replaceUrlContent(obj.data.datas, new_data);
  } else {
    obj.code = 0;
    obj.success = true;
    obj.msg = "成功";
    obj.data = {datas: new_data};
  }
  
  console.log('✅ Live Photo无水印URL替换完成');
}

function cleanNoteWidgets(obj) {
  if (obj.data) {
    const items = ["cooperate_binds", "generic", "note_next_step", "widget_list"];
    items.forEach(item => delete obj.data[item]);
    console.log('✅ 已清理笔记小部件');
  }
}

function processVideoFeedV3(obj) {
  if (!obj?.data?.length > 0) return;
  
  for (let item of obj.data) {
    unlockMediaSave(item);
    addDownloadButton(item);
  }
  
  console.log('✅ V3视频信息流处理完成');
}

function processVideoFeedV4(obj) {
  let videoData = [];
  
  if (!obj?.data?.length > 0) return;
  
  for (let item of obj.data) {
    // 强制开启保存权限
    unlockMediaSave(item);
    enableVideoDownload(item);
    addDownloadButtonIfMissing(item);
    
    // 提取最佳视频流
    const selectedStream = selectBestVideoStream(item);
    
    if (item?.id && selectedStream?.master_url) {
      videoData.push({
        id: item.id,
        url: selectedStream.master_url
      });
      console.log(`✅ 提取成功 ➜ ${item.id} → ${selectedStream.stream_desc || '未知规格'}`);
      console.log(`   [规格:${selectedStream.quality_type || 'N/A'}] [码率:${selectedStream.avg_bitrate || 'N/A'}]`);
    } else {
      console.log(`❌ 未找到可用视频: ${item.id}`);
    }
  }
  
  // 写入本地持久化缓存
  saveToCache(CACHE_KEYS.VIDEO_FEED, videoData);
  console.log(`✅ 已缓存视频 ${videoData.length} 条`);
}

function processVideoSave(obj) {
  const videoFeed = getFromCache(CACHE_KEYS.VIDEO_FEED) || [];
  
  if (obj.data?.note_id && videoFeed.length > 0) {
    for (let item of videoFeed) {
      if (item.id === obj.data.note_id) {
        obj.data.download_url = item.url;
        console.log(`✅ 已替换无水印视频URL: ${obj.data.note_id}`);
        break;
      }
    }
  }
  
  // 解除下载限制
  if (obj.data?.disable) {
    delete obj.data.disable;
    delete obj.data.msg;
    obj.data.status = 2;
    console.log('✅ 已解除视频下载限制');
  }
}

function cleanFollowFeed(obj) {
  if (obj?.data?.items?.length > 0) {
    const originalCount = obj.data.items.length;
    obj.data.items = obj.data.items.filter((i) => i?.recommend_reason === "friend_post");
    console.log(`✅ 关注页过滤完成，${originalCount} → ${obj.data.items.length} 条`);
  }
}

function cleanFollowFeedV4(obj) {
  if (obj?.data?.items?.length > 0) {
    const originalCount = obj.data.items.length;
    obj.data.items = obj.data.items.filter((i) => !["recommend_user"].includes(i.recommend_reason));
    console.log(`✅ 关注列表过滤完成，${originalCount} → ${obj.data.items.length} 条`);
  }
}

function cleanUserRecommend(obj) {
  if (obj?.data?.title === "你可能感兴趣的人" && obj?.data?.rec_users?.length > 0) {
    obj.data = {};
    console.log('✅ 已移除用户推荐');
  }
}

function cleanHomeFeed(obj) {
  if (!obj?.data?.length > 0) return;
  
  let newItems = [];
  let filtered = {live: 0, ads: 0, card: 0, goods: 0};
  
  for (let item of obj.data) {
    if (item?.model_type === "live_v2") {
      filtered.live++;
    } else if (item?.hasOwnProperty("ads_info")) {
      filtered.ads++;
    } else if (item?.hasOwnProperty("card_icon")) {
      filtered.card++;
    } else if (item?.note_attributes?.includes("goods")) {
      filtered.goods++;
    } else {
      if (item?.related_ques) {
        delete item.related_ques;
      }
      newItems.push(item);
    }
  }
  
  obj.data = newItems;
  console.log(`✅ 信息流净化完成，保留 ${newItems.length} 条`);
  console.log(`   过滤: 直播${filtered.live} 广告${filtered.ads} 带货${filtered.card} 商品${filtered.goods}`);
}

function processComments(obj) {
  replaceRedIdWithFmz200(obj.data);
  
  let livePhotos = [];
  let commentVideos = [];
  let note_id = "";
  
  if (!obj.data?.comments?.length > 0) return;
  
  note_id = obj.data.comments[0].note_id;
  
  for (const comment of obj.data.comments) {
    processCommentItem(comment, livePhotos, commentVideos);
    
    // 处理子评论
    if (comment.sub_comments?.length > 0) {
      for (const sub_comment of comment.sub_comments) {
        processCommentItem(sub_comment, livePhotos, commentVideos);
      }
    }
  }
  
  console.log(`📝 本次note_id：${note_id}`);
  
  // 缓存Live Photo信息
  if (livePhotos.length > 0) {
    updateCommentsCache(note_id, livePhotos);
  }
  
  // 缓存评论视频信息
  if (commentVideos.length > 0) {
    updateCommentVideosCache(note_id, commentVideos);
  }
}

function processCommentVideoDownload(obj) {
  const targetId = obj.data?.video?.video_id;
  console.log(`🎬 目标video_id：${targetId}`);
  
  if (!obj.data?.video) {
    console.log(`❌ 响应中无 video 字段，跳过`);
    return;
  }
  
  let matched = false;
  
  // 先查 Live Photo 缓存
  const commitsCache = getFromCache(CACHE_KEYS.COMMENTS);
  if (commitsCache?.livePhotos?.length > 0) {
    for (const item of commitsCache.livePhotos) {
      if (item.videId === targetId) {
        console.log(`✅ [livePhotos] 匹配到无水印链接：${item.videoUrl}`);
        obj.data.video.video_url = item.videoUrl;
        matched = true;
        break;
      }
    }
  }
  
  // 再查评论视频缓存，两者独立互不干扰
  if (!matched) {
    const videosCache = getFromCache(CACHE_KEYS.COMMENT_VIDEOS);
    if (videosCache?.videos?.length > 0) {
      for (const item of videosCache.videos) {
        if (item.videId === targetId) {
          console.log(`✅ [commentVideos] 匹配到无水印链接：${item.videoUrl}`);
          obj.data.video.video_url = item.videoUrl;
          matched = true;
          break;
        }
      }
    }
  }
  
  if (!matched) {
    console.log(`❌ 没有[${targetId}]的无水印地址`);
  }
}

// ==================== 公共工具函数 ====================

/**
 * 解除媒体保存限制（水印、保存限制等）
 */
function unlockMediaSave(item) {
  if (!item?.media_save_config) return;
  
  item.media_save_config.disable_save = false;
  item.media_save_config.disable_watermark = true;
  item.media_save_config.disable_weibo_cover = true;
}

/**
 * 添加下载按钮（如果不存在）
 */
function addDownloadButton(item) {
  if (!item?.share_info?.function_entries?.length > 0) return;
  
  const addItem = {type: "video_download"};
  const func = item.share_info.function_entries[0];
  
  if (func?.type !== "video_download") {
    item.share_info.function_entries.unshift(addItem);
  }
}

/**
 * 启用图片下载功能
 */
function enableImageDownload(item) {
  if (!Array.isArray(item.function_switch)) return;
  
  item.function_switch.forEach(switchItem => {
    if (switchItem?.type === 'image_download') {
      switchItem.enable = true;
      if (switchItem.reason) delete switchItem.reason;
    }
  });
}

/**
 * 启用视频下载功能
 */
function enableVideoDownload(item) {
  if (!item?.function_switch?.length > 0) return;
  
  for (let switchItem of item.function_switch) {
    if (switchItem.type === "video_download") {
      switchItem.enable = true;
      if (switchItem.reason) delete switchItem.reason;
    }
  }
}

/**
 * 添加下载按钮（检查是否已存在）
 */
function addDownloadButtonIfMissing(item) {
  if (!item?.share_info?.function_entries?.length > 0) return;
  
  const hasDownload = item.share_info.function_entries.some(entry => entry.type === "video_download");
  if (!hasDownload) {
    console.log(`  添加下载按钮: ${item.id}`);
    item.share_info.function_entries.push({type: "video_download"});
  }
}

/**
 * 添加复制权限
 */
function addCopyPermission(item) {
  const options = item.note_text_press_options;
  if (!Array.isArray(options)) return;
  
  const hasCopy = options.some(opt => opt.key === 'copy');
  if (!hasCopy) {
    options.push({
      key: 'copy',
      extra: ''
    });
  }
}

/**
 * 过滤话题标签
 */
function filterHashTags(item) {
  if (item.hash_tag) {
    item.hash_tag = item.hash_tag.filter(tag => tag.type !== "interact_vote");
  }
}

/**
 * 选择最佳视频流（优化版）
 * 优先选择H265，降级H264
 * 排序：分辨率面积 > 平均码率
 */
function selectBestVideoStream(item) {
  const h265List = item?.video_info_v2?.media?.stream?.h265 || [];
  const h264List = item?.video_info_v2?.media?.stream?.h264 || [];
  
  // 排序函数：优先分辨率面积，其次平均码率
  const sortStream = (a, b) => {
    const resA = (a.width || 0) * (a.height || 0);
    const resB = (b.width || 0) * (b.height || 0);
    if (resB !== resA) return resB - resA;
    return (b.avg_bitrate || 0) - (a.avg_bitrate || 0);
  };
  
  // 优先选择 H265
  if (Array.isArray(h265List) && h265List.length > 0) {
    const sorted = h265List.filter(v => !!v.master_url).sort(sortStream);
    if (sorted.length > 0) return sorted[0];
  }
  
  // 降级策略：选择 H264
  if (Array.isArray(h264List) && h264List.length > 0) {
    const sorted = h264List.filter(v => !!v.master_url).sort(sortStream);
    if (sorted.length > 0) {
      console.log(`  ⚠️ 使用H264降级方案: ${item.id}`);
      return sorted[0];
    }
  }
  
  return null;
}

/**
 * 从已解析的 stream 对象中选择最佳流
 * 用于评论视频（video_info 字段已解析后的 .stream 层）
 * 与 selectBestVideoStream 逻辑一致，入参结构不同
 */
function selectBestStreamFromObj(stream) {
  if (!stream) return null;

  const sortStream = (a, b) => {
    const resA = (a.width || 0) * (a.height || 0);
    const resB = (b.width || 0) * (b.height || 0);
    if (resB !== resA) return resB - resA;
    return (b.avg_bitrate || 0) - (a.avg_bitrate || 0);
  };

  const h265List = Array.isArray(stream.h265) ? stream.h265 : [];
  const h264List = Array.isArray(stream.h264) ? stream.h264 : [];

  if (h265List.length > 0) {
    const sorted = h265List.filter(v => !!v.master_url).sort(sortStream);
    if (sorted.length > 0) return sorted[0];
  }

  if (h264List.length > 0) {
    const sorted = h264List.filter(v => !!v.master_url).sort(sortStream);
    if (sorted.length > 0) {
      console.log(`  ⚠️ 评论视频使用H264降级`);
      return sorted[0];
    }
  }

  return null;
}

/**
 * 处理单个评论项（表情包转图片 + Live Photo提取 + 评论视频提取）
 * @param {object} comment - 评论对象
 * @param {Array}  livePhotos    - Live Photo 收集数组（来自 comment.pictures）
 * @param {Array}  commentVideos - 评论视频收集数组（来自 comment.videos），子评论传空数组
 */
function processCommentItem(comment, livePhotos, commentVideos = []) {
  // 表情包转图片（可配置）
  if (isEmojiToPicEnabled) {
    if (comment.comment_type === 3) {
      comment.comment_type = 2;
    }
    if (comment.media_source_type === 1) {
      comment.media_source_type = 0;
    }
  }
  
  // 提取 Live Photo 视频URL（来自 comment.pictures）
  if (comment.pictures?.length > 0) {
    for (const picture of comment.pictures) {
      if (!picture.video_id) continue;
      
      try {
        const picObj = JSON.parse(picture.video_info);
        if (picObj.stream?.h265?.[0]?.master_url) {
          livePhotos.push({
            videId: picture.video_id,
            videoUrl: picObj.stream.h265[0].master_url
          });
        }
      } catch (e) {
        console.log(`  ⚠️ 解析 picture.video_info 失败: ${e.message}`);
      }
    }
  }
  
  // 提取评论视频 URL（来自 comment.videos，子评论通常无此字段）
  if (comment.videos?.length > 0) {
    for (const video of comment.videos) {
      if (!video?.video_id || !video?.video_info) continue;
      
      try {
        const videoObj = JSON.parse(video.video_info);
        const stream = selectBestStreamFromObj(videoObj?.stream);
        if (!stream?.master_url) {
          console.log(`  ⚠️ 评论视频 ${video.video_id} 无可用流（h265/h264 均缺失），跳过`);
          continue;
        }
        commentVideos.push({
          videId: video.video_id,
          videoUrl: stream.master_url,
          width: stream.width,
          height: stream.height,
          bitrate: stream.video_bitrate,
          hdr: stream.hdr_type === 1
        });
        console.log(`  ✅ 评论视频提取成功 ${video.video_id} [${stream.width}x${stream.height}]`);
      } catch (e) {
        console.log(`  ⚠️ 解析 video.video_info 失败: ${e.message}`);
      }
    }
  }
}

/**
 * 更新评论缓存
 */
function updateCommentsCache(note_id, livePhotos) {
  const commitsCache = getFromCache(CACHE_KEYS.COMMENTS);
  let commitsRsp;
  
  if (!commitsCache) {
    commitsRsp = {noteId: note_id, livePhotos: livePhotos};
  } else {
    commitsRsp = commitsCache;
    console.log(`  缓存note_id：${commitsRsp.noteId}`);
    
    if (commitsRsp.noteId === note_id) {
      console.log("  增量数据");
      commitsRsp.livePhotos = deduplicateLivePhotos(commitsRsp.livePhotos.concat(livePhotos));
    } else {
      console.log("  更换数据");
      commitsRsp = {noteId: note_id, livePhotos: livePhotos};
    }
  }
  
  saveToCache(CACHE_KEYS.COMMENTS, commitsRsp);
  console.log(`✅ 已缓存评论Live Photo ${commitsRsp.livePhotos.length} 条`);
}

/**
 * 更新评论视频缓存（comment.videos 来源，与 Live Photo 缓存独立）
 */
function updateCommentVideosCache(note_id, commentVideos) {
  const cached = getFromCache(CACHE_KEYS.COMMENT_VIDEOS);
  let videosCache;

  if (!cached) {
    videosCache = {noteId: note_id, videos: commentVideos};
  } else {
    videosCache = cached;
    console.log(`  [commentVideos] 缓存note_id：${videosCache.noteId}`);

    if (videosCache.noteId === note_id) {
      console.log("  [commentVideos] 增量数据");
      videosCache.videos = deduplicateLivePhotos(videosCache.videos.concat(commentVideos));
    } else {
      console.log("  [commentVideos] 更换数据");
      videosCache = {noteId: note_id, videos: commentVideos};
    }
  }

  saveToCache(CACHE_KEYS.COMMENT_VIDEOS, videosCache);
  console.log(`✅ 已缓存评论视频 ${videosCache.videos.length} 条`);
}

/**
 * 小红书画质增强：加载2K分辨率的图片
 */
function imageEnhance(jsonStr) {
  if (!jsonStr) {
    console.error("❌ imageEnhance: jsonStr为空");
    return [];
  }
  
  const imageQuality = $.getdata(CACHE_KEYS.IMAGE_QUALITY) || IMAGE_QUALITY_OPTIONS.DEFAULT;
  
  // 验证配置值
  const validQualities = Object.values(IMAGE_QUALITY_OPTIONS);
  if (!validQualities.includes(imageQuality)) {
    console.log(`⚠️ 无效的画质配置: ${imageQuality}，使用默认值`);
  }
  
  if (imageQuality === IMAGE_QUALITY_OPTIONS.ORIGINAL) {
    console.log("🎨 画质设置为-原始分辨率");
    jsonStr = jsonStr.replace(IMAGE_ENHANCE_REGEX.ORIGINAL, "?imageView2/0/format/png&redImage/frame/0");
  } else {
    console.log("🎨 画质设置为-高像素输出");
    jsonStr = jsonStr.replace(IMAGE_ENHANCE_REGEX.WIDTH, `imageView2/2/w/2160/format`);
    jsonStr = jsonStr.replace(IMAGE_ENHANCE_REGEX.HEIGHT, `imageView2/2/h/2160/format`);
  }
  
  console.log('✅ 图片画质增强完成');
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("❌ JSON解析错误:", e.message);
    return [];
  }
}

/**
 * 替换URL为无水印版本
 * [Fix Bug2-层1] 原正则 /(.*)\.mp4/ 无法匹配 m3u8 流 URL，match 为 null，整个替换静默跳过
 * [Fix Bug2-层2] 即使命中 mp4，match[1].mp4 截断了缓存 URL 的签名 query，换来的地址同样会 403
 * 修复：直接使用完整的无水印 URL（含签名 query），兼容 mp4 / m3u8 / 任意格式，不做路径拼接
 */
function replaceUrlContent(collectionA, collectionB) {
  console.log('🔄 替换无水印的URL');
  
  collectionA.forEach(itemA => {
    const itemB = collectionB.find(b => b.file_id === itemA.file_id);
    if (!itemB?.url) return;
    
    // [Fix Bug2] 直接整体替换，保留无水印 URL 的完整签名 query
    itemA.url = itemB.url;
    itemA.author = "@fmz200";
    console.log(`   ✅ URL 替换成功: ${itemA.file_id}`);
  });
}

/**
 * Live Photo数组去重（优化版）
 */
function deduplicateLivePhotos(livePhotos) {
  const seen = new Set();
  return livePhotos.filter(item => {
    if (seen.has(item.videId)) return false;
    seen.add(item.videId);
    return true;
  });
}

/**
 * 替换red_id为fmz200（递归隐藏真实ID）
 */
function replaceRedIdWithFmz200(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(item => replaceRedIdWithFmz200(item));
  } else if (typeof obj === 'object' && obj !== null) {
    if ('red_id' in obj) {
      obj.fmz200 = obj.red_id;
      delete obj.red_id;
    }
    Object.keys(obj).forEach(key => {
      replaceRedIdWithFmz200(obj[key]);
    });
  }
}

/**
 * 检测 CDN URL 签名是否已过期
 * 小红书 CDN 使用 x-expires（Unix 时间戳秒数）标识签名有效期
 * 提前 30s 判定为过期，避免边界情况下仍发出注定失败的请求
 */
function isUrlExpired(url) {
  try {
    const match = url.match(/[?&]x-expires?=(\d+)/i);
    if (!match) return false; // 无过期参数，视为永久有效（如内网/测试 URL）
    const expireTs = parseInt(match[1], 10);
    const nowTs = Math.floor(Date.now() / 1000);
    const expired = nowTs >= expireTs - 30;
    if (expired) {
      console.log(`   签名过期时间: ${new Date(expireTs * 1000).toLocaleString()}`);
    }
    return expired;
  } catch (e) {
    return false; // 解析失败时保守处理，不阻断替换流程
  }
}

// ==================== 配置和缓存管理 ====================

/**
 * 获取表情包转图片配置
 */
function getEmojiToPicConfig() {
  if (typeof $argument !== 'undefined' && $argument) {
    try {
      const args = JSON.parse($argument);
      if (args.xhs_sticker === false || args.xhs_sticker === 'false') {
        return false;
      }
    } catch (e) {
      console.log('⚠️ 参数解析失败，使用默认值');
    }
  } else if (typeof $loon !== 'undefined') {
    return $.getdata(CACHE_KEYS.EMOJI_TO_PIC) !== 'false';
  }
  return true; // 默认开启
}

/**
 * 验证缓存版本
 */
function validateCacheVersion() {
  const cachedVersion = $.getdata(CACHE_KEYS.CACHE_VERSION);
  
  if (cachedVersion !== CACHE_VERSION) {
    console.log(`🔄 缓存版本更新: ${cachedVersion || '无'} → ${CACHE_VERSION}`);
    
    // 清理旧版本缓存
    Object.values(CACHE_KEYS).forEach(key => {
      if (key !== CACHE_KEYS.CACHE_VERSION) {
        $.setdata('', key);
      }
    });
    
    // 更新版本号
    $.setdata(CACHE_VERSION, CACHE_KEYS.CACHE_VERSION);
    console.log('✅ 缓存已清理');
  }
}

/**
 * 保存数据到缓存（带版本校验）
 */
function saveToCache(key, data) {
  try {
    $.setdata(JSON.stringify(data), key);
  } catch (e) {
    console.error(`❌ 缓存保存失败 [${key}]:`, e.message);
  }
}

/**
 * 从缓存读取数据（带异常处理）
 */
function getFromCache(key) {
  try {
    const data = $.getdata(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`❌ 缓存读取失败 [${key}]:`, e.message);
    return null;
  }
}

// ==================== Env 框架（支持多平台）====================
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), a = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.isSurge() || this.isQuanX() || this.isLoon() ? $done(t) : this.isNode() && process.exit(1) } }(t, e) }
