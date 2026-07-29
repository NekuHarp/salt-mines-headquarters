import { CHART_MARGIN, HIDDEN_LEGEND, chartSx } from "./chartStyles";
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
} from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";
import { formatCompact } from "../../../utils/format";
import { useTheme } from "@mui/material/styles";

/**
 * Account balance as it stood before each bet.
 *
 * A single series, so it carries no legend — the title says what is plotted. The
 * area wash underneath is the series hue at low opacity, which reads as "this
 * line has a floor at zero" without competing with the line itself.
 */
export function BalanceChart({ series, height = 280 }) {
    const theme = useTheme();
    const { viz } = theme.palette;

    if (series.length < 2) {
        return (
            <Card sx={{ height: "100%" }}>
                <CardHeader title="Balance over time" />
                <CardContent>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", py: 6 }}
                    >
                        Balance is only recorded on matches the listener bet on.
                        Run the listener with auto-betting enabled to build this
                        history.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="Balance over time"
                subheader={`Recorded at ${series.length} bets`}
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
                            data: series.map((point) => point.balance),
                            label: "Balance",
                            color: viz.categorical[0],
                            area: true,
                            // Too many points to mark individually; the hover
                            // crosshair carries per-point values instead.
                            showMark: false,
                            valueFormatter: (value) => formatCompact(value),
                        },
                    ]}
                    grid={{ horizontal: true }}
                    slotProps={HIDDEN_LEGEND}
                    margin={CHART_MARGIN}
                    sx={{
                        ...chartSx(theme),
                        // A wash, never a saturated block.
                        "& .MuiAreaElement-root": { fillOpacity: 0.1 },
                    }}
                />
            </CardContent>
        </Card>
    );
}
