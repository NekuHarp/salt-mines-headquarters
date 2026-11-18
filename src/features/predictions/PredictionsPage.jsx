import { Alert, Box, Grid, Stack } from "@mui/material";
import { DEFAULT_FILTERS, sampleLimit, toQueryParams } from "./filterParams";
import {
    EMPTY,
    formatCompact,
    formatRatio,
    formatSignedCompact,
} from "../../utils/format";
import {
    balanceSeries,
    bettingSummary,
    calibrationBuckets,
    confidenceDistribution,
    profitSeries,
    scorePredictions,
    summaryByMode,
} from "./statistics";
import { useMemo, useState } from "react";

import { BalanceChart } from "./charts/BalanceChart";
import { CalibrationChart } from "./charts/CalibrationChart";
import { ConfidenceChart } from "./charts/ConfidenceChart";
import { ModeSummaryTable } from "./ModeSummaryTable";
import Page from "../../components/Page";
import { PredictionFilters } from "./PredictionFilters";
import { ProfitChart } from "./charts/ProfitChart";
import { QueryState } from "../../components/QueryState";
import { RecentPredictions } from "./RecentPredictions";
import { StatCard } from "../../components/StatCard";
import { predictionsQuery } from "../../api/predictions";
import { useQuery } from "@tanstack/react-query";

/** A Brier score of 0.25 is what predicting 50% every time would earn. */
const COIN_FLIP_BRIER = 0.25;

function Kpis({ score, betting }) {
    return (
        // A wrapping flex row rather than a Grid: five tiles don't divide into
        // twelve columns evenly, and `flex` lets them share the row equally at
        // any width instead of leaving a third of the last row empty.
        // `useFlexGap` is required for spacing to survive the wrap.
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
            <Box sx={{ flex: "1 1 200px" }}>
                <StatCard
                    label="Matches"
                    value={formatCompact(score.count)}
                    caption="Recorded predictions in this range."
                />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
                <StatCard
                    label="Accuracy"
                    value={formatRatio(score.accuracy)}
                    caption="How often the favoured fighter won."
                    hint="Ignores how confident the call was — a 51% call and a 99% call count the same."
                />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
                <StatCard
                    label="Brier score"
                    value={
                        score.brierScore === null
                            ? EMPTY
                            : score.brierScore.toFixed(3)
                    }
                    caption={
                        score.brierScore === null
                            ? "Needs at least one recorded match."
                            : score.brierScore < COIN_FLIP_BRIER
                              ? "Better than a coin flip (0.250)."
                              : "No better than a coin flip (0.250)."
                    }
                    hint="Mean squared error of the predicted probability. Lower is better; 0.250 is what always guessing 50% scores."
                />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
                <StatCard
                    label="Bets won"
                    value={formatRatio(betting.winRate)}
                    caption={
                        betting.betCount === 0
                            ? "No bets placed in this range."
                            : `${betting.betCount} ${
                                  betting.betCount === 1 ? "bet" : "bets"
                              } placed.`
                    }
                    hint="Share of placed bets that came in. Counted over every bet, not just the settled ones — a loss costs the wager whatever the pots did, so only a win can go unsettled, and settled-only would understate this."
                />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
                <StatCard
                    label="Betting ROI"
                    value={formatRatio(betting.roi)}
                    delta={betting.roi === null ? null : betting.profit}
                    deltaLabel={formatSignedCompact(betting.profit)}
                    caption={
                        betting.betCount === 0
                            ? "No bets placed in this range."
                            : `${betting.settledCount} of ${betting.betCount} bets settled.`
                    }
                    hint="Profit divided by total staked. Unlike the win rate, this covers only bets whose parimutuel pots were captured, since the pots are what size a payout."
                />
            </Box>
        </Stack>
    );
}

/**
 * Statistics view over the prediction log.
 *
 * Every figure is derived in the browser from one request, so the whole page
 * reflects a single consistent sample rather than several requests that could
 * each land on a different set of matches.
 */
export function PredictionsPage() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const limit = sampleLimit(filters.sampleSize);

    const params = useMemo(
        () => ({
            ...toQueryParams(filters),
            fightersInfo: true,
            sort: "-createdAt",
        }),
        [filters],
    );

    const query = useQuery(predictionsQuery(params));

    // Recomputed only when the rows change, not on every filter keystroke or
    // unrelated re-render: this walks the whole sample several times over.
    const stats = useMemo(() => {
        const rows = query.data?.rows ?? [];

        return {
            rows,
            score: scorePredictions(rows),
            betting: bettingSummary(rows),
            calibration: calibrationBuckets(rows),
            confidence: confidenceDistribution(rows),
            balance: balanceSeries(rows),
            profit: profitSeries(rows),
            byMode: summaryByMode(rows),
        };
    }, [query.data]);

    return (
        <Page
            title="Statistics"
            subtitle="Prediction accuracy and betting performance over the recorded match log."
        >
            <Stack spacing={2}>
                <PredictionFilters value={filters} onChange={setFilters} />

                <QueryState query={query} minHeight={320}>
                    {(data) => (
                        <Stack spacing={2}>
                            {data.count > limit ? (
                                <Alert severity="info" variant="outlined">
                                    Showing the most recent{" "}
                                    {formatCompact(limit)} of{" "}
                                    {formatCompact(data.count)} matches. Narrow
                                    the date range to analyse an earlier period.
                                </Alert>
                            ) : null}

                            <Kpis score={stats.score} betting={stats.betting} />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, lg: 6 }}>
                                    <CalibrationChart
                                        buckets={stats.calibration}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, lg: 6 }}>
                                    <ConfidenceChart bands={stats.confidence} />
                                </Grid>
                                <Grid size={{ xs: 12, lg: 6 }}>
                                    <BalanceChart series={stats.balance} />
                                </Grid>
                                <Grid size={{ xs: 12, lg: 6 }}>
                                    <ProfitChart series={stats.profit} />
                                </Grid>
                                <Grid size={12}>
                                    <ModeSummaryTable
                                        summaries={stats.byMode}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <RecentPredictions rows={stats.rows} />
                                </Grid>
                            </Grid>
                        </Stack>
                    )}
                </QueryState>
            </Stack>
        </Page>
    );
}
