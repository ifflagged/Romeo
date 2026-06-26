let args = {};
try {
    args = JSON.parse($argument || "{}");
} catch (e) {}

let scheme = args["t.me_redirect"];

const mapping = {
    Telegram: "tg",
    Swiftgram: "sg",
    Turrit: "turrit",
    iMe: "ime",
    Nicegram: "ng",
    Lingogram: "lingo"
};

if (mapping[scheme]) {
    scheme = mapping[scheme];
}

if (!scheme) {
    $done({});
}

let url = $request.url;

let match = url.match(/^https?:\/\/(t\.me|telegram\.me|telegram\.dog)\/([^?#]+)/);

if (match) {
    let path = match[2];
    let newUrl = `${scheme}://resolve?domain=${path}`;

    $done({
        status: 307,
        headers: {
            Location: newUrl,
            "Cache-Control": "no-cache"
        }
    });
} else {
    $done({});
}