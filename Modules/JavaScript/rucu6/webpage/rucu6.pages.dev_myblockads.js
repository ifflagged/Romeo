// 2026-08-16 17:10
// 网页元素 # === id, . === class, .div > p:has(> a[target="_blank"])

const url = $request.url;
const isHtml = /^\s*<!DOCTYPE html>/i.test($response.body);

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
  } else if (/^https:\/\/www\.xn--wcv59z\.com\//.test(url)) {
    let injectCode = `<title>Loading...</title>
<style>#bads{display:none!important;opacity:0!important;}</style>
<script>localStorage.setItem("bads", Date.now());</script>`;
    body = body.replace(/<title>Loading...<\/title>/i, injectCode);
  } else if (/^https:\/\/(?:yhg007\.com|[a-z]{8}\.111107\d\.xyz)\/search-[^/]+\.html$/.test(url)) {
    // 移花宫：底部透明广告

    // 1. 破坏隐形点击层脚本特征：
    // 将生成的隐形方块图层从顶层 (z-index:10) 丢到底层，并彻底禁用其鼠标/触摸事件
    body = body.replace(/z-index:10;/g, "z-index:-9999;pointer-events:none;");
    body = body.replace(/opacity:0.01;/g, "opacity:0;pointer-events:none;");

    // 2. 精准清空广告脚本逻辑：
    // 只清空带 `data-zsky-ad-code` 标记的脚本内容，但保留 <script> 标签本身以防检测
    body = body.replace(/(<script[^>]*data-zsky-ad-code[^>]*>)([\s\S]*?)(<\/script>)/gi, "$1/* ad blocked */$3");

    // 3. 注入安全 CSS 补丁：
    // 在表层视觉上隐藏广告容器，但强行保留 1px 的高度，用来骗过“反广告屏蔽”的高度检测
    const safeCss = `
      <style>
        /* 处理原生广告容器 */
        .zsky-custom-ad-code {
          opacity: 0 !important;
          height: 1px !important;
          min-height: 1px !important;
          margin: 0 !important;
          padding: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
        }
        /* 双保险：屏蔽任何漏网的动态生成劫持块 */
        div[style*="position:fixed"][style*="opacity"],
        [class^="idpmi"] {
          display: none !important;
          pointer-events: none !important;
          z-index: -9999 !important;
        }
      </style>
    </head>`;

    // 将 CSS 注入到网页 <head> 的末尾
    body = body.replace("</head>", safeCss);

    /* 
    // 1. 移除生成固定定位透明广告区域的脚本（特征：包含 oeexaywx_b 与 position:fixed）
    body = body.replace(/<script>if\(\!\/\^Mac\|Win\/\.test\(navigator\.platform\)\)\{[\s\S]*?<\/script>/g, "");
    // 2. 移除混淆的大型广告脚本（特征：以 !function(){function a(a){var b={ 开头）
    body = body.replace(/<script>!function\(\)\{function a\(a\)\{var b=\{[\s\S]*?<\/script>/g, "");
    // 3. 可选：移除任何包含可疑广告域或关键字的脚本（进一步净化）
    body = body.replace(/<script[\s\S]*?(otwaahn\.com|3791kc|oeexaywx_b)[\s\S]*?<\/script>/gi, "");
    */
  } else if (/^https:\/\/(?:yhg007\.com|[a-z]{8}\.111107\d\.xyz)\/hash\/(?:[a-fA-F0-9]{40}|[A-Z2-7]{32})\.html$/.test(url)) {
    // 移花宫：搜索结果页面

    // 1. 提取网页中的 data-hash 属性并生成完整的磁力链接[span_3](start_span)[span_3](end_span)
    let hashMatch = body.match(/id="magnetLink"[^>]*data-hash="([^"]+)"/i);
    if (hashMatch && hashMatch[1]) {
      let magnetLink = `magnet:?xt=urn:btih:${hashMatch[1]}`;
      // 将原本的提示文字“点击按钮后显示并复制磁力链接”直接替换为磁力链接[span_4](start_span)[span_4](end_span)
      body = body.replace(/>点击按钮后显示并复制磁力链接</g, `>${magnetLink}<`);
    }

    // 2. 注入 CSS 隐藏指定的中间区域[span_5](start_span)[span_5](end_span)
    // 通过 display: none !important 彻底隐藏“移花宫引路人”和“推荐应用”等区块[span_6](start_span)[span_6](end_span)
    let cssInject = `
      <style>
        .zsky-publish-links-mini,
        .zsky-app-ads-mini {
          display: none !important;
        }
      </style>
    </head>`;
    body = body.replace(/<\/head>/i, cssInject);

    /* 
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
    */
  }

  $done({ body });
} else {
  $done({});
}
