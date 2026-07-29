import { useCallback, useMemo, useState } from "react";

import { PAGINATION } from "../constants";

/**
 * Holds the paging and sorting state for a server-side list, and derives the
 * query params the API expects from it.
 *
 * Sort is kept in the API's own string form (`"name"` ascending, `"-name"`
 * descending) rather than an `{ orderBy, order }` pair, so it can go straight
 * into the request and straight into a query key without a translation step in
 * between.
 */
export function useListParams({
    defaultSort,
    defaultLimit = PAGINATION.DEFAULT_LIMIT,
    filters = {},
} = {}) {
    const [sort, setSort] = useState(defaultSort);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(defaultLimit);

    // Filters live outside this hook, since each page owns its own controls.
    // Serialized so a new object with identical contents doesn't read as a
    // change on every render.
    const filterKey = JSON.stringify(filters);
    const [seenFilterKey, setSeenFilterKey] = useState(filterKey);

    // A filter change has to reset paging, or a narrowed result set leaves the
    // user on a page past the end, looking at an empty table.
    if (seenFilterKey !== filterKey) {
        setSeenFilterKey(filterKey);
        setPage(0);
    }

    const orderBy = sort?.replace(/^-/, "") ?? null;
    const order = sort?.startsWith("-") ? "desc" : "asc";

    // First click on a column sorts ascending, second flips to descending.
    const toggleSort = useCallback((column) => {
        setSort((current) => (current === column ? `-${column}` : column));
        setPage(0);
    }, []);

    const changeLimit = useCallback((next) => {
        setLimit(next);
        setPage(0);
    }, []);

    const params = useMemo(
        () => ({
            ...JSON.parse(filterKey),
            sort,
            limit,
            offset: page * limit,
        }),
        [filterKey, sort, limit, page],
    );

    return {
        params,
        sort,
        orderBy,
        order,
        toggleSort,
        page,
        setPage,
        limit,
        changeLimit,
    };
}
