const url = $request.url;

if (url.includes("selffans")) {
  const data = JSON.parse($response.body);
  const cards = data.cards.filter((card) => card.itemid !== "INTEREST_PEOPLE2");
  const body = JSON.stringify({ ...data, cards });
  $done({ body });
} else {
  $done({});
}
