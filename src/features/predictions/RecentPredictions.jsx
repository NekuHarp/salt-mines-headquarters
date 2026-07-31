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
    formatOdds,
    formatPercent,
    formatSignedCompact,
} from "../../utils/format";
import { MATCH_WINNERS, PAGINATION, SELECTED_PLAYERS } from "../../constants";
import { favourite, favouriteWon, potOdds, realisedProfit } from "./statistics";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

const NUMERIC = { fontVariantNumeric: "tabular-nums" };

// Fighter names run long ("Evil ryu ssf'2 plus"), and thirteen columns is
// already wide. Truncating with the full name on the title keeps the row on one
// line without hiding anything.
const NAME_CELL = {
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

/**
 * The two sides are labelled by slot rather than by name everywhere except the
 * fighter columns. Repeating a name in Favourite, Winner and Wager made every
 * row read as a wall of the same two strings.
 */
const PLAYER_LABELS = Object.freeze({
    [MATCH_WINNERS.P1]: "P1",
    [MATCH_WINNERS.P2]: "P2",
});

/**
 * A correct or incorrect call, as an icon plus a word.
 *
 * Green and red are indistinguishable to a deuteranope, so the icon and the
 * label carry the meaning and the colour only reinforces it.
 */
function Outcome({ correct }) {
    const Icon = correct ? CheckIcon : CloseIcon;
    const color = correct ? "viz.status.good" : "viz.status.critical";

    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Icon sx={{ fontSize: 16, color }} />
            <Typography variant="body2" sx={{ color }}>
                {correct ? "Hit" : "Miss"}
            </Typography>
        </Box>
    );
}

/**
 * Flattens a prediction into the values the columns render, so each row's
 * derived figures are computed once rather than per cell.
 */
function toRow(prediction) {
    const { player, confidence } = favourite(prediction);

    return {
        uuid: prediction.uuid,
        createdAt: prediction.createdAt,
        mode: prediction.mode,
        // `fightersInfo` supplies P1/P2; fall back to the UUID if it was omitted.
        p1Name: prediction.P1?.name ?? prediction.p1Uuid,
        p2Name: prediction.P2?.name ?? prediction.p2Uuid,
        odds: potOdds(prediction),
        p1Total: prediction.p1Total,
        p2Total: prediction.p2Total,
        favouredPlayer: player,
        confidence,
        winner: prediction.winner,
        hit: favouriteWon(prediction),
        wager: prediction.wager,
        betPlayer: prediction.selectedPlayer
            ? prediction.selectedPlayer === SELECTED_PLAYERS.P1
                ? MATCH_WINNERS.P1
                : MATCH_WINNERS.P2
            : null,
        profit: realisedProfit(prediction),
    };
}

function wagerCell(row) {
    if (!row.wager) return EMPTY;

    const amount = formatCompact(row.wager);

    // The listener only ever backs the favourite, so naming the side would just
    // restate the Favourite column. A manual PUT /bet could diverge though, and
    // that is worth seeing rather than silently reading as a bet on the
    // favourite.
    return row.betPlayer === row.favouredPlayer
        ? amount
        : `${amount} on ${PLAYER_LABELS[row.betPlayer]}`;
}

const COLUMNS = [
    {
        id: "createdAt",
        label: "Recorded",
        render: (row) => formatDateTime(row.createdAt),
        sx: { whiteSpace: "nowrap" },
    },
    {
        id: "mode",
        label: "Mode",
        render: (row) => (
            <Chip size="small" variant="outlined" label={row.mode} />
        ),
    },
    {
        id: "p1Name",
        label: "Fighter 1",
        render: (row) => (
            <Box component="span" title={row.p1Name} sx={NAME_CELL}>
                {row.p1Name}
            </Box>
        ),
    },
    {
        id: "p2Name",
        label: "Fighter 2",
        render: (row) => (
            <Box component="span" title={row.p2Name} sx={NAME_CELL}>
                {row.p2Name}
            </Box>
        ),
    },
    {
        id: "odds",
        label: "Odds",
        numeric: true,
        render: (row) => formatOdds(row.odds),
    },
    {
        id: "p1Total",
        label: "P1 pot",
        numeric: true,
        render: (row) => formatCompact(row.p1Total),
    },
    {
        id: "p2Total",
        label: "P2 pot",
        numeric: true,
        render: (row) => formatCompact(row.p2Total),
    },
    {
        id: "favourite",
        label: "Favourite",
        render: (row) => PLAYER_LABELS[row.favouredPlayer],
    },
    {
        id: "confidence",
        label: "Confidence",
        numeric: true,
        render: (row) => formatPercent(row.confidence),
    },
    {
        id: "winner",
        label: "Winner",
        render: (row) => PLAYER_LABELS[row.winner],
    },
    {
        id: "call",
        label: "Call",
        render: (row) => <Outcome correct={row.hit} />,
    },
    {
        id: "wager",
        label: "Wager",
        numeric: true,
        render: wagerCell,
    },
    {
        id: "profit",
        label: "Profit",
        numeric: true,
        render: (row) => formatSignedCompact(row.profit),
        // Signed as well as coloured, so direction never rests on hue alone.
        cellSx: (row) => ({
            color:
                row.profit === null
                    ? "text.secondary"
                    : row.profit >= 0
                      ? "viz.status.good"
                      : "viz.status.critical",
        }),
    },
];

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

    const visible = rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(toRow);

    return (
        <Card>
            <CardHeader
                title="Match log"
                subheader="Every prediction in the current sample, newest first. Odds are P1:P2 against the smaller pot, so the shorter side is the one that pays more."
            />
            <CardContent>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {COLUMNS.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={
                                            column.numeric ? "right" : "left"
                                        }
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visible.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={COLUMNS.length}>
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
                                visible.map((row) => (
                                    <TableRow key={row.uuid} hover>
                                        {COLUMNS.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                align={
                                                    column.numeric
                                                        ? "right"
                                                        : "left"
                                                }
                                                sx={{
                                                    ...(column.numeric
                                                        ? NUMERIC
                                                        : null),
                                                    ...column.sx,
                                                    ...column.cellSx?.(row),
                                                }}
                                            >
                                                {column.render(row)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
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
