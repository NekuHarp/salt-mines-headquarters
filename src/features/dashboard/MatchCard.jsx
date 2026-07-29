import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import { formatInteger, formatRatio, winRate } from "../../utils/format";

import { MATCH_MODES } from "../../constants";
import { QueryState } from "../../components/QueryState";
import { WinChanceBar } from "./WinChanceBar";
import { matchStateQuery } from "../../api/state";
import { useQuery } from "@tanstack/react-query";

/** Error codes from the API that describe a state, not a fault. */
const EXHIBITION_ERROR_CODE = 42;

function FighterRecord({ fighter, align = "left" }) {
    const rate = winRate(fighter);

    return (
        <Stack spacing={0.25} sx={{ textAlign: align }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatInteger(fighter.matches)} matches ·{" "}
                {formatInteger(fighter.wins)}W / {formatInteger(fighter.losses)}L
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {rate === null ? "No record yet" : `${formatRatio(rate)} win rate`}
            </Typography>
        </Stack>
    );
}

function HeadToHead({ matchup, p1Name, p2Name }) {
    if (!matchup.matches) {
        return (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                These two have never met before.
            </Typography>
        );
    }

    return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Head to head: {formatInteger(matchup.matches)} previous{" "}
            {matchup.matches === 1 ? "match" : "matches"} —{" "}
            {formatInteger(matchup.p1Wins)} to {p1Name},{" "}
            {formatInteger(matchup.p2Wins)} to {p2Name}.
        </Typography>
    );
}

function MatchStateError({ error }) {
    // 422 with error code 42 is the API saying "this is an exhibition match",
    // which it deliberately does not model. That is a normal state to sit in for
    // minutes at a time, not a failure.
    if (error?.status === 422 || error?.errorCode === EXHIBITION_ERROR_CODE) {
        return (
            <Alert severity="info" variant="outlined">
                An exhibition match is running. The API does not track these, so
                there is nothing to predict until the next matchmaking or
                tournament match.
            </Alert>
        );
    }

    if (error?.status === 502) {
        return (
            <Alert severity="warning" variant="outlined">
                The API could not reach Salty Bet. {error.message}
            </Alert>
        );
    }

    return (
        <Alert severity="error" variant="outlined">
            {error?.message}
        </Alert>
    );
}

/**
 * The current match: who is fighting, what the model thinks, and how it ended.
 *
 * Polls `GET /state`, the one endpoint the API leaves public. The winner field
 * is a human-readable string rather than an enum — it holds a fighter's name
 * once the match resolves, and a sentence while it is still running.
 */
export function MatchCard() {
    const query = useQuery(matchStateQuery());

    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="Current match"
                subheader="Live from Salty Bet, refreshed every 5 seconds"
                action={
                    query.data?.mode ? (
                        <Chip
                            size="small"
                            label={query.data.mode}
                            color={
                                query.data.mode === MATCH_MODES.TOURNAMENT
                                    ? "secondary"
                                    : "primary"
                            }
                            variant="outlined"
                        />
                    ) : null
                }
            />
            <CardContent>
                <QueryState
                    query={query}
                    minHeight={220}
                    renderError={(error) => (
                        <MatchStateError error={error} />
                    )}
                >
                    {(data) => (
                        <Stack spacing={2.5}>
                            <WinChanceBar
                                p1Name={data.p1.name}
                                p2Name={data.p2.name}
                                p1Chance={data.p1WinChance}
                                p2Chance={data.p2WinChance}
                            />

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                spacing={2}
                            >
                                <FighterRecord fighter={data.p1} />
                                <FighterRecord
                                    fighter={data.p2}
                                    align="right"
                                />
                            </Stack>

                            <Divider />

                            <Stack spacing={1}>
                                <HeadToHead
                                    matchup={data.matchup}
                                    p1Name={data.p1.name}
                                    p2Name={data.p2.name}
                                />
                                <Box>
                                    <Typography variant="body2">
                                        {data.winner}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    )}
                </QueryState>
            </CardContent>
        </Card>
    );
}
