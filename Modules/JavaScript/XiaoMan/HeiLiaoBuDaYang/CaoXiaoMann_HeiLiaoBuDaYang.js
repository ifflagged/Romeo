let body = $response.body;

// 黑料不打烊去广告（Surge 版，参考 luestr 油猴脚本，保护视频/正文）
if (/<\/head>/.test(body) && body.indexOf('hlbdy') < 0) {
  var SEL = 'article.ad-item,.corner-badge--ad,.post-card-ads,.adspop,.bottom-ads,.horizontal-banner,#aiFloat,.launchapp-btn-container,.launchapp-des,.article-ads-btn,.ads-title,.article-bottom-apps,.article-content-after,.top_picks_title,.top_picks_wrapper,.post-content .content-copyright,.dplayer .ads_text,[data-ad_type],#lottery-popup-wrap,#zq-activity-popup,.addbox';
  var css = '<style id="hlbdy-css">' + SEL + '{display:none!important}' + '</style>';
  body = body.replace('</head>', css + '</head>');

  var js = '<script>(function(){' +
    'var S="' + SEL + '";' +
    'function kill(){document.querySelectorAll(S).forEach(function(e){var p=e.parentNode;if(p&&p.parentNode)p.parentNode.removeChild(p);else if(p)p.removeChild(e);})}' +
    'kill();setInterval(kill,200);new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});' +
    '})()</script>';
  body = body.replace('</body>', js + '</body>');
}

$done({ body: body });
