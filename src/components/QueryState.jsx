import { Alert, AlertTitle, Box, CircularProgress } from "@mui/material";

/**
 * Renders the loading and error states of a query so pages don't each invent
 * their own.
 *
 * `children` is a function rather than an element so that it is only called once
 * data exists — pages can then read `data` without null-guarding every field.
 *
 * A refetch that fails while data is already on screen is deliberately not
 * escalated to an error: on the polling views that would replace a good
 * snapshot with an error box every time the network hiccups.
 */
export function QueryState({
    query,
    children,
    errorTitle = "Could not load data",
    minHeight = 160,
    renderError,
}) {
    const { isPending, isError, error, data } = query;

    if (isPending) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight,
                }}
            >
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (isError && data === undefined) {
        if (renderError) return renderError(error);

        return (
            <Alert severity="error" variant="outlined">
                <AlertTitle>{errorTitle}</AlertTitle>
                {error?.message}
            </Alert>
        );
    }

    return children(data);
}
