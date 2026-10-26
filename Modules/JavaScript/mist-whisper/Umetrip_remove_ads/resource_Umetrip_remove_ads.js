const version = 'V1.0.1';
var ua = $request.headers.rpid || $request.headers.Rpid;

// 判断 ua 是否包含指定的值
if (ua.includes("1000002") || ua.includes("1000019")) {
  // 返回 404 Not Found 的响应
  $done({ 
    status: 404, 
    body: "Not Found" 
  });
} else {
  // 否则返回正常响应
  $done({});
}
