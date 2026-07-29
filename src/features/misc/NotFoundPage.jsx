import { Button, Stack, Typography } from "@mui/material";

import { Link } from "react-router-dom";
import Page from "../../components/Page";

export function NotFoundPage() {
    return (
        <Page title="Not found">
            <Stack spacing={3} alignItems="flex-start">
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    That page does not exist.
                </Typography>
                <Button component={Link} to="/" variant="contained">
                    Back to live view
                </Button>
            </Stack>
        </Page>
    );
}
