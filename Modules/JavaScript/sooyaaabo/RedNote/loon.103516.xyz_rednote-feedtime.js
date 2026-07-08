// 原始链接：https://raw.githubusercontent.com/meichiny/rednote-feed-time/rewrite-rule/modules/shadowrocket/rednote-feed-time.js

let body = $response.body;
if (!body) $done({});

let obj;
try {
  obj = JSON.parse(body);
} catch {
  $done({ body });
}

const now = new Date();
const thisYear = now.getFullYear();

function decodeTimestamp(noteId) {
  const hex = noteId.slice(0, 8);
  return new Date(parseInt(hex, 16) * 1000);
}

function formatTime(d) {
  const pad = (n) => String(n).padStart(2, "0");

  if (d.getFullYear() === thisYear) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hasPrefix(str) {
  return /^\d{2}-\d{2} \d{2}:\d{2}(丨.*)?$/.test(str) ||
         /^\d{4}-\d{2}-\d{2}(丨.*)?$/.test(str);
}

function processItem(item) {
  if (item?.model_type !== "note") return;
  if (!item?.id || !/^[a-f0-9]{24}$/i.test(item.id)) return;

  try {
    const d = decodeTimestamp(item.id);
    if (isNaN(d.getTime())) return;

    const time = formatTime(d);

    for (const field of ["display_title", "title", "name"]) {
      if (item[field] === undefined || item[field] === null) continue;

      const title = String(item[field]).trim();

      if (hasPrefix(title)) continue;

      item[field] = title ? `${time}丨${title}` : time;
    }
  } catch {
    // skip
  }
}

if (Array.isArray(obj?.data)) {
  for (const item of obj.data) {
    processItem(item);
  }
}

$done({ body: JSON.stringify(obj) });
