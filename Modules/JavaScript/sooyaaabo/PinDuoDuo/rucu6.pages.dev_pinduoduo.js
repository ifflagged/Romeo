// 2026-09-26 12:55

const url = $request.url;
if (!$response.body) $done({});
let body = $response.body;

if (url.includes("/api/alexa/homepage/hub")) {
  let obj = JSON.parse(body);
  // 底部标签栏
  if (obj?.result) {
    if (obj?.result?.bottom_tabs?.length > 0) {
      // 标签栏1
      obj.result.bottom_tabs = obj.result.bottom_tabs.filter((i) => /(?:chat_list|index|personal)/.test(i?.link));
    }
    if (obj?.result?.buffer_bottom_tabs?.length > 0) {
      // 标签栏2
      obj.result.buffer_bottom_tabs = obj.result.buffer_bottom_tabs.filter((i) => /(?:chat_list|index|personal)/.test(i?.link));
    }
    if (obj?.result?.dy_module?.irregular_banner_dy) {
      delete obj.result.dy_module.irregular_banner_dy; // 首页 顶部banner
    }
    // delete obj.result.icon_set; // 顶部图标 多多买菜 现金大转盘
    if (obj?.result?.search_bar_hot_query) {
      delete obj.result.search_bar_hot_query; // 搜索框填充词
    }
    if (obj?.result?.top_skin) {
      delete obj.result.top_skin; // 首页 顶部背景图
    }
  }
  body = JSON.stringify(obj);
} else if (url.includes("/comment_result")) {
  // 评价页面
  if (/^\s*<!DOCTYPE html>/i.test(body) !== false) {
    // 构造我们要注入的 CSS 样式
    const hideCSS = `
      <style>
        /* 隐藏推荐商品容器 */
        #recommend-wrapper,
        #downloader-container {
          display: none !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      </style>
    </head>
    `;

    // 将样式代码注入到 HTML 的 </head> 标签之前
    body = body.replace("</head>", hideCSS);
    // 数据层面声明"没有更多了"，阻止翻页时继续请求推荐接口
    if (body.includes('"has_more":true')) {
      body = body.replace('"has_more":true', '"has_more":false');
    }
  }
} else if (url.includes("/mdkd/package")) {
  // 取件页面
  if (/^\s*<!DOCTYPE html>/i.test(body) !== false) {
    // 构造我们要注入的 CSS 样式
    const hideCSS = `
      <style>
        /* 1. 隐藏底部大面积的商品推荐瀑布流 */
        #goods-list-big-container,
        [class^="index_goods-list-big-container"],
        .goods-list-container {
          display: none !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        
        /* 2. 隐藏右下角悬浮的 GIF 活动动图 */
        [class^="index_gif-container"] {
          display: none !important;
        }

        /* 3. 【可选】如果你说的红框是“近一周已取出快递”模块，请删除下面这行代码前后的注释斜杠 */
        /* [class^="index_recently-package-container"] { display: none !important; } */
        
        /* 4. 【可选】如果你说的红框是“暂无手机尾号收到的快递”的引导，请删除下面这行代码前后的注释斜杠 */
        /* .empty-package_package-none-container__35DEn { display: none !important; } */
      </style>
    </head>
    `;

    // 将样式代码注入到 HTML 的 </head> 标签之前
    body = body.replace("</head>", hideCSS);
  }
} else {
  $done({});
}

$done({ body });
