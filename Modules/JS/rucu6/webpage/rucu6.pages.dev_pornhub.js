// 2026-06-22 18:15

const url = $request.url;
const isHtml = /<!DOCTYPE\x20html>/i.test($response.body) !== false;
let body = $response.body;

if (isHtml) {
  if (/^https:\/\/cn\.pornhub\.com\//.test(url)) {
    // 第一层：HTML 源码正则替换（从物理层面抹除）
    // 1. 拦截插屏广告跳转 (interstitial)
    body = body.replace(
      /window\.location\.href\s*=\s*['"]\/interstitial[^'"]*['"]/gi,
      "console.log('Blocked interstitial redirect')"
    );

    // 2. 直接移除 TrafficJunky 的原生广告节点 (<ins> 标签)
    body = body.replace(/<ins[^>]*trafficjunky[^>]*>[\s\S]*?<\/ins>/gi, "");
    body = body.replace(/<ins[^>]*popsByTrafficJunky[^>]*>[\s\S]*?<\/ins>/gi, "");

    // 第二层：CSS 隐藏层（处理残留的视觉元素）
    const adSelectors = [
      "#cookieBanner",
      ".ad-box",
      ".ad-item",
      ".ad-placeholder",
      ".adContainer",
      ".adWrapper",
      ".ad_wrapper",
      ".ads-container",
      ".adsRemoveButtonWrapper",
      ".adsbytrafficjunky",
      ".bottomNav",
      ".bottomNotification",
      ".cookieBannerV1",
      ".globalCookieBanner",
      ".mg_ad_native",
      ".middleAdContainer",
      ".middleRemoveCTA",
      ".premiumPromoBanner",
      ".topRemoveCTA",
      ".video-wrapper-ad",
      "div[class*='ad-']",
      "div[class*='watchpageAd']",
      "div[id*='ad-']",
      "ins.adsbytrafficjunky",
      // 屏蔽 "Join Now" 及相关按钮
      ".joinBtn",
      ".joinNowCPPBtn",
      ".fanClubButtons",
      // 屏蔽特定 URL 特征的节点
      "a[href*='trafficjunky']",
      "a[href*='_xa/ads']",
      "a[href*='interstitial']",
      "iframe[src*='trafficjunky']"
    ];

    const cssInjection = `
      <style>
        ${adSelectors.join(", ")} {
          border: none !important;
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          min-height: 0 !important;
          opacity: 0 !important;
          overflow: hidden !important;
          padding: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          visibility: hidden !important;
          width: 0 !important;
        }
      </style>
    `;

    // 第三层：JS 动态拦截层（扼杀网络请求与弹窗）
    const jsInjection = `
      <script>
        (function() {
          // 1. 屏蔽 TEXTLINKS 等全局广告变量
          Object.defineProperty(window, 'TEXTLINKS', {
            get: function() { return []; },
            set: function(val) { },
            configurable: false
          });

          // 2. 定义违禁词列表
          const adKeywords = ['trafficjunky', '_xa/ads', 'interstitial'];

          // 3. 拦截 XMLHttpRequest (Ajax) 请求
          const originalXhrOpen = XMLHttpRequest.prototype.open;
          const originalXhrSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function(method, url) {
            this._isAd = typeof url === 'string' && adKeywords.some(keyword => url.includes(keyword));
            return originalXhrOpen.apply(this, arguments);
          };
          XMLHttpRequest.prototype.send = function() {
            if (this._isAd) {
              console.log('XHR Ad Blocked safely');
              // 发起请求后瞬间掐断，完美避免抛出底层异常导致主线程卡死
              originalXhrSend.apply(this, arguments);
              this.abort();
              return;
            }
            return originalXhrSend.apply(this, arguments);
          };

          // 4. 拦截 Fetch API 请求
          const originalFetch = window.fetch;
          window.fetch = function() {
            let url = arguments[0];
            if (typeof url === 'string' && adKeywords.some(keyword => url.includes(keyword))) {
              console.log('Fetch Ad Blocked:', url);
              // 伪造一个正常的空返回，防止网页因报错而卡死
              return Promise.resolve(new Response('{}', { status: 200, statusText: 'OK' }));
            }
            // 修复 Illegal invocation：绑定 window 作用域，防止视频流框架崩溃
            return originalFetch.apply(window, arguments);
          };

          // 5. 拦截所有新窗口弹窗 (window.open 防御 popunder)
          const originalWindowOpen = window.open;
          window.open = function(url, target, features) {
            if (typeof url === 'string' && adKeywords.some(keyword => url.includes(keyword))) {
              console.log('Popup Blocked:', url);
              return null;
            }
            return originalWindowOpen.apply(window, arguments);
          };

          // 6. DOM 加载完成后清扫遗漏节点
          document.addEventListener('DOMContentLoaded', function() {
            const joinButtons = document.querySelectorAll('.joinBtn, .joinNowCPPBtn, .fanClubButtons');
            joinButtons.forEach(btn => btn.remove());
          });
        })();
      </script>
    `;

    // 注入逻辑：将代码注入到 <head> 标签之后
    if (body && body.includes("<head")) {
      body = body.replace(/(<head[^>]*>)/i, "$1\n" + cssInjection + jsInjection);
    }
  }
  $done({ body });
} else {
  $done({});
}
