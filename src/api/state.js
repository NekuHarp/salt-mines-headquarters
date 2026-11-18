import { API_ROUTES, POLL_INTERVALS } from "../constants";

import { queryKeys } from "./queryKeys";
import { request } from "./client";

/**
 * `GET /state` — read-only snapshot of the current Salty Bet match.
 *
 * The only public endpoint of the two this app uses. It answers 422 for
 * exhibition matches and 502 when Salty Bet itself is unreachable; neither is
 * worth retrying, since the next poll supersedes the result anyway.
 */
export const matchStateQuery = () => ({
    queryKey: queryKeys.state.match,
    queryFn: ({ signal }) => request(API_ROUTES.State, { signal }),
    refetchInterval: POLL_INTERVALS.MATCH_STATE,
    retry: false,
});

/**
 * `GET /state/balance` — scrapes the Salty Bet account balance, signing in
 * first if there is no session yet.
 *
 * Polled far more slowly than the match state: every call hits Salty Bet's
 * site rather than the local database.
 */
export const balanceQuery = () => ({
    queryKey: queryKeys.state.balance,
    queryFn: ({ signal }) => request(`${API_ROUTES.State}/balance`, { signal }),
    refetchInterval: POLL_INTERVALS.BALANCE,
    retry: false,
});
