async function operator(proxies = []) {
  return proxies.map((p = {}) => {
    p.port = 80;
    delete p.tls;
    delete p.sni;
    return p;
  });
}
