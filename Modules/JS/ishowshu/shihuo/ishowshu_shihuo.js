//  2025-05-22
//  树先生
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

if (url.indexOf("/home/info/v1") != -1) {
    obj.data.new_activity = [];
    obj.data.search_arr = {};
    obj.data.hotspot = {};
    obj.data.activity_dynamic_modules = [];
} else if (url.indexOf("/sh-appapi/my/info") != -1) {
    obj.data.background = "";
    obj.data.background_imgs = "";
} else if (url.indexOf("/home/feed/v1") != -1) {
    // 加密了
    //const type = ["DYNAMIC_CARD", "EXPRESS_AD"];
    //obj.data.lists = obj.data.lists.filter(obj => !type.includes(obj.item_type));
} else if (url.indexOf("/center/config") != -1) {
    const arrayKey = [2,3,1,8];
    obj.data.tool_list = obj.data.tool_list.filter(item => arrayKey.includes(item.id));
    obj.data.navigation_list = [];
    obj.data.activity_dynamic_modules = [];
} else if (url.indexOf("/center/info") != -1) {
    //obj.data.background = {}; // 我的 页面顶部背景图
    const prop = "tab_extends";
    obj.data.tabs.forEach(card => {
        if (prop in card) {
            delete card.tab_extends;
        }
    });
} else if (url.indexOf("/sh-applicationapi/pti") != -1) {
    obj.data.feed_back_entrance = [];
}  else if (url.indexOf("/sh-goodsapi/public/detail") != -1) {
    obj.data.bottom_tab.list = obj.data.bottom_tab.list.filter(item => item.show_type != 4);
}

body = JSON.stringify(obj);
$done({body});
