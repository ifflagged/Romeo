//  2025-06-03
//  树先生

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

obj.data.isVip = true;

body = JSON.stringify(obj);
$done({body});
