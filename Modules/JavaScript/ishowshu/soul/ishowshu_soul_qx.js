//  2026-08-29
//  树先生
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

if (url.indexOf("/chat/limitInfo") != -1) {
    delete obj.data.subMsg;
    delete obj.data.extMsg;
    delete obj.data.abValue;
    delete obj.data.freeEquityStatus;
    delete obj.data.msg;
    delete obj.data.remainFreeCount;
    delete obj.data.type;
    obj.data.limit = false;
} else if (url.indexOf("/snapchat/url") != -1) {
    try {
        //console.log("响应原文obj：" + obj);
        let imageUrl = obj.data.url;
        //console.log("响应原文data：" + imageUrl);
        if (imageUrl && typeof imageUrl === 'string') {
            console.log("图片地址: " + imageUrl);
            $notify("图片预览", "点击跳转浏览器", imageUrl, {
                "media-url": imageUrl,
                "open-url": imageUrl
            });

            //var attach = {  
                //"openUrl":imageUrl,
                //"mediaUrl":imageUrl
                //"clipboard":"图片通知已接收"
            //};
            // 调用$notification.post方法发送通知
            //$notification.post("图片通知", "查看图片", "点击查看详情", attach);
        }
        
    } catch (e) {
        console.log("处理图片预览出错：" + e);
    }

}


body = JSON.stringify(obj);
$done({body});
