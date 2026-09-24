let body = $response.body;
let obj = JSON.parse(body);

obj.objRes = [];

body = JSON.stringify(obj);
$done({body});
