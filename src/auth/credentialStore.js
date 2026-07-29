/**
 * Holds the API's Basic Auth credentials for the lifetime of the tab.
 *
 * This is a plain module store rather than React state on purpose: the API
 * client needs the credentials from outside the component tree, and a 401 has
 * to be able to clear them from inside a fetch. React reads it through
 * `useSyncExternalStore` (see `useAuth`).
 *
 * sessionStorage rather than localStorage: the credentials survive a reload but
 * not closing the tab, and they never enter the built bundle the way a
 * VITE_-prefixed env var would.
 */

const STORAGE_KEY = "salt-mines-hq.credentials";

const listeners = new Set();

function read() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (typeof parsed?.username !== "string") return null;
        if (typeof parsed?.password !== "string") return null;

        return parsed;
    } catch {
        // Unavailable (private mode, storage disabled) or corrupt: treat as
        // logged out rather than breaking the app on boot.
        return null;
    }
}

let credentials = read();

function emit() {
    listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Reference-stable while unchanged, so `useSyncExternalStore` stays quiet. */
export function getCredentials() {
    return credentials;
}

export function setCredentials({ username, password }) {
    credentials = { username, password };

    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    } catch {
        // Keep the in-memory copy: the session still works, it just won't
        // survive a reload.
    }

    emit();
}

export function clearCredentials() {
    if (credentials === null) return;

    credentials = null;

    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to do — the in-memory copy is already gone.
    }

    emit();
}

/**
 * `btoa` throws on anything outside Latin-1, so the password is UTF-8 encoded
 * first. RFC 7617 expects UTF-8 for non-ASCII credentials anyway.
 */
function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

/**
 * Builds an `Authorization` header from an arbitrary credential pair, without
 * storing it — the login screen needs to try a pair before committing to it.
 */
export function basicAuthHeader({ username, password }) {
    return `Basic ${encodeBase64(`${username}:${password}`)}`;
}

/** The `Authorization` header for the stored credentials, or null if logged out. */
export function getAuthHeader() {
    return credentials ? basicAuthHeader(credentials) : null;
}
