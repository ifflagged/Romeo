// 引用地址：https://github.com/RuCu6/Loon/blob/main/Scripts/webpage/baidu-zhidao.js

let rHead = "<head>";
let newStyle =
  "<head><style> .ec_ad_results, .ad-icon, .wpbyuwfarr-ecom-ads, div[class*=fc-][tplid], .w-question-list[data-sign], .ec-ad{display:none!important} </style>";
let body = $response.body.replace(rHead, newStyle);
$done({ body });