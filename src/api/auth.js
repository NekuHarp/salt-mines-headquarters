import { ApiError, request } from "./client";

import { API_ROUTES } from "../constants";
import { basicAuthHeader } from "../auth/credentialStore";

/**
 * Checks a credential pair against the API, throwing an ApiError if it is
 * rejected or the API is unreachable.
 *
 * `/fighters` is the probe because it is the cheapest authenticated GET
 * available — `?limit=1` keeps the response to a single row. `/state` would be
 * useless here: it is public, so it answers 200 for a wrong password too.
 */
export async function verifyCredentials({ username, password }) {
    try {
        await request(API_ROUTES.Fighter, {
            params: { limit: 1 },
            authHeader: basicAuthHeader({ username, password }),
        });
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            throw new ApiError("Incorrect username or password.", {
                status: 401,
            });
        }

        throw error;
    }
}
