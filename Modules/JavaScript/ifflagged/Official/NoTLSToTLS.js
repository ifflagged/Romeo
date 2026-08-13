async function operator(proxies = []) {
  return proxies.map((p = {}) => {
    p.port = 443;
    p.tls = 'true'; // 替换为你想要的 TLS 版本
    p.sni = 'sni-value'; // 替换为你想要的 SNI 值
    return p;
  });
}
