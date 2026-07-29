const integerFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
});

const signedIntegerFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "short" });

/** An em dash, used everywhere a value is genuinely absent rather than zero. */
export const EMPTY = "—";

function isMissing(value) {
    return value === null || value === undefined || Number.isNaN(value);
}

export function formatInteger(value) {
    return isMissing(value) ? EMPTY : integerFormatter.format(value);
}

/** For deltas, where the leading `+` is the point. */
export function formatSignedInteger(value) {
    return isMissing(value) ? EMPTY : signedIntegerFormatter.format(value);
}

export function formatPercent(value, fractionDigits = 1) {
    return isMissing(value) ? EMPTY : `${value.toFixed(fractionDigits)}%`;
}

/** Formats a 0–1 ratio as a percentage. */
export function formatRatio(value, fractionDigits = 1) {
    return isMissing(value) ? EMPTY : formatPercent(value * 100, fractionDigits);
}

export function formatDateTime(value) {
    if (isMissing(value)) return EMPTY;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? EMPTY : dateTimeFormatter.format(date);
}

export function formatDate(value) {
    if (isMissing(value)) return EMPTY;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? EMPTY : dateFormatter.format(date);
}

/**
 * Abbreviation tiers, largest first. Nothing sits above `B`, so a value that
 * rounds up out of it simply keeps counting in billions.
 */
const COMPACT_TIERS = [
    { divisor: 1_000_000_000, suffix: "B", fractionDigits: 2 },
    { divisor: 1_000_000, suffix: "M", fractionDigits: 2 },
    { divisor: 1_000, suffix: "k", fractionDigits: 1 },
];

/** Below this the number is shown in full; abbreviating it would buy nothing. */
const COMPACT_FLOOR = 10_000;

/**
 * Salty Bet balances reach the hundreds of millions, which is too wide for a
 * stat tile, so large values are abbreviated. Tables keep the full number.
 */
export function formatCompact(value) {
    if (isMissing(value)) return EMPTY;

    const magnitude = Math.abs(value);
    if (magnitude < COMPACT_FLOOR) return integerFormatter.format(value);

    const index = COMPACT_TIERS.findIndex((tier) => magnitude >= tier.divisor);
    const tier = COMPACT_TIERS.at(index);

    // The tier comes from the raw magnitude, but rounding can carry a value up
    // out of it: 999,999 split into thousands renders as "1000.0k", naming a
    // unit it never reached. When that happens it belongs one tier higher.
    const carries =
        Number((magnitude / tier.divisor).toFixed(tier.fractionDigits)) >= 1000;
    const chosen = carries && index > 0 ? COMPACT_TIERS.at(index - 1) : tier;

    const scaled = (value / chosen.divisor).toFixed(chosen.fractionDigits);

    return `${scaled}${chosen.suffix}`;
}

/**
 * As `formatCompact`, but always signed.
 *
 * Used wherever a value is also colour-coded by direction: the explicit `+`
 * means the sign is legible without relying on the red/green pair, which
 * deuteranopes cannot separate.
 */
export function formatSignedCompact(value) {
    if (isMissing(value)) return EMPTY;

    const formatted = formatCompact(Math.abs(value));
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
}

/** Win rate as a 0–1 ratio, or null when the fighter has no recorded matches. */
export function winRate({ wins, matches }) {
    if (!matches) return null;
    return wins / matches;
}
