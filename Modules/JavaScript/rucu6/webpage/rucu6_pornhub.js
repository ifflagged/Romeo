// 2026-10-30 13:02
// Pornhub 去推广/广告 + 去年龄门（Loon http-response 脚本，独立版）
// 2026-10-30 按 home.html（首页）+ play.html（播放页）两份实测结构编写
// 注意：广告容器的类名前缀会轮换（首页 rdisc5*、播放页 yv3wl*），不能认前缀——2e~2h 全部按结构（ins.adsbytrafficjunky 为首子元素）删
// 做法与 myblockads 一致：正则删节点 + 掐掉触发脚本，不靠 CSS 硬压（站点内联样式特异性会压过 display:none）
// 不写 accessAgeDisclaimerPH cookie——那等于替站点记下「已确认」，本脚本只是不让弹窗和模糊出现

const url = $request.url;
const isHtml = /^\s*<!DOCTYPE html>/i.test($response.body);
// 整页广告插页 /interstitial?viewkey=X：本身就是广告落地页，不做任何处理、直接换成跳回该视频页的响应（与 2q 配套）
const interMatch = url.match(/^https:\/\/cn\.pornhub\.com\/interstitial\?[^#]*\bviewkey=([A-Za-z0-9]+)/i);
const interTarget = interMatch ? "https://cn.pornhub.com/view_video.php?viewkey=" + interMatch[1] : "";

if (interTarget) {
  $done({
    body:
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta http-equiv="refresh" content="0;url=' + interTarget + '">' +
      "<script>location.replace(" + JSON.stringify(interTarget) + ")</script>" +
      "</head><body></body></html>",
  });
} else if (isHtml && /^https:\/\/cn\.pornhub\.com\//i.test(url)) {
  let body = $response.body;

  // ============ 1. 年龄门 + 全页模糊 ============
  body = body
    // 1a. 删 <head> 里两段模糊样式：body.blurredAVModal{filter:blur(25px);opacity:.6}
    //     以及 #ageDisclaimerOverlay 的 backdrop-filter + .is-blurred 下图片/视频的 blur
    .replace(/<style>body\.blurredAVModal\{[^<]*?<\/style>/g, "")
    .replace(
      /<style>\s*#ageDisclaimerOverlay,#ageVerificationOverlay\{[\s\S]*?<\/style>/g,
      ""
    )
    // 1b. <body> 标签去掉 blurredAVModal / is-blurred 类（服务端下发的初始模糊）
    .replace(/<body\b[^>]*>/g, (tag) =>
      tag.replace(/\s*\bblurredAVModal\b/g, "").replace(/\s*\bis-blurred\b/g, "")
    )
    // 1c. 删年龄弹窗的遮罩层（空 div）与弹窗本体
    //     弹窗本体以其后紧跟的 avModalContent 数据脚本为锚：非贪婪到第一处「</div></div> + 该脚本」才是弹窗收尾，内部同类闭合不会误伤
    .replace(/<div id="ageDisclaimerOverlay"[^>]*><\/div>/g, "")
    .replace(
      /<div id="js-ageDisclaimerModal"[\s\S]*?<\/div>\s*<\/div>\s*(?=<script>\s*var avModalContent)/g,
      ""
    )
    // 1d. 掐掉弹窗的唯一调用点 initModal();（全页仅一处，函数定义是 initModal() { 不带分号、不会误伤）
    //     万一 1c 因上游改版没删干净，MG_Modal 也不会被打开；其余函数（addClogCookieBanner 等）被别处 onclick 引用，故整段脚本保留不动
    .replace(/\binitModal\(\);/, "/* initModal disabled */");

  // ============ 2. 推广 / 广告（首页 + 播放页） ============
  let navRemoved = false; // 2d 真删掉顶部付费标签行时置真，第 3 节据此给 #mobileContainer 补顶栏留位（见彼处注释）
  body = body
    // 2a. 掐 TrafficJunky 预加载脚本（var tjPreloadAds = JSON.parse(...) + TJ_ADS_TAKEOVER，负责批量拉 /_xa/ads_batch）
    .replace(/<script\b[^>]*>\s*var tjPreloadAds =[\s\S]*?<\/script>/g, "")
    // 2b. 掐 TrafficJunky 加载器脚本（同一段里同时拉 embeddedads 与 popunder 两个外部脚本）
    //     这是「点视频、播放页打开前先弹一个广告页」的源头：popunder.min.js 靠它注入，删它则全站（含播放页自身）不再武装弹窗
    .replace(/<script\b[^>]*>\s*var tjEmbeddedAdsDuration =[\s\S]*?<\/script>/g, "")
    // 2c. 删其余直引 trafficjunky 的外部脚本（如 media.trafficjunky.net 的 abp 探测）
    .replace(/<script\b[^>]*\bsrc="[^"]*trafficjunky[^"]*"[^>]*>\s*<\/script>/g, "")
    // 2d. 顶部付费标签行：<div class="bottomNav clearfix"> 内 4 个 gtm-event-header-paidtabs
    //     （LIVE CAMS / AI JERK OFF / 查看附近炮友 / 今晚想约炮吗，首页与播放页共用同一头部）——用回调确认含 paidtabs 才整行删，避免误伤同名导航
    //     注意：这行 div 自带 padding-top:60px，是给悬浮顶栏 #mobileHeader（position:absolute）留的位；整行删掉后正文会滑进顶栏底下，
    //     故删除时置 navRemoved 标记，第 3 节给 #mobileContainer 补回这 60px（2026-10-30 实测两处症状的共同根因）
    .replace(/<div class="bottomNav clearfix">[\s\S]*?<\/div>/g, (m) => {
      if (m.includes("gtm-event-header-paidtabs")) {
        navRemoved = true;
        return "";
      }
      return m;
    })
    // 2e. 广告整卡 <li>：li 的第一个子 div 的首个元素就是 ins.adsbytrafficjunky 的，整 li 删、不留空位
    //     覆盖两种形态：原生广告卡（首页 li.rdisc5 tjListItem、播放页相关列表 li.yv3wlaf.js-nativeTjMob，li>div>ins 后直接 </li>）
    //     与横幅卡（首页 data-block-position=19 的 li>div.rdisc5aa，ins 后还有 tjLinksWrapper/去广告按钮，收尾 </div></li>）
    //     非贪婪到第一处「</div> 后紧跟 </li>」即整卡收尾；正常视频 li 首子元素不是 ins，不会误伤
    .replace(
      /<li\b[^>]*>\s*<div\b[^>]*>\s*<ins\b[^>]*\badsbytrafficjunky\b[^>]*><\/ins>[\s\S]*?<\/div>\s*<\/li>/g,
      ""
    )
    // 2f. 只装一个 ins 的容器：div.rdisc5k（首页顶栏下大横幅 576x240，ins 后直接 </div>）
    //     必须排在 2g 前：若先跑 2g，它对这种单收尾容器会越过自身 </div> 继续吞到后面兄弟节点的第一处双收尾（首跑曾误吞 leftMenu 一截，被标签平衡测试抓出）
    .replace(/<div\b[^>]*>\s*<ins\b[^>]*\badsbytrafficjunky\b[^>]*><\/ins>\s*<\/div>/g, "")
    // 2g. 横幅容器 <div>：首子元素为 ins.adsbytrafficjunky 的 div 整块删
    //     覆盖：首页顶部/中部/底部 div.rdisc5aa、播放页顶部 div.yv3wlaa.watchpageAd（截图里播放器上方那块带 Ad 标与「去广告」的黑框）与底部 ad-tabSplit
    //     结构均为 div>(ins + tjLinksWrapper + adsRemoveButtonWrapper)，收尾是连续两个 </div>（内层按钮 div + 容器自身）
    .replace(
      /<div\b[^>]*>\s*<ins\b[^>]*\badsbytrafficjunky\b[^>]*><\/ins>[\s\S]*?<\/div>\s*<\/div>/g,
      ""
    )
    // 2h. 清掉 2f/2g 删空后留下的外层空壳（随机串包装层）：类名认「含数字的随机串 + ad/ab 结尾」、内容全空（或只有注释）才删
    //     类名长度也轮换、不能设上限：已见 yv3wlad(7)、gjd6ad(6)、rdisc5ab(8)、b3go6p8byuzkad(15)；壳被站点内联样式定高 154px，空着也占一整条
    //     「含数字」这条把 download/tab 这类无数字的正常单词类名排除在外，不会误伤
    .replace(
      /<div\b[^>]*\bclass="([a-z0-9]+a[bd])"[^>]*>(?:\s|<!--[\s\S]*?-->)*<\/div>/g,
      (m, cls) => (cls.length >= 6 && /\d/.test(cls) ? "" : m)
    )
    // 2p. 样式层兜底（2026-10-30 追加）：站点每页有一整块内联 <style> 专给轮换广告类名定尺寸（顶部位 height/min-height 154px 出自这里），
    //     整块的选择器全挂在广告类名下、不服务任何正文元素。DOM 删除与类名轮换赛跑偶尔漏网时，漏网的壳/容器就是靠这块样式撑出空白；
    //     故识别出这块（两个广告专属标记：含 .ad-link、且有「含数字、以 aa/ab/ad 结尾」的轮换类名选择器）后，把块内全部
    //     height/min-height/padding/margin 清零——不管哪种结构变体漏网，高度都塌成 0，刷新与否表现一致
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, open, css, close) => {
      if (!/\.ad-link\b/.test(css) || !/\.[a-z0-9]*\d[a-z0-9]*a[abd][\s.{,:]/.test(css)) return m;
      const zeroed = css
        .replace(/([;{]\s*(?:min-)?height\s*:\s*)\d+(?:\.\d+)?px/g, "$10px")
        .replace(/([;{]\s*(?:padding|margin)(?:-[a-z]+)?\s*:\s*)[^;}]+/g, "$10");
      return open + zeroed + close;
    })
    // 2i. 兜底：任何漏网的裸 <ins class='adsbytrafficjunky'> 占位本身删掉（class 有单/双引号两种写法）
    .replace(/<ins\b[^>]*\badsbytrafficjunky\b[^>]*>[\s\S]*?<\/ins>/g, "")
    // 2j. 去掉全部视频缩略图链接上的 popunder 触发类 js-popUnder / js-pop（首页 58 处、播放页相关列表 45 处）
    //     popunder 脚本就是靠这两个类给链接挂点击弹窗的；与 2b 双断：脚本不来、来了也没挂载点
    //     先删长的：js-pop 的 \b 在连字符后也成立，但 js-popUnder 中 pop 后是 U（单词字符）不会误匹配，顺序只是双保险
    //     2026-10-30 性能修正：旧写法 /\s*\b…\b/ 以 \s* 开头，全文每个位置都要试匹配+回溯，两遍共约 137ms（955KB 首页、桌面 CPU），
    //     占整脚本耗时一半还多（手机上更甚，冷启动白屏里有它一份）。改锚定写法：类名在 class 属性里必被引号/空格包围，
    //     只认「前界是引号或空格、后界是引号或空格」的出现，替换保留前界字符，耗时降到个位数 ms；与旧写法功能等价
    //     （js-pop 残留同为 0、四份样本仅 class 属性里多留个别空格、归一化后逐字节一致——class 匹配不认多余空格，无影响）
    .replace(/(["' ])js-popUnder(?=["' ])/g, "$1")
    .replace(/(["' ])js-pop(?=["' ]|$)/g, "$1")
    // 2k. 播放页播放器贴片广告（顺手断掉）：flashvars 里的 adRollGlobalConfig 置空数组
    //     站点自己的 appendScreenDimensionsToPreroll 对空数组有显式判空返回，属受支持状态
    //     2026-10-30 修正：旧写法以「其后紧跟的 "embedCode" 键」为终点锚——flashvars 键序随页面变化时，排在 adRoll 与 embedCode 之间的
    //     mediaDefinitions/defaultQuality 等键会被连带吞掉，实测播放器右上角清晰度选择与设置按钮因此消失。
    //     改结构限定：数组元素只允许「普通字符 / 一层 [] / 一层 {}」的组合，匹配范围严格止于数组自身的 ]，与键序无关；
    //     再加回调守卫（长度 <8000 且含广告拉取标记 _xa 才动手），不合条件原样保留——宁可漏删广告也不能伤播放器配置
    .replace(/"adRollGlobalConfig":\[(?:[^\[\]{}]|\[[^\]]*\]|\{[^{}]*\})*\]/g, (m) =>
      m.length < 8000 && m.includes("_xa") ? '"adRollGlobalConfig":[]' : m
    )
    //     adOutstreamGlobalConfig（outstream 视频广告）：只抽掉它的 json 拉取地址，对象其余字段原样保留
    //     同样改结构限定（对象内只允许普通字符与一层 []）+ 长度守卫，避免 "json" 不在本对象时跨对象误伤
    .replace(
      /("adOutstreamGlobalConfig":\{(?:[^{}]|\[[^\]]*\])*"json":")[^"]*(")/,
      (m, p1, p2) => (m.length < 3000 ? p1 + p2 : m)
    )
    // 2l. 播放页视频标签行（2026-10-30 用户追加）：播放器上方 div.abovePlayerButtons，内只有 33 个 div.videoCtaPill（标签/分类/明星药丸），无其他按钮
    //     用「药丸 div 重复组 + 收尾 </div>」的自限定式写法：只吃药丸、吃完即停；上游若往里塞了非药丸子元素则整条不匹配、交由兜底 CSS 隐藏，不会误吞
    .replace(
      /<div class="abovePlayerButtons clearfix ctasActionMenu">(?:\s|<div class="clearfix videoCtaPill[^"]*">[\s\S]*?<\/a>\s*<\/div>)*\s*<\/div>/g,
      ""
    )
    // 2m. 播放页顶部空白占位（2026-10-30 实测反馈）：2l 删掉标签行后，外层 div.abovePlayerButtonsWrapper 还留着（内只剩两个 blurredBackground 装饰 div，
    //     自身带内边距、仍在播放器上方占一整条高度）——整层一并删，同样用自限定写法：只吃装饰 div、吃完即停
    .replace(
      /<div class="abovePlayerButtonsWrapper ctasActionMenuWrap">(?:\s|<div class="blurredBackground[^"]*"><\/div>)*\s*<\/div>/g,
      ""
    )
    // 2n. 首页顶部残留（2026-10-30 实测反馈）：广告栈删掉后，「热门色情视频」标题 + 热门搜索药丸行（div.relatedSearchTermsWrapper > ul.trendingNowWrapper）
    //     被顶栏压住只露出下半截——与播放页标签同类（站点推的词条、非正文），整段删干净，页面直接从「为您推荐」开始
    //     2026-10-30 修正：旧写法以「第一处 </ul>」为终点锚——实测页面结构与样本有出入时（药丸行不是 ul 结构），会一路吞到后面无关的 </ul>，
    //     把中间的「为您推荐」标题头（recommended-carousel-header）连带误伤。改自限定写法（与 2l/2m 同法）：
    //     标题必须是「div > h1」形状才删；药丸段逐个吃 li.trendingNow（ul 内注释一并吃），吃完必须紧跟 </ul> + 装饰 div + 自身收尾才成立，
    //     结构对不上就整条不匹配、交兜底 CSS 隐藏；再加回调守卫（不含 recommended 且长度 <40000）双保险
    .replace(
      /<div class="sectionTitle trendingPillsTitle">\s*<h1[^>]*>[\s\S]*?<\/h1>\s*<\/div>/g,
      ""
    )
    .replace(
      /<div class="[^"]*relatedSearchTermsWrapper[^"]*">(?:\s|<div class="blurredBackground[^"]*"><\/div>)*<ul class="trendingNowWrapper[^"]*">(?:\s|<!--[\s\S]*?-->|<li class="trendingNow"[^>]*>[\s\S]*?<\/li>)*\s*<\/ul>(?:\s|<div class="blurredBackground[^"]*"><\/div>)*\s*<\/div>/g,
      (m) => (m.length < 40000 && !m.includes("recommended") ? "" : m)
    );

  // 2q. 删播放页的 interstitial 计数跳转脚本（2026-10-30 实测）：播放页内联脚本用 cookie 'views' 数观看次数，
  //     每攒满一轮（配置 counter=7、first_show=3）就有一次在页面加载时直接 location.href 跳到
  //     /interstitial?viewkey=<本视频>——整页广告插页，用户感知为「打开视频弹出广告」（攒满才触发，故偶发）。
  //     整段自包含（计数与跳转都在这一个 IIFE 里、辅助函数是局部变量），整段删；回调守卫确认含跳转行且长度 <6000 才动手。
  //     配套：万一仍落到插页本身（旧版脚本缓存等），入口处已把 /interstitial 的响应直接换成跳回视频页。
  body = body.replace(/<script>\s*var interstitial = JSON\.parse\('[^']*'\)[\s\S]*?<\/script>/g, (m) =>
    m.length < 6000 && m.includes("window.location.href = '/interstitial?viewkey=") ? "" : m
  );

  // ============ 3. 兜底 CSS（上游改版导致上面某个锚点失效时的第二道） ============
  // 顶栏留位补偿（仅当 2d 真删了付费标签行时才加）：#mobileHeader 是 position:absolute 的悬浮层、自身不占流内高度，
  // 原页面靠 bottomNav 的 padding-top:60px 给它让位；标签行删掉后正文整体上移、顶部约 60px 被不透明顶栏盖住——
  // 首页表现为「为您推荐」标题不见（源码里还在、是被顶栏压在底下），播放页表现为播放器上方一条黑带。给 #mobileContainer 补回 60px 即复位。
  const navFixCss = navRemoved
    ? `
      #mobileContainer {
        padding-top: 60px;
      }`
    : "";
  const cssBlock = `
    <style>
      #ageDisclaimerOverlay,
      #ageVerificationOverlay,
      #js-ageDisclaimerModal,
      .ageDisclaimer,
      ins.adsbytrafficjunky,
      div.rdisc5k,
      div.rdisc5aa,
      div.watchpageAd,
      li.rdisc5,
      li.js-nativeTjMob,
      .abovePlayerButtons,
      .abovePlayerButtonsWrapper,
      div.trendingPillsTitle,
      .relatedSearchTermsWrapper,
      .adsRemoveButtonWrapper,
      .gtm-event-header-paidtabs {
        display: none !important;
      }
      body.blurredAVModal,
      body.is-blurred {
        filter: none !important;
        opacity: 1 !important;
      }
      .is-blurred #mobileContainer img,
      .is-blurred #mobileContainer iframe,
      .is-blurred #mobileContainer video {
        filter: none !important;
      }
      /* 播放页 tab 栏（相关/推荐视频/评论/片单）取消悬停：站点样式给 .tabFilterWrapper 设了 position:sticky
         （带药丸时 top:116px），滑动看相关列表时它一直浮在固定位置挡视线（2026-10-30 用户反馈）；
         改 static 让它随页面滚走，tab 本身与切换功能保留不动 */
      div.tabWrapper .tabFilterWrapper {
        position: static !important;
      }${navFixCss}
    </style>
  </head>`;
  body = body.replace(/<\/head>/i, cssBlock);

  // ============ 4. 返回位置逻辑（参考 pornhub-old.js 第四、五层，按实测失效模式改进） ============
  // 旧版两层思路：列表页存滚动位置、pageshow 时恢复；点视频链接强制 target=_blank，让列表页根本不卸载。
  // 实测失效点与本版改进：
  // ① 旧版恢复只认 event.persisted（bfcache 恢复）——但本机实测返回时页面是整页重载（persisted=false），旧逻辑根本不触发、位置照丢。
  //    改为认「点过视频链接」的标记：30 分钟内、且确属后退到达（persisted / 导航类型 back_forward）才恢复，
  //    重载也救得回；恢复带 100ms×12 次重试，等内容长够高再定位，避免没长齐时滚不到位。
  //    注意后退判定不认 referrer：从播放页点站点 logo 回首页时 referrer 同样是播放页，但那是主动导航——
  //    误判成返回会白藏一遍页面（打开变慢）还把人拽回旧位置（2026-10-30 实测反馈后收紧）。
  // ② 新标签隔离两类页面都开（2026-10-30 用户选定，取代此前「播放页同标签跳转」的设计）：点视频链接一律新标签打开，
  //    原页面不卸载，「返回」实际是关掉新标签、切回还活着的原页，位置天然还在、零重建，播放页和列表页一样丝滑；
  //    代价是连着点会攒标签页。若浏览器把 _blank 开在同标签（原页被卸载），存位+标记保留，正好走下面的重载恢复兜底。
  // ③ 旧版给播放页设 scrollRestoration='manual'，等于关掉浏览器自带的返回恢复——本版两类页面统一 'auto'，与本节恢复双保险。
  // ④ 标记读时不消费：前进落地的新页面靠导航类型跳过、不抢标记，多级返回链（播放→播放→返回→返回）逐级都能恢复，标记只靠 30 分钟新鲜度过期；
  //    列表页新标签真打开时（5 秒后列表页还活着且仍可见）清标记，避免之后手动刷新被误拽回旧位置。
  // ⑤ 滚动位置按 pathname 分开存，播放页另加 query（viewkey 不同是不同视频、不能共用一个位置）；pagehide 时补存一次，快点视频时最后位置不丢。
  // ⑥ 防闪烁（2026-10-30 实测反馈）：重载返回时页面先在顶部渲染出来、pageshow 才触发恢复，必然先回顶部闪一下。
  //    改为 head 阶段就预判（标记+存位+后退导航），命中先把整页 visibility:hidden 藏起来，DOMContentLoaded 起定位、到位再揭示，
  //    1200ms 兜底必揭示不会藏死；恢复未完成时存位跳过被浏览器 clamp 的中间值，防止把存好的目标位置冲掉。
  // 整体 try/catch 包死：这段 JS 出任何错都不许影响页面本身；不写 cookie（与第一节原则一致）。
  const returnJs = `
    <script>
      (function () {
        try {
          var isDetail = /view_video\\.php/.test(location.pathname) || /[?&]viewkey=/.test(location.search);
          if ("scrollRestoration" in history) {
            history.scrollRestoration = "auto";
          }
          var POS_KEY = "ph_scroll_" + location.pathname + (isDetail ? location.search : "");
          var MARK_KEY = "ph_went_detail";
          var saveTimer = null;
          var restorePos = 0, restoreDone = false, revealed = true;
          function saveNow() {
            // 恢复进行中时，内容还没长齐、scrollTo 会被浏览器 clamp 到半途——这种中间值不许回写存位，免得把存好的目标冲掉
            if (restorePos && !restoreDone && (window.scrollY || 0) < restorePos) return;
            try { sessionStorage.setItem(POS_KEY, String(window.scrollY || 0)); } catch (e) {}
          }
          window.addEventListener("scroll", function () {
            if (saveTimer) return;
            saveTimer = setTimeout(function () { saveTimer = null; saveNow(); }, 150);
          }, { passive: true });
          window.addEventListener("pagehide", saveNow);
          document.addEventListener("click", function (event) {
            if (event.ctrlKey || event.metaKey) return;
            var t = event.target;
            var link = t && t.closest ? t.closest("a") : null;
            if (!link || !link.href) return;
            if (!/view_video\\.php/.test(link.href) && !/[?&]viewkey=/.test(link.href)) return;
            saveNow();
            try { sessionStorage.setItem(MARK_KEY, String(Date.now())); } catch (e) {}
            link.setAttribute("target", "_blank");
            setTimeout(function () {
              if (!document.hidden) {
                try { sessionStorage.removeItem(MARK_KEY); } catch (e) {}
              }
            }, 5000);
          }, true);
          // ---- 恢复侧 ----
          // 闪烁的成因：整页重载时页面先在顶部渲染出来，pageshow 才触发恢复，第一帧必然是顶部。
          // 改法：脚本在 <head> 里就预判（标记新鲜 + 存有位置 + 后退导航），命中先把整页藏起来（visibility:hidden），
          // DOMContentLoaded 起开始定位、到位立刻揭示；1200ms 兜底必揭示，不会把页面藏死。
          function readSaved() {
            var mark = 0, pos = 0;
            try {
              mark = parseInt(sessionStorage.getItem(MARK_KEY) || "0", 10);
              pos = parseInt(sessionStorage.getItem(POS_KEY) || "0", 10);
            } catch (e) {}
            if (!mark || !pos) return 0;
            if (Date.now() - mark >= 30 * 60 * 1000) return 0;
            return pos;
          }
          function navIsBack() {
            var t = "";
            try {
              var entries = performance.getEntriesByType ? performance.getEntriesByType("navigation") : null;
              if (entries && entries[0]) t = entries[0].type;
              else if (performance.navigation && performance.navigation.type === 2) t = "back_forward";
            } catch (e) {}
            return t === "back_forward";
          }
          function reveal() {
            if (!revealed) {
              revealed = true;
              try { document.documentElement.style.visibility = ""; } catch (e) {}
            }
          }
          function tryRestore() {
            if (!restorePos || restoreDone) return;
            window.scrollTo(0, restorePos);
            if (Math.abs((window.scrollY || 0) - restorePos) <= 2) {
              restoreDone = true;
              reveal();
            }
          }
          function startRestore() {
            tryRestore();
            var tries = 0;
            var timer = setInterval(function () {
              tries++;
              tryRestore();
              if (restoreDone || tries >= 12) {
                clearInterval(timer);
                reveal();
              }
            }, 100);
          }
          var earlyPos = readSaved();
          if (earlyPos && navIsBack()) {
            restorePos = earlyPos;
            revealed = false;
            try { document.documentElement.style.visibility = "hidden"; } catch (e) {}
            setTimeout(reveal, 1200);
            document.addEventListener("DOMContentLoaded", startRestore);
          }
          window.addEventListener("pageshow", function (event) {
            if (restorePos) {
              tryRestore();
              if (restoreDone) reveal();
              return;
            }
            // head 阶段没判出后退时在这里补判：bfcache 恢复（persisted，浏览器已原生定位、只补一刀）
            // 或此刻才读到 back_forward 的重载返回——不藏页（可能已出画），照常恢复
            var p = readSaved();
            if (!p) return;
            if (event.persisted || navIsBack()) {
              restorePos = p;
              startRestore();
            }
          });
        } catch (e) {}
      })();
    </script>`;
  body = body.replace(/<\/head>/i, returnJs + "\n</head>");

  $done({ body });
} else {
  $done({});
}
