import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { INPUT_VALIDATION, MATCHES_TO_RECORD } from "../../constants";
import {
    listenerStatusQuery,
    startListener,
    stopListener,
} from "../../api/listener";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { QueryState } from "../../components/QueryState";
import StopIcon from "@mui/icons-material/Stop";
import { queryKeys } from "../../api/queryKeys";
import { useState } from "react";

const OPTIONS = [
    {
        name: "strictMode",
        label: "Strict mode",
        hint: "Record matchmaking only. Exhibitions are always skipped; this also skips tournaments.",
    },
    {
        name: "recordRemaining",
        label: "Record remaining strings",
        hint: "Store each unique `remaining` string with its detected mode, so a misdetected mode can be corrected later.",
    },
    {
        name: "bettingMode",
        label: "Auto-betting",
        hint: "Place a real bet on the favourite each time betting opens. Tournaments go all-in; matchmaking is staked by confidence.",
    },
];

function ActiveParams({ params }) {
    if (!params) return null;

    const enabled = OPTIONS.filter((option) => params[option.name]).map(
        (option) => option.label,
    );

    return (
        <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {params.matchesToRecord
                    ? `Stopping after ${params.matchesToRecord} recorded ${
                          params.matchesToRecord === 1 ? "match" : "matches"
                      }.`
                    : "Running until stopped."}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {enabled.length
                    ? `Enabled: ${enabled.join(", ")}.`
                    : "No options enabled."}
            </Typography>
        </Stack>
    );
}

function StartForm({ onStart, isStarting }) {
    // Held back so auto-betting can be confirmed before the request goes out.
    const [pendingPayload, setPendingPayload] = useState(null);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            matchesToRecord: "",
            strictMode: false,
            recordRemaining: false,
            bettingMode: false,
        },
    });

    const onSubmit = (payload) => {
        const { matchesToRecord, ...flags } = payload;

        // The API treats an absent `matchesToRecord` as "run until stopped", so
        // a blank field must be omitted rather than sent as 0 or "".
        const body = {
            ...flags,
            ...(matchesToRecord === ""
                ? {}
                : { matchesToRecord: Number(matchesToRecord) }),
        };

        // Auto-betting stakes the real account balance the moment betting opens,
        // and a tournament match goes all-in. Worth one deliberate click.
        if (body.bettingMode) {
            setPendingPayload(body);
            return;
        }

        onStart(body);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
                <TextField
                    label="Matches to record"
                    type="number"
                    placeholder="Leave blank to run indefinitely"
                    error={Boolean(errors.matchesToRecord)}
                    helperText={
                        errors.matchesToRecord?.message ??
                        `Optional, ${MATCHES_TO_RECORD.MIN}–${MATCHES_TO_RECORD.MAX}.`
                    }
                    inputProps={{
                        min: MATCHES_TO_RECORD.MIN,
                        max: MATCHES_TO_RECORD.MAX,
                    }}
                    {...register("matchesToRecord", {
                        validate: (value) => {
                            if (value === "") return true;

                            const parsed = Number(value);
                            if (!Number.isInteger(parsed)) {
                                return INPUT_VALIDATION.INVALID;
                            }
                            if (
                                parsed < MATCHES_TO_RECORD.MIN ||
                                parsed > MATCHES_TO_RECORD.MAX
                            ) {
                                return INPUT_VALIDATION.MATCHES_TO_RECORD_RANGE;
                            }
                            return true;
                        },
                    })}
                />

                <Stack>
                    {OPTIONS.map((option) => (
                        <Controller
                            key={option.name}
                            name={option.name}
                            control={control}
                            render={({ field }) => (
                                <Tooltip
                                    title={option.hint}
                                    placement="right"
                                    enterTouchDelay={0}
                                >
                                    <FormControlLabel
                                        sx={{ alignSelf: "flex-start" }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                {option.label}
                                            </Typography>
                                        }
                                    />
                                </Tooltip>
                            )}
                        />
                    ))}
                </Stack>

                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    loading={isStarting}
                >
                    Start listener
                </Button>
            </Stack>

            <Dialog
                open={pendingPayload !== null}
                onClose={() => setPendingPayload(null)}
            >
                <DialogTitle>Start with auto-betting?</DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">
                        <Stack spacing={1}>
                            <Typography variant="body2">
                                The listener will place real bets on the Salty
                                Bet account as each betting window opens.
                            </Typography>
                            <Typography variant="body2">
                                Tournament matches are staked at the full
                                balance; matchmaking is staked at 5–25% of it
                                depending on the favourite&apos;s win chance.
                            </Typography>
                        </Stack>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPendingPayload(null)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={() => {
                            onStart(pendingPayload);
                            setPendingPayload(null);
                        }}
                    >
                        Start betting
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
}

/**
 * Status and controls for the backend's background listener.
 *
 * Status is polled rather than assumed from the last button pressed: the
 * listener stops itself once it has recorded its quota, and it can be started or
 * stopped from outside this app.
 */
export function ListenerCard() {
    const queryClient = useQueryClient();
    const query = useQuery(listenerStatusQuery());

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.listener.all });

    const start = useMutation({
        mutationFn: startListener,
        onSuccess: invalidate,
    });
    const stop = useMutation({
        mutationFn: stopListener,
        onSuccess: invalidate,
    });

    const mutationError = start.error ?? stop.error;

    return (
        <Card sx={{ height: "100%" }}>
            <CardHeader
                title="Listener"
                subheader="Background scraping and result recording"
                action={
                    query.data ? (
                        <Chip
                            size="small"
                            label={query.data.active ? "Running" : "Stopped"}
                            variant={query.data.active ? "filled" : "outlined"}
                            color={query.data.active ? "success" : "default"}
                        />
                    ) : null
                }
            />
            <CardContent>
                <QueryState query={query} minHeight={220}>
                    {(data) => (
                        <Stack spacing={2}>
                            {mutationError ? (
                                <Alert
                                    severity={
                                        // 409 means the listener already moved
                                        // to the state being asked for, which
                                        // the next poll will show anyway.
                                        mutationError.status === 409
                                            ? "info"
                                            : "error"
                                    }
                                    variant="outlined"
                                    onClose={() => {
                                        start.reset();
                                        stop.reset();
                                    }}
                                >
                                    {mutationError.message}
                                </Alert>
                            ) : null}

                            {data.active ? (
                                <Stack spacing={2}>
                                    <ActiveParams params={data.params} />
                                    <Divider />
                                    <Box>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<StopIcon />}
                                            loading={stop.isPending}
                                            onClick={() => stop.mutate()}
                                        >
                                            Stop listener
                                        </Button>
                                    </Box>
                                </Stack>
                            ) : (
                                <StartForm
                                    onStart={start.mutate}
                                    isStarting={start.isPending}
                                />
                            )}
                        </Stack>
                    )}
                </QueryState>
            </CardContent>
        </Card>
    );
}
