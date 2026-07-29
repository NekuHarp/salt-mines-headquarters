import { Box, CircularProgress } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useRef } from "react";

import { ApiError } from "./api/client";
import { AppLayout } from "./components/AppLayout";
import { LoginGate } from "./auth/LoginGate";
import { NotFoundPage } from "./features/misc/NotFoundPage";
import { ThemeConfig } from "./theme";
import { useAuth } from "./auth/useAuth";

// Split per route. The statistics page pulls in the whole charting library,
// which is dead weight for someone who only ever opens the live view.
const DashboardPage = lazy(() =>
    import("./features/dashboard/DashboardPage").then((module) => ({
        default: module.DashboardPage,
    })),
);
const PredictionsPage = lazy(() =>
    import("./features/predictions/PredictionsPage").then((module) => ({
        default: module.PredictionsPage,
    })),
);
const FightersPage = lazy(() =>
    import("./features/fighters/FightersPage").then((module) => ({
        default: module.FightersPage,
    })),
);
const MatchupsPage = lazy(() =>
    import("./features/matchups/MatchupsPage").then((module) => ({
        default: module.MatchupsPage,
    })),
);

function RouteFallback() {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 320,
            }}
        >
            <CircularProgress size={28} />
        </Box>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // A rejected request here is almost always a bad credential, a
            // stopped API, a missing base URL, or a deliberate 4xx like the 422
            // on exhibition matches. None of those are fixed by trying again.
            retry: (failureCount, error) => {
                if (error instanceof ApiError) {
                    if (error.status === undefined) return false;
                    if (error.status < 500) return false;
                }
                return failureCount < 2;
            },
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
});

/**
 * Drops every cached response when the session ends.
 *
 * Without this, signing out and back in as someone else would briefly render
 * the previous session's data — and after a 401-triggered logout the cache is
 * full of responses that are no longer authorised.
 */
function CacheReset({ children }) {
    const { isAuthenticated } = useAuth();
    const wasAuthenticated = useRef(isAuthenticated);

    useEffect(() => {
        if (wasAuthenticated.current && !isAuthenticated) {
            queryClient.clear();
        }
        wasAuthenticated.current = isAuthenticated;
    }, [isAuthenticated]);

    return children;
}

function App() {
    return (
        <ThemeConfig>
            <QueryClientProvider client={queryClient}>
                <CacheReset>
                    <LoginGate>
                        <BrowserRouter>
                            <Suspense fallback={<RouteFallback />}>
                                <Routes>
                                    <Route element={<AppLayout />}>
                                        <Route
                                            index
                                            element={<DashboardPage />}
                                        />
                                        <Route
                                            path="predictions"
                                            element={<PredictionsPage />}
                                        />
                                        <Route
                                            path="fighters"
                                            element={<FightersPage />}
                                        />
                                        <Route
                                            path="matchups"
                                            element={<MatchupsPage />}
                                        />
                                        <Route
                                            path="*"
                                            element={<NotFoundPage />}
                                        />
                                    </Route>
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </LoginGate>
                </CacheReset>
            </QueryClientProvider>
        </ThemeConfig>
    );
}

export default App;
