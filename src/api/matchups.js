import { API_ROUTES } from "../constants";
import { queryKeys } from "./queryKeys";
import { request } from "./client";

/**
 * `GET /matchups` — returns `{ count, rows }`, each row eager-loading its two
 * fighters as nested `P1` and `P2` objects.
 *
 * Filtering is by `p1Uuid` / `p2Uuid` only; there is no name filter, though
 * `P1_name` and `P2_name` are both sortable.
 */
export const matchupsQuery = (params) => ({
    queryKey: queryKeys.matchups.list(params),
    queryFn: ({ signal }) => request(API_ROUTES.Matchup, { params, signal }),
});

export const matchupQuery = (uuid) => ({
    queryKey: [...queryKeys.matchups.all, uuid],
    queryFn: ({ signal }) =>
        request(`${API_ROUTES.Matchup}/${uuid}`, { signal }),
    enabled: Boolean(uuid),
});

export const deleteMatchup = (uuid) =>
    request(`${API_ROUTES.Matchup}/${uuid}`, { method: "DELETE" });
