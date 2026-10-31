// SPDX-License-Identifier: GPL-3.0-only
// Watermark handling adapted from fmz200/wool_scripts, Scripts/xiaohongshu/xiaohongshu.js.
// Modified by ccyykk666, 2026-09-13: rednote endpoints, bounded cache, exact media matching.
// License: https://raw.githubusercontent.com/ccyykk666/Loon-Plugin/main/plugins/rednote/LICENSE

(function () {
  const CACHE_KEY = "ccyykk666.rednote.livePhoto.v1";
  const MAX_ENTRIES = 120;
  const MAX_AGE = 60 * 60 * 1000;
  const now = Date.now();
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const validId = value => typeof value === "string" && value.length > 0;
  const validUrl = value => typeof value === "string" && /^https?:\/\/sns-v\d+\.rednotecdn\.com\/[^\s]+$/i.test(value);

  function readCache() {
    try {
      const entries = JSON.parse($persistentStore.read(CACHE_KEY) || "[]");
      if (!Array.isArray(entries)) return [];
      return entries.filter(item => isObject(item) && validId(item.fileId) &&
        validId(item.videoId) && validUrl(item.url) && Number.isFinite(item.time) &&
        now >= item.time && now - item.time < MAX_AGE).slice(-MAX_ENTRIES);
    } catch (_) {
      return [];
    }
  }

  try {
    const path = $request.url.split("?")[0];
    const isFeed = /^https:\/\/edith\.rnote\.com\/api\/sns\/v1\/note\/imagefeed$/i.test(path);
    const isSave = /^https:\/\/edith\.rnote\.com\/api\/sns\/v1\/note\/live_photo\/save$/i.test(path);
    if ((!isFeed && !isSave) || !$response.body) return $done({});
    const body = JSON.parse($response.body);
    if (!isObject(body) || body.success === false || (body.code !== undefined && body.code !== 0)) return $done({});
    let changed = false;

    if (isFeed && Array.isArray(body.data)) {
      const additions = [];
      for (const group of body.data) {
        if (!isObject(group) || !Array.isArray(group.note_list)) continue;
        for (const note of group.note_list) {
          if (!isObject(note)) continue;
          if (isObject(note.media_save_config) && note.media_save_config.disable_watermark === false) {
            note.media_save_config.disable_watermark = true;
            changed = true;
          }
          if (!Array.isArray(note.images_list)) continue;
          for (const picture of note.images_list) {
            if (!isObject(picture) || !validId(picture.live_photo_file_id)) continue;
            const media = picture.live_photo && picture.live_photo.media;
            if (!isObject(media) || !validId(media.video_id) || !isObject(media.stream)) continue;
            const streams = [media.stream.h265, media.stream.h264];
            let source;
            for (const list of streams) {
              if (Array.isArray(list)) source = list.find(item => isObject(item) && validUrl(item.master_url));
              if (source) break;
            }
            if (source) additions.push({fileId: picture.live_photo_file_id, videoId: media.video_id, url: source.master_url, time: now});
          }
        }
      }
      if (additions.length) {
        let cache = readCache();
        for (const item of additions) {
          cache = cache.filter(old => old.fileId !== item.fileId || old.videoId !== item.videoId);
          cache.push(item);
        }
        try {
          $persistentStore.write(JSON.stringify(cache.slice(-MAX_ENTRIES)), CACHE_KEY);
        } catch (_) {}
      }
    } else if (isSave && isObject(body.data) && Array.isArray(body.data.datas)) {
      const cache = readCache();
      for (const item of body.data.datas) {
        if (!isObject(item) || !validId(item.file_id) || !validId(item.video_id) || typeof item.url !== "string") continue;
        const source = cache.find(entry => entry.fileId === item.file_id && entry.videoId === item.video_id);
        if (source && item.url !== source.url) {
          item.url = source.url;
          changed = true;
        }
      }
    }
    return $done(changed ? {body: JSON.stringify(body)} : {});
  } catch (_) {
    return $done({});
  }
})();
