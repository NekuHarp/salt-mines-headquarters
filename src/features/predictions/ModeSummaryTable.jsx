import {
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { EMPTY, formatCompact, formatRatio } from "../../utils/format";

// Columns of figures need to line up vertically, which proportional digits
// don't do.
const NUMERIC = { fontVariantNumeric: "tabular-nums" };

/**
 * Per-mode breakdown.
 *
 * A table rather than a grouped bar chart: there are only two or three modes but
 * five metrics each, and a chart of that shape asks the reader to compare across
 * axes that share no scale. Numbers side by side are simply easier to read here.
 */
export function ModeSummaryTable({ summaries }) {
    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="By match mode"
                subheader="Tournaments are only recorded when strict mode is off"
            />
            <CardContent>
                {summaries.length === 0 ? (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", py: 4 }}
                    >
                        No recorded matches in this range.
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Mode</TableCell>
                                <TableCell align="right">Matches</TableCell>
                                <TableCell align="right">Accuracy</TableCell>
                                <TableCell align="right">Brier</TableCell>
                                <TableCell align="right">Bets</TableCell>
                                <TableCell align="right">Profit</TableCell>
                                <TableCell align="right">ROI</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {summaries.map((summary) => (
                                <TableRow key={summary.mode}>
                                    <TableCell>{summary.mode}</TableCell>
                                    <TableCell align="right" sx={NUMERIC}>
                                        {summary.count}
                                    </TableCell>
                                    <TableCell align="right" sx={NUMERIC}>
                                        {formatRatio(summary.accuracy)}
                                    </TableCell>
                                    <TableCell align="right" sx={NUMERIC}>
                                        {summary.brierScore === null
                                            ? EMPTY
                                            : summary.brierScore.toFixed(3)}
                                    </TableCell>
                                    <TableCell align="right" sx={NUMERIC}>
                                        {summary.betting.betCount}
                                    </TableCell>
                                    <TableCell align="right" sx={NUMERIC}>
                                        {summary.betting.settledCount
                                            ? formatCompact(
                                                  summary.betting.profit,
                                              )
                                            : EMPTY}
                                    </TableCell>
                                    <TableCell align="right" sx={NUMERIC}>
                                        {formatRatio(summary.betting.roi)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
