const req = $request || {};
const res = $response || {};
const headers = req.headers || {};
const rpid = String(headers.rpid || headers.Rpid || "").trim();

const hideWholeResponse = new Set([
  "1000002",
  "1000019",
  "1430064",
  "1370286"
]);

hideWholeResponse.delete("1000002");

if (hideWholeResponse.has(rpid)) {
  $done({
    status: "HTTP/1.1 404 Not Found",
    headers: res.headers || {},
    body: ""
  });
} else if (rpid !== "1100001" && rpid !== "1000002") {
  $done({});
} else {
  const body = res.body;

  if (!(body instanceof Uint8Array)) {
    console.log("UMETRIP: response body is not Uint8Array; passthrough");
    $done({});
  } else {
    const decoder = new TextDecoder();

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
        let payloadStart;
        let payloadEnd;

        if (fieldNo <= 0) throw new Error("Invalid field number");

        if (wireType === 0) {
          [, pos] = readVarint(bytes, pos);
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

    function moduleShouldBeRemoved(record, currentRpid) {
      const text = decoder.decode(record);

      if (currentRpid === "1000002") {
        return (
          /"groupId"\s*:\s*111357/.test(text) ||
          /"groupId"\s*:\s*111442/.test(text)
        );
      }

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

    function filterRepeatedModules(bytes, fieldNo, currentRpid) {
      const fields = parseFields(bytes);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
        if (
          field.fieldNo === fieldNo &&
          field.wireType === 2 &&
          moduleShouldBeRemoved(payloadOf(bytes, field), currentRpid)
        ) {
          removed++;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }

      return [concat(kept), removed];
    }

    function cleanMyPageList(bytes) {
      const fields = parseFields(bytes);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
        if (field.fieldNo === 11 && field.wireType === 2) {
          const [list, count] =
            filterRepeatedModules(payloadOf(bytes, field), 5, "1100001");
          kept.push(wrapLengthField(11, list));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }

      return [concat(kept), removed];
    }

    function cleanMyPageOuter(bytes) {
      const fields = parseFields(bytes);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
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

    function cleanHomeSectionList(bytes) {
      const fields = parseFields(bytes);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
        if (field.fieldNo === 5 && field.wireType === 2) {
          const [list, count] =
            filterRepeatedModules(payloadOf(bytes, field), 5, "1000002");
          kept.push(wrapLengthField(5, list));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }

      return [concat(kept), removed];
    }

    function cleanHomePageData(bytes) {
      const fields = parseFields(bytes);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
        if (field.fieldNo === 2 && field.wireType === 2) {
          const [sectionList, count] =
            cleanHomeSectionList(payloadOf(bytes, field));
          kept.push(wrapLengthField(2, sectionList));
          removed += count;
        } else {
          kept.push(bytes.subarray(field.start, field.end));
        }
      }

      return [concat(kept), removed];
    }

    function cleanHomeOuter(bytes) {
      const fields = parseFields(bytes);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
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

    try {
      const fields = parseFields(body);
      const kept = [];
      let removed = 0;

      for (const field of fields) {
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
        console.log("UMETRIP removed module records: " + removed);
        $done({ body: concat(kept) });
      } else {
        console.log("UMETRIP: target modules not found; passthrough");
        $done({});
      }
    } catch (error) {
      console.log("UMETRIP Protobuf parse failed; passthrough: " + error);
      $done({});
    }
  }
}
