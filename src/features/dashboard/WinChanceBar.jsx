import { Box, Stack, Typography } from "@mui/material";

import { formatPercent } from "../../utils/format";

const BAR_HEIGHT = 24;
// Gap in the surface color, the mechanism that separates the two fills. A
// stroke around each fill would add ink that isn't data.
const SURFACE_GAP = 2;

/**
 * The two fighters' win chances as a single part-to-whole bar.
 *
 * Both sides are direct-labeled with their name and percentage, so identity
 * never rests on the colour alone — which also means no legend box is needed
 * for what is only ever two series.
 */
export function WinChanceBar({ p1Name, p2Name, p1Chance, p2Chance }) {
    const total = p1Chance + p2Chance;
    // The API rounds each side independently, so the two need not sum to exactly
    // 100. Normalising keeps the fills flush with the track.
    const p1Width = total > 0 ? (p1Chance / total) * 100 : 50;

    return (
        <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: "viz.categorical.0",
                            flexShrink: 0,
                        }}
                    />
                    <Typography variant="subtitle2" noWrap>
                        {p1Name}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" noWrap>
                        {p2Name}
                    </Typography>
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: "viz.categorical.1",
                            flexShrink: 0,
                        }}
                    />
                </Stack>
            </Stack>

            <Box
                role="img"
                aria-label={`${p1Name} ${formatPercent(p1Chance)}, ${p2Name} ${formatPercent(p2Chance)}`}
                sx={{
                    display: "flex",
                    height: BAR_HEIGHT,
                    width: "100%",
                    gap: `${SURFACE_GAP}px`,
                }}
            >
                <Box
                    sx={{
                        width: `${p1Width}%`,
                        bgcolor: "viz.categorical.0",
                        // Square where the two meet, rounded at the data end.
                        borderRadius: "4px 0 0 4px",
                        minWidth: 4,
                    }}
                />
                <Box
                    sx={{
                        flex: 1,
                        bgcolor: "viz.categorical.1",
                        borderRadius: "0 4px 4px 0",
                        minWidth: 4,
                    }}
                />
            </Box>

            <Stack direction="row" justifyContent="space-between">
                <Typography
                    variant="h6"
                    component="p"
                    sx={{ color: "text.primary" }}
                >
                    {formatPercent(p1Chance)}
                </Typography>
                <Typography
                    variant="h6"
                    component="p"
                    sx={{ color: "text.primary" }}
                >
                    {formatPercent(p2Chance)}
                </Typography>
            </Stack>
        </Stack>
    );
}
