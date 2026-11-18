// QuGuangGao 通用处理脚本（Surge 原生 http-request / http-response）
// 由 .sgmodule 通过 argument 传入 base64url 编码的操作表，复刻 Loon 的
// response.json.delete / json.replace / body.mock / body.replace 等内置操作。
function b64decode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  if (typeof atob === 'function') {
    var bin = atob(s), out = '', i, c;
    // UTF-8 decode
    var bytes = [];
    for (i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
    var res = '', j = 0;
    while (j < bytes.length) {
      c = bytes[j];
      if (c < 0x80) { res += String.fromCharCode(c); j += 1; }
      else if (c < 0xE0) { res += String.fromCharCode(((c & 0x1F) << 6) | (bytes[j + 1] & 0x3F)); j += 2; }
      else if (c < 0xF0) { res += String.fromCharCode(((c & 0x0F) << 12) | ((bytes[j + 1] & 0x3F) << 6) | (bytes[j + 2] & 0x3F)); j += 3; }
      else { var cp = ((c & 0x07) << 18) | ((bytes[j + 1] & 0x3F) << 12) | ((bytes[j + 2] & 0x3F) << 6) | (bytes[j + 3] & 0x3F); cp -= 0x10000; res += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)); j += 4; }
    }
    return res;
  }
  return '';
}
function splitPath(p) { return p.split('.').filter(function (x) { return x.length > 0; }); }
function delPath(obj, segs) {
  if (!obj || segs.length === 0) return;
  var head = segs[0], rest = segs.slice(1), wild = false;
  if (head.slice(-2) === '[]') { head = head.slice(0, -2); wild = true; }
  if (head === '') { // pure [] segment
    if (Array.isArray(obj)) obj.forEach(function (el) { delPath(el, rest); });
    return;
  }
  if (rest.length === 0 && !wild) { delete obj[head]; return; }
  var next = obj[head];
  if (wild) {
    if (Array.isArray(next)) next.forEach(function (el) { delPath(el, rest); });
  } else {
    delPath(next, rest);
  }
}
function setPath(obj, segs, val) {
  var cur = obj;
  for (var i = 0; i < segs.length - 1; i++) {
    if (typeof cur[segs[i]] !== 'object' || cur[segs[i]] === null) cur[segs[i]] = {};
    cur = cur[segs[i]];
  }
  cur[segs[segs.length - 1]] = val;
}
function getPath(obj, segs) {
  var cur = obj;
  for (var i = 0; i < segs.length; i++) { if (cur == null) return undefined; cur = cur[segs[i]]; }
  return cur;
}
try {
  var cfg = JSON.parse(b64decode($argument));
  var ops = cfg.ops || [];
  var isResp = typeof $response !== 'undefined';
  var body = isResp ? ($response.body || '') : ($request.body || '');
  var changed = false, result = {};
  for (var oi = 0; oi < ops.length; oi++) {
    var op = ops[oi];
    if (op.t === 'mock') {
      if (op.status && op.status !== 200) $done({ response: { status: op.status, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: op.body } });
      else $done({ body: op.body });
    } else if (op.t === 'del' || op.t === 'set' || op.t === 'jqdel') {
      var root = JSON.parse(body);
      if (op.t === 'del') {
        op.paths.forEach(function (p) { delPath(root, splitPath(p)); });
      } else if (op.t === 'set') {
        op.items.forEach(function (it) { setPath(root, splitPath(it.path), it.value); });
      } else if (op.t === 'jqdel') {
        if (op.target) {
          var sub = getPath(root, splitPath(op.target));
          var wasStr = typeof sub === 'string';
          if (wasStr) sub = JSON.parse(sub);
          op.paths.forEach(function (p) { delPath(sub, splitPath(p)); });
          setPath(root, splitPath(op.target), wasStr ? JSON.stringify(sub) : sub);
        } else {
          op.paths.forEach(function (p) { delPath(root, splitPath(p)); });
        }
      }
      body = JSON.stringify(root); changed = true;
    } else if (op.t === 'bodyre') {
      body = body.replace(new RegExp(op.pattern, op.flags || ''), op.repl); changed = true;
    } else if (op.t === 'headeradd') {
      var hs = isResp ? $response.headers : $request.headers;
      hs[op.name] = op.value; result.headers = hs; changed = true;
    } else if (op.t === 'headerre') {
      var hh = $request.headers, cur2 = hh[op.name];
      if (typeof cur2 === 'string') { hh[op.name] = cur2.replace(new RegExp(op.pattern, op.flags || ''), op.repl); result.headers = hh; changed = true; }
    }
  }
  if (changed) { result.body = body; }
  $done(result);
} catch (e) {
  $done({});
}
