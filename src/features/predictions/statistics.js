import { MATCH_WINNERS, SELECTED_PLAYERS } from "../../constants";

/**
 * Aggregations over the prediction log.
 *
 * Everything here is derived in the browser from the rows `GET /predictions`
 * returns. The API stores the stats as they were at prediction time, so these
 * numbers stay honest even though the underlying fighter records have moved on
 * since.
 */

/** Number of calibration buckets across the 50–100% confidence range. */
const CALIBRATION_BUCKET_COUNT = 10;

/** A bucket needs at least this many matches before its rate means anything. */
const MIN_BUCKET_SAMPLE = 5;

/**
 * The side the model favoured, and how strongly.
 *
 * `p1WinChance` is stored from p1's point of view, so a value below 50 is a
 * prediction for p2. An exact 50-50 is treated as favouring p1, matching what
 * the backend's auto-betting does.
 */
export function favourite(prediction) {
    const p1Favoured = prediction.p1WinChance >= 50;

    return {
        player: p1Favoured ? MATCH_WINNERS.P1 : MATCH_WINNERS.P2,
        confidence: p1Favoured
            ? prediction.p1WinChance
            : 100 - prediction.p1WinChance,
    };
}

/** Whether the favoured side actually won. */
export function favouriteWon(prediction) {
    return favourite(prediction).player === prediction.winner;
}

/**
 * Realised profit on a single bet, in Salty Bet dollars.
 *
 * Salty Bet is parimutuel: winners split the losing pot in proportion to their
 * stake, so a winning bet returns `wager * loserPot / winnerPot` on top of the
 * stake, and a losing bet returns nothing.
 *
 * Returns null when the profit cannot be known: no bet was placed, or the pots
 * were never captured (the API reports 0 for both until betting locks, and the
 * columns stay null if that read was missed).
 */
export function realisedProfit(prediction) {
    const { selectedPlayer, wager, p1Total, p2Total, winner } = prediction;

    if (!selectedPlayer || !wager) return null;

    const betOnP1 = selectedPlayer === SELECTED_PLAYERS.P1;
    const betWon =
        (betOnP1 && winner === MATCH_WINNERS.P1) ||
        (!betOnP1 && winner === MATCH_WINNERS.P2);

    if (!betWon) return -wager;

    if (!p1Total || !p2Total) return null;

    const winnerPot = winner === MATCH_WINNERS.P1 ? p1Total : p2Total;
    const loserPot = winner === MATCH_WINNERS.P1 ? p2Total : p1Total;

    if (!winnerPot) return null;

    return (wager * loserPot) / winnerPot;
}

/**
 * Accuracy and Brier score over a set of predictions.
 *
 * Accuracy answers "how often was the favourite right", which is the intuitive
 * number but ignores confidence. The Brier score is the mean squared error of
 * the probability itself, so it punishes a confident wrong call harder than a
 * hesitant one. Lower is better; 0.25 is what always guessing 50% scores.
 */
export function scorePredictions(predictions) {
    if (!predictions.length) {
        return { count: 0, accuracy: null, brierScore: null };
    }

    let correct = 0;
    let squaredError = 0;

    predictions.forEach((prediction) => {
        if (favouriteWon(prediction)) correct++;

        const predicted = prediction.p1WinChance / 100;
        const actual = prediction.winner === MATCH_WINNERS.P1 ? 1 : 0;
        squaredError += (predicted - actual) ** 2;
    });

    return {
        count: predictions.length,
        accuracy: correct / predictions.length,
        brierScore: squaredError / predictions.length,
    };
}

/**
 * Buckets predictions by the favourite's confidence and reports how often that
 * favourite actually won in each bucket.
 *
 * A well-calibrated model tracks the diagonal: among matches it called at 70%,
 * the favourite should win about 70% of the time. Buckets thinner than
 * `MIN_BUCKET_SAMPLE` are returned with a null rate rather than dropped, so the
 * chart can show the gap instead of interpolating across it.
 *
 * The range starts at 50% because the favourite is by definition the side above
 * even odds; there is no such thing as a 30%-confident favourite.
 */
export function calibrationBuckets(predictions) {
    const width = 50 / CALIBRATION_BUCKET_COUNT;

    const buckets = Array.from(
        { length: CALIBRATION_BUCKET_COUNT },
        (unused, index) => ({
            lowerBound: 50 + index * width,
            upperBound: 50 + (index + 1) * width,
            midpoint: 50 + index * width + width / 2,
            total: 0,
            won: 0,
        }),
    );

    predictions.forEach((prediction) => {
        const { confidence } = favourite(prediction);

        // 100% lands one past the last bucket, so it is clamped back into it.
        const index = Math.min(
            Math.floor((confidence - 50) / width),
            CALIBRATION_BUCKET_COUNT - 1,
        );
        const bucket = buckets.at(index);
        if (!bucket) return;

        bucket.total++;
        if (favouriteWon(prediction)) bucket.won++;
    });

    return buckets.map((bucket) => ({
        ...bucket,
        observedRate:
            bucket.total >= MIN_BUCKET_SAMPLE
                ? (bucket.won / bucket.total) * 100
                : null,
    }));
}

/**
 * Betting performance: staked, returned, and the ratio between them.
 *
 * Rows whose profit can't be determined are counted separately rather than
 * folded in as zero, so an ROI is never quietly computed over a partial sample.
 */
export function bettingSummary(predictions) {
    const bets = predictions.filter(
        (prediction) => prediction.selectedPlayer && prediction.wager,
    );

    let staked = 0;
    let profit = 0;
    let won = 0;
    let unknownProfit = 0;

    bets.forEach((prediction) => {
        const result = realisedProfit(prediction);

        if (result === null) {
            unknownProfit++;
            return;
        }

        staked += prediction.wager;
        profit += result;
        if (result > 0) won++;
    });

    const settled = bets.length - unknownProfit;

    return {
        betCount: bets.length,
        settledCount: settled,
        unknownProfit,
        staked,
        profit,
        winRate: settled ? won / settled : null,
        roi: staked ? profit / staked : null,
    };
}

/**
 * Cumulative profit over time, oldest first.
 *
 * Only settled bets appear: a row with unknown pots would otherwise flatten the
 * curve as though the bet had broken even.
 */
export function profitSeries(predictions) {
    const settled = predictions
        .map((prediction) => ({
            date: new Date(prediction.createdAt),
            profit: realisedProfit(prediction),
        }))
        .filter((entry) => entry.profit !== null)
        .sort((a, b) => a.date - b.date);

    let running = 0;

    return settled.map((entry) => {
        running += entry.profit;
        return { date: entry.date, cumulativeProfit: running };
    });
}

/**
 * Account balance over time, oldest first.
 *
 * `balanceBefore` is the balance as it stood when each bet was placed, so this
 * is a record of where the account actually was rather than a reconstruction.
 */
export function balanceSeries(predictions) {
    return predictions
        .filter((prediction) => prediction.balanceBefore !== null)
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((prediction) => ({
            date: new Date(prediction.createdAt),
            balance: prediction.balanceBefore,
        }));
}

/**
 * Distribution of how confident the model was, in 5-point bands.
 *
 * Reads as a shape question — is the model mostly hedging near 50%, or does it
 * find genuinely lopsided matchups? — so it is a magnitude comparison rather
 * than a set of distinct series.
 */
export function confidenceDistribution(predictions) {
    const width = 5;
    const bandCount = 10;

    const bands = Array.from({ length: bandCount }, (unused, index) => ({
        lowerBound: 50 + index * width,
        label: `${50 + index * width}–${50 + (index + 1) * width}`,
        total: 0,
    }));

    predictions.forEach((prediction) => {
        const { confidence } = favourite(prediction);
        const index = Math.min(
            Math.floor((confidence - 50) / width),
            bandCount - 1,
        );
        const band = bands.at(index);
        if (band) band.total++;
    });

    return bands;
}

/** Accuracy, Brier score and betting performance, split by match mode. */
export function summaryByMode(predictions) {
    const modes = [...new Set(predictions.map((p) => p.mode))].sort();

    return modes.map((mode) => {
        const forMode = predictions.filter((p) => p.mode === mode);

        return {
            mode,
            ...scorePredictions(forMode),
            betting: bettingSummary(forMode),
        };
    });
}
