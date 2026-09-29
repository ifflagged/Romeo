// 引用修改自：https://raw.githubusercontent.com/meichiny/rednote-feed-time/rewrite-rule/modules/shadowrocket/rednote-feed-time.js
// 2026-08-14

let body = $response.body;
if (!body) $done({});

let obj;
try {
  obj = JSON.parse(body);
} catch {
  $done({ body });
}

// 语言探测 (精准匹配 en 和 zh)
let isEnglish = false;
if (typeof $request !== 'undefined' && $request.headers) {
  const headers = $request.headers;
  const acceptLang = (headers['Accept-Language'] || headers['accept-language'] || '').toLowerCase();
  // 使用正则匹配单词边界，防止类似于 "sl-SI" 触发 "en"
  const zhIndex = acceptLang.search(/\bzh\b/);
  const enIndex = acceptLang.search(/\ben\b/);
  if (enIndex !== -1 && (zhIndex === -1 || enIndex < zhIndex)) {
    isEnglish = true;
  }
}

const i18n = {
  zh: { justNow: '刚刚', m: '分钟', h: '小时', d: '天' },
  en: { justNow: 'Now', m: 'm', h: 'h', d: 'd' }
};
const lang = isEnglish ? i18n.en : i18n.zh;

function decodeTimestamp(noteId) {
  const hex = noteId.slice(0, 8);
  return new Date(parseInt(hex, 16) * 1000);
}

function formatTwitterStyleTime(d) {
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);

  if (diffMins < 5) return lang.justNow;
  if (diffMins < 60) return `${diffMins}${lang.m}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}${lang.h}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}${lang.d}`;

  // 超过一周
  const pad = (n) => String(n).padStart(2, '0');
  const monthDay = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // 非本年度：显示年份后两位 + 月日
  if (d.getFullYear() !== now.getFullYear()) {
    const yy = String(d.getFullYear()).slice(-2);
    return `${yy}-${monthDay}`;
  }
  return monthDay;
}

function processTime(item) {
  if (item?.model_type !== 'note') return;
  if (!item?.id || !/^[a-f0-9]{24}$/i.test(item.id)) return;

  try {
    const d = decodeTimestamp(item.id);
    if (isNaN(d.getTime())) return;

    const timeStr = formatTwitterStyleTime(d);
    // 正则兼容 "MM-DD" 和 "YY-MM-DD" 格式
    const timePattern = /^(?:刚刚|Now|\d+(?:分钟|小时|天|m|h|d)|\d{2}-\d{2}(?:-\d{2})?) · /i;

    if (item.user?.nickname) {
      if (!timePattern.test(item.user.nickname)) {
        item.user.nickname = `${timeStr} · ${item.user.nickname}`;
      }
    }
  } catch {
    // skip
  }
}

function shouldKeep(item) {
  if (item.type !== 'normal') return false;

  const recommend = item.recommend || {};
  const type = recommend.type || '';
  const desc = recommend.desc || '';
  const trackId = recommend.track_id || '';
  const icon = recommend.icon || '';

  if (type === 'hot_reason') return false;
  if (desc === '热点') return false;
  if (trackId.startsWith('hotspot')) return false;
  if (icon !== '') return false;

  let extra = {};
  try {
    if (item.rec_extra_info) {
      extra = typeof item.rec_extra_info === 'string'
        ? JSON.parse(item.rec_extra_info)
        : item.rec_extra_info;
    }
  } catch {}
  if (extra?.hotEventId) return false;

  return true;
}

// ========== 统一处理 ==========
if (Array.isArray(obj?.data)) {
  obj.data = obj.data
    .filter(shouldKeep) // 先过滤垃圾数据，减少不必要的计算开销
    .map(item => {
      processTime(item); // 再为有效数据插入时间
      return item;
    });
}

$done({ body: JSON.stringify(obj) });
