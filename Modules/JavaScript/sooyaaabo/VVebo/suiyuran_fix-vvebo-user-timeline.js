let url = $request.url;
const hasUid = (url) => url.includes("uid");
const getUid = (url) => (hasUid(url) ? url.match(/uid=(\d+)/)[1] : undefined);
const uidKey = "vvebo_uid";

if (url.includes("remind/unread_count")) {
  const uid = getUid(url);
  $persistentStore.write(uid, uidKey);
  $done({});
} else if (url.includes("statuses/user_timeline")) {
  const uid = getUid(url) || $persistentStore.read(uidKey);
  url = url.replace("statuses/user_timeline", "profile/statuses/tab").replace("max_id", "since_id");
  url = url + `&containerid=230413${uid}_-_WEIBO_SECOND_PROFILE_WEIBO`;
  $done({ url });
} else if (url.includes("profile/statuses/tab")) {
  const data = JSON.parse($response.body);
  const statuses = data.cards
    .map((card) => (card.card_group ? card.card_group : card))
    .flat()
    .filter((card) => card.card_type === 9)
    .map((card) => card.mblog)
    .map((status) => (status.isTop ? { ...status, label: "置顶" } : status));
  const sinceId = data.cardlistInfo.since_id;
  const body = JSON.stringify({ statuses, since_id: sinceId, total_number: 100 });
  $done({ body });
} else {
  $done({});
}
