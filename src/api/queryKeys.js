/**
 * Query keys, kept in one place so a mutation can invalidate a resource without
 * knowing how the reading component spelled its params.
 *
 * Each list key is `[resource, "list", params]`, so invalidating `[resource]`
 * catches every page and filter combination of that resource at once.
 */
export const queryKeys = {
    fighters: {
        all: ["fighters"],
        list: (params) => ["fighters", "list", params],
    },
    matchups: {
        all: ["matchups"],
        list: (params) => ["matchups", "list", params],
    },
    predictions: {
        all: ["predictions"],
        list: (params) => ["predictions", "list", params],
    },
    remainings: {
        all: ["remainings"],
        list: (params) => ["remainings", "list", params],
    },
    state: {
        all: ["state"],
        match: ["state", "match"],
        balance: ["state", "balance"],
    },
    listener: {
        all: ["listener"],
        status: ["listener", "status"],
    },
};
