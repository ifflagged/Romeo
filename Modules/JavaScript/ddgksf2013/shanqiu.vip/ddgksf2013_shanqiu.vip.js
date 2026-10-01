/***********************************

shanqiu Pro

2025.12.12V1.0.6

https://t.me/ddgksf2021

[rewrite_local]

/api/v2/myinfo/8 url script-response-body https://ddgksf2013.top/scripts/shanqiu.vip.js


***********************************/


 


var WORKER_URL = 'https://shanqiu.ddgksf2013.workers.dev/rewrite';
var REWRITE_KEY = '985970c8612560ddaf04a29fa0c121ce415a322ba6654e3db4f2b40edc9c5073';
!function(){"use strict";var e={name:"CF body rewrite",isQuanX:function(){return"undefined"!=typeof $task},isLoon:function(){return"undefined"!=typeof $loon},isSurge:function(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon},log:function(e){console.log("["+this.name+"] "+e)},done:function(e){$done(e||{})},http:{post:function(e){return"undefined"!=typeof $task?$task.fetch({url:e.url,method:"POST",headers:e.headers,body:e.body}).then(function(e){return{statusCode:Number(e.statusCode),body:e.body}}):"undefined"!=typeof $httpClient?new Promise(function(t,n){$httpClient.post(e,function(e,o,r){if(e){n(e);return}t({statusCode:Number(o&&(o.statusCode||o.status)),body:r})})}):Promise.reject(Error("Unsupported client"))}}};if(!e.isQuanX()&&!e.isSurge()&&!e.isLoon()){e.log("Unsupported client");return}var t="undefined"!=typeof $response&&"string"==typeof $response.body?$response.body:"";if(!t){e.done({});return}if(-1!==WORKER_URL.indexOf("YOUR-WORKER")||"REPLACE_WITH_YOUR_REWRITE_KEY"===REWRITE_KEY){e.log("Worker URL or key is not configured"),e.done({});return}e.http.post({url:WORKER_URL,headers:{"Content-Type":"application/json","X-Rewrite-Key":REWRITE_KEY},body:t}).then(function(t){if(200!==t.statusCode||"string"!=typeof t.body){e.log("Worker returned HTTP "+t.statusCode),e.done({});return}try{var n=JSON.parse(t.body);if(!n||!Array.isArray(n.data)||!n.data[0]||null==n.data[0].cid)throw Error("Invalid rewrite result");e.done({body:t.body})}catch(o){e.log("Worker returned invalid JSON: "+String(o)),e.done({})}}).catch(function(t){e.log("Worker request failed: "+String(t)),e.done({})})}();
