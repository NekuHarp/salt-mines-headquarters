import { CHART_MARGIN, HIDDEN_LEGEND, chartSx } from "./chartStyles";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";

import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { LineChart } from "@mui/x-charts/LineChart";
import { formatCompact } from "../../../utils/format";
import { useTheme } from "@mui/material/styles";

/**
 * Cumulative realised profit across every settled bet.
 *
 * Read against the zero line: above it the betting strategy is ahead, below it
 * behind. The zero reference is drawn in the chart chrome rather than a data
 * colour, so it never reads as a second series.
 */
export function ProfitChart({ series, height = 280 }) {
    const theme = useTheme();
    const { viz } = theme.palette;

    if (series.length < 2) {
        return (
            <Card sx={{ height: "100%" }}>
                <CardHeader title="Cumulative profit" />
                <CardContent>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", py: 6 }}
                    >
                        Nothing settled yet. Profit needs bets whose pot totals
                        were captured before betting locked.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const final = series.at(-1).cumulativeProfit;

    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="Cumulative profit"
                subheader={`${formatCompact(final)} across ${series.length} settled bets`}
            />
            <CardContent>
                <LineChart
                    height={height}
                    xAxis={[
                        {
                            data: series.map((point) => point.date),
                            scaleType: "time",
                        },
                    ]}
                    yAxis={[{ valueFormatter: formatCompact }]}
                    series={[
                        {
                            data: series.map((point) => point.cumulativeProfit),
                            label: "Cumulative profit",
                            color: viz.categorical[0],
                            showMark: false,
                            valueFormatter: (value) => formatCompact(value),
                        },
                    ]}
                    grid={{ horizontal: true }}
                    slotProps={HIDDEN_LEGEND}
                    margin={CHART_MARGIN}
                    sx={chartSx(theme)}
                >
                    {/* Break-even, so "am I up or down" is one glance. */}
                    <ChartsReferenceLine
                        y={0}
                        lineStyle={{ stroke: viz.reference, strokeWidth: 1 }}
                    />
                </LineChart>
            </CardContent>
        </Card>
    );
}
