const luminous = $argument;
const ping = luminous + "/ping";
const url = $request.url;
const cleanURL = removeUrlParameters(url, ["token", "sig", "p", "play_session_id"]); // 移除網址中的敏感資訊

if (url.includes("https://usher.ttvnw.net/api/channel/hls")) {
	var live = cleanURL.slice("https://usher.ttvnw.net/api/channel/hls/".length);
	redirect(live);
} else if (url.includes("https://usher.ttvnw.net/vod")) {
	var vod = cleanURL.slice("https://usher.ttvnw.net/vod/".length);
	redirect(vod);
}

function redirect(path) {
	$httpClient.get(ping, function (error, response) {
		if (response.status != 200) {
			$done({});
		} else if (live) {
			const proxy = `${luminous}/live/${encodeURIComponent(path)}`;
			$done({
				status: 302,
				headers: {
					Location: proxy,
				},
			});
		} else if (vod) {
			const proxy = `${luminous}/vod/${encodeURIComponent(path)}`;
			$done({
				status: 302,
				headers: {
					Location: proxy,
				},
			});
		}
	});
}

function removeUrlParameters(url, parameters) {
	let urlParts = url.split("?");
	if (urlParts.length >= 2) {
		let urlBase = urlParts.shift();
		let queryString = urlParts.join("?");
		let parts = queryString.split(/[&;]/g);
		parts = parts.filter((part) => {
			for (let j = 0; j < parameters.length; j++) {
				const parameter = parameters[j];
				let prefix = encodeURIComponent(parameter) + "=";
				if (part.lastIndexOf(prefix, 0) === 0) {
					return false;
				}
			}
			return true;
		});
		url = urlBase + "?" + parts.join("&");
	}
	return url;
}