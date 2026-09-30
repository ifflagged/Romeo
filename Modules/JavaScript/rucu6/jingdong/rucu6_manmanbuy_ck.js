// 2025-04-23 20:40

const url = $request.url;
const reqbody = $request.body;

if (url.includes("/baoliao/center/menu")) {
  const params = new URLSearchParams(reqbody);
  const devId = params.get("c_mmbDevId");
  if (devId) {
    let attach = {
      openUrl: null,
      clipboard: devId
    };
    $notification.post("🎉🎉🎉", "账号捕获成功! ", "点此通知即可复制认证信息~ ", attach);
  } else {
    $notification.post("⚠️⚠️⚠️", "CK 获取失败! ", "c_mmbDevId 参数不存在, 请重新再试~ ", reqbody);
  }
}

$done({});
