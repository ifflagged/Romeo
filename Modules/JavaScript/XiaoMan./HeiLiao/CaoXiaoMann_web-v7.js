let body = $response.body;

if (/<\/head>/.test(body) && body.indexOf('hl-kill-ads') < 0) {
  // 1) CSS：隐藏横幅 + 广告弹窗/遮罩（对静态渲染的元素）
  const css = `<style id="hl-kill-ads-css">
.addbox,.add-box,.add_box,.add-to-home,.addhome,.addhome-bar,.addhome-banner,
.add-to-desktop-overlay,
.download-banner,.download-bar,.app-download,.app-download-bar,.pwa-banner,.pwa-tip,
.pwa-install,.install-app,.install-bar,#addbox,.bottom-banner,.bottom-bar,.fixed-bottom,
.van-popup--center,.van-overlay,.popup-wrapper,.popup-panel
{display:none !important;visibility:hidden !important;opacity:0 !important;height:0 !important;min-height:0 !important;}
</style>`;

  // 2) JS：持续删除横幅 + 广告弹窗（按内容识别广告，避免误删登录/菜单等正常弹窗）
  const js = `<script id="hl-kill-ads">
(function(){
  // 广告关键词（赌博/色情推广）
  var AD_RE = /约炮|直约|情趣|春药|乖乖水|娱乐城|棋牌|开元|PG电子|直营|博彩|彩票|性药|催情/i;
  function kill(){
    // a) 删底部横幅
    ['.addbox','.add-box','.add_box','#addbox','.add-to-home','.addhome'].forEach(function(s){
      document.querySelectorAll(s).forEach(function(el){ el.remove(); });
    });
    // b) 删「添加到主屏幕」遮罩
    document.querySelectorAll('.add-to-desktop-overlay').forEach(function(el){ el.remove(); });
    // c) 删广告弹窗（.van-popup / .popup-wrapper，内容含广告关键词才删，保留登录/菜单等正常弹窗）
    document.querySelectorAll('.van-popup, .popup-wrapper, .popup-panel').forEach(function(el){
      var txt = el.innerText || '';
      if (AD_RE.test(txt)) { el.remove(); return; }
    });
    // d) 删广告遮罩（对应广告弹窗的 overlay，含 add-to-desktop 或紧跟被删弹窗）
    document.querySelectorAll('.van-overlay').forEach(function(el){
      var txt = el.innerText || '';
      if (AD_RE.test(txt) || el.className.indexOf('add-to-desktop') >= 0) { el.remove(); }
    });
  }
  kill();
  document.addEventListener('DOMContentLoaded', kill);
  window.addEventListener('load', kill);

  setInterval(kill, 200);
  var mo = new MutationObserver(function(){ kill(); });
  mo.observe(document.documentElement, {childList:true, subtree:true});
})();
</script>`;

  body = body.replace('</head>', css + js + '</head>');
  $done({ body });
} else {
  $done({});
}
