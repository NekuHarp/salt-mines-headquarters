import { request, requestList } from "./client";
import { API_ROUTES } from "../constants";
import { queryKeys } from "./queryKeys";

/**
 * `GET /fighters` — returns `{ count, rows }` from Sequelize's findAndCountAll.
 *
 * `name` takes the operator array syntax, so pass `["contains", text]` to search
 * by substring. A bare string is an exact match.
 */
export const fightersQuery = (params) => ({
    queryKey: queryKeys.fighters.list(params),
    queryFn: ({ signal }) =>
        requestList(API_ROUTES.Fighter, { params, signal }),
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
