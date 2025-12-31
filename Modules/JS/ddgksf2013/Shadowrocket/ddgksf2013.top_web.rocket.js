body = $response.body.replace(/Lock\s*=\s*\d/g, 'Lock=3').replace(/<\/i>\s*QuantumultX/g, '</i> Shadowrocket');
$done({ body });

