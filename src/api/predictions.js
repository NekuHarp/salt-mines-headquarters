import { API_ROUTES } from "../constants";
import { queryKeys } from "./queryKeys";
import { request } from "./client";

/**
 * `GET /predictions` — returns `{ count, rows }`.
 *
 * One row per recorded match, with the stats frozen as they were when the
 * prediction was made. `fightersInfo: true` adds the nested `P1`/`P2` fighter
 * objects; without it only their UUIDs come back.
 *
 * There is no POST: rows are written by the backend's listener.
 */
export const predictionsQuery = (params) => ({
    queryKey: queryKeys.predictions.list(params),
    queryFn: ({ signal }) => request(API_ROUTES.Prediction, { params, signal }),
});

export const updatePrediction = ({ uuid, ...body }) =>
    request(`${API_ROUTES.Prediction}/${uuid}`, { method: "PATCH", body });

export const deletePrediction = (uuid) =>
    request(`${API_ROUTES.Prediction}/${uuid}`, { method: "DELETE" });
