const TITLE = "AWS Lightsail Bandwidth";
const DISCOVERY_REGION = "us-east-1";
const CONTENT_TYPE = "application/x-amz-json-1.1";
const HTTP_TIMEOUT = 10;
const METRIC_PERIOD = 3600;
const BYTES_PER_GB = 1024 ** 3;
const SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const args = parseArguments(typeof $argument === "undefined" ? "" : $argument);

main().catch((error) => {
    $done({
        title: TITLE,
        content: `Error: ${messageOf(error)}`,
        icon: "externaldrive.fill.badge.xmark",
        "icon-color": "#ff453a",
    });
});

async function main() {
    const instanceNames = [arg("instance_1_name"), arg("instance_2_name")];
    const credentials = {
        accessKeyId: arg("ACCESS_KEY_ID"),
        secretAccessKey: arg("SECRET_ACCESS_KEY"),
    };

    if (
        instanceNames.some(isPlaceholder) ||
        isPlaceholder(credentials.accessKeyId) ||
        isPlaceholder(credentials.secretAccessKey)
    ) {
        throw new Error("missing instance names or AWS credentials");
    }
    if (instanceNames[0] === instanceNames[1]) {
        throw new Error("instance names must differ");
    }

    const instances = await findInstances(instanceNames, credentials);
    const usage = await Promise.all(
        instances.map((instance) => loadUsage(instance, credentials)),
    );
    const highestPercent = Math.max(...usage.map((item) => item.percent));
    const state = stateForUsage(highestPercent);

    $done({
        title: TITLE,
        content: usage.map(formatInstance).join("\n\n"),
        icon: state.icon,
        "icon-color": state.color,
    });
}

async function findInstances(instanceNames, credentials) {
    const result = await awsCall(
        "GetRegions",
        DISCOVERY_REGION,
        {},
        credentials,
    );
    const regions = (result.regions || []).map((region) => region.name);
    if (!regions.length) throw new Error("AWS returned no Lightsail regions");

    const scans = [];
    for (let index = 0; index < regions.length; index += 10) {
        const batch = await Promise.all(
            regions.slice(index, index + 10).map(async (region) => {
                try {
                    return {
                        instances: await findInstancesInRegion(
                            instanceNames,
                            region,
                            credentials,
                        ),
                    };
                } catch (error) {
                    return { error };
                }
            }),
        );
        scans.push(...batch);
    }
    const matches = scans.flatMap((scan) => scan.instances || []);
    const failures = scans.filter((scan) => scan.error).length;
    const suffix = failures ? `; ${failures} region scans failed` : "";
    const resolved = instanceNames.map((name) => {
        const namedMatches = matches.filter(
            (instance) => instance.name === name,
        );
        if (namedMatches.length !== 1) {
            throw new Error(
                `found ${namedMatches.length} instances named ${name}${suffix}`,
            );
        }
        return namedMatches[0];
    });
    if (resolved[0].region === resolved[1].region) {
        throw new Error("instances must be in different regions");
    }
    return resolved;
}

async function findInstancesInRegion(instanceNames, region, credentials) {
    const matches = [];
    let pageToken;
    do {
        const payload = pageToken ? { pageToken } : {};
        const result = await awsCall(
            "GetInstances",
            region,
            payload,
            credentials,
        );
        for (const instance of result.instances || []) {
            if (instanceNames.includes(instance.name)) {
                matches.push({ ...instance, region });
            }
        }
        if (matches.length === instanceNames.length) return matches;
        pageToken = result.nextPageToken;
    } while (pageToken);
    return matches;
}

async function loadUsage(instance, credentials) {
    const now = new Date();
    const startTime =
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000;
    const endTime = now.getTime() / 1000;
    const metricPayload = {
        instanceName: instance.name,
        period: METRIC_PERIOD,
        startTime,
        endTime,
        statistics: ["Sum"],
        unit: "Bytes",
    };
    const [networkIn, networkOut] = await Promise.all(
        ["NetworkIn", "NetworkOut"].map((metricName) =>
            awsCall(
                "GetInstanceMetricData",
                instance.region,
                { ...metricPayload, metricName },
                credentials,
            ),
        ),
    );
    const quotaGb = Number(
        instance.networking &&
            instance.networking.monthlyTransfer &&
            instance.networking.monthlyTransfer.gbPerMonthAllocated,
    );
    if (!Number.isFinite(quotaGb) || quotaGb <= 0) {
        throw new Error(
            `missing quota for ${instance.name} in ${instance.region}`,
        );
    }

    const incoming = sumMetric(networkIn);
    const outgoing = sumMetric(networkOut);
    const quota = quotaGb * BYTES_PER_GB;
    return {
        name: instance.name,
        region: instance.region,
        quota,
        incoming,
        outgoing,
        percent: ((incoming + outgoing) / quota) * 100,
    };
}

async function awsCall(operation, region, payload, credentials) {
    const host = `lightsail.${region}.amazonaws.com`;
    const target = `Lightsail_20161128.${operation}`;
    const body = JSON.stringify(payload);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
    const canonicalHeaders =
        `content-type:${CONTENT_TYPE}\n` +
        `host:${host}\n` +
        `x-amz-date:${amzDate}\n` +
        `x-amz-target:${target}\n`;
    const canonicalRequest = [
        "POST",
        "/",
        "",
        canonicalHeaders,
        signedHeaders,
        await sha256(body),
    ].join("\n");
    const scope = `${dateStamp}/${region}/lightsail/aws4_request`;
    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        scope,
        await sha256(canonicalRequest),
    ].join("\n");
    const dateKey = await hmac(
        encode(`AWS4${credentials.secretAccessKey}`),
        dateStamp,
    );
    const regionKey = await hmac(dateKey, region);
    const serviceKey = await hmac(regionKey, "lightsail");
    const signingKey = await hmac(serviceKey, "aws4_request");
    const signature = toHex(await hmac(signingKey, stringToSign));
    const authorization =
        `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return httpPost(`https://${host}/`, body, {
        "Content-Type": CONTENT_TYPE,
        "X-Amz-Date": amzDate,
        "X-Amz-Target": target,
        Authorization: authorization,
    });
}

function httpPost(url, body, headers) {
    return new Promise((resolve, reject) => {
        $httpClient.post(
            { url, body, headers, timeout: HTTP_TIMEOUT },
            (error, response = {}, data = "") => {
                if (error) {
                    reject(new Error(messageOf(error)));
                    return;
                }
                const status = Number(
                    response.status || response.statusCode || 0,
                );
                if (status < 200 || status >= 300) {
                    reject(new Error(awsError(data, status)));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error("invalid AWS response"));
                }
            },
        );
    });
}

function sha256(value) {
    return toHex(sha256Bytes(encode(value)));
}

function hmac(key, value) {
    if (key.length > 64) key = sha256Bytes(key);
    const inner = new Uint8Array(64 + encode(value).length);
    const outer = new Uint8Array(96);
    for (let index = 0; index < 64; index += 1) {
        const byte = key[index] || 0;
        inner[index] = byte ^ 0x36;
        outer[index] = byte ^ 0x5c;
    }
    inner.set(encode(value), 64);
    outer.set(sha256Bytes(inner), 64);
    return sha256Bytes(outer);
}

function encode(value) {
    const string = unescape(encodeURIComponent(String(value)));
    return Uint8Array.from(string, (character) => character.charCodeAt(0));
}

function sha256Bytes(bytes) {
    const length = Math.ceil((bytes.length + 9) / 64) * 64;
    const data = new Uint8Array(length);
    const view = new DataView(data.buffer);
    data.set(bytes);
    data[bytes.length] = 0x80;
    const bitLength = bytes.length * 8;
    view.setUint32(length - 8, Math.floor(bitLength / 0x100000000));
    view.setUint32(length - 4, bitLength >>> 0);

    const hash = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
        0x1f83d9ab, 0x5be0cd19,
    ]);
    const words = new Uint32Array(64);
    for (let offset = 0; offset < length; offset += 64) {
        for (let index = 0; index < 16; index += 1) {
            words[index] = view.getUint32(offset + index * 4);
        }
        for (let index = 16; index < 64; index += 1) {
            const previous15 = words[index - 15];
            const previous2 = words[index - 2];
            const sigma0 =
                rotateRight(previous15, 7) ^
                rotateRight(previous15, 18) ^
                (previous15 >>> 3);
            const sigma1 =
                rotateRight(previous2, 17) ^
                rotateRight(previous2, 19) ^
                (previous2 >>> 10);
            words[index] =
                (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
        }

        let [a, b, c, d, e, f, g, h] = hash;
        for (let index = 0; index < 64; index += 1) {
            const choice = (e & f) ^ (~e & g);
            const majority = (a & b) ^ (a & c) ^ (b & c);
            const sum0 =
                rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const sum1 =
                rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const temporary1 =
                (h + sum1 + choice + SHA256_K[index] + words[index]) >>> 0;
            const temporary2 = (sum0 + majority) >>> 0;
            h = g;
            g = f;
            f = e;
            e = (d + temporary1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temporary1 + temporary2) >>> 0;
        }
        hash[0] = (hash[0] + a) >>> 0;
        hash[1] = (hash[1] + b) >>> 0;
        hash[2] = (hash[2] + c) >>> 0;
        hash[3] = (hash[3] + d) >>> 0;
        hash[4] = (hash[4] + e) >>> 0;
        hash[5] = (hash[5] + f) >>> 0;
        hash[6] = (hash[6] + g) >>> 0;
        hash[7] = (hash[7] + h) >>> 0;
    }

    const output = new Uint8Array(32);
    const outputView = new DataView(output.buffer);
    hash.forEach((word, index) => outputView.setUint32(index * 4, word));
    return output;
}

function rotateRight(value, bits) {
    return (value >>> bits) | (value << (32 - bits));
}

function toHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
    );
}

function sumMetric(result) {
    return (result.metricData || []).reduce(
        (total, point) => total + Number(point.sum || 0),
        0,
    );
}

function formatInstance(instance) {
    const used = instance.incoming + instance.outgoing;
    const left = Math.max(instance.quota - used, 0);
    const leftPercent = clamp(100 - instance.percent, 0, 100);
    return [
        instance.name,
        `Used: ${formatGigabytes(used)} / ${formatGigabytes(instance.quota)} GB (${instance.percent.toFixed(2)}%)`,
        `Left: ${formatGigabytes(left)} GB (${leftPercent.toFixed(2)}%)`,
        progressBar(instance.percent),
        `Bill date: ${billDate()}`,
    ].join("\n");
}

function formatGigabytes(bytes) {
    return (bytes / BYTES_PER_GB).toFixed(2);
}

function billDate() {
    const now = new Date();
    const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    return `${date.toISOString().slice(0, 10)} (${days}d)`;
}

function progressBar(percent) {
    const width = 18;
    const filled = Math.round((clamp(percent, 0, 100) / 100) * width);
    return `[${"#".repeat(filled)}${"-".repeat(width - filled)}]`;
}

function stateForUsage(percent) {
    if (percent >= 90) {
        return {
            icon: "externaldrive.fill.badge.xmark",
            color: "#ff453a",
        };
    }
    if (percent >= 70) {
        return {
            icon: "externaldrive.fill.badge.exclamationmark",
            color: "#ff9f0a",
        };
    }
    return {
        icon: "externaldrive.fill.badge.checkmark",
        color: "#32d74b",
    };
}

function parseArguments(value) {
    const result = {};
    for (const item of String(value || "")
        .replace(/^\?/, "")
        .split("&")) {
        if (!item) continue;
        const separator = item.indexOf("=");
        const key = decodeArgument(
            separator < 0 ? item : item.slice(0, separator),
        );
        if (!key) continue;
        result[key] = decodeArgument(
            separator < 0 ? "" : item.slice(separator + 1),
        );
    }
    return result;
}

function decodeArgument(value) {
    try {
        return decodeURIComponent(String(value));
    } catch {
        return String(value);
    }
}

function arg(name) {
    const value = args[name];
    return value === undefined || value === null ? "" : String(value).trim();
}

function isPlaceholder(value) {
    return ["", "-", "none", "null", "undefined"].includes(
        String(value).trim().toLowerCase(),
    );
}

function awsError(body, status) {
    try {
        const data = JSON.parse(body);
        return (
            data.message || data.Message || data.__type || `AWS HTTP ${status}`
        );
    } catch {
        return `AWS HTTP ${status}`;
    }
}

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

function messageOf(error) {
    return error && error.message ? error.message : String(error);
}
