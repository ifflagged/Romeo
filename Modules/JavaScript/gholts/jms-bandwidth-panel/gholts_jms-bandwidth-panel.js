/**
 * Based on Doraemon-Labs/QuantumultX-JMS-Bandwidth-Checker
 * Licensed under the Apache License 2.0.
 *
 * Copyright 2024 Doraemon-Labs
 * Modified by Hugo Lee, 2026.
 */

const TITLE = "JMS Bandwidth";
const API_URL = "https://justmysocks6.net/members/getbwcounter.php";
const HTTP_TIMEOUT = 8;
const BYTES_PER_GB = 1000 ** 3;
const args = parseArguments(typeof $argument === "undefined" ? "" : $argument);

main().catch((error) => {
    finish({
        title: TITLE,
        content: `Error: ${messageOf(error)}`,
        style: "error",
        icon: "exclamationmark.triangle.fill",
        color: "#ff453a",
    });
});

async function main() {
    const service = arg("service");
    const id = arg("id");
    if (isPlaceholder(service) || isPlaceholder(id)) {
        throw new Error("missing service or id");
    }
    const apiUrl =
        `${API_URL}?service=${encodeURIComponent(service)}` +
        `&id=${encodeURIComponent(id)}`;
    const response = await httpGet(apiUrl);

    if (!response.ok)
        throw new Error(`HTTP ${response.status || response.statusCode}`);

    const data = parseJson(response.body);
    const limitBytes = numberFrom(data, [
        "monthly_bw_limit_b",
        "monthly_bw_limit",
        "limit_b",
        "limit",
    ]);
    const usedBytes = numberFrom(data, [
        "bw_counter_b",
        "bw_used_b",
        "used_b",
        "used",
    ]);

    if (!Number.isFinite(limitBytes) || limitBytes <= 0) {
        throw new Error("bad monthly_bw_limit_b");
    }
    if (!Number.isFinite(usedBytes) || usedBytes < 0) {
        throw new Error("bad bw_counter_b");
    }

    const usedPercent = clamp((usedBytes / limitBytes) * 100, 0, 999);
    const leftBytes = Math.max(limitBytes - usedBytes, 0);
    const leftPercent = clamp(100 - usedPercent, 0, 100);
    const state = stateForLeft(leftPercent);
    const resetDay =
        data.bw_reset_day_of_month || data.reset_day || data.resetDay;

    const lines = [
        `Used: ${formatBytes(usedBytes)} / ${formatBytes(limitBytes)} GB ` +
            `(${usedPercent.toFixed(2)}%)`,
        `Left: ${formatBytes(leftBytes)} GB (${leftPercent.toFixed(2)}%)`,
        `${bar(usedPercent)}`,
    ];

    if (resetDay) lines.push(`Reset day: ${resetDay}`);
    lines.push(`Updated: ${timestamp()}`);

    finish({
        title: TITLE,
        content: lines.join("\n"),
        style: state.style,
        icon: state.icon,
        color: state.color,
    });
}

function finish({ title, content, style, icon, color }) {
    finishNative({
        title,
        content,
        style,
        icon,
        "icon-color": color,
    });
}

function finishNative(payload) {
    if (typeof $done === "function") return $done(payload);
}

function httpGet(url) {
    const request = {
        url,
        headers: { Accept: "application/json" },
        timeout: HTTP_TIMEOUT,
        "auto-redirect": true,
    };

    return new Promise((resolve, reject) => {
        $httpClient.get(request, (error, response = {}, body = "") => {
            if (error) {
                reject(new Error(messageOf(error)));
                return;
            }

            const status = Number(response.status || 0);
            response.ok = status >= 200 && status < 300;
            response.status = status;
            response.statusCode = status;
            response.body = body;
            resolve(response);
        });
    });
}

function isPlaceholder(value) {
    return ["", "-", "none", "null", "undefined"].includes(
        String(value).trim().toLowerCase(),
    );
}

function parseArguments(value) {
    if (value && typeof value === "object") return value;

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
        return decodeURIComponent(String(value).replace(/\+/g, " "));
    } catch {
        return String(value);
    }
}

function arg(name) {
    const value = args[name];
    return value === undefined || value === null ? "" : String(value);
}

function numberFrom(object, names) {
    for (const name of names) {
        const value = Number(getPath(object, name));
        if (Number.isFinite(value)) return value;
    }
    return NaN;
}

function getPath(object, path) {
    return String(path)
        .split(".")
        .reduce(
            (value, key) => (value == null ? undefined : value[key]),
            object,
        );
}

function parseJson(body) {
    if (typeof body !== "string") throw new Error("empty response body");
    return JSON.parse(body);
}

function formatBytes(bytes) {
    return (bytes / BYTES_PER_GB).toFixed(3);
}

function stateForLeft(leftPercent) {
    if (leftPercent <= 5) {
        return {
            style: "error",
            icon: "exclamationmark.triangle.fill",
            color: "#ff453a",
        };
    }
    if (leftPercent <= 20) {
        return {
            style: "alert",
            icon: "gauge.with.dots.needle.bottom.100percent",
            color: "#ff9f0a",
        };
    }
    return {
        style: "good",
        icon: "gauge.with.dots.needle.bottom.50percent",
        color: "#32d74b",
    };
}

function bar(percent) {
    const width = 18;
    const filled = Math.round((clamp(percent, 0, 100) / 100) * width);
    return `[${"#".repeat(filled)}${"-".repeat(width - filled)}]`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function timestamp() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function messageOf(error) {
    return error && error.message ? error.message : String(error);
}
