/*
 *
 *
#!name= 哔哩哔哩 𝕏
#!desc= 对 哔哩哔哩 深度学习探索;
#!openUrl= https://apps.apple.com/app/id1517062289
#!author= 
#!icon= https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a9/db/da/a9dbdad4-a3de-2916-3676-178b353e8767/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/400x400bb.webp
#!date= 2025-12-00 00:00:00

[Argument]
displayUpList=select,"auto","show","hide",tag=显示[动态-最常访问], desc = auto: 仅当列表中存在直播状态时显示; show: 始终显示; hide: 始终隐藏;
purifyComment=switch,true,tag=过滤[评论区-置顶], desc = 关闭开关将不对此选项生效
optimizeRequest=switch,true,tag=优化[评论区-加载], desc = 关闭开关将不对此选项生效
sponsorBlock=switch,true,tag=跳过[视频-插播], desc = 关闭开关将不对此选项生效

VIP = switch, false, tag = [启用]会员, desc = 关闭开关将不对此选项生效

Authorization = input,"", tag = Authorization ,desc = 选填
UserAgent = input,"", tag = UserAgent, desc = 选填

[Rule]
DOMAIN,bsbsb.top,DIRECT
DOMAIN,api.biliapi.com,REJECT
DOMAIN,app.biliapi.com,REJECT
DOMAIN,api.biliapi.net,REJECT
DOMAIN,app.biliapi.net,REJECT
AND,((DOMAIN-SUFFIX,chat.bilibili.com), (OR,((DOMAIN-KEYWORD,stun), (DOMAIN-KEYWORD,tracker)))),REJECT

[Rewrite]
^https:\/\/api\.live\.bilibili\.com\/xlive\/e-commerce-interface\/v1\/ecommerce-user\/get_shopping_info\? reject-dict
^https:\/\/line3-h5-mobile-api\.biligame\.com\/game\/live\/large_card_material\? reject-dict

^https:\/\/ap[ip]\.bilibili\.com\/x\/(resource\/(top\/activity|patch\/tab)|v2\/search\/square|vip\/ads\/materials)\? mock-response-body data-type=text status-code=200 data="{"code":-404,"message":"-404","ttl":1,"data":null}"
^https:\/\/api\.bilibili\.com\/pgc\/activity\/deliver\/material\/receive\? mock-response-body data-type=text status-code=200 data="{"code":0,"data":{"closeType":"close_win","container":[],"showTime":""},"message":"success"}"
^https:\/\/grpc\.biliapi\.net\/bilibili\.app\.interface\.v1\.Teenagers\/ModeStatus$ mock-response-body data-type=base64 data="AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA" mock-data-is-base64=true
^https:\/\/grpc\.biliapi\.net\/bilibili\.app\.interface\.v1\.Search\/DefaultWords$ mock-response-body data-type=base64 data="AAAAACEaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7KAE=" mock-data-is-base64=true
^https:\/\/grpc\.biliapi\.net\/bilibili\.app\.(view\.v1\.View\/TFInfo|viewunite\.v1\.View\/ViewEndPage)$ mock-response-body data-type=base64 data="AAAAAAA=" mock-data-is-base64=true

^https:\/\/api\.bilibili\.com\/pgc\/page\/channel\?(.*)&mobi_app=iphone&(.*)$ header https://api.bilibili.com/pgc/page/channel?$1&mobi_app=iphone_i&$2

^https:\/\/api\.bilibili\.com\/x\/pd-proxy\/tracker\? response-body-json-jq '.data[][]?="stun.chat.bilibili.com:3478"'
^https:\/\/api\.bilibili\.com\/pgc\/view\/v2\/app\/season\? response-body-json-jq 'del(.data.payment)'
^https:\/\/api\.live\.bilibili\.com\/xlive\/(app-interface\/v2\/index\/feed|app-room\/v1\/index\/getInfoBy(Room|User))\? response-body-json-jq '.data |= (del(.play_together_info, .play_together_info_v2, .activity_banner_info) | if .function_card then .function_card[] = null end | if .new_tab_info.outer_list then .new_tab_info.outer_list |= map(select(.biz_id != 33)) end | if .card_list then .card_list |= map(select(.card_type | IN("banner_v2", "activity_card_v1") | not)) end | reduce ([["show_reserve_status"], false], [["reserve_info", "show_reserve_status"], false], [["shopping_info", "is_show"], 0]) as [$path, $value] (.; if getpath($path) then setpath($path; $value) end))'

^https:\/\/app\.bilibili\.com\/x\/resource\/show\/skin\? response-body-json-del data.common_equip

^https:\/\/app\.bilibili\.com\/x\/resource\/show\/tab\/v2\? response-body-json-jq jq-path="https://raw.githubusercontent.com/kokoryh/Sparkle/master/jq/bilibili.tab.jq"
^https:\/\/app\.bilibili\.com\/x\/v2\/splash\/(list|show|event\/list2)\? response-body-json-jq '.data |= with_entries(if .key | IN("show", "event_list") then .value = [] else . end)'
^https:\/\/app\.bilibili\.com\/x\/v2\/feed\/index\? response-body-json-jq 'if .data.items then .data.items |= map(select((.banner_item == null) and (.ad_info == null) and (.card_goto == "av") and (.card_type | IN("small_cover_v2", "large_cover_single_v9", "large_cover_v1")))) end'
^https:\/\/app\.bilibili\.com\/x\/v2\/feed\/index\/story\? response-body-json-jq 'if .data.items then .data.items |= map(select((.ad_info == null) and (.card_goto | IN("vertical_ad_av", "vertical_ad_live", "vertical_ad_picture") | not)) | del(.story_cart_icon, .free_flow_toast, .image_infos, .course_info, .game_info)) end'
^https:\/\/app\.bilibili\.com\/x\/v2\/account\/mine(\/ipad)?\? response-body-json-jq jq-path="https://raw.githubusercontent.com/kokoryh/Sparkle/master/jq/bilibili.mine.jq"
^https:\/\/app\.bilibili\.com\/x\/v2\/account\/myinfo\? response-body-json-jq '.data.vip |= if . != null and .status == 0 then . + { status: 1, type: 2, due_date: 9005270400000, role: 15 } else . end'

[Script]
http-request ^https:\/\/(grpc\.biliapi\.net|app\.bilibili\.com)\/bilibili\.community\.service\.dm\.v1\.DM\/DmSegMobile$ script-path=https://raw.githubusercontent.com/kokoryh/Sparkle/master/dist/bilibili.protobuf.request.js, requires-body=true, binary-body-mode=true, timeout=10, enable={sponsorBlock}, tag=插播
http-request ^https:\/\/(grpc\.biliapi\.net|app\.bilibili\.com)\/bilibili\.(app\.viewunite\.v1\.View\/View|main\.community\.reply\.v1\.Reply\/MainList)$ script-path=https://raw.githubusercontent.com/kokoryh/Sparkle/master/dist/bilibili.protobuf.request.js, argument=[{purifyComment}], requires-body=true, binary-body-mode=true, timeout=10, enable={optimizeRequest}, tag=优化
http-response ^https:\/\/(grpc\.biliapi\.net|app\.bilibili\.com)\/bilibili\.(app\.(show\.v1\.Popular\/Index|dynamic\.v2\.Dynamic\/DynAll|view(unite)?\.v1\.View\/(View|ViewProgress|RelatesFeed)|playurl\.v1\.PlayURL\/PlayView|playerunite\.v1\.Player\/PlayViewUnite)|polymer\.app\.search\.v1\.Search\/SearchAll|community\.service\.dm\.v1\.DM\/DmView|main\.community\.reply\.v1\.Reply\/MainList|pgc\.gateway\.player\.v2\.PlayURL\/PlayView)$ script-path=https://raw.githubusercontent.com/kokoryh/Sparkle/master/dist/bilibili.protobuf.response.js, argument=[{displayUpList}, {purifyComment}, {sponsorBlock}], requires-body=true, binary-body-mode=true, tag=净化

http-request ^https?:\/\/(?:grpc\.biliapi\.net|app\.bilibili\.com|app\.biliapi\.net)\/(?:bilibili\.app\.(?:playerunite\.v1\.Player\/PlayViewUnite|playurl\.v1\.PlayURL\/PlayView)|bilibili\.pgc\.gateway\.player\.v2\.PlayURL\/PlayView) script-path=https://he2o.vercel.app/Resource/Plugin/Bilibili.js, binary-body-mode=true, requires-body=true, timeout=60, tag=会员, enable={VIP}, argument=[{Authorization},{UserAgent}]
http-response ^https?:\/\/app\.bilibili\.com\/x\/v\d\/(account\/(myinfo|mine)|(feed\/index))\? script-path=https://he2o.vercel.app/Resource/Plugin/Bilibili.js, requires-body=true, timeout=60, tag=画质, enable={VIP}, argument=[{Authorization},{UserAgent}]

[Mitm]
hostname= *.bilibili.*,*.biliapi.*,*.biligame.*
*
*
*/






/*
 *
 *
var BiliHeaders = $request.headers;
BiliHeaders['authorization'] = '';
BiliHeaders['user-agent'] = '';

$done({headers : BiliHeaders});
*
*
*/
const header = $request.headers;

let authorization = $argument?.Authorization;
/*
let userAgent = $argument?.UserAgent;
*/
let userAgent = header["user-agent"];

if ($argument?.UserAgent) userAgent = $argument.UserAgent;

/*
if (!authorization || !userAgent) {
	*/
if (!authorization) {
    console.log("参数缺失信息：");
    if (!authorization) console.log("❌ Authorization 参数缺失");
	/*
    if (!userAgent) console.log("❌ UserAgent 参数缺失");
	*/
    $notification.post(
        "哔哩哔哩遇到问题",
        "参数缺失",
        "请在插件内填入完整的会员数据"
    );

    $done({});
    return;
}

header["authorization"] = authorization;
header["user-agent"] = userAgent;

console.log("✅ 哔哩哔哩大会员已解锁 🎉");

$done({ headers: header });