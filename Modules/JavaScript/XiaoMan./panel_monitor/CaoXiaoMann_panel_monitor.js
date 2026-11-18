// 内存和流量实时监控
var KEY = "xiaoMan1997";
var base = 'https://127.0.0.1:6171';
function field(text, name) {
  var m = text.match(new RegExp('^' + name + '\\s+([0-9.]+)', 'm'));
  return m ? parseFloat(m[1]) : 0;
}
function fmt(n) {
  if (n >= 1073741824) return (n / 1073741824).toFixed(2) + ' GB';
  if (n >= 1048576) return (n / 1048576).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
  return Math.round(n) + ' B';
}
function uptime(sec) {
  sec = Math.max(0, sec);
  var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
  if (d > 0) return d + ' 天 ' + h + ' 小时';
  if (h > 0) return h + ' 小时 ' + m + ' 分钟';
  return m + ' 分钟';
}
$httpClient.get({url: base + '/v1/metrics', headers: {'X-Key': KEY}}, function(e1, r1, metrics) {
  if (e1) { $done({title:'内存和流量实时监控',content:'读取失败',style:'error'}); return; }
  var mt = String(metrics || '');
  var mem = field(mt, 'surge_memory_bytes') / 1048576;
  var up = field(mt, 'surge_uptime_seconds');
  var req = field(mt, 'surge_active_requests');
  var dns = field(mt, 'surge_dns_cache_entries');
  var ban = field(mt, 'surge_banned_requests');
  var ver = (mt.match(/surge_build_info\{version="([^"]+)",build="([^"]+)"/) || [])[0] || '';
  var v = mt.match(/surge_build_info\{version="([^"]+)",build="([^"]+)"/);
  var verText = v ? ('Surge ' + v[1] + ' · Build ' + v[2]) : 'Surge';
  $httpClient.get({url: base + '/v1/traffic', headers: {'X-Key': KEY}}, function(e2, r2, traffic) {
    if (e2) { $done({title:'内存和流量实时监控',content:'读取失败',style:'error'}); return; }
    var tr; try { tr = typeof traffic === 'string' ? JSON.parse(traffic) : traffic; } catch(e) { tr = null; }
    var down = 0, upB = 0;
    if (tr && tr.interface) {
      Object.keys(tr.interface).forEach(function(k) {
        if (k !== 'lo0') { down += tr.interface[k].in || 0; upB += tr.interface[k].out || 0; }
      });
    }
    var content = '内存占用： ' + mem.toFixed(2) + ' MB\n\n' +
      '运行时间： ' + uptime(up) + '\n\n' +
      'HTTP请求： ' + Math.round(req) + ' · DNS缓存： ' + Math.round(dns) + ' · 封禁： ' + Math.round(ban) + '\n\n' +
      '本机流量： ↓' + fmt(down) + ' ↑' + fmt(upB) + '\n\n' +
      '总计流量： ↓' + fmt(down) + ' ↑' + fmt(upB) + '\n\n' + verText;
    $done({title:'内存和流量实时监控', content: content, icon:'chart.bar.fill', 'icon-color':'#0A84FF'});
  });
});
