const req = $request || {};
const res = $response || {};
const headers = req.headers || {};
const rpid = String(headers.rpid || headers.Rpid || "").trim();

const EMPTY_PAYLOAD_RESPONSE = ["1000019", "1370286", "1430064"];
const HOME_BLOCK_GROUP_IDS = [111353, 111435, 111357, 111442];
const HOME_BLOCK_NAME_HINT = /无行程机票直销卡片|发现目的地|本地服务标题/;
const REMOVE_ADVERT_SECTIONS = true;
if (
  rpid !== "1000002" &&
  rpid !== "1100001" &&
  EMPTY_PAYLOAD_RESPONSE.indexOf(rpid) < 0
) {
  $done({});
} else {
  const body = res.body;
  if (!(body instanceof Uint8Array)) {
    console.log("UMETRIP: body is not Uint8Array; passthrough");
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
    function emptyPayload(bytes) {
      const kept = [];
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 7 && field.wireType === 2) {
          kept.push(wrapLengthField(7, new Uint8Array(0)));
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return concat(kept);
    }
    function homeSectionBlocked(section) {
      let fields;
      try {
        fields = parseFields(section);
      } catch (error) {
        return false;
      }
      for (const field of fields) {
        if (
          field.fieldNo === 2 &&
          field.wireType === 0 &&
          HOME_BLOCK_GROUP_IDS.indexOf(field.value) >= 0
        ) {
          return true;
        }
        if (
          REMOVE_ADVERT_SECTIONS &&
          field.fieldNo === 37 &&
          field.wireType === 2 &&
          decoder.decode(payloadOf(section, field)).trim() === "ADVERT"
        ) {
          return true;
        }
      }
      return HOME_BLOCK_NAME_HINT.test(decoder.decode(section));
    }
    function cleanHomeSectionList(bytes) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (
          field.fieldNo === 5 &&
          field.wireType === 2 &&
          homeSectionBlocked(payloadOf(bytes, field))
        ) {
          removed++;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    function cleanHomePageData(bytes) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 2 && field.wireType === 2) {
          const [list, count] = cleanHomeSectionList(payloadOf(bytes, field));
          kept.push(wrapLengthField(2, list));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    function cleanHomeOuter(bytes) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 1 && field.wireType === 2) {
          const [pageData, count] = cleanHomePageData(payloadOf(bytes, field));
          kept.push(wrapLengthField(1, pageData));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    function moduleShouldBeRemoved(record) {
      const text = decoder.decode(record);
      if (
        /"groupId"\s*:\s*111402/.test(text) ||
        /"groupId"\s*:\s*111403/.test(text) ||
        /"groupId"\s*:\s*111404/.test(text)
      ) {
        return true;
      }
      return (
        text.includes("会员卡片") ||
        (text.includes("我的页") && text.includes("腰部"))
      );
    }
    function filterMyModules(bytes) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (
          field.fieldNo === 5 &&
          field.wireType === 2 &&
          moduleShouldBeRemoved(payloadOf(bytes, field))
        ) {
          removed++;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    function cleanMyPageList(bytes) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 11 && field.wireType === 2) {
          const [list, count] = filterMyModules(payloadOf(bytes, field));
          kept.push(wrapLengthField(11, list));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    function cleanMyPageOuter(bytes) {
      const kept = [];
      let removed = 0;
      for (const field of parseFields(bytes)) {
        if (field.fieldNo === 1 && field.wireType === 2) {
          const [inner, count] = cleanMyPageList(payloadOf(bytes, field));
          kept.push(wrapLengthField(1, inner));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }
      return [concat(kept), removed];
    }
    if (EMPTY_PAYLOAD_RESPONSE.indexOf(rpid) >= 0) {
      try {
        const stripped = emptyPayload(body);
        console.log("UMETRIP emptied payload: " + rpid + " " + body.length + " -> " + stripped.length);
        $done({ body: stripped });
      } catch (error) {
        console.log("UMETRIP empty payload failed; passthrough: " + error);
        $done({});
      }
    } else {
      try {
        const kept = [];
        let removed = 0;
        for (const field of parseFields(body)) {
          if (field.fieldNo === 7 && field.wireType === 2) {
            const payload = payloadOf(body, field);
            const [newPayload, count] =
              rpid === "1100001"
                ? cleanMyPageOuter(payload)
                : cleanHomeOuter(payload);
            kept.push(wrapLengthField(7, newPayload));
            removed += count;
          } else {
            kept.push(body.subarray(field.start, field.end));
          }
        }
        if (removed > 0) {
          console.log("UMETRIP removed blocks: " + removed);
          $done({ body: concat(kept) });
        } else {
          console.log("UMETRIP: target blocks not found; passthrough");
          $done({});
        }
      } catch (error) {
        console.log("UMETRIP Protobuf parse failed; passthrough: " + error);
        $done({});
      }
    }
  }
}
