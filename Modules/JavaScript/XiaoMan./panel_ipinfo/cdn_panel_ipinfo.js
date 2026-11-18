// IP 纯净度详细面板
$httpClient.get({
  url: 'http://ip-api.com/json/?fields=status,country,countryCode,regionName,city,isp,org,as,hosting,proxy,query'
}, function (err, resp, data) {
  if (err) { $done({ title: 'IP 纯净度', content: '查询失败', style: 'error' }); return; }
  var d;
  try { d = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { d = null; }
  if (!d || d.status !== 'success') {
    $done({ title: 'IP 纯净度', content: '查询失败', style: 'error' });
    return;
  }

  var ip = d.query || '-';
  var cc = (d.countryCode || '').toUpperCase();
  var flag = cc ? cc.replace(/./g, function (c) { return String.fromCodePoint(127397 + c.charCodeAt(0)); }) : '';
  var country = d.country || '-';
  var city = d.city || d.regionName || '-';
  var region = d.regionName || city;
  var isp = d.isp || d.org || '-';
  var asn = d.as || '-';
  var isHost = !!d.hosting;
  var isProxy = !!d.proxy;

  // Scamalytics 风险分/黑名单
  $httpClient.get({ url: 'https://scamalytics.com/ip/' + encodeURIComponent(ip) }, function (e2, r2, html) {
    var text = String(html || '');
    var sm = text.match(/"score"\s*:\s*"([0-9]+)"/);
    var rm = text.match(/"risk"\s*:\s*"([^"]+)"/);
    var bm = text.match(/"is_blacklisted_external"\s*:\s*(true|false)/);
    var score = sm ? parseInt(sm[1], 10) : (isProxy ? 80 : (isHost ? 50 : 10));
    var riskWord = rm ? rm[1] : (score >= 70 ? 'high' : (score >= 40 ? 'medium' : 'low'));
    var blacklisted = bm ? bm[1] === 'true' : false;

    var riskLabel = score >= 70 ? '高风险' : (score >= 40 ? '中风险' : '低风险');
    var dot = score >= 70 ? '🔴' : (score >= 40 ? '🟡' : '🟢');
    var type = isHost ? '🏢 机房 / 商业' : '🏠 住宅 / ISP';
    var proxyLabel = isProxy ? '⚠️ 有' : '✅ 无';
    var blackLabel = blacklisted ? '⚠️ 已收录' : '✅ 未收录';
    var loc = flag + ' ' + country + ' · ' + city + ' · ' + region + ' (' + (cc || '-') + ')';

    var content = '代理策略：自动选择\n' +
      '策略组：节点选择\n' +
      'IP：' + ip + '\n' +
      '归属：' + loc + '\n' +
      'ISP：' + isp + '\n' +
      'AS：' + asn + '\n' +
      '类型：' + type + '\n' +
      '风险：' + dot + ' ' + riskLabel + ' | ' + score + '/100\n' +
      '代理/VPN：' + proxyLabel + '\n' +
      '黑名单：' + blackLabel;

    $done({
      title: 'IP 纯净度',
      content: content,
      icon: score >= 40 ? 'exclamationmark.triangle.fill' : 'checkmark.shield.fill',
      'icon-color': score >= 70 ? '#FF3B30' : (score >= 40 ? '#FFCC00' : '#34C759')
    });
  });
});
