
body = $response.body.replace(/Lock\s*=\s*\d/g, 'Lock=2').replace(/<\/i>\s*QuantumultX/g, '</i> Surge');
$done({ body });
