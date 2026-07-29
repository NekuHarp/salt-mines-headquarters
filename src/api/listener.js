import { API_ROUTES, POLL_INTERVALS } from "../constants";

import { queryKeys } from "./queryKeys";
import { request } from "./client";

/**
 * `GET /listener` — `{ active, params }`, where `params` is null while stopped.
 *
 * Polled rather than pushed: the listener can stop on its own once it has
 * recorded its `matchesToRecord` quota, without the browser being told.
 */
export const listenerStatusQuery = () => ({
    queryKey: queryKeys.listener.status,
    queryFn: ({ signal }) => request(API_ROUTES.Listener, { signal }),
    refetchInterval: POLL_INTERVALS.LISTENER_STATUS,
    retry: false,
});

/**
 * `PUT /listener/start` — answers 409 if already running.
 *
 * `matchesToRecord` is optional: omitted, the listener runs until stopped.
 */
export const startListener = (body) =>
    request(`${API_ROUTES.Listener}/start`, { method: "PUT", body });

/** `PUT /listener/stop` — answers 409 if not running. */
export const stopListener = () =>
    request(`${API_ROUTES.Listener}/stop`, { method: "PUT" });
