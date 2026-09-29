body = $response.body.replace(/Lock\s*=\s*\d/g, 'Lock=4').replace(/<\/i>\s*QuantumultX/g, '</i> Loon');
$done({ body });
