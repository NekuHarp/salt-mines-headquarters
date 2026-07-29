import { CHART_MARGIN, HIDDEN_LEGEND, chartSx } from "./chartStyles";
import {
    Card,
    CardContent,
    CardHeader,
    Stack,
    Typography,
} from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";
import { useTheme } from "@mui/material/styles";

/**
 * Predicted confidence against the rate the favourite actually won.
 *
 * The grey reference line is perfect calibration. Points above it mean the model
 * is under-confident (the favourite wins more often than predicted); below means
 * over-confident. This is the chart that says whether a 70% call means 70%.
 *
 * Two marks, but only one is data — so this is emphasis rather than a
 * categorical pair: the observed series takes the accent hue and the reference
 * recedes into the chart chrome. That also means no legend box is needed beyond
 * the two direct labels.
 */
export function CalibrationChart({ buckets, height = 300 }) {
    const theme = useTheme();
    const { viz } = theme.palette;

    const midpoints = buckets.map((bucket) => bucket.midpoint);
    const observed = buckets.map((bucket) => bucket.observedRate);
    const hasData = observed.some((value) => value !== null);

    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="Calibration"
                subheader="Predicted confidence vs how often the favourite won"
            />
            <CardContent>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mb: 1, flexWrap: "wrap" }}
                >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <span
                            style={{
                                width: 14,
                                height: 2,
                                backgroundColor: viz.categorical[0],
                                borderRadius: 1,
                            }}
                        />
                        <Typography variant="caption">Observed</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <span
                            style={{
                                width: 14,
                                height: 2,
                                backgroundColor: viz.reference,
                                borderRadius: 1,
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            Perfect calibration
                        </Typography>
                    </Stack>
                </Stack>

                {hasData ? (
                    <LineChart
                        height={height}
                        xAxis={[
                            {
                                data: midpoints,
                                label: "Predicted win chance (%)",
                                min: 50,
                                max: 100,
                                valueFormatter: (value) => `${value}%`,
                            },
                        ]}
                        yAxis={[
                            {
                                label: "Observed win rate (%)",
                                min: 0,
                                max: 100,
                            },
                        ]}
                        series={[
                            {
                                data: observed,
                                label: "Observed",
                                color: viz.categorical[0],
                                curve: "linear",
                                showMark: true,
                                // Buckets below the sample floor come through as
                                // null; connectNulls would draw a line straight
                                // over the gap and imply data that isn't there.
                                connectNulls: false,
                                valueFormatter: (value, { dataIndex }) => {
                                    const bucket = buckets.at(dataIndex);
                                    if (value === null) {
                                        return `not enough matches (${bucket?.total ?? 0})`;
                                    }
                                    return `${value.toFixed(1)}% over ${bucket?.total} matches`;
                                },
                            },
                            {
                                data: midpoints,
                                label: "Perfect calibration",
                                color: viz.reference,
                                curve: "linear",
                                showMark: false,
                                valueFormatter: () => null,
                            },
                        ]}
                        grid={{ horizontal: true }}
                        slotProps={HIDDEN_LEGEND}
                        margin={CHART_MARGIN}
                        sx={chartSx(theme)}
                    />
                ) : (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", py: 6 }}
                    >
                        Not enough recorded matches yet. Each confidence bucket
                        needs at least five before its rate is meaningful.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
