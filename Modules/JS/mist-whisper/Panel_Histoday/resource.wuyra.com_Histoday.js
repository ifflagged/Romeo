/*
 * 原作者：@deezertidal
 * 修改：@wish
 * 更新时间：2025.06.04
 * 功能：展示“历史上的今天”若干事件
 */

// 参数解析函数
function getParams(rawArg) {
  const params = {};
  if (!rawArg || typeof rawArg !== 'string') return params;

  rawArg.split('&').forEach(item => {
    if (!item) return;
    const [rawKey, rawVal] = item.split('=');
    const key = rawKey ? rawKey.trim() : '';
    const val = rawVal !== undefined ? decodeURIComponent(rawVal.trim()) : '';
    if (!key) return;
    params[key] = val;
  });

  return params;
}

// 获取整数参数（带范围校验）
function getIntParam(params, key, defaultVal, min, max) {
  if (!params.hasOwnProperty(key)) return defaultVal;
  const parsed = parseInt(params[key], 10);
  if (isNaN(parsed)) return defaultVal;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

// 主执行函数
(function main() {
  const rawArg = typeof $argument !== 'undefined' ? $argument : '';
  const params = getParams(rawArg);
  const icon = params.icon || '📅';
  const iconColor = params.color || '#FF4500';
  const count = getIntParam(params, 'count', 5, 1, 20);

  const url = "https://lishishangdejintian.bmcx.com/";

  $httpClient.get(url, (error, response, data) => {
    if (error || !response || response.status !== 200 || !data || typeof data !== 'string') {
      console.log("请求失败或数据不合法");
      $done({});
      return;
    }

    const sanitizedData = data.replace(/&nbsp;/g, ' ');
    handleResponse(sanitizedData, { icon, iconColor, count });
  });
})();

// 响应处理函数
function handleResponse(html, options) {
  const { icon, iconColor, count } = options;
  const events = [];
  let monthDay = null;

  try {
    const regex = /(\d{4}年)(\d{1,2}月\d{1,2}日)\s*<a\s+href='\/\d+__lishishangdejintianchaxun\/'\s+target='_blank'>(.*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const yearText = match[1].trim();
      const dateText = match[2].trim();
      const description = match[3].trim();

      if (monthDay === null) monthDay = dateText;

      if (!/^\d{4}年$/.test(yearText) || !/^\d{1,2}月\d{1,2}日$/.test(dateText)) continue;

      events.push(`${yearText}：${description}`);
      if (events.length >= count) break;
    }
  } catch (e) {
    console.log('解析 HTML 时发生异常：', e);
    $done({});
    return;
  }

  if (events.length === 0 || !monthDay) {
    $done({});
    return;
  }

  const notificationText = events.join("\n").trim();
  const body = {
    title: `📓 历史上的今天 · ${monthDay}`,
    content: notificationText,
    icon: icon,
    "icon-color": iconColor,
    count: events.length
  };

  $done(body);
}