import {
    Alert,
    Box,
    Button,
    Card,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { INPUT_VALIDATION } from "../constants";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "./useAuth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { verifyCredentials } from "../api/auth";

/**
 * Gates the app behind the API's HTTP Basic Auth credentials.
 *
 * They are entered here rather than read from an env var because a
 * VITE_-prefixed variable is inlined into the bundle, where anyone loading the
 * page can read it. Entered credentials live in sessionStorage instead, so they
 * survive a reload but never ship with the build.
 */
export function LoginGate({ children }) {
    const { isAuthenticated, logIn } = useAuth();
    const [submitError, setSubmitError] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { username: "", password: "" } });

    const onSubmit = async (payload) => {
        setSubmitError(null);

        try {
            // Verified before storing, so a typo surfaces here rather than as a
            // wall of failed queries behind the gate.
            await verifyCredentials(payload);
            logIn(payload);
        } catch (error) {
            setSubmitError(error.message);
        }
    };

    if (isAuthenticated) return children;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <Card sx={{ p: 4, width: "100%", maxWidth: 400 }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack spacing={3}>
                        <Stack spacing={0.5}>
                            <Typography variant="h4">Salt Mines HQ</Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                Sign in with the salt-mines API credentials.
                            </Typography>
                        </Stack>

                        {submitError ? (
                            <Alert severity="error" variant="outlined">
                                {submitError}
                            </Alert>
                        ) : null}

                        <TextField
                            label="Username"
                            autoComplete="username"
                            autoFocus
                            fullWidth
                            error={Boolean(errors.username)}
                            helperText={errors.username?.message}
                            {...register("username", {
                                required: INPUT_VALIDATION.REQUIRED,
                            })}
                        />

                        <TextField
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            fullWidth
                            error={Boolean(errors.password)}
                            helperText={errors.password?.message}
                            {...register("password", {
                                required: INPUT_VALIDATION.REQUIRED,
                            })}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={<LoginIcon />}
                            loading={isSubmitting}
                        >
                            Sign in
                        </Button>

                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            Stored in sessionStorage for this tab only.
                        </Typography>
                    </Stack>
                </form>
            </Card>
        </Box>
    );
}
