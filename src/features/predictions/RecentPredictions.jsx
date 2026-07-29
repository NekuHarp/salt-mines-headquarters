import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from "@mui/material";
import {
    EMPTY,
    formatCompact,
    formatDateTime,
    formatPercent,
    formatSignedCompact,
} from "../../utils/format";
import { MATCH_WINNERS, PAGINATION, SELECTED_PLAYERS } from "../../constants";
import { favourite, favouriteWon, realisedProfit } from "./statistics";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

const NUMERIC = { fontVariantNumeric: "tabular-nums" };

/** The name of a fighter, falling back to the UUID when P1/P2 weren't loaded. */
function fighterName(fighter, uuid) {
    return fighter?.name ?? uuid;
}

/**
 * A correct/incorrect call, as an icon plus a word.
 *
 * Green and red are indistinguishable to a deuteranope, so the icon and the
 * label carry the meaning and the colour only reinforces it.
 */
function Outcome({ correct }) {
    const Icon = correct ? CheckIcon : CloseIcon;
    const color = correct ? "viz.status.good" : "viz.status.critical";

    return (
        <Box
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
            <Icon sx={{ fontSize: 16, color }} />
            <Typography variant="body2" sx={{ color }}>
                {correct ? "Hit" : "Miss"}
            </Typography>
        </Box>
    );
}

/**
 * The prediction log as a table.
 *
 * Paginated in the browser rather than on the server: these are the same rows
 * the charts above were computed from, so re-fetching a page would risk showing
 * a different sample than the one being visualised.
 */
export function RecentPredictions({ rows }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_LIMIT);

    const visible = rows.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
    );

    return (
        <Card>
            <CardHeader
                title="Match log"
                subheader="Every prediction in the current sample, newest first"
            />
            <CardContent>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Recorded</TableCell>
                                <TableCell>Mode</TableCell>
                                <TableCell>Favourite</TableCell>
                                <TableCell align="right">Confidence</TableCell>
                                <TableCell>Winner</TableCell>
                                <TableCell>Call</TableCell>
                                <TableCell align="right">Wager</TableCell>
                                <TableCell align="right">Profit</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visible.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                py: 4,
                                                textAlign: "center",
                                            }}
                                        >
                                            No predictions recorded in this
                                            range.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visible.map((row) => {
                                    const { player, confidence } =
                                        favourite(row);
                                    const p1Name = fighterName(
                                        row.P1,
                                        row.p1Uuid,
                                    );
                                    const p2Name = fighterName(
                                        row.P2,
                                        row.p2Uuid,
                                    );
                                    const profit = realisedProfit(row);

                                    return (
                                        <TableRow key={row.uuid} hover>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {formatDateTime(row.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={row.mode}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {player === MATCH_WINNERS.P1
                                                    ? p1Name
                                                    : p2Name}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={NUMERIC}
                                            >
                                                {formatPercent(confidence)}
                                            </TableCell>
                                            <TableCell>
                                                {row.winner ===
                                                MATCH_WINNERS.P1
                                                    ? p1Name
                                                    : p2Name}
                                            </TableCell>
                                            <TableCell>
                                                <Outcome
                                                    correct={favouriteWon(row)}
                                                />
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={NUMERIC}
                                            >
                                                {row.wager
                                                    ? `${formatCompact(row.wager)} on ${
                                                          row.selectedPlayer ===
                                                          SELECTED_PLAYERS.P1
                                                              ? p1Name
                                                              : p2Name
                                                      }`
                                                    : EMPTY}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    ...NUMERIC,
                                                    color:
                                                        profit === null
                                                            ? "text.secondary"
                                                            : profit >= 0
                                                              ? "viz.status.good"
                                                              : "viz.status.critical",
                                                }}
                                            >
                                                {formatSignedCompact(profit)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={rows.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
                    onPageChange={(event, next) => setPage(next)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(Number(event.target.value));
                        setPage(0);
                    }}
                />
            </CardContent>
        </Card>
    );
}
