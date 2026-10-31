/*! Original Copyright (c) 2026 Yu9191. Licensed under the MIT License. */

(() => {
const ARGUMENTS = globalThis.$argument ?? {};

const SETTINGS = {
  LegacyHomeFramework: ARGUMENTS.LegacyHomeFramework ?? false,
  BottomSimple: ARGUMENTS.BottomSimple ?? true,
  TopRcmd: ARGUMENTS.TopRcmd ?? true,
  TopMusic: ARGUMENTS.TopMusic ?? true,
  TopPodcast: ARGUMENTS.TopPodcast ?? true,
  TopBook: ARGUMENTS.TopBook ?? false,
  TopAI: ARGUMENTS.TopAI ?? false,
  MineClean: ARGUMENTS.MineClean ?? true,
  SearchTabExperiment: ARGUMENTS.SearchTabExperiment ?? false,
};
const REQUEST_PATH = extractApiPath(globalThis.$request?.url ?? "");
const RESPONSE_BYTES = globalThis.$response?.body;
if (!REQUEST_PATH || !(RESPONSE_BYTES instanceof Uint8Array) || !RESPONSE_BYTES.length)
  return $done({});

function extractApiPath(url) {
  return (
    url.match(
      /^https?:\/\/[^/]+\/x?eapi(\/[a-z0-9_/-]+)(?:\?.*)?$/i,
    )?.[1]?.replace(/\/+$/, "") ?? null
  );
}

const COMMENT_FIELD_ACTIONS = {
  tag: 1, tags: 1, commentTag: 1, commentTags: 1,
  contentTags: 1, tagDatas: 1, topicList: 1, bottomTags: 1,
  userBizLevels: 2, userNameplates: 2, pendantData: 2, medal: 2, decoration: 2,
};
const COMMENT_USER_FIELDS = [
  "vipRights", "avatarDetail", "commonIdentity", "relationTag",
];

function cleanCommentTree(value) {
  if (!value || typeof value !== "object") return 0;
  let changes = 0;
  if (Array.isArray(value)) {
    for (const item of value) changes += cleanCommentTree(item);
    return changes;
  }
  if (value.user && typeof value.user === "object") {
    for (const field of COMMENT_USER_FIELDS) {
      if (field in value.user && value.user[field] !== null) {
        value.user[field] = null;
        changes += 1;
      }
    }
    if ("vipType" in value.user && value.user.vipType !== 0) {
      value.user.vipType = 0;
      changes += 1;
    }
  }
  for (const key in value) {
    const child = value[key];
    const action = COMMENT_FIELD_ACTIONS[key];
    if (action === 1) {
      delete value[key];
      changes += 1;
    } else if (action === 2) {
      if (child !== null) {
        value[key] = null;
        changes += 1;
      }
    } else if (child && typeof child === "object" && Object.prototype.hasOwnProperty.call(value, key)) {
      changes += cleanCommentTree(child);
    }
  }
  return changes;
}
function cleanPlayerHints(payload) {
  if (!Array.isArray(payload.data?.hints)) return false;
  const PLAYER_VIEW_TYPES = new Set([
    "NMHintMVSwitchView",
    "FastPlayRecReasonBubbleView",
    "musicianTalk",
    "artistFollow",
    "PlayerAgentButtonRedDotView",
    "PlayerShareView",
  ]);
  const PLAYER_PROMO_POSITIONS = new Set([
    "player_vinyl_float_guide",
    "player_bottom_toast",
    "player_bottom_left_entrance",
    "player_bottom_left",
    "player_bottom_left_scene",
    "fast_player_middle_left_toast",
    "player_global_bubble",
    "vinyl_comment_entrance",
    "playlist_detail_top_banner",
  ]);

  const removedTokens = Array.isArray(payload.trp?.rules) && payload.trp.rules.length
    ? new Set() : null;
  const filtered = payload.data.hints.filter((hint) => {
    const viewType = hint?.template?.extra?.viewType;
    const extra = hint?.data?.extra;
    const position =
      hint?.position?.code ?? extra?.positionCode ?? "";
    const remove = PLAYER_VIEW_TYPES.has(viewType) || PLAYER_PROMO_POSITIONS.has(position);
    if (remove && !removedTokens) return false;
    const identifiers = [
      hint?.code, extra?.code, extra?.channelCode, extra?.trp_id,
    ];
    if (!remove && !identifiers.some((identifier) => {
      if (!identifier) return false;
      const text = String(identifier);
      return text.includes("heijiao_dj_wiki_pop_channel") || /UgcVideoChange/i.test(text);
    })) return true;
    if (!removedTokens) return false;
    if (position) removedTokens.add(String(position));
    for (const value of identifiers) {
      if (!value) continue;
      const identifier = String(value);
      removedTokens.add(identifier);
      const suffix = identifier.slice(identifier.lastIndexOf("@") + 1);
      if (suffix.length > 8) removedTokens.add(suffix);
    }
    return false;
  });
  if (filtered.length === payload.data.hints.length) return false;
  payload.data.hints = filtered;
  if (removedTokens?.size) {
    const tokens = [...removedTokens];
    payload.trp.rules = payload.trp.rules.filter(
      (rule) => {
        const text = String(rule);
        return !tokens.some((token) => text.includes(token));
      },
    );
  }
  return true;
}

function cleanDailyBottomExperiment(payload) {
  if (!Array.isArray(payload.data)) return false;
  let changed = false;
  for (const experiment of payload.data) {
    if (experiment?.abtestname !== "hy-hepaituijian" || experiment.abtestgroup === "c") continue;
    experiment.abtestgroup = "c";
    changed = true;
  }
  return changed;
}

function cleanClientExperiments(payload) {
  if (!Array.isArray(payload.data)) return false;
  let changed = false;
  for (let index = payload.data.length - 1; index >= 0; index -= 1) {
    const experiment = payload.data[index];
    const name = experiment?.expName;
    if (name === "lyrics_addcomment" || name === "New_Agent_Entry_Added_for_Search") {
      payload.data.splice(index, 1);
      changed = true;
    }
  }
  return applyExperimentOverrides(payload, clientExperimentOverrides()) || changed;
}

function clientExperimentOverrides() {
  const overrides = {};
  if (SETTINGS.SearchTabExperiment) {
    overrides["2026newframe_searchtabtest_distribution"] = { group: "t1" };
    overrides["2026newframe_listenidentifyandsearchtab_0126"] = {
      group: "t1",
      config: {
        showVoiceRec: false, fixSearchTab: true, searchTabJump: true,
        showTip: false, showSearchButton: true, bottomTabFixIcon: true,
      },
    };
  }
  return overrides;
}

function applyExperimentOverrides(payload, overrides) {
  if (payload.code !== 200 || !Array.isArray(payload.data) || !Object.keys(overrides).length) return false;
  let changed = false;
  const found = new Set();
  for (const experiment of payload.data) {
    const name = experiment?.expName;
    if (!Object.prototype.hasOwnProperty.call(overrides, name)) continue;
    found.add(name);
    const { group, config } = overrides[name];
    changed = replaceValue(experiment, "expGroupName", group) || changed;
    changed = replaceValue(experiment, "status", 1) || changed;
    if (config) {
      experiment.clientConfig ??= {};
      for (const key in config) changed = replaceValue(experiment.clientConfig, key, config[key]) || changed;
    }
  }
  for (const name in overrides) {
    if (found.has(name)) continue;
    const { group, config } = overrides[name];
    payload.data.push({ expName: name, expGroupName: group, status: 1, clientConfig: config ?? {} });
    changed = true;
  }
  return changed;
}

function cleanWebExperiments(payload) {
  if (!Array.isArray(payload.data)) return false;
  let changed = false;
  let hasSearchConfig = false;
  let hasSearchLabel = false;
  for (let index = payload.data.length - 1; index >= 0; index -= 1) {
    const experiment = payload.data[index];
    if (experiment?.expName === "search_add_voice_input") {
      payload.data.splice(index, 1);
      changed = true;
      continue;
    }
    if (["SearchUI2", "SearchUI3", "SearchSongRec"].includes(experiment?.expName))
      hasSearchConfig = true;
    if (experiment?.expName === "SearchLabel") {
      hasSearchLabel = true;
      if (!experiment.expGroupName || experiment.expGroupName === "c") {
        experiment.expGroupName = "t1";
        changed = true;
      }
    }
    if (experiment?.expName === "Hp_Playlist_Suggest" &&
        experiment.expGroupName === "t1") {
      experiment.expGroupName = "c";
      changed = true;
    }
  }
  if (hasSearchConfig && !hasSearchLabel) {
    payload.data.push({ expName: "SearchLabel", expGroupName: "t1" });
    changed = true;
  }
  return changed;
}

function cleanSongQuality(privilege) {
  if (!privilege || typeof privilege !== "object") return false;
  let changed = false;
  if (Number.isSafeInteger(privilege.flag) && privilege.flag >= 0) {
    const qualityBits = (Math.floor(privilege.flag / 65536) % 8) * 65536 +
      (Math.floor(privilege.flag / 4096) % 2) * 4096;
    if (qualityBits) {
      privilege.flag -= qualityBits;
      changed = true;
    }
  }
  if (typeof privilege.maxbr === "number" && privilege.maxbr > 320000) {
    privilege.maxbr = 320000;
    changed = true;
  } else if (privilege.maxbr === 0 &&
             typeof privilege.playMaxLevel === "number" && privilege.playMaxLevel > 320000) {
    privilege.playMaxLevel = 320000;
    changed = true;
  }
  if (privilege.maxBrLevel === "hires") {
    privilege.maxBrLevel = "exhigh";
    changed = true;
  }
  return changed;
}

function cleanArtistPageSongs(payload) {
  if (!Array.isArray(payload.data?.modules)) return false;
  let changed = false;
  for (const module of payload.data.modules) {
    if (module?.blockCode !== "ARTIST_SONGS") continue;
    changed = cleanSongCollection(module.resource?.songData?.songs, undefined, true) || changed;
  }
  return changed;
}

function cleanSearchResults(payload) {
  if (!Array.isArray(payload.data?.blocks)) return false;
  const HIDDEN_SEARCH_TAGS = new Set([
    "VIP", "VIP_DOWNLOAD", "Dolby", "HiRes", "SQ",
    "Whale_Cloud_Mica_Belt", "Whale_Cloud_Attain_Sound", "WHALE_CLOUD_AROUND",
  ]);

  let changed = false;
  const blocks = [];
  for (const block of payload.data.blocks) {
    if (block?.blockCode === "search_block_note") {
      changed = true;
      continue;
    }
    if (Array.isArray(block?.resources)) {
      if (block.blockCode === "search_block_best_match") {
        const resources = block.resources.filter((item) => item?.resourceType !== "note");
        if (resources.length !== block.resources.length) {
          block.resources = resources;
          changed = true;
          if (!resources.length) continue;
        }
      }
      for (const resource of block.resources) {
        if (resource?.resourceType !== "song") continue;
        if (Array.isArray(resource.extInfo?.algClickableTags) &&
            resource.extInfo.algClickableTags.length) {
          resource.extInfo.algClickableTags = [];
          changed = true;
        }
        const metadata = resource.baseInfo?.metaData;
        changed = cleanSongCollection([resource.baseInfo?.simpleSongData]) || changed;
        if (!Array.isArray(metadata) || !metadata.length) continue;
        const filtered = metadata.filter((tag) => !HIDDEN_SEARCH_TAGS.has(tag));
        if (filtered.length !== metadata.length) {
          resource.baseInfo.metaData = filtered.length ? filtered : [""];
          changed = true;
        }
      }
    }
    blocks.push(block);
  }
  if (changed) payload.data.blocks = blocks;
  return changed;
}

function cleanSearchRecommendations(payload) {
  const data = payload.data;
  if (!Array.isArray(data?.algWords)) return false;
  let changed = replaceValue(data, "algWords", [{}]);
  changed = replaceValue(data, "operateWords", {}) || changed;
  return changed;
}

function cleanSearchTabs(payload) {
  let changed = false;
  for (const key of ["algTabs", "defaultTabs"]) {
    const tabs = payload.data?.[key];
    if (!Array.isArray(tabs)) continue;
    const filtered = tabs.filter((tab) => String(tab?.code) !== "5003" && tab?.oid !== "auto_note");
    if (filtered.length === tabs.length) continue;
    payload.data[key] = filtered;
    changed = true;
  }
  return changed;
}

function clearEntitledPrivilegeFee(privilege) {
  if (privilege?.payed !== 1 || privilege.fee === 0) return false;
  privilege.fee = 0;
  return true;
}

function cleanSongPrivileges(privileges, hideQuality = false, entitledIds) {
  if (!Array.isArray(privileges)) return false;
  let changed = false;
  for (const privilege of privileges) {
    if (entitledIds && privilege?.payed === 1 && privilege.id != null)
      entitledIds.add(String(privilege.id));
    changed = clearEntitledPrivilegeFee(privilege) || changed;
    if (hideQuality) changed = cleanSongQuality(privilege) || changed;
  }
  return changed;
}

function cleanSongCollection(songs, privileges, hideQuality = false, clearReasons = false) {
  const entitledIds = Array.isArray(songs) && songs.length &&
    Array.isArray(privileges) && privileges.length ? new Set() : null;
  let changed = cleanSongPrivileges(privileges, hideQuality, entitledIds);
  if (!Array.isArray(songs)) return changed;
  for (const song of songs) {
    if (!song || typeof song !== "object") continue;
    changed = clearEntitledPrivilegeFee(song.privilege) || changed;
    if (hideQuality) changed = cleanSongQuality(song.privilege) || changed;
    if (clearReasons) {
      if (song?.reason != null) {
        song.reason = null;
        changed = true;
      }
      if (song?.recommendReason != null) {
        song.recommendReason = null;
        changed = true;
      }
    }
    if (song.privilege?.payed !== 1 && !entitledIds?.has(String(song.id))) continue;
    if (song.fee !== 0) {
      song.fee = 0;
      changed = true;
    }
  }
  return changed;
}

function cleanPlayMoreItems(payload) {
  const data = payload.data;
  if (!data || typeof data !== "object") return false;
  let changed = false;
  if (data.entranceItem?.bizType === "xindong") {
    data.entranceItem = null;
    changed = true;
  }
  const lists = data.bottomItem?.itemNodeList;
  if (!Array.isArray(lists)) return changed;
  const hiddenKeys = new Set(["magent", "redAnimeGuide", "ring", "giftCard"]);
  for (let index = lists.length - 1; index >= 0; index -= 1) {
    if (!Array.isArray(lists[index])) continue;
    const items = lists[index].filter((item) =>
      !hiddenKeys.has(item?.uniqueKey ?? item?.type) && item?.logInfo?.s_cid !== "yunBei");
    if (items.length === lists[index].length) continue;
    if (!items.length) lists.splice(index, 1);
    else lists[index] = items;
    changed = true;
  }
  return changed;
}

function cleanMinePublishButton(payload) {
  if (!SETTINGS.MineClean || !Array.isArray(payload.data?.minePrivacyList))
    return false;
  let changed = false;
  for (const item of payload.data.minePrivacyList) {
    if (item?.key !== "createBtn" || item.value === -1 ||
        !Array.isArray(item.availableValueList) || !item.availableValueList.includes(-1) ||
        !item.availableValueList.includes(item.value)) continue;
    item.value = -1;
    changed = true;
  }
  return changed;
}

function cleanDailyRecommendation(payload) {
  const data = payload.data;
  if (!data) return false;
  let changed = cleanSongCollection(data.dailySongs, undefined, true, true);
  if (Array.isArray(data.recommendReasons) && data.recommendReasons.length) {
    data.recommendReasons = [];
    changed = true;
  }
  return changed;
}

function cleanPlaylistDetail(payload) {
  let changed = cleanSongCollection(
    payload.playlist?.tracks, payload.privileges, true,
  );
  for (const track of Array.isArray(payload.playlist?.trackIds) ? payload.playlist.trackIds : []) {
    if (track && Object.prototype.hasOwnProperty.call(track, "dpr")) {
      delete track.dpr;
      changed = true;
    }
  }
  return changed;
}

function cleanPlayerArtistFollow(payload) {
  if (!Array.isArray(payload.data)) return false;
  let changed = false;
  for (const artist of payload.data) {
    if (artist?.followed !== false) continue;
    artist.followed = true;
    changed = true;
  }
  return changed;
}

const TOP_TAB_SETTING_BY_CODE = {
  rcmd: "TopRcmd",
  music: "TopMusic",
  podcast: "TopPodcast",
  vBook: "TopBook",
  "ai-generate-song": "TopAI",
};

function matchesValue(value, expected) {
  if (value === expected) return true;
  if (!value || !expected || typeof value !== "object" ||
      typeof expected !== "object" ||
      Array.isArray(value) !== Array.isArray(expected)) return false;
  if (Array.isArray(expected)) {
    if (value.length !== expected.length) return false;
    for (let i = 0; i < expected.length; i++)
      if (!matchesValue(value[i], expected[i])) return false;
    return true;
  }
  const keys = Object.keys(expected);
  return Object.keys(value).length === keys.length &&
    keys.every((key) => matchesValue(value[key], expected[key]));
}

function replaceValue(target, key, value) {
  if (matchesValue(target[key], value)) return false;
  target[key] = value;
  return true;
}

function cleanCommentList(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  let changed = false;
  if (Array.isArray(data.comments)) {
    const comments = data.comments.filter(
      (comment) =>
        !comment?.voiceNosKey &&
        !comment?.voiceWhaleId &&
        !(comment?.voiceDurationMillSecond > 0),
    );
    if (comments.length !== data.comments.length) {
      data.comments = comments;
      changed = true;
    }
  }
  return cleanCommentTree(data) > 0 || changed;
}

const HANDLERS = {
  "/personal/home/page/artist/v2": cleanArtistPageSongs,
  "/v3/artist/songs": (payload) => cleanSongCollection(payload.songs, payload.privileges, true),
  "/community/artist/home/listTabs": (payload) => {
    if (!Array.isArray(payload.data)) return false;
    const tabs = payload.data.filter((tab) => tab?.code !== "FANS_EVENT");
    if (tabs.length === payload.data.length) return false;
    payload.data = tabs;
    return true;
  },
  "/community/artist/home/listActionPoints": (payload) => {
    if (!Array.isArray(payload.data)) return false;
    const actions = payload.data.filter((action) => action?.code !== "SUPPORT");
    if (actions.length === payload.data.length) return false;
    payload.data = actions;
    return true;
  },
  "/song/play/more/list/v2": cleanPlayMoreItems,
  "/mine/rn/resource/list": cleanMinePublishButton,
  "/mine/rn/header/info/get": cleanMinePublishButton,
  "/v3/song/detail": (payload) => cleanSongCollection(payload.songs, payload.privileges, true),
  "/v6/playlist/detail": cleanPlaylistDetail,
  "/chart/playlist/detail": cleanPlaylistDetail,
  "/playlist/privilege": (payload) => cleanSongPrivileges(payload.data, true),
  "/album/privilege": (payload) => cleanSongPrivileges(payload.data, true),
  "/song/mix/detail": (payload) =>
    cleanSongCollection(payload.songs, payload.privileges, true),
  "/song/or/podcast/detail": (payload) =>
    cleanSongCollection(payload.data?.songs, payload.data?.privileges, true),
  "/song/enhance/privilege": (payload) => cleanSongPrivileges(payload.data, true),
  "/song/enhance/player/url/v1": (payload) => cleanSongPrivileges(payload.data, true),
  "/v3/discovery/recommend/songs": cleanDailyRecommendation,
  "/playmode/intelligence/list": (payload) =>
    Array.isArray(payload.data) && cleanSongCollection(payload.data.map((item) => item?.songInfo)),
  "/search/complex/page/v3": cleanSearchResults,
  "/search/result/tab": cleanSearchTabs,
  "/search/ai/song/block": (payload) => {
    if (typeof payload.data?.specJson !== "string" || !payload.data.specJson) return false;
    return replaceValue(payload, "data", {});
  },
  "/homepage/scene/more/rcmd/song": (payload) => {
    const data = payload.data;
    if (!Array.isArray(data?.songList) || !data.songList.length) return false;
    if (!data.songList.every(
      (song) => data.sourceMap?.[song?.id] === "curlist_scene_more_rcmd",
    )) return false;
    data.songList = [];
    data.algMap = null;
    data.sourceMap = null;
    data.offset = 0;
    data.hasMore = false;
    return true;
  },
  "/comments/activity/airborne/enable/voice": (payload) => {
    if (payload.data?.voiceCommentEnabled !== true) return false;
    payload.data.voiceCommentEnabled = false;
    return true;
  },
  "/batch": cleanBatch,
  "/social/event/bff/ad/resources": (payload) =>
    payload.data !== undefined && replaceValue(payload, "data", {}),
  "/ad/get": (payload) =>
    payload.data !== undefined && replaceValue(payload, "data", { code: 200, ads: {} }),
  "/platform/song/bff/grading/song/order/entrance": (payload) =>
    payload.data !== undefined && replaceValue(payload, "data", { songOrderEntrance: {} }),
  "/event/rcmd/topic/list": (payload) =>
    payload.data !== undefined && replaceValue(payload, "data", { topicList: [] }),
  "/v2/resource/comments/preload": (payload) => cleanCommentList(payload.data),
  "/v2/resource/comments": (payload) =>
    cleanCommentList(payload.data),
  "/v2/resource/comment/floor/get": (payload) =>
    cleanCommentTree(payload.data) > 0,
  "/resource/comments/reply/preload": (payload) =>
    cleanCommentTree(payload.data?.preloadCommentMap) > 0,
  "/comment/feed/inserted/resources/combined": cleanInsertedResources,
  "/comment/feed/inserted/resources": cleanInsertedResources,
  "/comment/feed/inserted/resources/isolation": cleanCommentMomentRecommendation,
  "/moment/song/feed/get": (payload) => {
    let changed = replaceValue(payload, "event", []);
    changed = replaceValue(payload, "more", false) || changed;
    changed = replaceValue(payload, "size", 0) || changed;
    changed = replaceValue(payload, "cursor", 0) || changed;
    return changed;
  },
  "/v1/user/info": (payload) => {
    if (!SETTINGS.MineClean || (payload.fmConfig === null && payload.ticketConfig === null))
      return false;
    payload.fmConfig = null;
    payload.ticketConfig = null;
    return true;
  },
  "/creator/musician/reminder/message/get": (payload) => {
    if (!SETTINGS.MineClean || !payload.data || payload.data.message === "")
      return false;
    payload.data.message = "";
    return true;
  },
  "/vipactivity/app/cashier/setting/get": (payload) => {
    if (!payload.data?.cashierTabPopup) return false;
    return replaceValue(payload.data, "cashierTabPopup", {});
  },
  "/delivery/batch-deliver": (payload) => {
    if (
      !SETTINGS.MineClean ||
      !payload.data ||
      typeof payload.data !== "object" ||
      !(119 in payload.data)
    )
      return false;
    delete payload.data[119];
    return true;
  },
  "/link/scene/show/resource": cleanPlayerHints,
  "/link/scene/show/resource/scene-code/player": cleanPlayerHints,
  "/rtrs/abt/front/expinfo/list": cleanClientExperiments,
  "/rtrs/abt/web/expinfo/list": cleanWebExperiments,
  "/experiment/group/batch/get": cleanDailyBottomExperiment,
  "/user/sub/artist/exist": cleanPlayerArtistFollow,
  "/link/home/framework/tab": (payload) => {
    const frameworkChanged = cleanHomeFramework(payload);
    const bottomChanged = cleanBottomTabs(payload);
    return frameworkChanged || bottomChanged;
  },
  "/link/home/framework/top/tab": cleanTopTabs,
  "/search/default/keyword/list": cleanSearchDefaultKeyword,
  "/search/rcmd/keyword/get/v2": cleanSearchRecommendations,
  "/homepage/block/page": cleanHomepageBanners,
  "/link/page/rcmd/resource/show": cleanHomepageSongTags,
};

function cleanBatch(payload) {
  let changed = false;
  for (const path in payload) {
    if (!Object.prototype.hasOwnProperty.call(payload, path) || !path.startsWith("/api/")) continue;
    const value = payload[path];
    const apiPath = path.slice(4).replace(/\/+$/, "");
    if (!value || typeof value !== "object" || Array.isArray(value) || apiPath === "/batch" ||
        !Object.prototype.hasOwnProperty.call(HANDLERS, apiPath)) continue;
    changed = HANDLERS[apiPath](value) || changed;
  }
  return changed;
}

function hasCleaningTargets(path, text) {
  if (path === "/link/page/rcmd/resource/show")
    return /"resourceType"\s*:\s*"song"|\\u00/i.test(text);
  if (text.includes("\\u")) return true;
  switch (path) {
    case "/experiment/group/batch/get":
      return text.includes("hy-hepaituijian");
    case "/rtrs/abt/front/expinfo/list":
      return SETTINGS.SearchTabExperiment ||
        /lyrics_addcomment|New_Agent_Entry_Added_for_Search/.test(text);
    case "/link/scene/show/resource":
    case "/link/scene/show/resource/scene-code/player":
      return /NMHintMVSwitchView|FastPlayRecReasonBubbleView|musicianTalk|artistFollow|PlayerAgentButtonRedDotView|PlayerShareView|player_vinyl_float_guide|player_bottom_toast|player_bottom_left|fast_player_middle_left_toast|player_global_bubble|vinyl_comment_entrance|playlist_detail_top_banner|heijiao_dj_wiki_pop_channel|UgcVideoChange/i.test(text);
    default:
      return true;
  }
}

function cleanInsertedResources(payload, offset = Number(payload.data?.offset) || 0) {
  let changed = replaceValue(payload, "data", {
    count: 0, offset, records: [], delayRender: false,
  });
  if (Array.isArray(payload.trp?.rules) && payload.trp.rules.length) {
    payload.trp.rules = [];
    changed = true;
  }
  return changed;
}

function cleanCommentMomentRecommendation(payload) {
  if (!Array.isArray(payload.data?.records)) {
    return false;
  }
  const filtered = payload.data.records.filter(
    (record) => record?.dslJson?.positionCode !== "CommentMomentRcmd",
  );
  if (filtered.length === payload.data.records.length) return false;
  payload.data.records = filtered;
  if ("count" in payload.data) payload.data.count = filtered.length;
  return true;
}


function cleanBottomTabs(payload) {
  if (
    !SETTINGS.BottomSimple ||
    !Array.isArray(payload.data?.commonResourceList)
  )
    return false;
  const filtered = payload.data.commonResourceList.filter(
    (tab) => ["main", "search", "mine"].includes(tab?.resourceType),
  );
  if (filtered.length < 2) return false;
  let changed = filtered.length !== payload.data.commonResourceList.length;
  payload.data.commonResourceList = filtered;

  if (Array.isArray(payload.data.adminList) && payload.data.adminList.length) {
    payload.data.adminList = [];
    changed = true;
  }
  return changed;
}

function cleanHomeFramework(payload) {
  if (!SETTINGS.LegacyHomeFramework || payload.data?.homeFrameworkType !== "fastPlay")
    return false;
  payload.data.homeFrameworkType = "normal";
  if (payload.data.selectedHomeTopTabCode === "fastPlay")
    payload.data.selectedHomeTopTabCode = "rcmd";
  payload.data.haveShowFastPlayGuide = false;
  return true;
}

function cleanSearchDefaultKeyword(payload) {
  if (!Array.isArray(payload.data?.keywords)) return false;

  let changed = false;
  if (payload.data.keywords.length) {
    payload.data.keywords = [];
    changed = true;
  }
  if (Array.isArray(payload.trp?.rules)) {
    const filteredRules = payload.trp.rules.filter(
      (rule) => !String(rule).startsWith("default_word_intervene::"),
    );
    if (filteredRules.length !== payload.trp.rules.length) {
      payload.trp.rules = filteredRules;
      changed = true;
    }
  }
  return changed;
}

function cleanTopTabs(payload) {
  if (!Array.isArray(payload.data?.commonResourceList)) return false;
  const original = payload.data.commonResourceList;

  const result = original.filter((tab) => {
    if (tab?.resCode === "fastPlay") return !SETTINGS.LegacyHomeFramework;
    const setting = TOP_TAB_SETTING_BY_CODE[tab?.resCode];
    return Boolean(setting && SETTINGS[setting]);
  });

  if (!result.length) {
    const fallback = original.find((tab) => tab?.resCode === "rcmd") ??
      original.find((tab) => tab?.resCode !== "fastPlay");
    if (fallback) result.push(fallback);
  }

  let changed =
    result.length !== original.length ||
    result.some((tab, index) => tab !== original[index]);
  payload.data.commonResourceList = result;

  if (result.length >= 2 && result.length <= 3 &&
      payload.data.topTabStyle === "tab_try_expand") {
    payload.data.topTabStyle = "tab_try_center";
    changed = true;
  }

  if (Array.isArray(payload.trp?.rules) && payload.trp.rules.length) {
    const allowedTopTabIds = new Set(result.map((tab) => tab?.trp_id).filter(Boolean));
    const filteredRules = payload.trp.rules.filter((rule) => {
      if (typeof rule !== "string" || !rule.startsWith("musicTopTab::")) {
        return true;
      }
      const trpId = rule.split("::", 3)[1];
      return allowedTopTabIds.has(trpId);
    });
    if (filteredRules.length !== payload.trp.rules.length) {
      payload.trp.rules = filteredRules;
      changed = true;
    }
  }

  if (Array.isArray(payload.data.adminList) && payload.data.adminList.length) {
    payload.data.adminList = [];
    changed = true;
  }
  return changed;
}

function cleanHomepageSongTags(payload) {
  if (!Array.isArray(payload.data?.blocks)) return false;
  let changed = false;
  for (const block of payload.data.blocks) {
    const modules = block?.dslData;
    for (const key in modules) {
      if (!Object.prototype.hasOwnProperty.call(modules, key)) continue;
      const module = modules[key];
      if (!Array.isArray(module?.content?.items)) continue;
      for (const group of module.content.items) {
        if (!Array.isArray(group?.items)) continue;
        for (const item of group.items) {
          if (item?.resourceType !== "song") continue;
          if (item.tag !== "VIP" && item.tag !== "Hi-Res" && item.tag !== "SQ") continue;
          item.tag = "";
          if (typeof item.tagDisplay === "string") item.tagDisplay = "none";
          changed = true;
        }
      }
    }
  }
  return changed;
}

function cleanHomepageBanners(payload) {
  if (!Array.isArray(payload.data?.blocks)) return false;
  const blocks = [];
  let changed = false;
  for (const block of payload.data.blocks) {
    if (block?.showType !== "BANNER" || !Array.isArray(block.extInfo?.banners)) {
      blocks.push(block);
      continue;
    }
    const filtered = block.extInfo.banners.filter(
      (banner) => !["活动", "广告"].includes(banner?.typeTitle),
    );
    if (filtered.length !== block.extInfo.banners.length) {
      block.extInfo.banners = filtered;
      changed = true;
    }
    if (filtered.length) {
      blocks.push(block);
    } else {
      changed = true;
    }
  }
  if (changed) payload.data.blocks = blocks;
  return changed;
}

try {
  const handler = HANDLERS[REQUEST_PATH];
  if (!handler) return $done({});
  const encoder = new TextEncoder();
  const options = { mode: "ecb", padding: "pkcs7", key: encoder.encode("e82ckenh8dichen8") };
  let bytes = $crypto.aes.decrypt(RESPONSE_BYTES, options);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = $utils.ungzip(bytes);
  const text = new TextDecoder().decode(bytes);
  if (!hasCleaningTargets(REQUEST_PATH, text)) return $done({});
  const payload = JSON.parse(text);
  if (!handler(payload)) return $done({});
  return $done({ body: $crypto.aes.encrypt(encoder.encode(JSON.stringify(payload)), options).ciphertext });
} catch (error) {
  console.log(`[网易云音乐净化] 放行原响应：${error?.message ?? error}`);
  return $done({});
}
})();
