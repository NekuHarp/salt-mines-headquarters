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
 * Salty Bet balances reach the hundreds of millions, which is too wide for a
 * stat tile, so large values are abbreviated. Tables keep the full number.
 */
export function formatCompact(value) {
    if (isMissing(value)) return EMPTY;

    const magnitude = Math.abs(value);
    if (magnitude >= 1_000_000_000)
        return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (magnitude >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (magnitude >= 10_000) return `${(value / 1_000).toFixed(1)}k`;

    return integerFormatter.format(value);
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
