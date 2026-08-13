/*
脚本引用 https://github.com/Keywos/rule/blob/main/loon/tk.js
*/
let keyus={US: "US", TW: "TW", SG:"SG", JP:"JP", KR:"KR"},
lk = $persistentStore.read("UnlockArea"),loc = keyus[lk] || "US",url = $request.url;
// if(loc == "inkey"){
//   inkeys = $persistentStore.read("CountryCode");
//   loc = inkeys
// }
if (/(tnc|dm).+\.[^\/]+\.com\/\w+\/v\d\/\?/.test(url)) {
  url = url.replace(/\/\?/g,'');
  const response = {
    status: 302,
    headers: {Location: url},
  };
  $done({response});
} else if (/_region=CN&|&mcc_mnc=4/.test(url)) {
  url = url.replace(/_region=CN&/g,`_region=${loc}&`).replace(/&mcc_mnc=4/g,"&mcc_mnc=2");
  const response = {
    status: 307,
    headers: {Location: url},
  };
  $done({response});
} else {
  $done({})
}
