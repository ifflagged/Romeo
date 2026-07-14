// 2026-07-14 11:10

const url = $request.url;
const isHtml = /<!DOCTYPE\x20html>/i.test($response.body);

if (isHtml) {
  let body = $response.body;
  if (/^https:\/\/cn\.pornhub\.com\//.test(url)) {
    // 第一层：HTML 源码正则替换
    // 1. 拦截插屏广告跳转
    body = body.replace(
      /window\.location\.href\s*=\s*['"]\/interstitial[^'"]*['"]/gi,
      "console.log('Blocked interstitial redirect')"
    );

    // 2. 移除原生广告
    body = body.replace(/<ins[^>]*trafficjunky[^>]*>[\s\S]*?<\/ins>/gi, "");

    // 第二层：CSS 隐藏层
    const adSelectors = [
      // 合并重叠项后的广告选择器
      "[class*='cookieBanner' i]",
      "[class*='adContainer' i]",
      "[class*='adWrapper' i]",
      "[class*='RemoveCTA' i]",
      ".adsRemoveButtonWrapper",
      "a[data-event*='header_paid_tabs']", // 非常重要
      ".bottomNotification",
      ".mg_ad_native",
      ".premiumPromoBanner",
      ".video-wrapper-ad",
      ".watchpageAd",
      "[class*='trafficjunky' i]",
      // 屏蔽 "短片" (Shorties) 栏目及相关入口
      "a[href*='/shorties']",
      "[class*='shorties' i]",
      "[id*='shorties' i]",
      // 屏蔽 "Join Now" 按钮
      "a[data-label='join_now']",
      // 屏蔽特定 URL 特征的节点
      "a[href*='_xa/ads']",
      "a[href*='interstitial']",
      // 屏蔽年龄验证弹窗及透明遮罩
      "#age-verification-wrapper",
      "#age-verification-container",
      "#front-page-disclaimer",
      ".age-verification",
      ".mg_modal",
      ".mg_overlay",
      "[class*='overlay' i]",
      "[id*='overlay' i]",
      "[class*='backdrop' i]",
      "[id*='backdrop' i]",
      "[class*='disclaimer' i]",
      "[id*='disclaimer' i]",
      "[class*='mask' i]", 
      "[id*='mask' i]",
      "dialog::backdrop",
      // 屏蔽视频缩略图上的局部年龄警告图层和锁定标记
      "[class*='age-warning' i]",
      "[class*='restricted' i]",
      // 屏蔽网页顶部及视频信息中的话题标签/分类标签 (精确提取内部胶囊，去除外层包裹器防误伤)
      ".videoCtaPill.videoCtaMixed",
      "a[data-event='video_underplayer'][data-label='tag']",
      "a[data-event='video_underplayer'][data-label='category']",
      "a.isTag"
    ];

    // 仅保留核心隐藏属性，移除会破坏网页排版的极端的 position/height 属性，仅保留滚动与点击穿透
    const cssInjection = `
      <style>
        ${adSelectors.join(", ")} {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -9999 !important;
        }
        body, html {
          overflow: auto !important;
          pointer-events: auto !important; 
        }
        /* 强制移除每个视频预览图上的模糊滤镜与变暗效果，恢复彻底清晰 */
        img, video, [class*='phimage' i], [class*='thumb' i], [class*='blur' i] {
          filter: none !important;
          -webkit-filter: none !important;
          opacity: 1 !important;
        }
        /* 确保视频缩略图本身及内部链接绝对可以点击，穿透隐形劫持 */
        [class*='phimage' i], [class*='phimage' i] a, [class*='thumb' i] a {
          pointer-events: auto !important;
        }
      </style>
    `;

    // 第三层至第五层：JS 核心逻辑
    const jsInjection = `
      <script>
        (function() {
          // ==========================================
          // 第三层：JS 动态拦截层
          // ==========================================
          
          // 自动写入年龄验证相关的 Cookie
          document.cookie = "age_verified=1; path=/; domain=.pornhub.com; max-age=31536000";
          document.cookie = "accessAgeDisclaimerPH=1; path=/; domain=.pornhub.com; max-age=31536000";
          document.cookie = "accessPH=1; path=/; domain=.pornhub.com; max-age=31536000";
          
          // 强行写入 localStorage 凭证，防止 JS 二次校验
          try {
            const keys = ["age_verified", "accessAgeDisclaimerPH", "accessPH"];
            keys.forEach(key => localStorage.setItem(key, "1"));
          } catch(e) {}

          // 1. 屏蔽 TEXTLINKS 等全局广告变量
          Object.defineProperty(window, 'TEXTLINKS', {
            get: () => [], set: () => {}, configurable: false
          });

          // 2. 违禁词列表及检测公用函数提取
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
              this.abort();
              return;
            }
            return originalXhrSend.apply(this, arguments);
          };

          // 4. 拦截 Fetch API 请求
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
            return originalWindowOpen.apply(this, arguments);
          };

          // 6. 动态清理防御机制
          document.addEventListener('DOMContentLoaded', function() {
            // 安全剥离 body/html 上的弹窗锁定状态 (隐藏节点的职责已完全交由最高效的第二层 CSS 处理)
            if (document.body) {
              document.body.classList.remove('modal-open', 'age-verification-active', 'lock-scroll');
            }
            if (document.documentElement) {
              document.documentElement.classList.remove('modal-open', 'lock-scroll');
            }
          });

          // ==========================================
          // 第四层：滚动条位置强制保护 (防刷新丢失进度)
          // ==========================================
          
          const isDetailPage = () => location.href.includes('viewkey=');

          if (!isDetailPage()) {
            // 1. 冻结底层 API：禁止网页将滚动恢复设置为手动
            if ('scrollRestoration' in history) {
              try {
                history.scrollRestoration = 'auto';
              } catch (e) {}
            }
            // 2. 建立滚动条位置备份机制 (防抖记录，避免性能损耗)
            let scrollTimeout;
            window.addEventListener('scroll', () => {
              clearTimeout(scrollTimeout);
              scrollTimeout = setTimeout(() => {
                sessionStorage.setItem('saved_scroll_pos_list', window.scrollY);
              }, 150); 
            }, { passive: true });

            // 3. 页面重新展示时强制跳回历史位置
            window.addEventListener('pageshow', (event) => {
              const savedPos = sessionStorage.getItem('saved_scroll_pos_list');
              if (savedPos && parseInt(savedPos) > 0) {
                requestAnimationFrame(() => {
                  window.scrollTo({
                    top: parseInt(savedPos),
                    behavior: 'instant'
                  });
                });
              }
            });
          } else {
            // 详情页禁用强制恢复，防止干扰
            if ('scrollRestoration' in history) {
              history.scrollRestoration = 'manual';
            }
          }

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
