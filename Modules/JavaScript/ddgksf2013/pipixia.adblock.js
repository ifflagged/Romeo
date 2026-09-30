/***********************************

> 应用名称：皮皮虾我们走
> 下载地址：http://t.cn/Air8PM5k
> 脚本作者：@Liquor030, @ddgksf2013
> 微信账号：墨鱼手记
> 解锁说明：去广告+去水印
> 更新时间：2023-05-25
> 通知频道：https://t.me/ddgksf2021
> 贡献投稿：https://t.me/ddgksf2013_bot
> 问题反馈：ddgksf2013@163.com
> 特别提醒：如需转载请注明出处，谢谢合作！
> 重写地址：https://gist.githubusercontent.com/ddgksf2013/bb1dadbd32f67c68772caebcc70b0a33/raw/pipixia.adblock.js
> 特别说明：⚠️⚠️⚠️
          本脚本仅供学习交流使用，禁止转载售卖
          ⚠️⚠️⚠️
          
          
[rewrite_local]

# ======= 去水印 ======= #
^https?:\/\/.*\.pipix\.com\/bds\/(feed\/stream|comment\/cell_reply|cell\/cell_comment|cell\/detail|ward\/list|user\/favorite|user\/cell_coment|user\/cell_userfeed|user\/publish_list) url script-response-body https://gist.githubusercontent.com/ddgksf2013/bb1dadbd32f67c68772caebcc70b0a33/raw/pipixia.adblock.js
# ======= 去广告 ======= #
app_name=super&([\S]*)aid=\d+ url 307 app_name=super_pro&$1aid=1412

[mitm]
 
hostname = *.pipix.com

***********************************/

























var body=$response.body.replace(/id\":([0-9]{15,})/g,'id":"$1str"'),obj=null;try{obj=(body=JSON.parse(body)).data?.data||body.data?.replies||body.data?.cell_comments}catch(o){console.log("JSON parse error:",o)}Array.isArray(obj)?obj.forEach(function(o,i){if(null!=o.ad_info){obj.splice(i,1);return}o.item?.video&&(o.item.video.video_download.url_list=o.item.origin_video_download.url_list),o.item?.comments&&o.item.comments.forEach(function(o){o.video&&(o.video_download.url_list=o.video.url_list)}),o.comment_info?.video&&(o.comment_info.video_download.url_list=o.comment_info.video.url_list)}):(obj.item?.video&&(obj.item.video.video_download.url_list=obj.item.origin_video_download.url_list),obj.item?.comments&&obj.item.comments.forEach(function(o){o.video&&(o.video_download.url_list=o.video.url_list)}),obj.comment_info?.video&&(obj.comment_info.video_download.url_list=obj.comment_info.video.url_list)),$done({body:body=(body=(body=(body=(body=JSON.stringify(body)).replace(/id\":\"([0-9]{15,})str\"/g,'id":$1')).replace(/\"can_download\":false/g,'"can_download":true')).replace(/tplv-ppx-logo.image/g,"0x0.gif")).replace(/tplv-ppx-logo/g,"0x0")});