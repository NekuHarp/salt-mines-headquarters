import { API_MAX_LIMIT, STATISTICS_SAMPLE_LIMIT } from "../../constants";

export const SAMPLE_SIZES = [
    {
        value: "recent",
        label: `Last ${STATISTICS_SAMPLE_LIMIT.toLocaleString("en")} fights`,
        limit: STATISTICS_SAMPLE_LIMIT,
    },
    { value: "all", label: "All fights", limit: API_MAX_LIMIT },
];

export function sampleLimit(sampleSize) {
    return SAMPLE_SIZES.find((size) => size.value === sampleSize).limit;
}

export const DEFAULT_FILTERS = {
    mode: "",
    createdAfter: "",
    createdBefore: "",
    betFilter: "all",
    sampleSize: "recent",
};

export const BET_FILTERS = [
    { value: "all", label: "All matches" },
    { value: "bet", label: "Bet on" },
    { value: "noBet", label: "Not bet on" },
];

/**
 * Translates the filter state into the query params the API expects.
 *
 * `betPlaced` is the API's own convenience filter for "matches we actually bet
 * on" — the operator syntax can't express it, since it has no IS NULL operator
 * and `selectedPlayer` is null on every match that wasn't bet on.
 */
export function toQueryParams({
    mode,
    createdAfter,
    createdBefore,
    betFilter,
    sampleSize,
}) {
    return {
        limit: sampleLimit(sampleSize),
        ...(mode ? { mode } : {}),
        ...(createdAfter
            ? { createdAfter: new Date(createdAfter).toISOString() }
            : {}),
        // The date input yields a bare date, which as an instant would mean
        // midnight and exclude the whole of the chosen day.
        ...(createdBefore
            ? {
                  createdBefore: new Date(
                      `${createdBefore}T23:59:59.999Z`,
                  ).toISOString(),
              }
            : {}),
        ...(betFilter === "bet" ? { betPlaced: true } : {}),
        ...(betFilter === "noBet" ? { betPlaced: false } : {}),
    };
}
