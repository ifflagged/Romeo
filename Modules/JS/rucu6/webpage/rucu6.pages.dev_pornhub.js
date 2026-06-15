// 2026-06-15 16:50

let body = $response.body;

// 1. CSS 隐藏层：屏蔽 banner 和已知的广告容器
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
  "ins.adsbytrafficjunky"
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
</style>`;

// 2. JS 拦截层：深度劫持跳转逻辑
const jsInjection = `
<script>
    (function() {
        // 1. 变量屏蔽：在网页读取 TEXTLINKS 之前，将其锁定为 null 或空数组
        Object.defineProperty(window, 'TEXTLINKS', {
            get: function() { return []; },
            set: function(val) { /* 忽略设置操作，使其无法被赋值 */ },
            configurable: false
        });
    })();
</script>`;

// 3. 插入逻辑：将代码注入到 <head> 标签之后
if (body && body.includes("<head")) {
  body = body.replace(/(<head[^>]*>)/i, "$1" + cssInjection + jsInjection);
}

$done({ body });
