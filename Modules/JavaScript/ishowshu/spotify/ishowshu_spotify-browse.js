// Spotify 搜索/浏览页 browsita/v1/browse：删除带 aet.spotify.com 曝光埋点的广告板块，其余板块保留
// 响应结构: Root{ 1: Page{ 1: Section(repeated) }, 2: id }

function readVarint(b, i) {
  let r = 0, s = 0, x;
  do {
    x = b[i++];
    r += (x & 0x7f) * Math.pow(2, s);
    s += 7;
  } while (x & 0x80);
  return [r, i];
}

function writeVarint(n) {
  const out = [];
  while (n > 0x7f) {
    out.push((n % 128) | 0x80);
    n = Math.floor(n / 128);
  }
  out.push(n);
  return out;
}

// 把一段 protobuf 拆成 [{field, wire, start, end, bodyStart}]
function fields(b, from, to) {
  const list = [];
  let i = from;
  while (i < to) {
    const start = i;
    let k;
    [k, i] = readVarint(b, i);
    const field = Math.floor(k / 8), wire = k & 7;
    let bodyStart = i;
    if (wire === 0) {
      [, i] = readVarint(b, i);
    } else if (wire === 2) {
      let l;
      [l, i] = readVarint(b, i);
      bodyStart = i;
      i += l;
    } else if (wire === 5) {
      i += 4;
    } else if (wire === 1) {
      i += 8;
    } else {
      throw new Error("bad wire " + wire);
    }
    list.push({ field, wire, start, end: i, bodyStart });
  }
  return list;
}

const AD_MARK = Array.from("aet.spotify.com/v2/t?p=").map(c => c.charCodeAt(0));

function hasAdTracker(b, from, to) {
  const n = AD_MARK.length;
  outer: for (let i = from; i + n <= to; i++) {
    if (b[i] !== AD_MARK[0]) continue;
    for (let j = 1; j < n; j++) if (b[i + j] !== AD_MARK[j]) continue outer;
    return true;
  }
  return false;
}

function concat(parts) {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function stripAds(b) {
  const top = fields(b, 0, b.length);
  const parts = [];
  let removed = 0;
  for (const t of top) {
    if (t.field !== 1 || t.wire !== 2) { parts.push(b.subarray(t.start, t.end)); continue; }
    // Page: 逐个检查 Section
    const secs = fields(b, t.bodyStart, t.end);
    const keep = [];
    for (const s of secs) {
      if (s.field === 1 && s.wire === 2) {
        const inner = fields(b, s.bodyStart, s.end);
        if (hasAdTracker(b, s.bodyStart, s.end)) { removed++; continue; }
      }
      keep.push(b.subarray(s.start, s.end));
    }
    const body = concat(keep);
    parts.push(concat([new Uint8Array([0x0a]), new Uint8Array(writeVarint(body.length)), body]));
  }
  return { data: concat(parts), removed };
}

try {
  const src = new Uint8Array($response.bodyBytes);
  const { data, removed } = stripAds(src);
  if (removed === 0) {
    $done({});
  } else {
    const headers = Object.assign({}, $response.headers);
    for (const k of Object.keys(headers)) {
      const l = k.toLowerCase();
      if (l === "content-encoding" || l === "content-length") delete headers[k];
    }
    $done({ headers, bodyBytes: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) });
  }
} catch (e) {
  console.log("spotify-browse error: " + e);
  $done({});
}
