const url = $request.url;

if (!$response.body) {
  $done({});
} else {
  try {
    const body = JSON.parse($response.body);

    let membershipCleaned = false;

    if (url.includes("/2/comments/build_comments")) {
      cleanCommentResponse(body);
      membershipCleaned = true;
    } else if (url.includes("/2/statuses/friends/timeline") ||
               url.includes("/2/statuses/unread_hot_timeline") ||
               url.includes("/2/statuses/container_timeline_hot") ||
               url.includes("/2/statuses/container_timeline_topic")) {
      cleanTimeline(body);
    } else if (url.includes("/2/statuses/container_detail")) {
      cleanContainerDetail(body);
    } else if (url.includes("/2/cardlist")) {
      cleanCardList(body);
    } else if (hasPortalAction(url, "user_center")) {
      cleanUserCenter(body);
    }

    if (!membershipCleaned) cleanMembershipMarks(body);

    $done({ body: JSON.stringify(body) });
  } catch (_) {
    $done({});
  }
}

function hasPortalAction(requestUrl, action) {
  return new RegExp("[?&]a=" + action + "(?:&|$)").test(requestUrl);
}

function cleanCommentResponse(root) {
  walk(root, function (node) {
    if (Array.isArray(node.url_struct)) {
      node.url_struct = node.url_struct.filter(function (item) {
        const target = String(item && (item.ori_url || item.url || item.scheme) || "");
        const log = String(item && item.actionlog && item.actionlog.ext || "");
        return !target.includes("sinaweibo://searchall") &&
               !log.includes("search_high_lights:");
      });
      if (node.url_struct.length === 0) delete node.url_struct;
    }

    if (typeof node.analysis_extra === "string" &&
        node.analysis_extra.includes("search_high_lights:")) {
      node.analysis_extra = node.analysis_extra
        .split("|")
        .filter(function (part) { return !part.startsWith("search_high_lights:"); })
        .join("|");
    }

    if (Object.prototype.hasOwnProperty.call(node, "ad_from_comment")) {
      node.ad_from_comment = true;
    }

    cleanMembershipNode(node);
  });
}

function cleanTimeline(root) {
  delete root.advertises;
  delete root.ad;
  delete root.ad_version_2_weibo;

  if (Array.isArray(root.statuses)) {
    root.statuses = root.statuses.filter(function (status) {
      return !(status && status.ad_marked === true);
    });
  }

  if (Array.isArray(root.items)) {
    root.items = root.items.filter(function (item) {
      const status = item && (item.data || item.mblog);
      return !(status && status.ad_marked === true);
    });
  }
}

function cleanContainerDetail(root) {
  const items = root && root.pageHeader && root.pageHeader.data && root.pageHeader.data.items;
  if (Array.isArray(items)) {
    root.pageHeader.data.items = items.filter(function (item) {
      return !(item && item.data && item.data.itemid === "top_searching");
    });
  }
}

function cleanCardList(root) {
  if (!Array.isArray(root.cards)) return;
  root.cards = root.cards.filter(function (card) {
    if (card && card.mblog && card.mblog.ad_marked === true) return false;
    if (Array.isArray(card && card.card_group)) {
      card.card_group = card.card_group.filter(function (child) {
        return !(child && child.mblog && child.mblog.ad_marked === true);
      });
      if (card.card_group.length === 0) return false;
    }
    return true;
  });
}

function cleanUserCenter(root) {
  const data = root && root.data;
  if (!data || !Array.isArray(data.cards)) return;

  const removeTypes = new Set([
    "personal_vip",
    "ic_profile_wallpaper",
    "personal_accessrecord",
    "personal_topic",
    "personal_wallpaper"
  ]);

  data.cards.forEach(function (card) {
    if (!Array.isArray(card && card.items)) return;
    card.items = card.items.filter(function (item) {
      return !(item && removeTypes.has(item.type));
    });
  });

  data.cards = data.cards.filter(function (card) {
    return Array.isArray(card && card.items) && card.items.length > 0;
  });
}

function cleanMembershipMarks(root) {
  walk(root, cleanMembershipNode);
}

function cleanMembershipNode(node) {
  const isUserObject =
    typeof node.screen_name === "string" ||
    Object.prototype.hasOwnProperty.call(node, "mbtype") ||
    Object.prototype.hasOwnProperty.call(node, "mbrank");

  if (!isUserObject) return;

  if (Array.isArray(node.icons)) {
    node.icons = node.icons.filter(function (icon) {
      return String(icon && icon.name || "").toLowerCase() !== "vip";
    });
  }

  if (Object.prototype.hasOwnProperty.call(node, "mbtype")) node.mbtype = 0;
  if (Object.prototype.hasOwnProperty.call(node, "mbrank")) node.mbrank = 0;
  if (Object.prototype.hasOwnProperty.call(node, "svip")) node.svip = 0;
  if (Object.prototype.hasOwnProperty.call(node, "vvip")) node.vvip = 0;
}

function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  if (Array.isArray(value)) {
    value.forEach(function (item) { walk(item, visitor); });
  } else {
    Object.keys(value).forEach(function (key) { walk(value[key], visitor); });
  }
}
