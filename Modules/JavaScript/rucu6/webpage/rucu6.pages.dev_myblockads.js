// 2026-07-12 10:50
// 网页元素 # === id, . === class, .div > p:has(> a[target="_blank"])

const url = $request.url;
const isHtml = /<!DOCTYPE\x20html>/i.test($response.body);

if (isHtml) {
  let body = $response.body;
  if (/^https:\/\/(?:18hlw\.com|8olbt\.imsatcmn\.cc)\//.test(url)) {
    // 黑料网：addbox底部常驻按钮 application-popup广告弹窗 footer页脚信息 gotoclick信息流广告 infomation首页底部推广 list-sec底部推广栏目 relation大家都在搜
    const cssBlock = `
      <style>
        #copy-img,
        #copy-success,
        #notice_container,
        .addbox,
        .application-popup,
        .article-tags,
        .client-only-placeholder > p:has(> img[alt="710X240"]),
        .client-only-placeholder > p:has(> img[alt="710X240"]) + p,
        .client-only-placeholder > p:has(> img[alt="812X400"]),
        .editormd-preview blockquote,
        .editormd-preview p a,
        .footer,
        .gotoclick,
        .infomation,
        .list-sec,
        .relation { 
          display: none !important; 
        } 
      </style>
    </head>`;
    body = body.replace(/<\/head>/, cssBlock);
  } else if (/^https:\/\/javdb\.com\//.test(url)) {
    // JavDB：去除顶部域名, 底部下载提醒, 播放页广告
    const cssBlock = `
      <style>
        .app-desktop-banner, 
        .moj-content,
        .sub-header { 
          display: none !important; 
        } 
      </style>
    </head>`;
    body = body.replace(/<\/head>/, cssBlock);
  } else if (/^https:\/\/[a-z]{8}\.111107\d\.xyz\/search/.test(url)) {
    // 移花宫：底部透明广告
    // 1. 移除生成固定定位透明广告区域的脚本（特征：包含 oeexaywx_b 与 position:fixed）
    body = body.replace(/<script>if\(\!\/\^Mac\|Win\/\.test\(navigator\.platform\)\)\{[\s\S]*?<\/script>/g, "");

    // 2. 移除混淆的大型广告脚本（特征：以 !function(){function a(a){var b={ 开头）
    body = body.replace(/<script>!function\(\)\{function a\(a\)\{var b=\{[\s\S]*?<\/script>/g, "");

    // 3. 可选：移除任何包含可疑广告域或关键字的脚本（进一步净化）
    body = body.replace(/<script[\s\S]*?(otwaahn\.com|3791kc|oeexaywx_b)[\s\S]*?<\/script>/gi, "");
  } else if (/^https:\/\/[a-z]{8}\.111107\d\.xyz\/hash\/(?:[a-fA-F0-9]{40}|[A-Z2-7]{32})\.html$/.test(url)) {
    // 要定位的文本
    const targetText = "下载BT种子文件";
    const pos = body.indexOf(targetText);

    if (pos !== -1) {
      // 向前找到包含该文本的 <div class="tbox"> 开始标签
      const tboxStart = body.lastIndexOf('<div class="tbox">', pos);

      if (tboxStart !== -1) {
        // 截取该 tbox 之前的所有内容
        let newBody = body.substring(0, tboxStart);

        // 原始页面以 <div class="wrapper"> 开头，需要补上闭合标签
        newBody += "</div></body></html>";

        // 将修改后的内容赋给 body 变量
        body = newBody;
      }
    }
  }

  $done({ body });
} else {
  $done({});
}
