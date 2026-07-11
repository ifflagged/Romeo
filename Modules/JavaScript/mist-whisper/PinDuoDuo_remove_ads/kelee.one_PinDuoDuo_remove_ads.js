/*
https://t.me/ibilibili
2026-07-11 18:09:55
*/

let body = $response.body || '';

function removeElementByFixedText(html, fixedText) {
  const hitIndex = html.indexOf(fixedText);
  if (hitIndex === -1) return html;

  const start = html.lastIndexOf('<div', hitIndex);
  if (start === -1) return html;

  const end = html.indexOf('</div>', hitIndex);
  if (end === -1) return html;

  return html.slice(0, start) + html.slice(end + '</div>'.length);
}

function removeScriptByFixedId(html, fixedId) {
  const hitIndex = html.indexOf(fixedId);
  if (hitIndex === -1) return html;

  const start = html.lastIndexOf('<script', hitIndex);
  if (start === -1) return html;

  const end = html.indexOf('</script>', hitIndex);
  if (end === -1) return html;

  return html.slice(0, start) + html.slice(end + '</script>'.length);
}

// 删除 class 包含固定前缀 index_gif-container 的整个 div
body = removeElementByFixedText(body, 'index_gif-container');

// 删除 id="__NEXT_DATA__" 的整个 script
body = removeScriptByFixedId(body, 'id="__NEXT_DATA__"');

$done({ body });