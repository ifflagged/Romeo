/*! Original Copyright (c) 2026 Yu9191. Licensed under the MIT License. */

(() => {
const RESPONSE_BYTES = globalThis.$response?.body;
if (!(RESPONSE_BYTES instanceof Uint8Array) || !RESPONSE_BYTES.length) return $done({});

const SETTINGS = { MineClean: globalThis.$argument?.MineClean ?? true };

const SIDEBAR_ITEM_CODES = new Set([
  "ai_songwriting",
  "mall",
  "concert",
  "cloud_push_song",
]);

function clearSubtitles(value) {
  if (!value || typeof value !== "object") return 0;
  let changes = 0;
  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    const child = value[key];
    if ((key === "subTitle" || key === "subtitle") && child !== "") {
      value[key] = "";
      changes += 1;
    } else if (child && typeof child === "object") {
      changes += clearSubtitles(child);
    }
  }
  return changes;
}

function getSidebarItemCode(item) {
  return item?.sideBarItemData3?.code ?? item?.code;
}

function filterGeneralizedObjects(resource) {
  if (
    !resource ||
    typeof resource !== "object" ||
    !Array.isArray(resource.generalizedObject)
  )
    return 0;
  const filtered = resource.generalizedObject.filter(
    (item) => !SIDEBAR_ITEM_CODES.has(getSidebarItemCode(item)),
  );
  const removed = resource.generalizedObject.length - filtered.length;
  if (removed) resource.generalizedObject = filtered;
  return removed;
}

function cleanSidebarResources(payload) {
  if (!payload.data) return false;
  let changes = 0;
  const crossPosition = payload.data.crossPlatformResource?.positionCode;
  if (crossPosition === "MOMENT_MORE_RCMD_PAGE") {
    payload.data.crossPlatformResource = {};
    changes += 1;
  }
  if (!SETTINGS.MineClean) return changes > 0;
  if (["MyPageBar", "MyPageBarRN"].includes(crossPosition)) {
    payload.data.crossPlatformResource = {};
    changes += 1;
  }
  const groups = Array.isArray(payload.data.dataGroupResourceList)
    ? payload.data.dataGroupResourceList
    : [];
  const isSidebarResponse = groups.some((group) =>
    String(group?.positionCode ?? "").startsWith("side_bar_new_"),
  );
  if (!isSidebarResponse) return changes > 0;

  const removedRuleIds = new Set();
  const filteredGroups = groups.filter((group) => {
    if (!SIDEBAR_ITEM_CODES.has(getSidebarItemCode(group))) return true;
    if (group?.trp_id) removedRuleIds.add(`::${group.trp_id}::`);
    return false;
  });
  if (filteredGroups.length !== groups.length) {
    payload.data.dataGroupResourceList = filteredGroups;
    changes += groups.length - filteredGroups.length;
  }
  changes += filterGeneralizedObjects(payload.data.commonResource);
  for (const resource of payload.data.commonResourceList ?? [])
    changes += filterGeneralizedObjects(resource);
  changes += clearSubtitles(payload.data.commonResource);
  changes += clearSubtitles(payload.data.commonResourceList);
  if (Array.isArray(payload.trp?.rules) && removedRuleIds.size) {
    const tokens = [...removedRuleIds];
    const filteredRules = payload.trp.rules.filter(
      (rule) => {
        const text = String(rule);
        return !tokens.some((token) => text.includes(token));
      },
    );
    changes += payload.trp.rules.length - filteredRules.length;
    payload.trp.rules = filteredRules;
  }
  return changes > 0;
}

try {
  const encoder = new TextEncoder();
  const options = { mode: "ecb", padding: "pkcs7", key: encoder.encode("e82ckenh8dichen8") };
  let bytes = $crypto.aes.decrypt(RESPONSE_BYTES, options);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = $utils.ungzip(bytes);
  const text = new TextDecoder().decode(bytes);
  if (!text.includes("\\u") &&
      !(SETTINGS.MineClean
        ? /MOMENT_MORE_RCMD_PAGE|MyPageBar|side_bar_new_/
        : /MOMENT_MORE_RCMD_PAGE/).test(text)) return $done({});
  const payload = JSON.parse(text);
  if (!cleanSidebarResources(payload)) return $done({});
  return $done({ body: $crypto.aes.encrypt(encoder.encode(JSON.stringify(payload)), options).ciphertext });
} catch (error) {
  console.log(`[网易云音乐净化] 放行原响应：${error?.message ?? error}`);
  return $done({});
}
})();
