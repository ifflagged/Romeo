let scheme = $argument["tgapp"];

const mapping = {
    "Telegram": "tg",
    "Swiftgram": "sg",
    "Turrit": "turrit",
    "iMe": "ime",
    "Nicegram": "ng",
    "Lingogram": "lingo"
};

scheme = mapping[scheme] || scheme;

if (!scheme) {
    $done({});
}

let url = $request.url;

let match = url.match(/^(https?:\/\/)?(t\.me|telegram\.(me|dog))\/(.+)/);

if (match) {
    let newUrl = `${scheme}://resolve?domain=${match[4]}`;

    $done({
        status: 307,
        headers: {
            'Location': newUrl
        }
    });
} else {
    $done({});
}