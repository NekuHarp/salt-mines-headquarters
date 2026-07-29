import { Box, Card, Stack, Tooltip, Typography } from "@mui/material";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RemoveIcon from "@mui/icons-material/Remove";

/**
 * The delta carries an arrow icon and its own number alongside the color:
 * good and critical are a red/green pair, which deuteranopes cannot separate by
 * hue, so hue is never the only thing saying which way this went.
 */
function Delta({ delta, deltaLabel }) {
    const theme = { good: "viz.status.good", critical: "viz.status.critical" };
    const isFlat = delta === 0;
    const Icon = isFlat
        ? RemoveIcon
        : delta > 0
          ? ArrowUpwardIcon
          : ArrowDownwardIcon;

    const color = isFlat
        ? "text.secondary"
        : delta > 0
          ? theme.good
          : theme.critical;

    return (
        <Stack direction="row" spacing={0.5} alignItems="center">
            <Icon sx={{ fontSize: 16, color }} />
            <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
                {deltaLabel}
            </Typography>
        </Stack>
    );
}

/**
 * A single headline number. This is deliberately not a one-bar chart: a lone
 * value reads faster as text than as a mark on an axis.
 *
 * `value` is pre-formatted by the caller — the tile has no opinion about units.
 */
export function StatCard({
    label,
    value,
    unit,
    hint,
    delta,
    deltaLabel,
    caption,
    action,
}) {
    return (
        <Card sx={{ p: 2, height: "100%" }}>
            <Stack spacing={1} sx={{ height: "100%" }}>
                <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                            variant="overline"
                            sx={{ color: "text.secondary" }}
                        >
                            {label}
                        </Typography>
                        {hint ? (
                            <Tooltip title={hint} enterTouchDelay={0}>
                                <InfoOutlinedIcon
                                    sx={{
                                        fontSize: 14,
                                        color: "text.disabled",
                                        cursor: "help",
                                    }}
                                />
                            </Tooltip>
                        ) : null}
                    </Stack>
                    {action}
                </Stack>

                <Stack direction="row" spacing={0.75} alignItems="baseline">
                    <Typography variant="h3" component="p">
                        {value}
                    </Typography>
                    {unit ? (
                        <Typography
                            variant="subtitle2"
                            sx={{ color: "text.secondary" }}
                        >
                            {unit}
                        </Typography>
                    ) : null}
                </Stack>

                {delta === undefined || delta === null ? null : (
                    <Delta delta={delta} deltaLabel={deltaLabel} />
                )}

                {caption ? (
                    <Box sx={{ mt: "auto" }}>
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            {caption}
                        </Typography>
                    </Box>
                ) : null}
            </Stack>
        </Card>
    );
}
