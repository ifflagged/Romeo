// 2026-07-12 12:25

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

    // 第三层至第五层：JS 核心逻辑
    const jsInjection = `
      <script>
        (function() {
          // ==========================================
          // 第三层：JS 动态拦截层（扼杀网络请求与弹窗）
          // ==========================================
          
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
              console.log('XHR Ad Blocked safely');
              // 发起请求后瞬间掐断，完美避免抛出底层异常导致主线程卡死
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
              // 伪造一个正常的空返回，防止网页因报错而卡死
              return Promise.resolve(new Response('{}', { status: 200, statusText: 'OK' }));
            }
            // 修复 Illegal invocation：绑定 window 作用域，防止视频流框架崩溃
            return originalFetch.apply(window, arguments);
          };

          // 5. 拦截所有新窗口弹窗 (window.open 防御 popunder)
          const originalWindowOpen = window.open;
          window.open = function(url) {
            if (isAdUrl(url)) {
              console.log('Popup Blocked Safely:', url);
              // 返回伪造的 window 对象，防止对方脚本因 null 报错而崩溃
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

          // ==========================================
          // 第四层：滚动条位置强制保护 (防刷新丢失进度)
          // ==========================================
          
          // 1. 冻结底层 API：禁止网页将滚动恢复设置为手动 (manual)
          if ('scrollRestoration' in history) {
            try {
              Object.defineProperty(history, 'scrollRestoration', {
                value: 'auto',
                writable: false,
                configurable: false
              });
            } catch (e) {}
          }

          // 2. 建立滚动条位置备份机制 (防抖记录，避免性能损耗)
          let scrollTimeout;
          window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              // 根据当前页面路径独立保存滚动高度
              sessionStorage.setItem('saved_scroll_pos_' + location.pathname, window.scrollY);
            }, 150); 
          }, { passive: true });

          // 3. 页面重新展示时强制跳回历史位置
          window.addEventListener('pageshow', (event) => {
            const savedPos = sessionStorage.getItem('saved_scroll_pos_' + location.pathname);
            if (savedPos && parseInt(savedPos) > 0) {
              // 设定 500ms 延迟，确保动态 Feed 流的数据已经渲染完毕撑起页面高度
              setTimeout(() => {
                window.scrollTo({
                  top: parseInt(savedPos),
                  behavior: 'instant' // 瞬间跳回，不显示平滑滚动动画
                });
              }, 500);
            }
          });

          // ==========================================
          // 第五层：信息流状态物理隔离（彻底解决内容刷新）
          // ==========================================
          
          // 在捕获阶段拦截用户的点击事件，确保在网站框架路由生效前执行
          document.addEventListener('click', function(event) {
            // 向上寻找最近的 <a> 链接标签
            const link = event.target.closest('a');
            
            // 匹配视频播放页的特征 (URL 中包含 viewkey=)
            if (link && link.href && link.href.includes('viewkey=')) {
              // 强制赋予新标签页打开属性，主信息流页面不再跳转卸载
              link.setAttribute('target', '_blank');
            }
          }, true); 
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
