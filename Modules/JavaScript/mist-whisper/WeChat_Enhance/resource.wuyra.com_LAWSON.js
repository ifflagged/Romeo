let obj;
try {
  obj = JSON.parse($response.body);
  obj.data?.homeButtonList && delete obj.data.homeButtonList;
  obj.data?.dysmorphismPictureList && delete obj.data.dysmorphismPictureList;
  $done({ body: JSON.stringify(obj) });
} catch {
  $done({});
}