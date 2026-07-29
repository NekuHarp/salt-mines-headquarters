import {
    clearCredentials,
    getCredentials,
    setCredentials,
    subscribe,
} from "./credentialStore";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to the credential store. Re-renders on login, logout, and on the
 * logout the API client triggers itself when the API answers 401.
 */
export function useAuth() {
    const credentials = useSyncExternalStore(subscribe, getCredentials);

    return {
        credentials,
        username: credentials?.username ?? null,
        isAuthenticated: credentials !== null,
        logIn: setCredentials,
        logOut: clearCredentials,
    };
}
