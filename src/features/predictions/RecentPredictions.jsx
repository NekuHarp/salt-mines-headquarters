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
    formatOddsSide,
    formatPercent,
    formatSignedCompact,
} from "../../utils/format";
import {
    MATCH_WINNERS,
    PAGINATION,
    SELECTED_PLAYERS,
    WIN_CHANCE_DECIMALS,
} from "../../constants";
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
 * How a match slot is written and coloured.
 *
 * The two sides are labelled by slot rather than by name everywhere except the
 * fighter columns — repeating a name in Favourite, Winner and Wager made every
 * row read as a wall of the same two strings.
 *
 * A branch on the enum rather than a lookup table: `winner` and the derived
 * favourite are both strictly one of two values, so this is exhaustive, and it
 * keeps each side's label and colour defined together.
 */
function playerStyle(player) {
    return player === MATCH_WINNERS.P1
        ? { label: "P1", color: "viz.players.p1" }
        : { label: "P2", color: "viz.players.p2" };
}

/**
 * A slot label in its own colour.
 *
 * Colour here reinforces identity rather than carrying it: which fighter is
 * which is already fixed by the column, and this cell still spells out "P1" or
 * "P2", so nothing is lost if the hue cannot be seen.
 */
function PlayerLabel({ player }) {
    const { label, color } = playerStyle(player);

    return (
        <Box component="span" sx={{ color, fontWeight: 600 }}>
            {label}
        </Box>
    );
}

/**
 * Which side was favoured and by how much, as one cell.
 *
 * Only the slot label is coloured; the percentage stays in body text, since it
 * is a magnitude rather than an identity. Precision comes from the shared
 * `WIN_CHANCE_DECIMALS`, so this reads the same as the live match bar.
 */
function FavouriteCell({ player, confidence }) {
    return (
        <Box component="span">
            <PlayerLabel player={player} />
            <Box component="span" sx={{ color: "text.disabled" }}>
                {" - "}
            </Box>
            {formatPercent(confidence, WIN_CHANCE_DECIMALS)}
        </Box>
    );
}

/** The ratio with each side in its own slot colour, the separator recessive. */
function OddsCell({ odds }) {
    if (!odds) return EMPTY;

    return (
        // The joined ratio goes on the label so assistive tech reads "1:4.85"
        // rather than three disconnected fragments.
        <Box component="span" aria-label={formatOdds(odds)}>
            <Box component="span" sx={{ color: "viz.players.p1" }}>
                {formatOddsSide(odds.p1)}
            </Box>
            <Box component="span" sx={{ color: "text.disabled", mx: 0.25 }}>
                :
            </Box>
            <Box component="span" sx={{ color: "viz.players.p2" }}>
                {formatOddsSide(odds.p2)}
            </Box>
        </Box>
    );
}

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
        : `${amount} on ${playerStyle(row.betPlayer).label}`;
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
            <Box
                component="span"
                title={row.p1Name}
                sx={{ ...NAME_CELL, color: "viz.players.p1" }}
            >
                {row.p1Name}
            </Box>
        ),
    },
    {
        id: "p2Name",
        label: "Fighter 2",
        render: (row) => (
            <Box
                component="span"
                title={row.p2Name}
                sx={{ ...NAME_CELL, color: "viz.players.p2" }}
            >
                {row.p2Name}
            </Box>
        ),
    },
    {
        id: "odds",
        label: "Odds",
        numeric: true,
        render: (row) => <OddsCell odds={row.odds} />,
    },
    {
        id: "favourite",
        label: "Favourite",
        render: (row) => (
            <FavouriteCell
                player={row.favouredPlayer}
                confidence={row.confidence}
            />
        ),
        // Left-aligned as a compound label, but tabular figures still line the
        // percentages up: "P1" and "P2" are the same width once digits are, so
        // the numbers land in the same column down the page.
        sx: { ...NUMERIC, whiteSpace: "nowrap" },
    },
    {
        id: "winner",
        label: "Winner",
        render: (row) => <PlayerLabel player={row.winner} />,
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
