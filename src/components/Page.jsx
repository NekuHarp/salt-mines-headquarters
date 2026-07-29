import { Box, Stack, Typography } from "@mui/material";

import { forwardRef } from "react";

/**
 * Wraps a route's content and gives it its heading.
 *
 * `action` sits opposite the title on desktop and wraps beneath it on narrow
 * screens, which is where each page puts its filters and refresh controls.
 */
const Page = forwardRef(({ title, subtitle, action, children }, ref) => (
    <Box ref={ref} sx={{ width: "100%", py: 3 }}>
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "flex-end" }}
            sx={{ mb: 3 }}
        >
            <Stack spacing={0.5}>
                <Typography variant="h4" component="h1">
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                    >
                        {subtitle}
                    </Typography>
                ) : null}
            </Stack>
            {action}
        </Stack>

        {children}
    </Box>
));

Page.displayName = "Page";

export default Page;
