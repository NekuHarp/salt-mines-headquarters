/**
 * Values mirrored from the salt-mines backend. Anything in this block has a
 * counterpart in `salt-mines/src/constants/` and must be changed in step with
 * it — the API validates against its own copy and rejects unknown values.
 */

export const API_ROUTES = Object.freeze({
    Bet: "/bet",
    Fighter: "/fighters",
    HealthCheck: "/health_check",
    Listener: "/listener",
    Matchup: "/matchups",
    Prediction: "/predictions",
    Remaining: "/remainings",
    State: "/state",
});

export const MATCH_MODES = Object.freeze({
    MATCHMAKING: "Matchmaking",
    TOURNAMENT: "Tournament",
    EXHIBITION: "Exhibition",
});

/** Which side of a recorded match won. */
export const MATCH_WINNERS = Object.freeze({
    P1: "p1",
    P2: "p2",
});

export const SELECTED_PLAYERS = Object.freeze({
    P1: "player1",
    P2: "player2",
});

/** Sortable columns per resource. The API rejects anything not in these lists. */
export const SORTABLE_COLUMNS = Object.freeze({
    FIGHTERS: ["name", "matches", "wins", "losses", "createdAt", "updatedAt"],
    MATCHUPS: ["P1_name", "P2_name", "createdAt", "updatedAt"],
    PREDICTIONS: [
        "P1_name",
        "P2_name",
        "mode",
        "winner",
        "p1WinChance",
        "p1Total",
        "p2Total",
        "selectedPlayer",
        "wager",
        "balanceBefore",
        "createdAt",
        "updatedAt",
    ],
    REMAININGS: ["value", "mode", "createdAt", "updatedAt"],
});

export const PAGINATION = Object.freeze({
    DEFAULT_LIMIT: 25,
    ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
    MAX_LIMIT: 50000,
});

/** Bounds the API enforces on listener/auto-scrape requests. */
export const MATCHES_TO_RECORD = Object.freeze({ MIN: 1, MAX: 25 });

/**
 * How many predictions the statistics page pulls in one request. The API's
 * ceiling is 50000; this is deliberately lower because every row is also
 * aggregated in the browser.
 */
export const STATISTICS_SAMPLE_LIMIT = 5000;

/**
 * Poll intervals, in milliseconds. The backend's own listener polls Salty Bet
 * every 3s, so polling `/state` faster than that only adds load without
 * surfacing anything new.
 */
export const POLL_INTERVALS = Object.freeze({
    MATCH_STATE: 5000,
    LISTENER_STATUS: 5000,
    BALANCE: 30000,
});

export const INPUT_VALIDATION = Object.freeze({
    REQUIRED: "This field is required.",
    REQUIRED_SHORT: "Required.",
    INVALID: "This input is invalid.",
    INVALID_SHORT: "Invalid.",
    POSITIVE: "Must be positive.",
    NON_NEGATIVE: "Must not be negative.",
    MATCHES_TO_RECORD_RANGE: `Must be between ${MATCHES_TO_RECORD.MIN} and ${MATCHES_TO_RECORD.MAX}.`,
});
