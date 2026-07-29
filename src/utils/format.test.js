import {
    EMPTY,
    formatCompact,
    formatDate,
    formatDateTime,
    formatInteger,
    formatPercent,
    formatRatio,
    formatSignedCompact,
    formatSignedInteger,
    winRate,
} from "./format";
import { describe, expect, it } from "vitest";

/**
 * The formatters are built once at module scope from the machine's locale data
 * and time zone. `TZ` is pinned to UTC in the Vitest config, so the rendered
 * dates below are stable rather than a property of whoever ran the suite.
 */

/** Everything that should read as "absent" rather than as a number. */
const missing = [null, undefined, NaN];

describe("formatInteger", () => {
    it("groups thousands", () => {
        expect(formatInteger(1234567)).toBe("1,234,567");
        expect(formatInteger(9999)).toBe("9,999");
    });

    it("keeps zero as a number, not a gap", () => {
        expect(formatInteger(0)).toBe("0");
    });

    it("rounds away fractions rather than showing them", () => {
        expect(formatInteger(1234.67)).toBe("1,235");
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatInteger(value)).toBe(EMPTY);
    });
});

describe("formatSignedInteger", () => {
    it("forces a sign on a delta in either direction", () => {
        expect(formatSignedInteger(5)).toBe("+5");
        expect(formatSignedInteger(-5)).toBe("-5");
    });

    it("leaves zero unsigned", () => {
        expect(formatSignedInteger(0)).toBe("0");
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatSignedInteger(value)).toBe(EMPTY);
    });
});

describe("formatPercent", () => {
    it("takes an already-scaled percentage", () => {
        expect(formatPercent(72.34)).toBe("72.3%");
        expect(formatPercent(50)).toBe("50.0%");
    });

    it("honours a requested precision", () => {
        expect(formatPercent(72.349, 2)).toBe("72.35%");
        expect(formatPercent(72.349, 0)).toBe("72%");
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatPercent(value)).toBe(EMPTY);
    });
});

describe("formatRatio", () => {
    it("scales a 0-1 ratio up to a percentage", () => {
        expect(formatRatio(0.5)).toBe("50.0%");
        expect(formatRatio(0.1234)).toBe("12.3%");
        expect(formatRatio(1)).toBe("100.0%");
    });

    it("keeps a zero ratio distinct from an absent one", () => {
        expect(formatRatio(0)).toBe("0.0%");
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatRatio(value)).toBe(EMPTY);
    });
});

describe("formatDateTime", () => {
    it("renders a medium date with a short time", () => {
        expect(formatDateTime("2026-01-15T14:30:00.000Z")).toBe(
            "15 Jan 2026, 14:30",
        );
    });

    it("accepts a Date as readily as a string", () => {
        expect(formatDateTime(new Date("2026-01-15T14:30:00.000Z"))).toBe(
            "15 Jan 2026, 14:30",
        );
    });

    it("falls back to the dash on an unparseable value", () => {
        expect(formatDateTime("not a date")).toBe(EMPTY);
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatDateTime(value)).toBe(EMPTY);
    });
});

describe("formatDate", () => {
    it("renders a short day-first date", () => {
        expect(formatDate("2026-01-15T14:30:00.000Z")).toBe("15/01/2026");
    });

    it("falls back to the dash on an unparseable value", () => {
        expect(formatDate("not a date")).toBe(EMPTY);
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatDate(value)).toBe(EMPTY);
    });
});

describe("formatCompact", () => {
    it("leaves values below the abbreviation threshold grouped in full", () => {
        expect(formatCompact(0)).toBe("0");
        expect(formatCompact(999)).toBe("999");
        expect(formatCompact(9999)).toBe("9,999");
    });

    it("abbreviates from ten thousand upwards", () => {
        expect(formatCompact(10000)).toBe("10.0k");
        expect(formatCompact(87654)).toBe("87.7k");
    });

    it("abbreviates millions and billions to two decimals", () => {
        expect(formatCompact(1000000)).toBe("1.00M");
        expect(formatCompact(87654321)).toBe("87.65M");
        expect(formatCompact(1000000000)).toBe("1.00B");
        expect(formatCompact(2500000000)).toBe("2.50B");
    });

    it("picks the tier from the magnitude, so negatives abbreviate too", () => {
        expect(formatCompact(-15000)).toBe("-15.0k");
        expect(formatCompact(-2500000)).toBe("-2.50M");
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatCompact(value)).toBe(EMPTY);
    });

    it("promotes a value that rounding carries up out of its tier", () => {
        // Picked from the raw magnitude these would read "1000.0k" and
        // "1000.00M", naming a unit the value never actually reached.
        expect(formatCompact(999999)).toBe("1.00M");
        expect(formatCompact(999999999)).toBe("1.00B");
        expect(formatCompact(-999999)).toBe("-1.00M");
    });

    it("leaves a value that still rounds inside its tier alone", () => {
        expect(formatCompact(999000)).toBe("999.0k");
        expect(formatCompact(999499)).toBe("999.5k");
    });

    it("keeps counting in billions, having no tier above them", () => {
        expect(formatCompact(999999999999)).toBe("1000.00B");
    });
});

describe("formatSignedCompact", () => {
    it("signs an abbreviated value in either direction", () => {
        expect(formatSignedCompact(15000)).toBe("+15.0k");
        expect(formatSignedCompact(-15000)).toBe("-15.0k");
        expect(formatSignedCompact(2500000)).toBe("+2.50M");
    });

    it("leaves zero unsigned", () => {
        expect(formatSignedCompact(0)).toBe("0");
    });

    it("signs small values that are not abbreviated at all", () => {
        expect(formatSignedCompact(250)).toBe("+250");
        expect(formatSignedCompact(-250)).toBe("-250");
    });

    it.each(missing)("renders %s as the empty dash", (value) => {
        expect(formatSignedCompact(value)).toBe(EMPTY);
    });
});

describe("winRate", () => {
    it("divides wins by matches", () => {
        expect(winRate({ wins: 3, matches: 4 })).toBe(0.75);
        expect(winRate({ wins: 0, matches: 4 })).toBe(0);
    });

    it("is null for a fighter with no recorded matches", () => {
        expect(winRate({ wins: 0, matches: 0 })).toBeNull();
        expect(winRate({ wins: 0, matches: null })).toBeNull();
    });
});
