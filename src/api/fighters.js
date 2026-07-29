import { API_ROUTES } from "../constants";
import { queryKeys } from "./queryKeys";
import { request } from "./client";

/**
 * `GET /fighters` — returns `{ count, rows }` from Sequelize's findAndCountAll.
 *
 * Note that `name` is an exact-match filter, not a substring one: the API's
 * fighter validator declares it as a plain string, so the `contains` operator
 * available on other resources is not accepted here.
 */
export const fightersQuery = (params) => ({
    queryKey: queryKeys.fighters.list(params),
    queryFn: ({ signal }) =>
        request(API_ROUTES.Fighter, { params, signal }),
});

export const fighterQuery = (uuid) => ({
    queryKey: [...queryKeys.fighters.all, uuid],
    queryFn: ({ signal }) =>
        request(`${API_ROUTES.Fighter}/${uuid}`, { signal }),
    enabled: Boolean(uuid),
});

export const updateFighter = ({ uuid, ...body }) =>
    request(`${API_ROUTES.Fighter}/${uuid}`, { method: "PATCH", body });

export const deleteFighter = (uuid) =>
    request(`${API_ROUTES.Fighter}/${uuid}`, { method: "DELETE" });
