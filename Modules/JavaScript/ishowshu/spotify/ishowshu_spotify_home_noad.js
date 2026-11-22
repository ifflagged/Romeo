/*
 * Spotify 首页品牌广告(brand-ad)移除 - Quantumult X
 * 接口: /casita/v1/home/*  (protobuf)
 * 原理: 删除响应里 id 含 "|brand-ad" 的 section, 其余字节原样保留
 */
const DROP = ["|brand-ad"]; // 需要删除的 section 关键字, 可自行追加

function rv(b, p) {
  let r = 0, m = 1, x;
  do { x = b[p++]; r += (x & 0x7f) * m; m *= 128; } while (x & 0x80);
  return [r, p];
}
function wv(n) {
  const o = [];
  while (n > 127) { o.push((n % 128) | 128); n = Math.floor(n / 128); }
  o.push(n);
  return o;
}
// 解析一层 protobuf, 失败返回 null
function parse(b) {
  const out = [];
  let p = 0;
  try {
    while (p < b.length) {
      const s = p;
      let k; [k, p] = rv(b, p);
      const f = Math.floor(k / 8), w = k & 7;
      let vs = p, ve = p;
      if (w === 0) { [, p] = rv(b, p); ve = p; }
      else if (w === 2) { let l; [l, p] = rv(b, p); vs = p; p += l; ve = p; if (ve > b.length) return null; }
      else if (w === 1) { p += 8; ve = p; }
      else if (w === 5) { p += 4; ve = p; }
      else return null;
      if (f === 0 || p > b.length) return null;
      out.push({ f, w, s, e: p, vs, ve });
    }
  } catch (e) { return null; }
  return out;
}
function concat(parts) {
  let n = 0; parts.forEach(a => n += a.length);
  const o = new Uint8Array(n); let q = 0;
  parts.forEach(a => { o.set(a, q); q += a.length; });
  return o;
}
function isAd(u8) {
  let s = "";
  const n = Math.min(u8.length, 200);
  for (let i = 0; i < n; i++) s += String.fromCharCode(u8[i]);
  return DROP.some(k => s.indexOf(k) !== -1);
}

(function main() {
  if (!$response.bodyBytes) return $done({});
  const body = new Uint8Array($response.bodyBytes);
  if (body[0] === 0x1f && body[1] === 0x8b) return $done({}); // 仍是 gzip, 不处理
  const top = parse(body);
  if (!top) return $done({});
  const parts = [];
  let removed = 0;
  for (const t of top) {
    if (t.f === 1 && t.w === 2) {
      const cont = body.subarray(t.vs, t.ve);
      const secs = parse(cont);
      if (secs) {
        const kept = [];
        for (const s of secs) {
          if (s.f === 1 && s.w === 2 && isAd(cont.subarray(s.vs, s.ve))) { removed++; continue; }
          kept.push(cont.subarray(s.s, s.e));
        }
        if (removed) {
          const nc = concat(kept);
          parts.push(new Uint8Array([0x0a].concat(wv(nc.length))), nc);
          continue;
        }
      }
    }
    parts.push(body.subarray(t.s, t.e));
  }
  if (!removed) return $done({});
  console.log("spotify home: removed " + removed + " ad section(s)");
  $done({ bodyBytes: concat(parts).buffer });
})();
