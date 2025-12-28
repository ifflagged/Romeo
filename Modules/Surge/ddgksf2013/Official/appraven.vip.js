/***********************************************

> 应用名称：墨鱼自用AppRaven脚本
> 脚本作者：@ddgksf2013
> 微信账号：墨鱼手记
> 更新时间：2023-07-24
> 通知频道：https://t.me/ddgksf2021
> 贡献投稿：https://t.me/ddgksf2013_bot
> 问题反馈：ddgksf2013@163.com
> 特别提醒：如需转载请注明出处，谢谢合作！
> 解锁功能：界面美化[主界面APP应用内购买灰色框太难看了]、使用会员图标功能


[rewrite_local]

^https?:\/\/v2\.appraven\.net\/appraven\/graphql url script-response-body https://ddgksf2013.top/scripts/appraven.vip.js

[mitm]

hostname = v2.appraven.net

***********************************************/





var modifiedHeaders = $request.headers;
var operationName = modifiedHeaders['X-APOLLO-OPERATION-NAME'];

if (operationName == "GetCurrentUser"||operationName == "GetUserById") {
  var body = $response.body.replace(/"premium":false/g, '"premium":true');
  $done({ body: body });
} else {
  $done({});
}
