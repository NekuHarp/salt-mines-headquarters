import {
    StyledEngineProvider,
    ThemeProvider,
    createTheme,
} from "@mui/material/styles";
import shadows, { customShadows } from "./shadows";

import { CssBaseline } from "@mui/material";
import GlobalStyles from "./globalStyles";
import componentOverrides from "./overrides";
import palette from "./palette";
import typography from "./typography";

const theme = createTheme({
    palette,
    shape: { borderRadius: 8 },
    typography,
    shadows,
    customShadows,
});

theme.components = componentOverrides(theme);

export const ThemeConfig = ({ children }) => (
    <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyles />
            {children}
        </ThemeProvider>
    </StyledEngineProvider>
);
