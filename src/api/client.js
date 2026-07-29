import { clearCredentials, getAuthHeader } from "../auth/credentialStore";

import { stringify } from "qs";

const BASE_URL = (import.meta.env.VITE_SALT_MINES_BACKEND_URL ?? "").replace(
    /\/+$/,
    "",
);

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

        throw new ApiError(
            `Could not reach the API at ${BASE_URL}. Check that it is running and that this origin is in its CORS_ALLOWED_ORIGINS.`,
        );
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
