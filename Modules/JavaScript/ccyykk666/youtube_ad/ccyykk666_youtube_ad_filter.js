const FILTER_OPTIONS = {
  hideShorts: readBooleanArgument("HideShorts", true),
  hideBottomShorts: readBooleanArgument("HideBottomShorts", false),
  hideUpload: readBooleanArgument("HideUpload", false),
  hideSubscriptions: readBooleanArgument("HideSubscriptions", false)
};

const PLAYBACK_CONFIG_KEY = "YouTubeConfig";
const PLAYBACK_WORKER = "https://init-stream.maasea.workers.dev/";
const VIDEO_RENDERER_FIELD = 232954548;
const PRODUCT_ATTACHMENT_FIELDS = new Set([33, 34]);
const PRODUCT_ATTACHMENT_PATH = [9, 2, 4];
const SHORTS_AD_FLAG_PATH = [1, 139608561, 16, 1];
const BROWSE_CONTAINER_FIELD = 49399797;
const SHORTS_SHELF_FIELD = 51845067;
const LIST_FIELD = 50195462;
const GUIDE_CONTAINER_FIELD = 117866661;
const GUIDE_ITEM_FIELD = 1;
const GUIDE_ICON_RENDERER_FIELD = 117501096;
const GUIDE_LABEL_RENDERER_FIELD = 318370163;
const GUIDE_BROWSE_ID_FIELD = 1;
const AD_ITEM_PATH = [153515154, 172660663, 1, 168777401, 5];
const SHORTS_SHELF_ITEM_PATH = [
  153515154, 172660663, 1, 168777401, 5, 315733268
];
const NEXT_SPONSORED_LIST_PATH = [14, 78882851, 3, 29209665];
const NEXT_PRODUCT_ROOT_PATH = [14, 78882851];
const NEXT_PRODUCT_FULLSCREEN_PATH = [
  193948706, 5, 153515154, 172660663, 1, 168777401, 5, 283055480
];
const BROWSE_CONTAINER_KEY = encodeVarint(BROWSE_CONTAINER_FIELD * 8 + 2);
const AD_ITEM_ROOT_KEY = encodeVarint(AD_ITEM_PATH[0] * 8 + 2);
const LIST_FIELD_KEY = encodeVarint(LIST_FIELD * 8 + 2);
const SHORTS_SHELF_KEY = encodeVarint(SHORTS_SHELF_FIELD * 8 + 2);
const GUIDE_CONTAINER_KEY = encodeVarint(GUIDE_CONTAINER_FIELD * 8 + 2);
const SHORTS_TEXT = asciiBytes("Shorts");
const SHORTS_SHELF_EML_TEXT = asciiBytes("shorts_shelf.eml-fe");
const PAGEAD_TEXT = asciiBytes("pagead");
const VISIT_ADVERTISER_TEXT = asciiBytes("Visit advertiser");
const PRODUCT_LOCATION_TEXT = asciiBytes("PRODUCT_LOCATION_");
const SHOPPING_ASSET_TEXT = asciiBytes("gstatic.com/shopping");
const PLAYER_PRODUCT_OVERLAY_TEXT = asciiBytes("player_overlay_product_in_video");
const PRODUCT_PANEL_TEXT = asciiBytes("product_list_header.eml");
const HIDDEN_GUIDE_IDS = [
  FILTER_OPTIONS.hideBottomShorts && asciiBytes("FEshorts"),
  FILTER_OPTIONS.hideUpload && asciiBytes("FEuploads"),
  FILTER_OPTIONS.hideSubscriptions && asciiBytes("FEsubscriptions")
].filter(Boolean);

let removedAds = 0;
let removedShorts = 0;
let removedProducts = 0;
let removedTabs = 0;

try {
  const path = requestPath($request.url);
  if (typeof $response === "undefined") {
    rewritePlaybackRequest(path);
  } else {
    rewriteResponse(path);
  }
} catch (error) {
  console.log(`YouTube净化失败，放行原请求或响应: ${error}`);
  $done({});
}

function rewriteResponse(path) {
  const input = normalizeBody($response.body);
  if (!input.length) return $done({});

  if (path.endsWith("/config") || path.endsWith("/log_event")) {
    savePlaybackKeys(input);
    return $done({});
  }

  let result = { bytes: input, changed: false };
  if (path.endsWith("/browse") || path.endsWith("/next")) {
    const removeProducts =
      containsBytes(input, PRODUCT_LOCATION_TEXT) ||
      containsBytes(input, SHOPPING_ASSET_TEXT);
    result = rewriteBrowseTree(input, 0, removeProducts);
    if (path.endsWith("/next")) {
      if (containsBytes(result.bytes, PAGEAD_TEXT)) {
        result = mergeResults(result, removeNextSponsoredCards(result.bytes));
      }
      if (containsBytes(result.bytes, SHOPPING_ASSET_TEXT)) {
        result = mergeResults(result, removeNextProductFullscreen(result.bytes));
      }
      if (containsBytes(result.bytes, VISIT_ADVERTISER_TEXT)) {
        result = mergeResults(result, removeNextPlaybackAdMetadata(result.bytes));
      }
      if (containsBytes(result.bytes, PLAYER_PRODUCT_OVERLAY_TEXT)) {
        result = mergeResults(result, removeNextProductOverlay(result.bytes));
      }
    }
  } else if (path.endsWith("/player")) {
    result = removePlayerAds(input);
  } else if (path.endsWith("/get_watch")) {
    result = removeWatchAds(input);
  } else if (path.endsWith("/get_panel")) {
    result = removeProductPanel(input);
  } else if (path.endsWith("/reel/reel_watch_sequence")) {
    result = removeShortsStreamAds(input);
  } else if (path.endsWith("/guide") && HIDDEN_GUIDE_IDS.length) {
    result = rewriteGuideTree(input);
  }

  if (!result.changed) return $done({});
  console.log(
    `YouTube净化完成: ads=${removedAds}, shorts=${removedShorts}, products=${removedProducts}, tabs=${removedTabs}`
  );
  $done({ body: result.bytes });
}

function rewritePlaybackRequest(path) {
  if (path.endsWith("/log_event")) return preparePlaybackKeyRequest();
  if (path.endsWith("/initplayback")) return redirectInitPlayback();
  $done({});
}

function readBooleanArgument(name, fallback) {
  if (typeof $argument !== "object" || $argument === null) return fallback;
  if (!Object.prototype.hasOwnProperty.call($argument, name)) return fallback;
  const value = $argument[name];
  return value === true || value === "true" || value === 1 || value === "1";
}

function requestPath(url) {
  const match = String(url || "").match(/^https?:\/\/[^/]+([^?#]*)/i);
  return match ? match[1] : "";
}

function normalizeBody(body) {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (body && body.buffer instanceof ArrayBuffer) {
    return new Uint8Array(body.buffer, body.byteOffset || 0, body.byteLength);
  }
  return new Uint8Array();
}

function playbackPlatformKey() {
  const headers = ($request && $request.headers) || {};
  const userAgent = headers["user-agent"] || headers["User-Agent"] || "";
  return String(userAgent).includes("music") ? "youtubeMusic" : "youtube";
}

function readPlaybackConfig() {
  const raw = $persistentStore.read(PLAYBACK_CONFIG_KEY);
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : {};
  } catch (_) {
    return {};
  }
}

function writePlaybackConfig(config) {
  $persistentStore.write(JSON.stringify(config), PLAYBACK_CONFIG_KEY);
}

function savePlaybackKeys(bytes) {
  const messages = payloadsAtPath(bytes, [1, 16, 7, 138536474, 146311580]);
  for (const message of messages) {
    const fields = tryParseMessage(message);
    if (!fields) continue;
    const clientKey = fields.find((field) => field.number === 1 && field.wireType === 2);
    const encryptKey = fields.find((field) => field.number === 2 && field.wireType === 2);
    if (!clientKey || !encryptKey || !clientKey.payload.length || !encryptKey.payload.length) {
      continue;
    }
    const config = readPlaybackConfig();
    config[playbackPlatformKey()] = {
      clientKey: encodeBase64(clientKey.payload),
      encryptKey: encodeBase64(encryptKey.payload)
    };
    writePlaybackConfig(config);
    console.log("YouTube播放密钥已更新");
    return;
  }
}

function preparePlaybackKeyRequest() {
  const config = readPlaybackConfig();
  const hasKey = Boolean(config[playbackPlatformKey()]?.clientKey);
  const headers = { ...(($request && $request.headers) || {}) };
  for (const name of Object.keys(headers)) {
    const lower = name.toLowerCase();
    if (lower === "content-encoding" || (!hasKey && lower === "x-youtube-hot-hash-data")) {
      delete headers[name];
    }
  }
  $done({ headers });
}

function redirectInitPlayback() {
  const platform = playbackPlatformKey();
  const config = readPlaybackConfig();
  const keys = config[platform];
  const body = normalizeBody($request.body);
  const encryptedClientKeys = payloadsAtPath(body, [3, 5]);
  if (
    keys?.clientKey &&
    keys?.encryptKey &&
    encryptedClientKeys.some((value) => equalBytes(value, decodeBase64(keys.encryptKey)))
  ) {
    const params = {
      ck: keys.clientKey,
      target: $request.url,
      captionLang: "off",
      blockUpload: false,
      blockImmersive: false,
      blockShorts: false
    };
    const query = Object.keys(params)
      .map((name) => `${name}=${encodeURIComponent(String(params[name]))}`)
      .join("&");
    return $done({ url: `${PLAYBACK_WORKER}?${query}` });
  }

  if (config[platform]) {
    delete config[platform];
    writePlaybackConfig(config);
  }
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "text/plain" },
      body: new Uint8Array()
    }
  });
}

function payloadsAtPath(bytes, path) {
  let candidates = [bytes];
  for (const number of path) {
    const next = [];
    for (const candidate of candidates) {
      const fields = tryParseMessage(candidate);
      if (!fields) continue;
      for (const field of fields) {
        if (field.number === number && field.wireType === 2) next.push(field.payload);
      }
    }
    if (!next.length) return [];
    candidates = next;
  }
  return candidates;
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function encodeBase64(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const third = index + 2 < bytes.length ? bytes[index + 2] : 0;
    output += alphabet[first >> 2];
    output += alphabet[((first & 3) << 4) | (second >> 4)];
    output += index + 1 < bytes.length ? alphabet[((second & 15) << 2) | (third >> 6)] : "=";
    output += index + 2 < bytes.length ? alphabet[third & 63] : "=";
  }
  return output;
}

function decodeBase64(text) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = String(text || "").replace(/[^A-Za-z0-9+/]/g, "");
  const output = [];
  let bits = 0;
  let bitCount = 0;
  for (const character of clean) {
    const value = alphabet.indexOf(character);
    if (value < 0) continue;
    bits = (bits << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      output.push((bits >> bitCount) & 255);
    }
  }
  return new Uint8Array(output);
}

function readVarint(bytes, start, end) {
  let value = 0;
  let shift = 0;
  let position = start;
  while (position < end && shift <= 63) {
    const byte = bytes[position++];
    if (shift < 53) value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return { value, position };
    shift += 7;
  }
  throw new Error("invalid protobuf varint");
}

function encodeVarint(value) {
  const output = [];
  let current = value;
  while (current > 127) {
    output.push((current % 128) | 128);
    current = Math.floor(current / 128);
  }
  output.push(current);
  return new Uint8Array(output);
}

function parseMessage(bytes) {
  const fields = [];
  let position = 0;
  while (position < bytes.length) {
    const fieldStart = position;
    const key = readVarint(bytes, position, bytes.length);
    position = key.position;
    const number = Math.floor(key.value / 8);
    const wireType = key.value & 7;
    if (number < 1 || number > 536870911 || wireType === 4 || wireType > 5) {
      throw new Error("invalid protobuf field");
    }

    const keyBytes = bytes.slice(fieldStart, position);
    let payloadStart = position;
    let payloadEnd = position;
    if (wireType === 0) {
      position = readVarint(bytes, position, bytes.length).position;
      payloadEnd = position;
    } else if (wireType === 1) {
      position += 8;
      payloadEnd = position;
    } else if (wireType === 2) {
      const length = readVarint(bytes, position, bytes.length);
      position = length.position;
      payloadStart = position;
      position += length.value;
      payloadEnd = position;
    } else if (wireType === 3) {
      throw new Error("protobuf groups are unsupported");
    } else if (wireType === 5) {
      position += 4;
      payloadEnd = position;
    }
    if (position > bytes.length) throw new Error("protobuf field exceeds body");

    fields.push({
      number,
      wireType,
      keyBytes,
      payload: bytes.slice(payloadStart, payloadEnd),
      raw: bytes.slice(fieldStart, position)
    });
  }
  return fields;
}

function encodeField(field, payload) {
  if (field.wireType !== 2) return field.raw;
  return concatBytes([field.keyBytes, encodeVarint(payload.length), payload]);
}

function concatBytes(parts) {
  let length = 0;
  for (const part of parts) length += part.length;
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function asciiBytes(text) {
  const output = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index++) {
    output[index] = text.charCodeAt(index);
  }
  return output;
}

function containsBytes(bytes, needle) {
  if (!needle.length || needle.length > bytes.length) return false;
  const lastStart = bytes.length - needle.length;
  let index = 0;
  while (index <= lastStart) {
    index = bytes.indexOf(needle[0], index);
    if (index < 0 || index > lastStart) return false;
    let inner = 1;
    while (inner < needle.length && bytes[index + inner] === needle[inner]) {
      inner += 1;
    }
    if (inner === needle.length) return true;
    index += 1;
  }
  return false;
}

function rebuildMessage(fields, replacements, removedIndexes) {
  const chunks = [];
  for (let index = 0; index < fields.length; index++) {
    if (removedIndexes && removedIndexes.has(index)) continue;
    chunks.push(replacements && replacements.has(index) ? replacements.get(index) : fields[index].raw);
  }
  return concatBytes(chunks);
}

function rewriteBrowseTree(bytes, depth, removeProducts) {
  if (depth > 18 || !containsBytes(bytes, BROWSE_CONTAINER_KEY)) {
    return { bytes, changed: false };
  }
  let fields;
  try {
    fields = parseMessage(bytes);
  } catch (_) {
    return { bytes, changed: false };
  }

  const replacements = new Map();
  let changed = false;
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.wireType !== 2) continue;
    let child;
    if (field.number === BROWSE_CONTAINER_FIELD) {
      child = rewriteBrowseContainer(field.payload, 0, removeProducts);
    } else if (containsBytes(field.payload, BROWSE_CONTAINER_KEY)) {
      child = rewriteBrowseTree(field.payload, depth + 1, removeProducts);
    } else {
      continue;
    }
    if (!child.changed) continue;
    replacements.set(index, encodeField(field, child.bytes));
    changed = true;
  }

  return {
    bytes: changed ? rebuildMessage(fields, replacements) : bytes,
    changed
  };
}

function rewriteBrowseContainer(bytes, depth = 0, removeProducts = false) {
  const fields = parseMessage(bytes);
  const replacements = new Map();
  const removed = new Set();
  let changed = false;

  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.wireType !== 2) continue;

    if (field.number === 1 && isAdItem(field.payload)) {
      removed.add(index);
      removedAds += 1;
      changed = true;
      continue;
    }

    if (
      removeProducts &&
      field.number === 1 &&
      containsBytes(field.payload, PRODUCT_LOCATION_TEXT)
    ) {
      removed.add(index);
      removedProducts += 1;
      changed = true;
      continue;
    }

    let payload = field.payload;
    if (field.number === 1) {
      const itemFields = tryParseMessage(payload);
      if (itemFields) {
        if (
          FILTER_OPTIONS.hideShorts &&
          itemFields.some(
            (itemField) =>
              itemField.number === SHORTS_SHELF_FIELD &&
              itemField.wireType === 2 &&
              containsBytes(itemField.payload, SHORTS_TEXT)
          )
        ) {
          removed.add(index);
          removedShorts += 1;
          changed = true;
          continue;
        }

        const itemReplacements = new Map();
        for (let itemIndex = 0; itemIndex < itemFields.length; itemIndex++) {
          const itemField = itemFields[itemIndex];
          if (itemField.number !== LIST_FIELD || itemField.wireType !== 2) continue;
          const listResult = filterAdList(itemField.payload, removeProducts);
          if (!listResult.changed) continue;
          itemReplacements.set(itemIndex, encodeField(itemField, listResult.bytes));
        }
        if (itemReplacements.size) {
          payload = rebuildMessage(itemFields, itemReplacements);
        }
      }
    }

    if (depth < 10 && containsBrowseItem(payload)) {
      const nested = tryRewriteBrowseContainer(payload, depth + 1, removeProducts);
      if (nested.changed) payload = nested.bytes;
    }

    if (payload !== field.payload) {
      replacements.set(index, encodeField(field, payload));
      changed = true;
    }
  }

  return {
    bytes: changed ? rebuildMessage(fields, replacements, removed) : bytes,
    changed
  };
}

function containsBrowseItem(bytes) {
  return (
    containsBytes(bytes, AD_ITEM_ROOT_KEY) ||
    containsBytes(bytes, LIST_FIELD_KEY) ||
    (FILTER_OPTIONS.hideShorts && containsBytes(bytes, SHORTS_SHELF_KEY))
  );
}

function tryRewriteBrowseContainer(bytes, depth, removeProducts) {
  try {
    return rewriteBrowseContainer(bytes, depth, removeProducts);
  } catch (_) {
    return { bytes, changed: false };
  }
}

function filterAdList(bytes, removeProducts) {
  const fields = parseMessage(bytes);
  const replacements = new Map();
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.number !== 1 || field.wireType !== 2) continue;
    if (isAdItem(field.payload)) {
      removed.add(index);
      removedAds += 1;
      continue;
    }
    if (
      FILTER_OPTIONS.hideShorts &&
      containsBytes(field.payload, SHORTS_SHELF_EML_TEXT) &&
      hasPayloadAtPath(field.payload, SHORTS_SHELF_ITEM_PATH)
    ) {
      removed.add(index);
      removedShorts += 1;
      continue;
    }
    if (removeProducts && containsBytes(field.payload, SHOPPING_ASSET_TEXT)) {
      const productResult = removeProductAttachments(field.payload);
      if (productResult.changed) {
        replacements.set(index, encodeField(field, productResult.bytes));
      }
    }
  }
  return {
    bytes:
      removed.size || replacements.size
        ? rebuildMessage(fields, replacements, removed)
        : bytes,
    changed: removed.size > 0 || replacements.size > 0
  };
}

function removeProductAttachments(bytes) {
  return rewritePayloadPath(bytes, AD_ITEM_PATH, 0, removeProductRendererFields);
}

function hasPayloadAtPath(bytes, path, pathIndex = 0) {
  const fields = tryParseMessage(bytes);
  if (!fields) return false;
  for (const field of fields) {
    if (field.number !== path[pathIndex] || field.wireType !== 2) continue;
    if (pathIndex + 1 === path.length) return true;
    if (hasPayloadAtPath(field.payload, path, pathIndex + 1)) return true;
  }
  return false;
}

function rewritePayloadPath(bytes, path, pathIndex, transform) {
  if (pathIndex === path.length) return transform(bytes);
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const replacements = new Map();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.number !== path[pathIndex] || field.wireType !== 2) continue;
    const result = rewritePayloadPath(field.payload, path, pathIndex + 1, transform);
    if (!result.changed) continue;
    replacements.set(index, encodeField(field, result.bytes));
  }
  return {
    bytes: replacements.size ? rebuildMessage(fields, replacements) : bytes,
    changed: replacements.size > 0
  };
}

function removeProductRendererFields(bytes) {
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const replacements = new Map();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.number !== VIDEO_RENDERER_FIELD || field.wireType !== 2) continue;
    const videoFields = tryParseMessage(field.payload);
    if (!videoFields) continue;
    const hasProductCarousel = videoFields.some(
      (videoField) =>
        videoField.number === 33 &&
        videoField.wireType === 2 &&
        hasPayloadAtPath(videoField.payload, PRODUCT_ATTACHMENT_PATH)
    );
    if (!hasProductCarousel) continue;
    const removed = new Set();
    for (let videoIndex = 0; videoIndex < videoFields.length; videoIndex++) {
      if (PRODUCT_ATTACHMENT_FIELDS.has(videoFields[videoIndex].number)) {
        removed.add(videoIndex);
      }
    }
    if (!removed.size) continue;
    removedProducts += 1;
    replacements.set(
      index,
      encodeField(field, rebuildMessage(videoFields, null, removed))
    );
  }
  return {
    bytes: replacements.size ? rebuildMessage(fields, replacements) : bytes,
    changed: replacements.size > 0
  };
}

function isAdItem(bytes) {
  let candidates = [bytes];
  for (const number of AD_ITEM_PATH) {
    const next = [];
    for (const candidate of candidates) {
      const fields = tryParseMessage(candidate);
      if (!fields) continue;
      for (const field of fields) {
        if (field.number === number && field.wireType === 2) next.push(field.payload);
      }
    }
    if (!next.length) return false;
    candidates = next;
  }

  for (const candidate of candidates) {
    if (containsBytes(candidate, PAGEAD_TEXT)) return true;
  }
  return false;
}

function removeNextSponsoredCards(bytes) {
  return rewritePayloadPath(
    bytes,
    NEXT_SPONSORED_LIST_PATH,
    0,
    removeSponsoredListItems
  );
}

function removeSponsoredListItems(bytes) {
  return removeMatchingFields(bytes, 2, isAdItem, true);
}

function removeNextProductFullscreen(bytes) {
  return rewritePayloadPath(
    bytes,
    NEXT_PRODUCT_ROOT_PATH,
    0,
    removeProductFullscreenFields
  );
}

function removeProductFullscreenFields(bytes) {
  return removeMatchingFields(
    bytes,
    15,
    (payload) => hasPayloadAtPath(payload, NEXT_PRODUCT_FULLSCREEN_PATH),
    false
  );
}

function removeMatchingFields(bytes, number, predicate, ad) {
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (
      field.number === number &&
      field.wireType === 2 &&
      predicate(field.payload)
    ) {
      removed.add(index);
      if (ad) removedAds += 1;
      else removedProducts += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function removeNextPlaybackAdMetadata(bytes) {
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.number !== 14 || field.wireType !== 2) continue;
    const children = tryParseMessage(field.payload);
    if (
      children &&
      children.some((child) => child.number === 62960614) &&
      containsBytes(field.payload, VISIT_ADVERTISER_TEXT)
    ) {
      removed.add(index);
      removedAds += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function removeNextProductOverlay(bytes) {
  return rewritePayloadPath(bytes, [14, 78882851], 0, removeProductOverlayField);
}

function removeProductOverlayField(bytes) {
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (
      field.number === 42 &&
      field.wireType === 2 &&
      containsBytes(field.payload, PLAYER_PRODUCT_OVERLAY_TEXT)
    ) {
      removed.add(index);
      removedProducts += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function removeProductPanel(bytes) {
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (
      field.number === 2 &&
      field.wireType === 2 &&
      containsBytes(field.payload, PRODUCT_PANEL_TEXT)
    ) {
      removed.add(index);
      removedProducts += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function removeShortsStreamAds(bytes) {
  const fields = parseMessage(bytes);
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (
      field.number === 2 &&
      field.wireType === 2 &&
      hasTruthyVarintAtPath(field.payload, SHORTS_AD_FLAG_PATH)
    ) {
      removed.add(index);
      removedAds += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function hasTruthyVarintAtPath(bytes, path, pathIndex = 0) {
  const fields = tryParseMessage(bytes);
  if (!fields) return false;
  for (const field of fields) {
    if (field.number !== path[pathIndex]) continue;
    if (pathIndex + 1 === path.length && field.wireType === 0) {
      return readVarint(field.payload, 0, field.payload.length).value !== 0;
    }
    if (
      field.wireType === 2 &&
      hasTruthyVarintAtPath(field.payload, path, pathIndex + 1)
    ) {
      return true;
    }
  }
  return false;
}

function rewriteGuideTree(bytes, depth = 0) {
  if (depth > 8 || !containsBytes(bytes, GUIDE_CONTAINER_KEY)) {
    return { bytes, changed: false };
  }
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const replacements = new Map();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.wireType !== 2) continue;
    let result;
    if (field.number === GUIDE_CONTAINER_FIELD) {
      result = removeGuideItems(field.payload);
    } else if (containsBytes(field.payload, GUIDE_CONTAINER_KEY)) {
      result = rewriteGuideTree(field.payload, depth + 1);
    } else {
      continue;
    }
    if (result.changed) replacements.set(index, encodeField(field, result.bytes));
  }
  return {
    bytes: replacements.size ? rebuildMessage(fields, replacements) : bytes,
    changed: replacements.size > 0
  };
}

function removeGuideItems(bytes) {
  const fields = tryParseMessage(bytes);
  if (!fields) return { bytes, changed: false };
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (
      field.number === GUIDE_ITEM_FIELD &&
      field.wireType === 2 &&
      isHiddenGuideItem(field.payload)
    ) {
      removed.add(index);
      removedTabs += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function isHiddenGuideItem(bytes) {
  const itemFields = tryParseMessage(bytes);
  if (!itemFields) return false;
  for (const itemField of itemFields) {
    if (
      itemField.wireType !== 2 ||
      (itemField.number !== GUIDE_ICON_RENDERER_FIELD &&
        itemField.number !== GUIDE_LABEL_RENDERER_FIELD)
    ) {
      continue;
    }
    const rendererFields = tryParseMessage(itemField.payload);
    if (!rendererFields) continue;
    for (const rendererField of rendererFields) {
      if (rendererField.number !== GUIDE_BROWSE_ID_FIELD || rendererField.wireType !== 2) {
        continue;
      }
      if (HIDDEN_GUIDE_IDS.some((id) => equalBytes(rendererField.payload, id))) {
        return true;
      }
    }
  }
  return false;
}

function removePlayerAds(bytes) {
  const fields = parseMessage(bytes);
  const removed = new Set();
  for (let index = 0; index < fields.length; index++) {
    if (fields[index].number === 7 || fields[index].number === 68) {
      removed.add(index);
      removedAds += 1;
    }
  }
  return {
    bytes: removed.size ? rebuildMessage(fields, null, removed) : bytes,
    changed: removed.size > 0
  };
}

function removeWatchAds(bytes) {
  const fields = parseMessage(bytes);
  const replacements = new Map();
  let changed = false;
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    if (field.number !== 1 || field.wireType !== 2) continue;
    const contentFields = tryParseMessage(field.payload);
    if (!contentFields) continue;
    const contentReplacements = new Map();
    let contentChanged = false;
    for (let contentIndex = 0; contentIndex < contentFields.length; contentIndex++) {
      const contentField = contentFields[contentIndex];
      if (contentField.number !== 2 || contentField.wireType !== 2) continue;
      const playerResult = removePlayerAds(contentField.payload);
      if (!playerResult.changed) continue;
      contentReplacements.set(
        contentIndex,
        encodeField(contentField, playerResult.bytes)
      );
      contentChanged = true;
    }
    if (contentChanged) {
      replacements.set(
        index,
        encodeField(field, rebuildMessage(contentFields, contentReplacements))
      );
      changed = true;
    }
  }
  return {
    bytes: changed ? rebuildMessage(fields, replacements) : bytes,
    changed
  };
}

function tryParseMessage(bytes) {
  try {
    return parseMessage(bytes);
  } catch (_) {
    return null;
  }
}

function mergeResults(previous, next) {
  return {
    bytes: next.bytes,
    changed: previous.changed || next.changed
  };
}
