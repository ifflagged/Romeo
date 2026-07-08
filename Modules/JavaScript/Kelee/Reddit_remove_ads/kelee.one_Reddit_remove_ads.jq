#2024-12-02 10:28:36
walk(
  if type == "object" then
    #设置 NSFW 相关的字段, 防止一直弹窗确认
    (if .isNsfw == true then .isNsfw = false else . end)
    | (if .isNsfwMediaBlocked == true then .isNsfwMediaBlocked = false else . end)
    | (if .isNsfwContentShown == false then .isNsfwContentShown = true else . end)
    #把 commentsPageAds 设置为空数组
    | (if (.commentsPageAds | type == "array") then (.commentsPageAds = []) else . end)
    #过滤掉广告相关的数据
    | (if ( (.node | type == "object") and (.node.cells | type == "array") and (.node.cells | any(.__typename? == "AdMetadataCell" or .isAdPost? == true)) ) then empty else . end)
    | (if (.node | type == "object") and (.node.adPayload | type == "object") then empty else . end)
    | (if .__typename == "AdPost" then empty else . end)
  else . 
end)