import { CHART_MARGIN, HIDDEN_LEGEND, chartSx } from "./chartStyles";
import { Card, CardContent, CardHeader } from "@mui/material";

import { BarChart } from "@mui/x-charts/BarChart";
import { formatInteger } from "../../../utils/format";
import { useTheme } from "@mui/material/styles";

/**
 * How often the model lands in each confidence band.
 *
 * This is a magnitude question, not an identity one, so the bars share a single
 * hue rather than taking a colour each — colouring ten bands would imply ten
 * unrelated categories when they are one ordered scale.
 */
export function ConfidenceChart({ bands, height = 280 }) {
    const theme = useTheme();
    const { viz } = theme.palette;

    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="Confidence distribution"
                subheader="Matches per favourite win-chance band"
            />
            <CardContent>
                <BarChart
                    height={height}
                    xAxis={[
                        {
                            data: bands.map((band) => band.label),
                            scaleType: "band",
                            label: "Favourite win chance (%)",
                            // Caps the bar thickness so the band keeps some air
                            // rather than the fill running edge to edge.
                            categoryGapRatio: 0.4,
                        },
                    ]}
                    yAxis={[{ valueFormatter: formatInteger, label: "Matches" }]}
                    series={[
                        {
                            data: bands.map((band) => band.total),
                            label: "Matches",
                            color: viz.categorical[0],
                            valueFormatter: (value) => formatInteger(value),
                        },
                    ]}
                    grid={{ horizontal: true }}
                    slotProps={HIDDEN_LEGEND}
                    margin={CHART_MARGIN}
                    sx={chartSx(theme)}
                    // Rounds the data-end only, leaving the baseline square.
                    borderRadius={4}
                />
            </CardContent>
        </Card>
    );
}
