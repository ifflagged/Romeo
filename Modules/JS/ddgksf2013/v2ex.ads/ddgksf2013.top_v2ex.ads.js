/***********************************

墨鱼自用V2EX网页去广告

2026-01-30

https://t.me/ddgksf2021

    
[rewrite_local]

^https?:\/\/.*v2ex\.com\/(?!(.*(api|login|cdn-cgi|verify|auth|captch|(\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf))))) url script-response-body https://ddgksf2013.top/scripts/v2ex.ads.js
^https?:\/\/pagead.*googlesyndication\.com\/pagead url reject-200

[mitm] 

hostname = *.v2ex.com, pagead*.googlesyndication.com

***********************************/



var body = $response.body.replace(
  /<head>/,
  `<head>
    <style>
      .sidebar_units,
      .sidebar_compliance,
      ins.adsbygoogle,
      div[class^="wwads-"]{
        display: none !important;
      }
    </style>`
);
$done({ body });
