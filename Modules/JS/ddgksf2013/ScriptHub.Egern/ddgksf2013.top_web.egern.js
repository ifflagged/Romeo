body = $response.body.replace(/Lock\s*=\s*\d/g, 'Lock=5').replace(/<\/i>\s*QuantumultX/g, '</i> Egern');
$done({ body });
