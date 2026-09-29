(function () {
  "use strict";

  var AES_KEY = "RYV0hCV1lV25KYVJ";
  var AES_IV = "VjFSQ1ZtVkQxRTlQ";
  var H5_AES_KEY = "UVic06tpXgMNiApm";
  var H5_AES_IV = "9791027341711819";
  var RECHARGE_AES_KEY = "043AOQGK6ykklyZA";

  var ARGUMENTS =
    typeof $argument === "object" && $argument !== null ? $argument : {};

  var ARGUMENT_DEFAULTS = {
    HomeBasicClean: true,
    HideTopFamily: false,
    HideTopAge: false,
    HideTopPhone: false,
    HideTopNearby: false,
    HideTopAI: false,
    HideTopEnterprise: false,
    MineClean: true,
    HideMyCheckIn: false,
    HideMyMarketing: false,
    HideMyServices: false,
    HideMyFamilyCube: false,
    HideMyDevicesCube: false,
    HideMyMiniProgram: false,
    HideMyDigitalHuman: false,
    HideMySelections: false,
    HideMyGroup: false,
    HideMyRingtone: false,
    HideMyCloudDrive: false,
    HideMyToolbox: false,
    HideMyLifeServices: false
  };

  function enabled(name) {
    var value = Object.prototype.hasOwnProperty.call(ARGUMENTS, name)
      ? ARGUMENTS[name]
      : ARGUMENT_DEFAULTS[name];
    return value === true || value === "true" || value === 1 || value === "1";
  }

  var SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ];

  var INV_SBOX = (function () {
    var inverse = new Array(256);
    for (var i = 0; i < 256; i++) inverse[SBOX[i]] = i;
    return inverse;
  })();

  function utf8Encode(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
        var low = text.charCodeAt(i + 1);
        if (low >= 0xdc00 && low <= 0xdfff) {
          code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
          i++;
        }
      }
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return bytes;
  }

  function utf8Decode(bytes) {
    var text = "";
    for (var i = 0; i < bytes.length;) {
      var first = bytes[i++];
      var code;
      if (first < 0x80) {
        code = first;
      } else if ((first & 0xe0) === 0xc0) {
        code = ((first & 0x1f) << 6) | (bytes[i++] & 0x3f);
      } else if ((first & 0xf0) === 0xe0) {
        code = ((first & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      } else {
        code = ((first & 0x07) << 18) |
          ((bytes[i++] & 0x3f) << 12) |
          ((bytes[i++] & 0x3f) << 6) |
          (bytes[i++] & 0x3f);
      }
      if (code <= 0xffff) {
        text += String.fromCharCode(code);
      } else {
        code -= 0x10000;
        text += String.fromCharCode(0xd800 | (code >> 10), 0xdc00 | (code & 0x3ff));
      }
    }
    return text;
  }

  var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var BASE64_DECODE = (function () {
    var map = [];
    for (var i = 0; i < 64; i++) map[BASE64.charCodeAt(i)] = i;
    return map;
  })();

  function base64Decode(text) {
    text = String(text).replace(/\s+/g, "");
    var length = text.length;
    if (!length || length % 4 !== 0) throw new Error("base64");
    var padding = text.charCodeAt(length - 1) === 61
      ? (text.charCodeAt(length - 2) === 61 ? 2 : 1)
      : 0;
    var bytes = new Array((length >>> 2) * 3 - padding);
    var output = 0;
    for (var i = 0; i < length; i += 4) {
      var c0 = BASE64_DECODE[text.charCodeAt(i)];
      var c1 = BASE64_DECODE[text.charCodeAt(i + 1)];
      var code2 = text.charCodeAt(i + 2);
      var code3 = text.charCodeAt(i + 3);
      var c2 = code2 === 61 ? 0 : BASE64_DECODE[code2];
      var c3 = code3 === 61 ? 0 : BASE64_DECODE[code3];
      if (
        c0 === undefined ||
        c1 === undefined ||
        c2 === undefined ||
        c3 === undefined
      ) throw new Error("base64");
      var value = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      bytes[output++] = (value >>> 16) & 0xff;
      if (code2 !== 61) bytes[output++] = (value >>> 8) & 0xff;
      if (code3 !== 61) bytes[output++] = value & 0xff;
    }
    return bytes;
  }

  function base64Encode(bytes) {
    var text = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var a = bytes[i];
      var b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var value = (a << 16) | (b << 8) | c;
      text += BASE64.charAt((value >>> 18) & 0x3f);
      text += BASE64.charAt((value >>> 12) & 0x3f);
      text += i + 1 < bytes.length ? BASE64.charAt((value >>> 6) & 0x3f) : "=";
      text += i + 2 < bytes.length ? BASE64.charAt(value & 0x3f) : "=";
    }
    return text;
  }

  function xtime(value) {
    return ((value << 1) ^ ((value & 0x80) ? 0x11b : 0)) & 0xff;
  }

  function expandKey(key) {
    if (key.length !== 16) throw new Error("key");
    var expanded = key.slice();
    var generated = 16;
    var rcon = 1;
    var temp = new Array(4);
    while (generated < 176) {
      for (var i = 0; i < 4; i++) temp[i] = expanded[generated - 4 + i];
      if (generated % 16 === 0) {
        var first = temp.shift();
        temp.push(first);
        for (i = 0; i < 4; i++) temp[i] = SBOX[temp[i]];
        temp[0] ^= rcon;
        rcon = xtime(rcon);
      }
      for (i = 0; i < 4; i++) {
        expanded[generated] = expanded[generated - 16] ^ temp[i];
        generated++;
      }
    }
    return expanded;
  }

  function addRoundKey(state, expanded, offset) {
    for (var i = 0; i < 16; i++) state[i] ^= expanded[offset + i];
  }

  function substitute(state, box) {
    for (var i = 0; i < 16; i++) state[i] = box[state[i]];
  }

  function shiftRows(state, inverse) {
    var value;
    if (inverse) {
      value = state[13];
      state[13] = state[9];
      state[9] = state[5];
      state[5] = state[1];
      state[1] = value;
      value = state[2];
      state[2] = state[10];
      state[10] = value;
      value = state[6];
      state[6] = state[14];
      state[14] = value;
      value = state[3];
      state[3] = state[7];
      state[7] = state[11];
      state[11] = state[15];
      state[15] = value;
    } else {
      value = state[1];
      state[1] = state[5];
      state[5] = state[9];
      state[9] = state[13];
      state[13] = value;
      value = state[2];
      state[2] = state[10];
      state[10] = value;
      value = state[6];
      state[6] = state[14];
      state[14] = value;
      value = state[15];
      state[15] = state[11];
      state[11] = state[7];
      state[7] = state[3];
      state[3] = value;
    }
  }

  function mixColumns(state) {
    for (var column = 0; column < 4; column++) {
      var offset = column * 4;
      var a0 = state[offset];
      var a1 = state[offset + 1];
      var a2 = state[offset + 2];
      var a3 = state[offset + 3];
      var all = a0 ^ a1 ^ a2 ^ a3;
      state[offset] ^= all ^ xtime(a0 ^ a1);
      state[offset + 1] ^= all ^ xtime(a1 ^ a2);
      state[offset + 2] ^= all ^ xtime(a2 ^ a3);
      state[offset + 3] ^= all ^ xtime(a3 ^ a0);
    }
  }

  function inverseMixColumns(state) {
    for (var column = 0; column < 4; column++) {
      var offset = column * 4;
      var a0 = state[offset];
      var a1 = state[offset + 1];
      var a2 = state[offset + 2];
      var a3 = state[offset + 3];
      var u = xtime(xtime(a0 ^ a2));
      var v = xtime(xtime(a1 ^ a3));
      a0 ^= u;
      a1 ^= v;
      a2 ^= u;
      a3 ^= v;
      var all = a0 ^ a1 ^ a2 ^ a3;
      state[offset] = a0 ^ all ^ xtime(a0 ^ a1);
      state[offset + 1] = a1 ^ all ^ xtime(a1 ^ a2);
      state[offset + 2] = a2 ^ all ^ xtime(a2 ^ a3);
      state[offset + 3] = a3 ^ all ^ xtime(a3 ^ a0);
    }
  }

  function encryptBlock(state, expanded) {
    addRoundKey(state, expanded, 0);
    for (var round = 1; round < 10; round++) {
      substitute(state, SBOX);
      shiftRows(state, false);
      mixColumns(state);
      addRoundKey(state, expanded, round * 16);
    }
    substitute(state, SBOX);
    shiftRows(state, false);
    addRoundKey(state, expanded, 160);
    return state;
  }

  function decryptBlock(state, expanded) {
    addRoundKey(state, expanded, 160);
    for (var round = 9; round > 0; round--) {
      shiftRows(state, true);
      substitute(state, INV_SBOX);
      addRoundKey(state, expanded, round * 16);
      inverseMixColumns(state);
    }
    shiftRows(state, true);
    substitute(state, INV_SBOX);
    addRoundKey(state, expanded, 0);
    return state;
  }

  function aesCbcEncrypt(bytes, key, iv) {
    var padding = 16 - (bytes.length % 16);
    var length = bytes.length + padding;
    var expanded = expandKey(key);
    var output = new Array(length);
    var state = new Array(16);
    for (var offset = 0; offset < length; offset += 16) {
      for (var i = 0; i < 16; i++) {
        var value = offset + i < bytes.length ? bytes[offset + i] : padding;
        state[i] = value ^ (
          offset === 0 ? iv[i] : output[offset - 16 + i]
        );
      }
      encryptBlock(state, expanded);
      for (i = 0; i < 16; i++) output[offset + i] = state[i];
    }
    return output;
  }

  function aesCbcDecrypt(bytes, key, iv) {
    if (!bytes.length || bytes.length % 16 !== 0) throw new Error("cipher");
    var expanded = expandKey(key);
    var output = new Array(bytes.length);
    var state = new Array(16);
    for (var offset = 0; offset < bytes.length; offset += 16) {
      for (var i = 0; i < 16; i++) state[i] = bytes[offset + i];
      decryptBlock(state, expanded);
      for (i = 0; i < 16; i++) {
        output[offset + i] = state[i] ^ (
          offset === 0 ? iv[i] : bytes[offset - 16 + i]
        );
      }
    }
    var padding = output[output.length - 1];
    if (padding < 1 || padding > 16 || padding > output.length) throw new Error("padding");
    for (var p = output.length - padding; p < output.length; p++) {
      if (output[p] !== padding) throw new Error("padding");
    }
    output.length -= padding;
    return output;
  }

  function leftRotate(value, count) {
    return ((value << count) | (value >>> (32 - count))) >>> 0;
  }

  function md5(text) {
    var bytes = utf8Encode(text);
    var bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var low = bitLength >>> 0;
    var high = Math.floor(bitLength / 0x100000000) >>> 0;
    for (var i = 0; i < 4; i++) bytes.push((low >>> (8 * i)) & 0xff);
    for (i = 0; i < 4; i++) bytes.push((high >>> (8 * i)) & 0xff);

    var shifts = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    var constants = [];
    for (i = 0; i < 64; i++) constants[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;

    var a0 = 0x67452301;
    var b0 = 0xefcdab89;
    var c0 = 0x98badcfe;
    var d0 = 0x10325476;

    for (var offset = 0; offset < bytes.length; offset += 64) {
      var words = new Array(16);
      for (i = 0; i < 16; i++) {
        var at = offset + i * 4;
        words[i] = (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
      }
      var a = a0;
      var b = b0;
      var c = c0;
      var d = d0;
      for (i = 0; i < 64; i++) {
        var f;
        var g;
        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) % 16;
        }
        var oldD = d;
        d = c;
        c = b;
        var sum = (a + (f >>> 0) + constants[i] + words[g]) >>> 0;
        b = (b + leftRotate(sum, shifts[i])) >>> 0;
        a = oldD;
      }
      a0 = (a0 + a) >>> 0;
      b0 = (b0 + b) >>> 0;
      c0 = (c0 + c) >>> 0;
      d0 = (d0 + d) >>> 0;
    }

    function littleEndianHex(value) {
      var result = "";
      for (var i = 0; i < 4; i++) result += ("0" + ((value >>> (i * 8)) & 0xff).toString(16)).slice(-2);
      return result;
    }

    return littleEndianHex(a0) + littleEndianHex(b0) + littleEndianHex(c0) + littleEndianHex(d0);
  }

  function getHeader(headers, wanted) {
    if (!headers) return undefined;
    wanted = wanted.toLowerCase();
    for (var name in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, name) && name.toLowerCase() === wanted) return headers[name];
    }
    return undefined;
  }

  function setHeader(headers, wanted, value) {
    var lower = wanted.toLowerCase();
    for (var name in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, name) && name.toLowerCase() === lower) {
        headers[name] = value;
        return;
      }
    }
    headers[wanted] = value;
  }

  function deleteHeader(headers, wanted) {
    var lower = wanted.toLowerCase();
    for (var name in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, name) && name.toLowerCase() === lower) delete headers[name];
    }
  }

  function decryptJson(ciphertext, keyText, ivText) {
    return JSON.parse(
      utf8Decode(
        aesCbcDecrypt(
          base64Decode(ciphertext),
          utf8Encode(keyText),
          utf8Encode(ivText)
        )
      )
    );
  }

  function encryptJson(payload, keyText, ivText) {
    return base64Encode(
      aesCbcEncrypt(
        utf8Encode(JSON.stringify(payload)),
        utf8Encode(keyText),
        utf8Encode(ivText)
      )
    );
  }

  function signedResult(body) {
    var nonce = getHeader($request.headers, "x-nonce");
    if (nonce === undefined || nonce === null || nonce === "") {
      throw new Error("nonce");
    }

    var headers = {};
    var originalHeaders = $response.headers || {};
    for (var name in originalHeaders) {
      if (Object.prototype.hasOwnProperty.call(originalHeaders, name)) {
        headers[name] = originalHeaders[name];
      }
    }
    setHeader(headers, "r-token", md5(String(nonce) + "+" + body));
    deleteHeader(headers, "content-length");
    return { body: body, headers: headers };
  }

  function isWaterfallArea(area) {
    if (!area) return false;
    if (String(area.waterfall) === "1") return true;

    if (Array.isArray(area.additionInfo)) {
      for (var index = 0; index < area.additionInfo.length; index += 1) {
        var item = area.additionInfo[index];
        if (
          String(item && item.name).toLowerCase() === "waterfall" &&
          String(item && item.value) === "1"
        ) return true;
      }
    }

    return !!(
      area.additionInfoMap &&
      String(area.additionInfoMap.waterfall) === "1"
    );
  }

  function filterHomePage(payload) {
    var body = payload && payload.rspBody;
    if (!body || !Array.isArray(body.areaList)) return false;
    var homeClean = enabled("HomeBasicClean");
    var changed = false;

    if (homeClean) {
      var removedAreas = {
        "20260508002": true,
        "20241010002": true,
        "20250609002": true,
        "20250929002": true,
        "20241115002": true,
        "20241213006": true,
        "20241115004": true,
        "20241119002": true
      };
      var before = body.areaList.length;
      body.areaList = body.areaList.filter(function (area) {
        return (
          !removedAreas[String(area && area.areaId)] &&
          !isWaterfallArea(area)
        );
      });
      changed = body.areaList.length !== before;
      var pageNo = Number(body.lastPageNo);

      if (
        (pageNo === 1 || (body.areaList.length === 0 && pageNo > 1)) &&
        body.lastPage !== true
      ) {
        body.lastPage = true;
        changed = true;
      }
    }

    body.areaList.forEach(function (area) {
      var areaId = String(area && area.areaId);
      if (!Array.isArray(area.moduleList)) return;

      if (areaId === "20250829002") {
        if (homeClean) {
          var moduleCount = area.moduleList.length;
          area.moduleList = area.moduleList.filter(function (module) {
            return String(module && module.moduleId) !== "XBYYW01";
          });
          if (area.moduleList.length !== moduleCount) changed = true;
        }

        var topSwitchByTabId = {
          "1": "HideTopFamily",
          "2": "HideTopAge",
          "3": "HideTopPhone",
          "4": "HideTopNearby",
          "5": "HideTopAI",
          "6": "HideTopEnterprise"
        };
        area.moduleList.forEach(function (module) {
          if (String(module && module.moduleId) !== "XBTB01" || !Array.isArray(module.codeTableList)) return;
          var tabCount = module.codeTableList.length;
          module.codeTableList = module.codeTableList.filter(function (tab) {
            var switchName = topSwitchByTabId[String(tab && tab.tabId)];
            return !switchName || !enabled(switchName);
          });
          if (module.codeTableList.length !== tabCount) changed = true;
        });
      }

      if (homeClean && areaId === "20250829004") {
        area.moduleList.forEach(function (module) {
          if (String(module && module.moduleId) !== "XBAN01" || !Array.isArray(module.adverList)) return;
          var adCount = module.adverList.length;
          module.adverList = module.adverList.filter(function (adver) {
            return JSON.stringify(adver).indexOf("签到") < 0;
          });
          if (module.adverList.length !== adCount) changed = true;
        });
      }

      if (homeClean && areaId === "20250829008") {
        area.moduleList.forEach(function (module) {
          if (String(module && module.moduleId) !== "XBZB01" || !Array.isArray(module.adverList)) return;
          module.adverList.forEach(function (adver) {
            if (
              String(adver && adver.cornerIsShow) !== "1" &&
              String(adver && adver.vCornerMarkShow) !== "1" &&
              !String(adver && adver.vCornerMark || "")
            ) return;
            adver.cornerIsShow = "0";
            adver.vCornerMarkShow = "0";
            adver.vCornerMark = "";
            changed = true;
          });
        });
      }
    });
    return changed;
  }

  function shouldHideTopTab(tab) {
    var channelId = String(tab && tab.channelId || "");
    if (channelId === "P00000063396") return enabled("HideTopFamily");
    if (channelId === "P00000063397") return enabled("HideTopAge");
    if (channelId === "P00000090722") return enabled("HideTopPhone");
    if (channelId === "P00000090723") return enabled("HideTopNearby");
    if (channelId === "P00000091556") return enabled("HideTopEnterprise");
    return false;
  }

  function filterNavigation(payload) {
    var body = payload && payload.rspBody;
    if (!body) return false;
    var changed = false;

    var topTabs = body.labelList && body.labelList.topTabList;
    if (Array.isArray(topTabs)) {
      var topCount = topTabs.length;
      body.labelList.topTabList = topTabs.filter(function (tab) {
        return !shouldHideTopTab(tab);
      });
      if (body.labelList.topTabList.length !== topCount) changed = true;
    }

    return changed;
  }

  function filterSearchWords(payload) {
    if (!enabled("HomeBasicClean")) return false;
    var body = payload && payload.rspBody;
    if (!body || !Array.isArray(body.searchWordList) || body.searchWordList.length === 0) return false;
    body.searchWordList = [];
    return true;
  }

  function filterMyPage(payload) {
    var body = payload && payload.rspBody;
    if (!body || !Array.isArray(body.areaList)) return false;
    var myPageAreaHideSwitches = {
      "20230721008": "HideMyCheckIn",
      "20230721012": "HideMyMarketing",
      "20230721018": "HideMyServices",
      "20240708002": "HideMyFamilyCube",
      "20251024002": "HideMyDevicesCube",
      "20231017002": "HideMyMiniProgram",
      "20230721020": "HideMyDigitalHuman",
      "20230721030": "HideMySelections",
      "20230721036": "HideMyGroup",
      "20251230002": "HideMyRingtone",
      "20240624002": "HideMyCloudDrive",
      "20230721044": "HideMyToolbox",
      "20230928004": "HideMyLifeServices"
    };
    var before = body.areaList.length;
    body.areaList = body.areaList.filter(function (area) {
      var switchName = myPageAreaHideSwitches[String(area && area.areaId)];
      return switchName && !enabled(switchName);
    });
    return body.areaList.length !== before;
  }

  function filterServicePages(payload) {
    var body = payload && payload.rspBody;
    if (!body || !Array.isArray(body.areaList)) return false;

    var waterfallAreas = {
      "20260320004": true,
      "20260320008": true,
      "20260320012": true,
      "20260320016": true,
      "20260320020": true
    };
    var waterfallFloors = {
      "20260320006": true,
      "20260320010": true,
      "20260320014": true,
      "20260320018": true,
      "20260320022": true
    };
    var clearWaterfall = !!(
      body.waterfall &&
      waterfallFloors[String(body.waterfall.floorCode)]
    );
    if (!clearWaterfall) {
      for (var areaIndex = 0; areaIndex < body.areaList.length; areaIndex += 1) {
        var areaId = String(
          body.areaList[areaIndex] && body.areaList[areaIndex].areaId
        );
        if (waterfallAreas[areaId]) {
          clearWaterfall = true;
          break;
        }
      }
    }

    var removedAreas = {
      "20230515006": true,
      "20230609002": true,
      "20230515007": true,
      "20230621006": true,
      "20230621022": true,
      "20230621026": true,
      "20230621030": true,
      "20230515017": true,
      "20230515018": true,
      "20230719002": true,
      "20240513002": true,
      "20230719004": true,
      "20260320004": true,
      "20260320008": true,
      "20260320012": true,
      "20260320016": true,
      "20260320020": true
    };
    if (enabled("MineClean")) {
      removedAreas["20230621010"] = true;
      removedAreas["20230621014"] = true;
    }

    var before = body.areaList.length;
    body.areaList = body.areaList.filter(function (area) {
      return !removedAreas[String(area && area.areaId)];
    });
    var changed = body.areaList.length !== before;

    if (
      clearWaterfall &&
      body.waterfall !== null &&
      body.waterfall !== undefined
    ) {
      body.waterfall = null;
      changed = true;
    }

    body.areaList.forEach(function (area) {
      if (!Array.isArray(area && area.moduleList)) return;
      var areaId = String(area.areaId);

      if (areaId === "20230515002") {
        area.moduleList.forEach(function (module) {
          if (!Array.isArray(module && module.adverList)) return;
          var adCount = module.adverList.length;
          module.adverList = module.adverList.filter(function (adver) {
            return (
              String(adver && adver.markId) !== "1066197397" &&
              String(adver && adver.vSubject2) !== "领取本月红包"
            );
          });
          if (module.adverList.length !== adCount) changed = true;
        });
      }

      if (areaId === "20230515008") {
        var moduleCount = area.moduleList.length;
        area.moduleList.forEach(function (module) {
          if (!Array.isArray(module && module.adverList)) return;
          var adCount = module.adverList.length;
          module.adverList = module.adverList.filter(function (adver) {
            return String(adver && adver.markId) !== "1535899052";
          });
          if (module.adverList.length !== adCount) changed = true;
        });
        area.moduleList = area.moduleList.filter(function (module) {
          return (
            String(module && module.moduleId) !== "market-banner-1-001" &&
            (!Array.isArray(module && module.adverList) || module.adverList.length > 0)
          );
        });
        if (area.moduleList.length !== moduleCount) changed = true;
      }
    });

    return changed;
  }

  function filterMessageRecommendations(payload) {
    var body = payload && payload.rspBody;
    if (!body || typeof body !== "object") return false;
    var changed = false;

    for (var category in body) {
      if (!Object.prototype.hasOwnProperty.call(body, category) || !Array.isArray(body[category])) continue;
      var before = body[category].length;
      body[category] = body[category].filter(function (message) {
        return String(message && message.messageId) !== "1541887004";
      });
      if (body[category].length !== before) changed = true;
    }

    return changed;
  }

  function filterCouponRecommendations(payload) {
    var body = payload && payload.rspBody;
    if (!body || !Array.isArray(body.adverList) || body.adverList.length === 0) return false;
    body.adverList = [];
    return true;
  }

  function filterRechargeCommonBoard(payload) {
    var body = payload && payload.rspBody;
    if (!body || !Array.isArray(body.commonBoardDbList)) return false;
    var before = body.commonBoardDbList.length;
    body.commonBoardDbList = body.commonBoardDbList.filter(function (item) {
      return String(item && item.advLocation) !== "1";
    });
    return body.commonBoardDbList.length !== before;
  }

  function filterRechargePage(url, payload) {
    if (/\/i\/v1\/cust\/aiMainQry\//.test(url)) {
      if (!payload || String(payload.showFlag) === "0") return false;
      payload.showFlag = "0";
      return true;
    }

    if (/\/i\/v1\/cust\/iopBatchQry\//.test(url)) {
      if (
        !payload ||
        !Array.isArray(payload.specialOfferZone) ||
        payload.specialOfferZone.length === 0
      ) return false;
      payload.specialOfferZone = [];
      return true;
    }

    return false;
  }

  function filterAggregationData(payload) {
    if (!enabled("HomeBasicClean")) return false;
    var body = payload && payload.rspBody;
    if (!body) return false;
    var changed = false;

    if (Object.prototype.hasOwnProperty.call(body, "topPullSecond")) {
      delete body.topPullSecond;
      changed = true;
    }

    if (Array.isArray(body.popUpList)) {
      var popupCount = body.popUpList.length;
      body.popUpList = body.popUpList.filter(function (item) {
        return String(item && item.isAdvert) !== "1";
      });
      if (body.popUpList.length !== popupCount) changed = true;
    }

    var suspension = body.suspensionAdver;
    if (suspension) {
      var listNames = ["pageList", "suspensionList", "liveSuspensionList", "lingXiPageList", "floatingWindow"];
      listNames.forEach(function (listName) {
        if (!Array.isArray(suspension[listName]) || suspension[listName].length === 0) return;
        suspension[listName] = [];
        changed = true;
      });
    }

    var provinceConfig = body.provinceCodeChanage;
    if (provinceConfig && Array.isArray(provinceConfig.areaList)) {
      provinceConfig.areaList.forEach(function (area) {
        if (!Array.isArray(area.moduleList)) return;
        area.moduleList.forEach(function (module) {
          if (!Array.isArray(module.adverList)) return;
          var before = module.adverList.length;
          module.adverList = module.adverList.filter(function (adver) {
            return JSON.stringify(adver).indexOf("签到") < 0;
          });
          if (module.adverList.length !== before) changed = true;
        });
      });
    }

    return changed;
  }

  try {
    var responseBody = $response.body;
    if (!responseBody) {
      $done({});
      return;
    }

    var url = String($request.url || "");
    if (/\/i\/v1\/pay\/popWindowQry\//.test(url)) {
      var popupEnvelope = JSON.parse(responseBody);
      if (!popupEnvelope || popupEnvelope.data == null) {
        $done({});
        return;
      }
      popupEnvelope.data = null;
      $done({ body: JSON.stringify(popupEnvelope) });
      return;
    }

    if (/\/i\/v1\/cust\/(?:aiMainQry|iopBatchQry)\//.test(url)) {
      var rechargeEnvelope = JSON.parse(responseBody);
      var rechargeOutParam =
        rechargeEnvelope &&
        rechargeEnvelope.data &&
        rechargeEnvelope.data.outParam;
      if (typeof rechargeOutParam !== "string" || rechargeOutParam === "") {
        $done({});
        return;
      }

      var rechargeCiphertext = utf8Decode(
        base64Decode(rechargeOutParam.replace(/\s/g, ""))
      ).replace(/\s/g, "");
      var rechargePayload = decryptJson(
        rechargeCiphertext,
        RECHARGE_AES_KEY,
        RECHARGE_AES_KEY
      );
      if (!filterRechargePage(url, rechargePayload)) {
        $done({});
        return;
      }

      rechargeEnvelope.data.outParam = base64Encode(
        utf8Encode(
          encryptJson(
            rechargePayload,
            RECHARGE_AES_KEY,
            RECHARGE_AES_KEY
          )
        )
      );
      $done({ body: JSON.stringify(rechargeEnvelope) });
      return;
    }

    if (
      /\/(?:DH\/(?:message_query\/message\/query\/list|myCardVoucher\/getBannerList)|DA\/commonBoard\/getCommonBoard)(?:\?|$)/.test(url) &&
      String(getHeader($response.headers, "x-pen")) === "1"
    ) {
      var messageEnvelope = JSON.parse(responseBody);
      if (!messageEnvelope || typeof messageEnvelope.body !== "string") {
        $done({});
        return;
      }

      var messagePayload = decryptJson(
        messageEnvelope.body,
        H5_AES_KEY,
        H5_AES_IV
      );
      var h5Changed = /\/DH\/myCardVoucher\/getBannerList(?:\?|$)/.test(url)
        ? filterCouponRecommendations(messagePayload)
        : /\/DA\/commonBoard\/getCommonBoard(?:\?|$)/.test(url)
          ? filterRechargeCommonBoard(messagePayload)
          : filterMessageRecommendations(messagePayload);
      if (!h5Changed) {
        $done({});
        return;
      }

      messageEnvelope.body = encryptJson(
        messagePayload,
        H5_AES_KEY,
        H5_AES_IV
      );
      var messageBody = JSON.stringify(messageEnvelope);
      $done(signedResult(messageBody));
      return;
    }

    if (String(getHeader($response.headers, "x-pen")) !== "14") {
      $done({});
      return;
    }

    var declaredLength = parseInt(getHeader($response.headers, "content-length"), 10);
    if (declaredLength > 0 && declaredLength < responseBody.length) {
      responseBody = responseBody.slice(0, declaredLength);
    }

    var payload = decryptJson(responseBody, AES_KEY, AES_IV);
    var changed = false;

    if (/\/DN\/homePage\/getTopAreaList(?:\?|$)/.test(url)) {
      changed = filterHomePage(payload);
    } else if (/\/DN\/myPageNew\/getMyPageNew(?:\?|$)/.test(url)) {
      changed = filterMyPage(payload);
    } else if (/\/DN\/multipleInterfaces\/aggregationData(?:\?|$)/.test(url)) {
      changed = filterAggregationData(payload);
    } else if (/\/DN\/init\/getNavigation(?:\?|$)/.test(url)) {
      changed = filterNavigation(payload);
    } else if (/\/DN\/searchWord\/getSearchWordInfo(?:\?|$)/.test(url)) {
      changed = filterSearchWords(payload);
    } else if (/\/DA\/baseServiceFunction\/getAdverList(?:\?|$)/.test(url)) {
      changed = filterServicePages(payload);
    }

    if (!changed) {
      $done({});
      return;
    }

    $done(signedResult(encryptJson(payload, AES_KEY, AES_IV)));
  } catch (error) {
    $done({});
  }
})();
