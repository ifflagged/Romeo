const urlReg = /^https?:\/\/api\.m\.jd\.com\/\?functionId=union_exhibition_bff&client=apple&clientVer/i

if ($response.body && urlReg.test($request.url)) {
    let obj = JSON.parse($response.body);

    if (obj.result && Array.isArray(obj.result)) {
        // 过滤掉含有广告特征字段的项，比如带 url、urlList 的就判定为广告
        obj.result = obj.result.filter(item => {
            return !(item.url || (Array.isArray(item.urlList) && item.urlList.length > 0) || item.pcLandUrl || item.landUrl);
        });
    }

    // 保留必要数据结构
    obj.code = 200;
    obj.message = "success";
    obj.hasNext = false;
    obj.totalNum = obj.result ? obj.result.length : 0;

    $done({ body: JSON.stringify(obj) });
} else {
    $done($response);
}
