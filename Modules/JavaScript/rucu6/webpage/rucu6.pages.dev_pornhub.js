// 2026-07-12 10:50

const url = $request.url;
const isHtml = /<!DOCTYPE\x20html>/i.test($response.body);

if (isHtml) {
  let body = $response.body;
  if (/^https:\/\/cn\.pornhub\.com\//.test(url)) {
    // 第一层：HTML 源码正则替换（从物理层面抹除）
    // 1. 拦截插屏广告跳转 (interstitial)
    body = body.replace(
      /window\.location\.href\s*=\s*['"]\/interstitial[^'"]*['"]/gi,
      "console.log('Blocked interstitial redirect')"
    );

    // 2. 移除原生广告 (优化：正则 trafficjunky 已包含 popsByTrafficJunky)
    body = body.replace(/<ins[^>]*trafficjunky[^>]*>[\s\S]*?<\/ins>/gi, "");

    // 第二层：CSS 隐藏层（处理残留的视觉元素）
    const adSelectors = [
      // 合并重叠项后的广告选择器
      "[class*='cookieBanner' i]",
      "[class*='adContainer' i]",
      "[class*='adWrapper' i]",
      "[class*='RemoveCTA' i]",
      ".adsRemoveButtonWrapper",
      ".bottomNav",
      ".bottomNotification",
      ".mg_ad_native",
      ".premiumPromoBanner",
      ".video-wrapper-ad",
      "div[class*='ad-']",
      "div[id*='ad-']",
      "div[class*='watchpageAd']",
      "[class*='trafficjunky' i]",
      // 屏蔽 "短片" (Shorties) 栏目及相关入口
      "a[href*='/shorties']",
      "[class*='shorties' i]",
      "[id*='shorties' i]",
      // 屏蔽 "Join Now" 及相关按钮
      ".joinBtn",
      ".joinNowCPPBtn",
      ".fanClubButtons",
      // 屏蔽特定 URL 特征的节点
      "a[href*='_xa/ads']",
      "a[href*='interstitial']"
    ];

    // 优化：仅保留核心隐藏属性，去除宽高/边距等无效冗余声明
    const cssInjection = `
      <style>
        ${adSelectors.join(", ")} {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      </style>
    `;

    // 第三层：JS 动态拦截层（扼杀网络请求与弹窗）
    const jsInjection = `
      <script>
        (function() {
          // 1. 屏蔽 TEXTLINKS 等全局广告变量
          Object.defineProperty(window, 'TEXTLINKS', {
            get: () => [], set: () => {}, configurable: false
          });

          // 2. 违禁词列表及检测公用函数提取 (减少冗余逻辑)
          const adKeywords = ['trafficjunky', '_xa/ads', 'interstitial'];
          const isAdUrl = (target) => typeof target === 'string' && adKeywords.some(k => target.includes(k));

          // 3. 拦截 XMLHttpRequest (Ajax) 请求
          const originalXhrOpen = XMLHttpRequest.prototype.open;
          const originalXhrSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function(method, url) {
            this._isAd = isAdUrl(url);
            return originalXhrOpen.apply(this, arguments);
          };
          XMLHttpRequest.prototype.send = function() {
            if (this._isAd) {
              console.log('XHR Ad Blocked');
              originalXhrSend.apply(this, arguments);
              this.abort();
              return;
            }
            return originalXhrSend.apply(this, arguments);
          };

          // 4. 拦截 Fetch API 请求 (优化：增强对 Request 对象的兼容性解析)
          const originalFetch = window.fetch;
          window.fetch = function(req) {
            const targetUrl = typeof req === 'string' ? req : (req?.url || '');
            if (isAdUrl(targetUrl)) {
              console.log('Fetch Ad Blocked:', targetUrl);
              return Promise.resolve(new Response('{}', { status: 200, statusText: 'OK' }));
            }
            return originalFetch.apply(window, arguments);
          };

          // 5. 拦截所有新窗口弹窗 (window.open 防御 popunder)
          const originalWindowOpen = window.open;
          window.open = function(url) {
            if (isAdUrl(url)) {
              console.log('Popup Blocked:', url);
              return { closed: true, focus: ()=>{}, blur: ()=>{}, close: ()=>{}, postMessage: ()=>{} };
            }
            return originalWindowOpen.apply(window, arguments);
          };

          // 6. DOM 加载完成后清扫遗漏节点
          document.addEventListener('DOMContentLoaded', function() {
            // 优化：逗号拼接合并为单次 querySelectorAll 检索，降低引擎开销
            const selectors = '.joinBtn, .joinNowCPPBtn, .fanClubButtons, a[href*="/shorties"], [class*="shorties" i], [id*="shorties" i]';
            document.querySelectorAll(selectors).forEach(node => node.remove());
          });
        })();
      </script>
    `;

    // 注入逻辑：将代码注入到 <head> 标签之后
    if (body.includes("<head")) {
      body = body.replace(/(<head[^>]*>)/i, "$1\n" + cssInjection + jsInjection);
    }
  }
  $done({ body });
} else {
  $done({});
}
