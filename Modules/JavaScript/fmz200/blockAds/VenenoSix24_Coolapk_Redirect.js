let url = $request.url;

if (url.indexOf("coolapk.com/link") !== -1) {
  let match = url.match(/url=([^&]+)/);
  if (match) {
    let realUrl = decodeURIComponent(match[1]);

    $done({
      response: {
        status: 302,
        headers: {
          "Location": realUrl,
          "Cache-Control": "no-cache"
        }
      }
    });
    return;
  }
}

$done({});