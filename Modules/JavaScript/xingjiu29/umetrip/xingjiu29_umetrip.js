const req = $request || {};
const res = $response || {};
const headers = req.headers || {};
function rpidFromUrl(url) {
  const matched = /[?&]rpid=([^&]+)/i.exec(String(url || ""));
  return matched ? decodeURIComponent(matched[1]) : "";
}
const rpid =
  String(headers.rpid || headers.Rpid || "").trim() || rpidFromUrl(req.url);
const EMPTY_PAYLOAD_RESPONSE = ["1000019", "1420002", "1370286", "1430064"];
const HOME_KEEP_GROUPS = [
  10277, 10691, 111358, 111411, 111352, 111406, 111407, 111365, 111448
];
const HOME_SIGNATURE = [10277, 10691, 111358, 111352, 111411, 111406, 111407];
const TARGET_GROUPS = [111353, 111435, 111357, 111442, 10673];
const TARGET_NAMES = /无行程机票直销卡片|发现目的地|本地服务标题|新人券包/;
const REMOVE_ADVERT_SECTIONS = true;
const MY_PAGE_GROUPS = [111402, 111403, 111404];
const DEBUG = true;
function log(message) {
  if (DEBUG) console.log("UMETRIP " + message);
}
const isUmetripNative = /\/gateway\/api\/umetrip\/native/i.test(String(req.url || ""));
const bodySize = res.body && res.body.length ? res.body.length : 0;
if (!isUmetripNative && EMPTY_PAYLOAD_RESPONSE.indexOf(rpid) < 0) {
  $done({});
} else if (bodySize > 300000) {
  log("skip large body: " + rpid + " " + bodySize);
  $done({});
} else {
  const body = res.body;
  if (!(body instanceof Uint8Array)) {
    log("body is not Uint8Array (" + typeof body + "); passthrough");
    $done({});
  } else {
    const decoder = new TextDecoder("utf-8");
    function readVarint(bytes, pos) {
      let value = 0;
      let shift = 0;
      while (pos < bytes.length && shift < 53) {
        const byte = bytes[pos++];
        value += (byte & 0x7f) * Math.pow(2, shift);
        if ((byte & 0x80) === 0) return [value, pos];
        shift += 7;
      }
      throw new Error("Invalid Protobuf varint");
    }
    function writeVarint(value) {
      const out = [];
      while (value > 127) {
        out.push((value & 0x7f) | 0x80);
        value = Math.floor(value / 128);
      }
      out.push(value);
      return out;
    }
    function parseFields(bytes) {
      const fields = [];
      let pos = 0;
      while (pos < bytes.length) {
        const start = pos;
        let tag;
        [tag, pos] = readVarint(bytes, pos);
        const fieldNo = Math.floor(tag / 8);
        const wireType = tag & 7;
        if (fieldNo <= 0) throw new Error("Invalid field number");
        let value;
        let payloadStart;
        let payloadEnd;
        if (wireType === 0) {
          [value, pos] = readVarint(bytes, pos);
        } else if (wireType === 1) {
          pos += 8;
        } else if (wireType === 2) {
          let length;
          [length, pos] = readVarint(bytes, pos);
          payloadStart = pos;
          pos += length;
          payloadEnd = pos;
        } else if (wireType === 5) {
          pos += 4;
        } else {
          throw new Error("Unsupported Protobuf wire type: " + wireType);
        }
        if (pos > bytes.length) throw new Error("Truncated Protobuf field");
        fields.push({
          fieldNo,
          wireType,
          value,
          start,
          end: pos,
          payloadStart,
          payloadEnd
        });
      }
      return fields;
    }
    function concat(parts) {
      let total = 0;
      for (const part of parts) total += part.length;
      const out = new Uint8Array(total);
      let offset = 0;
      for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
      }
      return out;
    }
    function wrapLengthField(fieldNo, payload) {
      return concat([
        new Uint8Array(writeVarint(fieldNo * 8 + 2)),
        new Uint8Array(writeVarint(payload.length)),
        payload
      ]);
    }
    function payloadOf(bytes, field) {
      return bytes.subarray(field.payloadStart, field.payloadEnd);
    }
    function emptyPage() {
      return concat([
        wrapLengthField(1, new Uint8Array(0)),
        new Uint8Array([0x10, 0x00]),
        new Uint8Array([0x20, 0x00])
      ]);
    }
    function emptyPayload(bytes) {
      const kept = [];
      const page = emptyPage();
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 7 && field.wireType === 2) {
          kept.push(wrapLengthField(7, page));
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return concat(kept);
    }
    function parseSection(bytes) {
      let fields;
      try {
        fields = parseFields(bytes);
      } catch (error) {
        return null;
      }
      let groupId = -1;
      let hasCard = false;
      let advert = false;
      for (const field of fields) {
        if (field.fieldNo === 2 && field.wireType === 0) groupId = field.value;
        if (
          (field.fieldNo === 8 || field.fieldNo === 32) &&
          field.wireType === 2
        ) {
          hasCard = true;
        }
        if (
          REMOVE_ADVERT_SECTIONS &&
          field.fieldNo === 37 &&
          field.wireType === 2 &&
          decoder.decode(payloadOf(bytes, field)).trim() === "ADVERT"
        ) {
          advert = true;
        }
      }
      if (!hasCard) return null;
      return { groupId, advert, fields };
    }
    function sectionIsTarget(bytes) {
      const info = parseSection(bytes);
      if (!info) return false;
      if (TARGET_GROUPS.indexOf(info.groupId) >= 0) return true;
      if (info.advert) return true;
      return TARGET_NAMES.test(decoder.decode(bytes));
    }
    function cleanSectionList(bytes, stats) {
      const fields = parseFields(bytes);
      const items = [];
      for (const field of fields) {
        const isSection = field.fieldNo === 5 && field.wireType === 2;
        const section = isSection ? payloadOf(bytes, field) : null;
        const info = isSection ? parseSection(section) : null;
        if (info) {
          stats.total++;
          if (stats.gids.length < 12) stats.gids.push(info.groupId);
          if (HOME_SIGNATURE.indexOf(info.groupId) >= 0) stats.signature++;
        }
        items.push({ field: field, section: section, info: info, isSection: isSection });
      }
      const isHome = stats.signature >= 2;
      const kept = [];
      for (const item of items) {
        if (!item.isSection || !item.info) {
          kept.push(bytes.subarray(item.field.start, item.field.end));
          continue;
        }
        const info = item.info;
        let remove;
        if (isHome) {
          remove =
            HOME_KEEP_GROUPS.indexOf(info.groupId) < 0 ||
            (REMOVE_ADVERT_SECTIONS && info.advert);
        } else {
          remove =
            TARGET_GROUPS.indexOf(info.groupId) >= 0 ||
            (REMOVE_ADVERT_SECTIONS && info.advert) ||
            TARGET_NAMES.test(decoder.decode(item.section));
        }
        if (remove) {
          stats.removed++;
          continue;
        }
        kept.push(bytes.subarray(item.field.start, item.field.end));
      }
      stats.isHome = isHome;
      return concat(kept);
    }
    function cleanPageData(bytes, stats) {
      const kept = [];
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 2 && field.wireType === 2) {
          const list = cleanSectionList(payloadOf(bytes, field), stats);
          kept.push(wrapLengthField(2, list));
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return concat(kept);
    }
    function cleanHomeOuter(bytes, stats) {
      const kept = [];
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 1 && field.wireType === 2) {
          const pageData = cleanPageData(payloadOf(bytes, field), stats);
          kept.push(wrapLengthField(1, pageData));
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return concat(kept);
    }
    function deepClean(bytes, depth) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (field.wireType !== 2) {
          kept.push(bytes.subarray(field.start, field.end));
          continue;
        }
        const payload = payloadOf(bytes, field);
        if (payload.length > 80 && sectionIsTarget(payload)) {
          removed++;
          continue;
        }
        let sub = 0;
        let newPayload = payload;
        if (depth > 0 && payload.length > 80) {
          const head = payload[0];
          if (head !== 0x7b && head !== 0x5b && head !== 0x68 && head !== 0x20) {
            try {
              const result = deepClean(payload, depth - 1);
              if (result[1] > 0) {
                newPayload = result[0];
                sub = result[1];
              }
            } catch (error) {
              sub = 0;
            }
          }
        }
        if (sub > 0) {
          kept.push(wrapLengthField(field.fieldNo, newPayload));
          removed += sub;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    function moduleShouldBeRemoved(record) {
      const text = decoder.decode(record);
      for (const gid of MY_PAGE_GROUPS) {
        if (text.indexOf('"groupId":' + gid) >= 0) return true;
        if (text.indexOf('"groupId": ' + gid) >= 0) return true;
      }
      return (
        text.indexOf("会员卡片") >= 0 ||
        (text.indexOf("我的页") >= 0 && text.indexOf("腰部") >= 0)
      );
    }
    function myPageInner(bytes, stats) {
      const kept = [];
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 5 && field.wireType === 2) {
          const record = payloadOf(bytes, field);
          if (moduleShouldBeRemoved(record)) {
            stats.removed++;
            continue;
          }
        }
        kept.push(bytes.subarray(field.start, field.end));
      }
      return concat(kept);
    }
    function cleanMyPageList(bytes, stats) {
      const kept = [];
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 11 && field.wireType === 2) {
          const list = myPageInner(payloadOf(bytes, field), stats);
          kept.push(wrapLengthField(11, list));
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return concat(kept);
    }
    function cleanMyPageOuter(bytes, stats) {
      const kept = [];
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 1 && field.wireType === 2) {
          const inner = cleanMyPageList(payloadOf(bytes, field), stats);
          kept.push(wrapLengthField(1, inner));
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return concat(kept);
    }
    function isRelevant(bytes) {
      if (rpid === "1000002" || rpid === "1100001") return true;
      const text = decoder.decode(bytes);
      if (TARGET_NAMES.test(text)) return true;
      if (REMOVE_ADVERT_SECTIONS && text.indexOf("ADVERT") >= 0) return true;
      const ids = TARGET_GROUPS.concat(MY_PAGE_GROUPS);
      for (const id of ids) {
        if (text.indexOf(String(id)) >= 0) return true;
      }
      return false;
    }
    if (EMPTY_PAYLOAD_RESPONSE.indexOf(rpid) >= 0) {
      try {
        const stripped = emptyPayload(body);
        log("emptied payload: " + rpid + " " + body.length + " -> " + stripped.length);
        $done({ body: stripped });
      } catch (error) {
        log("empty payload failed; passthrough: " + error);
        $done({});
      }
    } else if (!isRelevant(body)) {
      $done({});
    } else {
      try {
        const stats = { total: 0, removed: 0, gids: [], signature: 0, isHome: false };
        const kept = [];
        let changed = false;
        let usedDeep = false;
        for (const field of parseFields(body)) {
          if (field.fieldNo === 7 && field.wireType === 2) {
            const payload = payloadOf(body, field);
            const isMyPage = rpid === "1100001";
            let newPayload = isMyPage
              ? cleanMyPageOuter(payload, stats)
              : cleanHomeOuter(payload, stats);
            if (!isMyPage && stats.removed === 0) {
              const result = deepClean(payload, 4);
              if (result[1] > 0) {
                newPayload = result[0];
                stats.removed = result[1];
                usedDeep = true;
              }
            }
            if (stats.removed > 0) {
              kept.push(wrapLengthField(7, newPayload));
              changed = true;
            } else {
              kept.push(body.subarray(field.start, field.end));
            }
          } else {
            kept.push(body.subarray(field.start, field.end));
          }
        }
        if (changed || rpid === "1000002" || rpid === "1100001") {
          log(
            (rpid === "1100001" ? "my page" : "page " + (rpid || "?")) +
              ": sections=" +
              stats.total +
              (stats.isHome ? " (home)" : "") +
              " removed=" +
              stats.removed +
              (usedDeep ? " (deep)" : "") +
              (stats.removed === 0 && stats.gids.length
                ? " gids=" + stats.gids.join(",")
                : "")
          );
        }
        if (changed) {
          $done({ body: concat(kept) });
        } else {
          $done({});
        }
      } catch (error) {
        log("parse failed; passthrough: " + error);
        $done({});
      }
    }
  }
}
