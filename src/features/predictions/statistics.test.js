import { MATCH_MODES, MATCH_WINNERS, SELECTED_PLAYERS } from "../../constants";
import {
    balanceSeries,
    betWon,
    bettingSummary,
    calibrationBuckets,
    confidenceDistribution,
    favourite,
    favouriteWon,
    profitSeries,
    realisedProfit,
    scorePredictions,
    summaryByMode,
} from "./statistics";
import { describe, expect, it } from "vitest";

/**
 * A prediction row shaped the way the API returns one.
 *
 * The defaults mirror the backend's nullability (salt-mines
 * `src/database/models/Prediction.js`): `mode`, `winner` and `p1WinChance` are
 * NOT NULL, so no aggregation here has to cope with them missing, while every
 * pot and betting column is nullable. Those arrive as `null` and never as
 * `undefined`, because the model's numeric getter normalises both to `null`.
 */
const row = (overrides = {}) => ({
    mode: MATCH_MODES.MATCHMAKING,
    winner: MATCH_WINNERS.P1,
    p1WinChance: 50,
    p1Total: null,
    p2Total: null,
    selectedPlayer: null,
    wager: null,
    balanceBefore: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
});

/** A bet that won, with both pots captured, so its profit is knowable. */
const settledWin = (overrides = {}) =>
    row({
        selectedPlayer: SELECTED_PLAYERS.P1,
        winner: MATCH_WINNERS.P1,
        wager: 100,
        p1Total: 1000,
        p2Total: 500,
        ...overrides,
    });

/** A bet that lost. Pots are irrelevant: the loss is the whole wager. */
const settledLoss = (overrides = {}) =>
    row({
        selectedPlayer: SELECTED_PLAYERS.P1,
        winner: MATCH_WINNERS.P2,
        wager: 100,
        ...overrides,
    });

/** A bet that won, but whose pots were never read. Profit is unknowable. */
const unsettledWin = (overrides = {}) =>
    row({
        selectedPlayer: SELECTED_PLAYERS.P1,
        winner: MATCH_WINNERS.P1,
        wager: 100,
        p1Total: null,
        p2Total: null,
        ...overrides,
    });

describe("favourite", () => {
    it("reads a chance above even odds as backing p1", () => {
        expect(favourite(row({ p1WinChance: 70 }))).toEqual({
            player: MATCH_WINNERS.P1,
            confidence: 70,
        });
    });

    it("mirrors a chance below even odds into a p2 confidence", () => {
        expect(favourite(row({ p1WinChance: 30 }))).toEqual({
            player: MATCH_WINNERS.P2,
            confidence: 70,
        });
    });

    it("breaks an exact 50-50 towards p1, as the backend's betting does", () => {
        expect(favourite(row({ p1WinChance: 50 }))).toEqual({
            player: MATCH_WINNERS.P1,
            confidence: 50,
        });
    });

    it("keeps confidence within 50-100 at both extremes", () => {
        expect(favourite(row({ p1WinChance: 100 })).confidence).toBe(100);
        expect(favourite(row({ p1WinChance: 0 }))).toEqual({
            player: MATCH_WINNERS.P2,
            confidence: 100,
        });
    });

    it("carries the two decimals the DECIMAL(5,2) column allows", () => {
        expect(favourite(row({ p1WinChance: 73.42 })).confidence).toBe(73.42);
        expect(favourite(row({ p1WinChance: 26.58 })).confidence).toBeCloseTo(
            73.42,
            10,
        );
    });
});

describe("favouriteWon", () => {
    it("is true when the favoured side took the match", () => {
        const prediction = row({
            p1WinChance: 80,
            winner: MATCH_WINNERS.P1,
        });
        expect(favouriteWon(prediction)).toBe(true);
    });

    it("is false when the underdog took the match", () => {
        const prediction = row({
            p1WinChance: 80,
            winner: MATCH_WINNERS.P2,
        });
        expect(favouriteWon(prediction)).toBe(false);
    });

    it("tracks the favourite rather than p1", () => {
        const prediction = row({
            p1WinChance: 20,
            winner: MATCH_WINNERS.P2,
        });
        expect(favouriteWon(prediction)).toBe(true);
    });
});

describe("betWon", () => {
    it("is null when no bet was placed", () => {
        expect(betWon(row())).toBeNull();
        expect(betWon(row({ selectedPlayer: SELECTED_PLAYERS.P1 }))).toBeNull();
    });

    it("reads a backed winner as a win on either side", () => {
        expect(betWon(settledWin())).toBe(true);
        expect(
            betWon(
                settledLoss({
                    selectedPlayer: SELECTED_PLAYERS.P2,
                    winner: MATCH_WINNERS.P2,
                }),
            ),
        ).toBe(true);
    });

    it("reads a backed loser as a loss", () => {
        expect(betWon(settledLoss())).toBe(false);
    });

    it("answers without the pots, which only size the payout", () => {
        const prediction = unsettledWin();

        expect(realisedProfit(prediction)).toBeNull();
        expect(betWon(prediction)).toBe(true);
    });
});

describe("realisedProfit", () => {
    it("is null when no bet was placed", () => {
        expect(realisedProfit(row())).toBeNull();
    });

    it("is null when a side was chosen but nothing was staked", () => {
        const prediction = row({
            selectedPlayer: SELECTED_PLAYERS.P1,
            wager: null,
        });
        expect(realisedProfit(prediction)).toBeNull();
        expect(realisedProfit(row({ ...prediction, wager: 0 }))).toBeNull();
    });

    it("pays the loser's pot in proportion to the stake", () => {
        // Backed the 1000 pot, the 500 pot lost: 100 * 500 / 1000.
        expect(realisedProfit(settledWin())).toBe(50);
    });

    it("pays more for backing the smaller pot", () => {
        // Backed the 500 pot, the 1000 pot lost: 100 * 1000 / 500.
        const prediction = settledWin({
            selectedPlayer: SELECTED_PLAYERS.P2,
            winner: MATCH_WINNERS.P2,
        });
        expect(realisedProfit(prediction)).toBe(200);
    });

    it("loses exactly the wager, without needing the pots", () => {
        expect(realisedProfit(settledLoss())).toBe(-100);
    });

    it("is null for a win whose pots were never captured", () => {
        expect(realisedProfit(unsettledWin())).toBeNull();
    });

    it("treats the pre-lock zero pots as uncaptured rather than as real", () => {
        // The API reports 0 for both sides until betting locks, so a zero pot
        // is missing data and not a pot that nobody bet into.
        const prediction = settledWin({ p1Total: 0, p2Total: 0 });
        expect(realisedProfit(prediction)).toBeNull();
    });
});

describe("scorePredictions", () => {
    it("reports nulls rather than NaN for an empty set", () => {
        expect(scorePredictions([])).toEqual({
            count: 0,
            accuracy: null,
            brierScore: null,
        });
    });

    it("scores a perfectly confident, perfectly right model at zero", () => {
        const predictions = [
            row({ p1WinChance: 100, winner: MATCH_WINNERS.P1 }),
            row({ p1WinChance: 0, winner: MATCH_WINNERS.P2 }),
        ];
        expect(scorePredictions(predictions)).toEqual({
            count: 2,
            accuracy: 1,
            brierScore: 0,
        });
    });

    it("scores a permanent 50-50 hedge at 0.25 whatever happens", () => {
        // The reference point the docstring names: no information at all.
        const predictions = [
            row({ p1WinChance: 50, winner: MATCH_WINNERS.P1 }),
            row({ p1WinChance: 50, winner: MATCH_WINNERS.P2 }),
        ];
        expect(scorePredictions(predictions).brierScore).toBeCloseTo(0.25, 10);
    });

    it("counts accuracy over the favourite, ignoring confidence", () => {
        const predictions = [
            row({ p1WinChance: 90, winner: MATCH_WINNERS.P1 }),
            row({ p1WinChance: 51, winner: MATCH_WINNERS.P1 }),
            row({ p1WinChance: 20, winner: MATCH_WINNERS.P2 }),
            row({ p1WinChance: 60, winner: MATCH_WINNERS.P2 }),
        ];
        expect(scorePredictions(predictions).accuracy).toBe(0.75);
    });

    it("punishes a confident wrong call harder than a hesitant one", () => {
        const confident = scorePredictions([
            row({ p1WinChance: 90, winner: MATCH_WINNERS.P2 }),
        ]);
        const hesitant = scorePredictions([
            row({ p1WinChance: 60, winner: MATCH_WINNERS.P2 }),
        ]);

        expect(confident.brierScore).toBeCloseTo(0.81, 10);
        expect(hesitant.brierScore).toBeCloseTo(0.36, 10);
        expect(confident.brierScore).toBeGreaterThan(hesitant.brierScore);
    });

    it("scores against p1's probability, not the favourite's", () => {
        // A 20% p1 chance that p2 wins is a good call: error is 0.2, not 0.8.
        const score = scorePredictions([
            row({ p1WinChance: 20, winner: MATCH_WINNERS.P2 }),
        ]);
        expect(score.brierScore).toBeCloseTo(0.04, 10);
    });
});

describe("calibrationBuckets", () => {
    it("spans 50-100 in ten evenly spaced buckets", () => {
        const buckets = calibrationBuckets([]);

        expect(buckets).toHaveLength(10);
        expect(buckets.at(0)).toMatchObject({
            lowerBound: 50,
            upperBound: 55,
            midpoint: 52.5,
        });
        expect(buckets.at(-1)).toMatchObject({
            lowerBound: 95,
            upperBound: 100,
            midpoint: 97.5,
        });
    });

    it("places a confidence in the bucket its lower bound opens", () => {
        const totals = (chance) =>
            calibrationBuckets([row({ p1WinChance: chance })])
                .map((bucket) => bucket.total)
                .indexOf(1);

        expect(totals(50)).toBe(0);
        expect(totals(54.99)).toBe(0);
        expect(totals(55)).toBe(1);
        expect(totals(72)).toBe(4);
        expect(totals(95)).toBe(9);
    });

    it("clamps a 100% call into the last bucket instead of past the end", () => {
        const buckets = calibrationBuckets([row({ p1WinChance: 100 })]);

        expect(buckets.at(-1).total).toBe(1);
        expect(buckets.reduce((sum, bucket) => sum + bucket.total, 0)).toBe(1);
    });

    it("withholds a rate from a bucket too thin to mean anything", () => {
        const thin = Array.from({ length: 4 }, () =>
            row({ p1WinChance: 72, winner: MATCH_WINNERS.P1 }),
        );
        const bucket = calibrationBuckets(thin).at(4);

        expect(bucket.total).toBe(4);
        expect(bucket.won).toBe(4);
        expect(bucket.observedRate).toBeNull();
    });

    it("reports a rate once the bucket reaches the sample floor", () => {
        const atFloor = [
            ...Array.from({ length: 3 }, () =>
                row({ p1WinChance: 72, winner: MATCH_WINNERS.P1 }),
            ),
            ...Array.from({ length: 2 }, () =>
                row({ p1WinChance: 72, winner: MATCH_WINNERS.P2 }),
            ),
        ];
        const bucket = calibrationBuckets(atFloor).at(4);

        expect(bucket.total).toBe(5);
        expect(bucket.won).toBe(3);
        expect(bucket.observedRate).toBeCloseTo(60, 10);
    });

    it("keeps thin buckets in place rather than dropping them", () => {
        // The chart needs the gap to stay a gap, not to be interpolated over.
        const buckets = calibrationBuckets([row({ p1WinChance: 72 })]);

        expect(buckets).toHaveLength(10);
        expect(buckets.filter((b) => b.observedRate === null)).toHaveLength(10);
    });
});

describe("bettingSummary", () => {
    it("reports nulls rather than dividing by zero with no bets", () => {
        expect(bettingSummary([row(), row()])).toEqual({
            betCount: 0,
            settledCount: 0,
            unknownProfit: 0,
            staked: 0,
            profit: 0,
            winRate: null,
            roi: null,
        });
    });

    it("totals stake and profit across settled bets", () => {
        const summary = bettingSummary([settledWin(), settledLoss()]);

        expect(summary).toMatchObject({
            betCount: 2,
            settledCount: 2,
            unknownProfit: 0,
            staked: 200,
            profit: -50,
        });
        expect(summary.winRate).toBe(0.5);
        expect(summary.roi).toBeCloseTo(-0.25, 10);
    });

    it("holds an unknowable bet out of the stake and profit totals", () => {
        const summary = bettingSummary([
            settledWin(),
            settledLoss(),
            unsettledWin(),
        ]);

        expect(summary.betCount).toBe(3);
        expect(summary.unknownProfit).toBe(1);
        expect(summary.settledCount).toBe(2);
        // The third wager is absent from both, so ROI stays a like-for-like
        // ratio over the same two bets.
        expect(summary.staked).toBe(200);
        expect(summary.profit).toBe(-50);
        // Its outcome is still known, so it counts towards the win rate.
        expect(summary.winRate).toBeCloseTo(2 / 3, 10);
    });

    it("counts a bet with no side chosen as no bet at all", () => {
        const orphanWager = row({ selectedPlayer: null, wager: 100 });
        expect(bettingSummary([orphanWager]).betCount).toBe(0);
    });

    /**
     * The reason the win rate and the money figures use different denominators.
     *
     * A loss costs exactly the wager whatever the pots did, so only a win can
     * ever go unsettled. Rating wins over the settled rows alone would drop
     * wins and no losses, reporting 50% for the four-in-five below.
     */
    it("rates wins over every bet, not just the ones that settled", () => {
        const summary = bettingSummary([
            settledWin(),
            unsettledWin(),
            unsettledWin(),
            unsettledWin(),
            settledLoss(),
        ]);

        expect(summary.betCount).toBe(5);
        expect(summary.unknownProfit).toBe(3);
        expect(summary.settledCount).toBe(2);
        expect(summary.winRate).toBe(0.8);

        // The money still comes only from the rows that can be priced.
        expect(summary.staked).toBe(200);
        expect(summary.profit).toBe(-50);
        expect(summary.roi).toBeCloseTo(-0.25, 10);
    });
});

describe("profitSeries", () => {
    it("accumulates oldest first, whatever order the rows arrive in", () => {
        const series = profitSeries([
            settledLoss({ createdAt: "2026-01-03T00:00:00.000Z" }),
            settledWin({ createdAt: "2026-01-01T00:00:00.000Z" }),
            settledWin({ createdAt: "2026-01-02T00:00:00.000Z" }),
        ]);

        expect(series.map((point) => point.cumulativeProfit)).toEqual([
            50, 100, 0,
        ]);
        expect(series.map((point) => point.date.toISOString())).toEqual([
            "2026-01-01T00:00:00.000Z",
            "2026-01-02T00:00:00.000Z",
            "2026-01-03T00:00:00.000Z",
        ]);
    });

    it("leaves out rows that would flatten the curve as a break-even", () => {
        const series = profitSeries([
            settledWin({ createdAt: "2026-01-01T00:00:00.000Z" }),
            unsettledWin({ createdAt: "2026-01-02T00:00:00.000Z" }),
        ]);

        expect(series).toHaveLength(1);
        expect(series.at(0).cumulativeProfit).toBe(50);
    });

    it("is empty when nothing was bet on", () => {
        expect(profitSeries([row(), row()])).toEqual([]);
    });
});

describe("balanceSeries", () => {
    it("orders the recorded balances oldest first", () => {
        const series = balanceSeries([
            row({ balanceBefore: 500, createdAt: "2026-01-02T00:00:00.000Z" }),
            row({ balanceBefore: 300, createdAt: "2026-01-01T00:00:00.000Z" }),
        ]);

        expect(series.map((point) => point.balance)).toEqual([300, 500]);
    });

    it("skips matches where no balance was recorded", () => {
        const series = balanceSeries([
            row({ balanceBefore: null }),
            row({ balanceBefore: 300 }),
        ]);

        expect(series).toHaveLength(1);
        expect(series.at(0).balance).toBe(300);
    });

    it("keeps a zero balance, which is a real state and not a gap", () => {
        expect(balanceSeries([row({ balanceBefore: 0 })])).toHaveLength(1);
    });

    it("does not reorder the caller's array", () => {
        const predictions = [
            row({ balanceBefore: 500, createdAt: "2026-01-02T00:00:00.000Z" }),
            row({ balanceBefore: 300, createdAt: "2026-01-01T00:00:00.000Z" }),
        ];
        balanceSeries(predictions);

        expect(predictions.at(0).balanceBefore).toBe(500);
    });
});

describe("confidenceDistribution", () => {
    it("spans 50-100 in ten five-point bands", () => {
        const bands = confidenceDistribution([]);

        expect(bands).toHaveLength(10);
        expect(bands.at(0)).toMatchObject({ lowerBound: 50, label: "50–55" });
        expect(bands.at(-1)).toMatchObject({ lowerBound: 95, label: "95–100" });
    });

    it("counts each confidence into the band its lower bound opens", () => {
        const bandOf = (chance) =>
            confidenceDistribution([row({ p1WinChance: chance })])
                .map((band) => band.total)
                .indexOf(1);

        expect(bandOf(50)).toBe(0);
        expect(bandOf(69.99)).toBe(3);
        expect(bandOf(70)).toBe(4);
        expect(bandOf(100)).toBe(9);
    });

    it("bands the favourite's confidence, so a 10% p1 call reads as 90%", () => {
        const bands = confidenceDistribution([row({ p1WinChance: 10 })]);

        expect(bands.at(8)).toMatchObject({ label: "90–95", total: 1 });
    });

    it("counts every row exactly once", () => {
        const chances = [50, 55, 62.5, 77, 88.88, 100, 0, 12.5];
        const bands = confidenceDistribution(
            chances.map((p1WinChance) => row({ p1WinChance })),
        );

        expect(bands.reduce((sum, band) => sum + band.total, 0)).toBe(
            chances.length,
        );
    });
});

describe("summaryByMode", () => {
    it("splits the scores by mode, in a stable alphabetical order", () => {
        const summary = summaryByMode([
            row({ mode: MATCH_MODES.TOURNAMENT, p1WinChance: 80 }),
            row({ mode: MATCH_MODES.MATCHMAKING, p1WinChance: 80 }),
            row({
                mode: MATCH_MODES.MATCHMAKING,
                p1WinChance: 80,
                winner: MATCH_WINNERS.P2,
            }),
        ]);

        expect(summary.map((entry) => entry.mode)).toEqual([
            MATCH_MODES.MATCHMAKING,
            MATCH_MODES.TOURNAMENT,
        ]);
        expect(summary.at(0)).toMatchObject({ count: 2, accuracy: 0.5 });
        expect(summary.at(1)).toMatchObject({ count: 1, accuracy: 1 });
    });

    it("attaches betting performance scoped to each mode", () => {
        const summary = summaryByMode([
            settledWin({ mode: MATCH_MODES.MATCHMAKING }),
            settledLoss({ mode: MATCH_MODES.TOURNAMENT }),
        ]);

        expect(summary.at(0).betting).toMatchObject({
            betCount: 1,
            profit: 50,
        });
        expect(summary.at(1).betting).toMatchObject({
            betCount: 1,
            profit: -100,
        });
    });

    it("has no rows to report for an empty set", () => {
        expect(summaryByMode([])).toEqual([]);
    });
});
