// 直接读取外部传入的 jump 参数
let scheme = $argument.jump;

// 检查传入的 jump 参数是否存在
if (!scheme) {
    $done({});  // 如果没有传入 jump 参数，则不进行任何操作
}

// 获取当前请求的 URL
let url = $request.url;

// 正则匹配 t.me/xxx
let match = url.match(/(?:https:\/\/)?t\.me\/(.+)/);

if (match && scheme) {
    // 构造新的 URL 地址
    let newUrl = `${scheme}://resolve?domain=${match[1]}`;

    // 修改响应的 Location header
    $done({response:{
        status: 302,  // 设置 HTTP 状态码为 302
        headers: {
            'Location': newUrl  // 设置新的 Location 重定向地址
        }
    }
          });
} else {
    // 如果不匹配要求的 URL，返回原响应内容
    $done({});
}
