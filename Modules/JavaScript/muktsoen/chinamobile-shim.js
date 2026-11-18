// Surge 移植垫片：模拟 Loon 的 $crypto.aes（AES-CBC + PKCS7）。
// S-box 由 GF(2^8) 逆元 + 仿射变换程序生成，不依赖硬编码大表。
// 所有辅助函数带 __cm_ 前缀，置于文件顶层，原脚本 IIFE 内可直接访问。
// $crypto 只在平台未提供时定义（即 Surge 环境），Loon 下用平台实现。
function __cm_gfMul(a, b) {
  var p = 0;
  for (var i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    var hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}
function __cm_gfPow(a, e) {
  var r = 1;
  while (e) {
    if (e & 1) r = __cm_gfMul(r, a);
    a = __cm_gfMul(a, a);
    e >>= 1;
  }
  return r;
}
function __cm_rotl8(x, n) {
  return ((x << n) | (x >> (8 - n))) & 0xff;
}
var __cm_SBOX = new Array(256);
var __cm_INV_SBOX = new Array(256);
for (var __cm_i = 0; __cm_i < 256; __cm_i++) {
  var __cm_inv = __cm_i === 0 ? 0 : __cm_gfPow(__cm_i, 254);
  var __cm_s = (__cm_inv ^ __cm_rotl8(__cm_inv, 1) ^ __cm_rotl8(__cm_inv, 2) ^ __cm_rotl8(__cm_inv, 3) ^ __cm_rotl8(__cm_inv, 4) ^ 0x63) & 0xff;
  __cm_SBOX[__cm_i] = __cm_s;
  __cm_INV_SBOX[__cm_s] = __cm_i;
}
function __cm_expandKey(keyBytes) {
  var Nk = keyBytes.length / 4;
  var Nr = Nk + 6;
  var w = new Array(4 * (Nr + 1));
  for (var i = 0; i < Nk; i++) {
    w[i] = ((keyBytes[4 * i] << 24) | (keyBytes[4 * i + 1] << 16) | (keyBytes[4 * i + 2] << 8) | keyBytes[4 * i + 3]) >>> 0;
  }
  var rcon = 1;
  for (i = Nk; i < 4 * (Nr + 1); i++) {
    var t = w[i - 1];
    if (i % Nk === 0) {
      t = (((__cm_SBOX[(t >> 16) & 0xff] << 24) | (__cm_SBOX[(t >> 8) & 0xff] << 16) | (__cm_SBOX[t & 0xff] << 8) | __cm_SBOX[(t >> 24) & 0xff]) ^ (rcon << 24)) >>> 0;
      rcon = __cm_gfMul(rcon, 2);
    } else if (Nk > 6 && i % Nk === 4) {
      t = ((__cm_SBOX[(t >> 24) & 0xff] << 24) | (__cm_SBOX[(t >> 16) & 0xff] << 16) | (__cm_SBOX[(t >> 8) & 0xff] << 8) | __cm_SBOX[t & 0xff]) >>> 0;
    }
    w[i] = (w[i - Nk] ^ t) >>> 0;
  }
  return { w: w, Nr: Nr };
}
function __cm_addRoundKey(s, w, round) {
  for (var c = 0; c < 4; c++) {
    var word = w[round * 4 + c];
    s[4 * c] ^= (word >>> 24) & 0xff;
    s[4 * c + 1] ^= (word >>> 16) & 0xff;
    s[4 * c + 2] ^= (word >>> 8) & 0xff;
    s[4 * c + 3] ^= word & 0xff;
  }
}
function __cm_subBytes(s) {
  for (var i = 0; i < 16; i++) s[i] = __cm_SBOX[s[i]];
}
function __cm_invSubBytes(s) {
  for (var i = 0; i < 16; i++) s[i] = __cm_INV_SBOX[s[i]];
}
function __cm_shiftRows(s) {
  var t = s.slice();
  for (var r = 1; r < 4; r++) for (var c = 0; c < 4; c++) s[4 * c + r] = t[4 * ((c + r) % 4) + r];
}
function __cm_invShiftRows(s) {
  var t = s.slice();
  for (var r = 1; r < 4; r++) for (var c = 0; c < 4; c++) s[4 * c + r] = t[4 * ((c - r + 4) % 4) + r];
}
function __cm_mixColumns(s) {
  for (var c = 0; c < 4; c++) {
    var i = 4 * c;
    var a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3];
    s[i] = __cm_gfMul(a0, 2) ^ __cm_gfMul(a1, 3) ^ a2 ^ a3;
    s[i + 1] = a0 ^ __cm_gfMul(a1, 2) ^ __cm_gfMul(a2, 3) ^ a3;
    s[i + 2] = a0 ^ a1 ^ __cm_gfMul(a2, 2) ^ __cm_gfMul(a3, 3);
    s[i + 3] = __cm_gfMul(a0, 3) ^ a1 ^ a2 ^ __cm_gfMul(a3, 2);
  }
}
function __cm_invMixColumns(s) {
  for (var c = 0; c < 4; c++) {
    var i = 4 * c;
    var a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3];
    s[i] = __cm_gfMul(a0, 14) ^ __cm_gfMul(a1, 11) ^ __cm_gfMul(a2, 13) ^ __cm_gfMul(a3, 9);
    s[i + 1] = __cm_gfMul(a0, 9) ^ __cm_gfMul(a1, 14) ^ __cm_gfMul(a2, 11) ^ __cm_gfMul(a3, 13);
    s[i + 2] = __cm_gfMul(a0, 13) ^ __cm_gfMul(a1, 9) ^ __cm_gfMul(a2, 14) ^ __cm_gfMul(a3, 11);
    s[i + 3] = __cm_gfMul(a0, 11) ^ __cm_gfMul(a1, 13) ^ __cm_gfMul(a2, 9) ^ __cm_gfMul(a3, 14);
  }
}
function __cm_encryptBlock(input, exp) {
  var s = input.slice();
  __cm_addRoundKey(s, exp.w, 0);
  for (var round = 1; round < exp.Nr; round++) {
    __cm_subBytes(s);
    __cm_shiftRows(s);
    __cm_mixColumns(s);
    __cm_addRoundKey(s, exp.w, round);
  }
  __cm_subBytes(s);
  __cm_shiftRows(s);
  __cm_addRoundKey(s, exp.w, exp.Nr);
  return s;
}
function __cm_decryptBlock(input, exp) {
  var s = input.slice();
  __cm_addRoundKey(s, exp.w, exp.Nr);
  for (var round = exp.Nr - 1; round >= 1; round--) {
    __cm_invShiftRows(s);
    __cm_invSubBytes(s);
    __cm_addRoundKey(s, exp.w, round);
    __cm_invMixColumns(s);
  }
  __cm_invShiftRows(s);
  __cm_invSubBytes(s);
  __cm_addRoundKey(s, exp.w, 0);
  return s;
}
function __cm_toArray(data) {
  var out = new Array(data.length);
  for (var i = 0; i < data.length; i++) out[i] = data[i] & 0xff;
  return out;
}
function __cm_cbcEncrypt(data, key, iv) {
  var exp = __cm_expandKey(key);
  var pad = 16 - (data.length % 16);
  var out = [];
  var prev = iv.slice();
  for (var off = 0; off < data.length + pad; off += 16) {
    var block = new Array(16);
    for (var i = 0; i < 16; i++) {
      block[i] = ((off + i < data.length ? data[off + i] : pad) ^ prev[i]) & 0xff;
    }
    var enc = __cm_encryptBlock(block, exp);
    for (var j = 0; j < 16; j++) out.push(enc[j]);
    prev = enc;
  }
  return out;
}
function __cm_cbcDecrypt(data, key, iv) {
  if (data.length === 0 || data.length % 16 !== 0) throw new Error("bad ciphertext length");
  var exp = __cm_expandKey(key);
  var out = [];
  var prev = iv.slice();
  for (var off = 0; off < data.length; off += 16) {
    var block = data.slice(off, off + 16);
    var dec = __cm_decryptBlock(block, exp);
    for (var i = 0; i < 16; i++) dec[i] ^= prev[i];
    for (var j = 0; j < 16; j++) out.push(dec[j]);
    prev = block;
  }
  var pad = out[out.length - 1];
  if (pad < 1 || pad > 16) throw new Error("bad padding");
  for (var i = 0; i < pad; i++) {
    if (out[out.length - 1 - i] !== pad) throw new Error("bad padding");
  }
  return out.slice(0, out.length - pad);
}
if (typeof $crypto === "undefined") {
  var $crypto = {
    aes: {
      encrypt: function (data, opts) {
        if (!opts || opts.mode !== "cbc" || opts.padding !== "pkcs7") throw new Error("unsupported aes options");
        return { ciphertext: __cm_cbcEncrypt(__cm_toArray(data), __cm_toArray(opts.key), __cm_toArray(opts.iv)) };
      },
      decrypt: function (data, opts) {
        if (!opts || opts.mode !== "cbc" || opts.padding !== "pkcs7") throw new Error("unsupported aes options");
        return __cm_cbcDecrypt(__cm_toArray(data), __cm_toArray(opts.key), __cm_toArray(opts.iv));
      }
    }
  };
}

// Surge 移植：$argument 解析。Loon 传对象，Surge 传字符串（模块 argument 参数）。
// 字符串格式为分号分隔的 k:v（模块里拼，不含逗号，避免 [Script] 行解析问题）。
// 无法识别的值不写入，交给脚本内 ARGUMENT_DEFAULTS 兜底（占位符未替换时也安全）。
function __parseSurgeArgs() {
  var a = (typeof $argument !== "undefined") ? $argument : undefined;
  if (a && typeof a === "object") return a;
  var o = {};
  if (typeof a === "string") {
    var parts = a.split(";");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split(":");
      if (kv.length === 2) {
        if (kv[1] === "true" || kv[1] === "1") o[kv[0]] = true;
        else if (kv[1] === "false" || kv[1] === "0") o[kv[0]] = false;
      }
    }
  }
  return o;
}
