// 2024-12-14 10:45
// 网页元素 `#` === `id`, `.` === `class`, .div > p:has(> a[target="_blank"])

const url = $request.url;
const isHtml = /<!DOCTYPE\x20html>/i.test($response.body) !== false;
let body = $response.body;

if (isHtml) {
  if (/^https:\/\/(?:18hlw\.com|8olbt\.imsatcmn\.cc)\//.test(url)) {
    // 黑料网 addbox底部常驻按钮 application-popup广告弹窗 footer页脚信息 gotoclick信息流广告 infomation首页底部推广 list-sec底部推广栏目 relation大家都在搜
    body = body.replace(
      /<\/head>/,
      `<style> #copy-img, #copy-success, #notice_container, .addbox, .application-popup, .article-tags, .editormd-preview blockquote, .editormd-preview p a, .footer, .gotoclick, .infomation, .list-sec, .relation, .client-only-placeholder > p:has(> img[alt="710X240"]), .client-only-placeholder > p:has(> img[alt="710X240"]) + p, .client-only-placeholder > p:has(> img[alt="812X400"]) { display: none !important; } </style> \n </head>`
    );
  } else if (/^https:\/\/javdb\.com\//.test(url)) {
    // JavDB 去除顶部域名, 底部下载提醒, 播放页广告
    body = body.replace(
      /<\/head>/,
      `<style> .sub-header, .app-desktop-banner, .moj-content { display: none !important; } </style> \n </head>`
    );
  }
  $done({ body });
} else {
  $done({});
}
