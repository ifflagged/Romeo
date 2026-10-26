// 引用地址：
// 2026-06-01

const VIP_PATCH = {
  vip_status: true,
  vip_level: 3,
  vip_expire_at: "2099-09-19T22:21:06.147807+00:00",
  username: "蛋蛋不语VIP"
};

function patch(obj) {
  if (!obj || typeof obj !== "object") return obj;
  return Object.assign(obj, VIP_PATCH);
}

function done(body) {
  $done({ body: typeof body === "string" ? body : JSON.stringify(body) });
}

function run() {
  const raw = ($response && $response.body) ? $response.body : "";

  if (!raw) return done("");

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return done(raw);
  }

  if (Array.isArray(data)) {
    data = data.map(patch);
  } else {
    data = patch(data);
  }

  return done(data);
}

try {
  run();
} catch (e) {
  console.log("fatal:", e);
  done($response?.body || "");
}
