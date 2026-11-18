import { clearCredentials, getAuthHeader } from "../auth/credentialStore";

import { LIST_CHUNK_LIMIT } from "../constants";

import { stringify } from "qs";

/**
 * Where the API lives. Either the backend's own origin, as in local development,
 * or a relative path that a proxy in front of this app forwards — which is how
 * the deployed build reaches an HTTP-only backend from an HTTPS page without
 * tripping the browser's mixed-content block.
 */
const BASE_URL = (import.meta.env.VITE_SALT_MINES_BACKEND_URL ?? "").replace(
    /\/+$/,
    "",
);

/** True when requests go straight to the backend rather than through a proxy. */
const IS_CROSS_ORIGIN = /^https?:\/\//i.test(BASE_URL);

/**
 * Browsers deliberately hide why a request failed at the network level, so the
 * best this can do is name the likely cause — and that differs by deployment:
 * direct requests can be refused by CORS, proxied ones cannot.
 */
function unreachableMessage() {
    if (IS_CROSS_ORIGIN) {
        return `Could not reach the API at ${BASE_URL}. Check that it is running and that this origin is in its CORS_ALLOWED_ORIGINS.`;
    }

    return `Could not reach the API through ${BASE_URL}. Check that the proxy in front of this app is configured and that the backend behind it is running.`;
}

/**
 * An API failure with the status and, when the backend supplied one, its
 * numeric `errorCode`. Callers branch on those rather than on message text —
 * for instance a 422 from `GET /state` means "exhibition match", not "broken".
 */
export class ApiError extends Error {
    constructor(message, { status, errorCode } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errorCode = errorCode;
    }
}

/**
 * Serializes query params into the shape the API's `qs` parser expects.
 *
 * Advanced filters arrive here as arrays — `{ wager: ["gte", 500] }` becomes
 * `wager[]=gte&wager[]=500`, which `preprocessWhere` on the backend turns into
 * a Sequelize operator. Plain values become plain equality.
 */
function serializeParams(params) {
    if (!params) return "";

    const query = stringify(params, {
        arrayFormat: "brackets",
        skipNulls: true,
        addQueryPrefix: true,
    });

    return query === "?" ? "" : query;
}

async function parseBody(response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        // Some failures (a proxy, a crash before the JSON handler) answer with
        // plain text; keep it so the message isn't lost.
        return text;
    }
}

/**
 * Performs a request against the salt-mines API.
 *
 * A 401 clears the stored credentials, which drops the app back to the login
 * screen — the credentials are either wrong or the API's own have been rotated,
 * and retrying with them is pointless either way. `authHeader` overrides the
 * stored credentials for a single call, and suppresses that logout: it exists
 * so the login screen can test a pair before committing to it, where a 401 is
 * an expected answer rather than an expired session.
 */
export async function request(
    path,
    { method = "GET", body, params, signal, authHeader: authOverride } = {},
) {
    if (!BASE_URL) {
        throw new ApiError(
            "VITE_SALT_MINES_BACKEND_URL is not set. Add it to .env and restart the dev server.",
        );
    }

    const authHeader = authOverride ?? getAuthHeader();
    const headers = {};
    if (authHeader) headers.Authorization = authHeader;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response;
    try {
        response = await fetch(`${BASE_URL}${path}${serializeParams(params)}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        // fetch only rejects on network-level failures, and the browser hides
        // the cause of a CORS rejection behind the same generic error.
        if (error?.name === "AbortError") throw error;

        throw new ApiError(unreachableMessage());
    }

    const payload = await parseBody(response);

    if (response.status === 401) {
        if (!authOverride) clearCredentials();

        throw new ApiError(
            payload?.message ?? "Authentication failed. Please sign in again.",
            { status: 401, errorCode: payload?.errorCode },
        );
    }

    if (!response.ok) {
        const message =
            (typeof payload === "string" ? payload : payload?.message) ??
            `Request failed with status ${response.status}.`;

        throw new ApiError(message, {
            status: response.status,
            errorCode: payload?.errorCode,
        });
    }

    return payload;
}

/**
 * `request` for list endpoints (`{ count, rows }`), splitting a large `limit`
 * into sequential requests of at most `LIST_CHUNK_LIMIT` rows, since one big
 * request can take the backend down.
 */
export async function requestList(path, { params = {}, signal } = {}) {
    const { limit, offset = 0 } = params;

    if (!(limit > LIST_CHUNK_LIMIT)) {
        return request(path, { params, signal });
    }

    const rows = [];
    let count = 0;

    while (rows.length < limit) {
        const chunkLimit = Math.min(LIST_CHUNK_LIMIT, limit - rows.length);
        const page = await request(path, {
            params: {
                ...params,
                offset: offset + rows.length,
                limit: chunkLimit,
            },
            signal,
        });

        count = page.count;
        rows.push(...page.rows);
        if (page.rows.length < chunkLimit) break;
    }

    return { count, rows: dedupeByUuid(rows) };
}

// Rows inserted between chunks shift the offsets, which can repeat a row
// across a chunk boundary.
function dedupeByUuid(rows) {
    const seen = new Set();
    return rows.filter((row) => {
        if (row?.uuid === undefined) return true;
        if (seen.has(row.uuid)) return false;
        seen.add(row.uuid);
        return true;
    });
}
