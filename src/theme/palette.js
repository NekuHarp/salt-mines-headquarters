import { alpha } from "@mui/material/styles";

// SETUP COLORS
const GREY = {
    0: "#FFFFFF",
    100: "#F9FAFB",
    200: "#F4F6F8",
    210: "#F2F2F2",
    300: "#DFE3E8",
    400: "#C4CDD5",
    500: "#919EAB",
    600: "#637381",
    700: "#454F5B",
    800: "#212B36",
    900: "#161C24",
    500_8: alpha("#919EAB", 0.08),
    500_12: alpha("#919EAB", 0.12),
    500_16: alpha("#919EAB", 0.16),
    500_24: alpha("#919EAB", 0.24),
    500_32: alpha("#919EAB", 0.32),
    500_48: alpha("#919EAB", 0.48),
    500_56: alpha("#919EAB", 0.56),
    500_80: alpha("#919EAB", 0.8),
};

/**
 * Surfaces. `paper` is the surface every chart renders on, so it is the one the
 * data-visualisation palette below was contrast-validated against.
 */
const BACKGROUND = {
    default: GREY[900],
    paper: GREY[800],
    neutral: GREY[700],
};

const PRIMARY = {
    lighter: "#CDE2FB",
    light: "#86B6EF",
    main: "#3987E5",
    dark: "#256ABF",
    darker: "#184F95",
    contrastText: "#fff",
};
const SECONDARY = {
    lighter: "#FBD9CB",
    light: "#EB8B62",
    main: "#D95926",
    dark: "#B4441A",
    darker: "#853212",
    contrastText: "#fff",
};
const INFO = {
    lighter: "#D0F2FF",
    light: "#74CAFF",
    main: "#1890FF",
    dark: "#0C53B7",
    darker: "#04297A",
    contrastText: "#fff",
};
const SUCCESS = {
    lighter: "#E9FCD4",
    light: "#5BE584",
    main: "#0CA30C",
    dark: "#08660D",
    darker: "#054A09",
    contrastText: "#fff",
};
const WARNING = {
    lighter: "#FFF7CD",
    light: "#FFE16A",
    main: "#FAB219",
    dark: "#B78103",
    darker: "#7A4F01",
    contrastText: GREY[900],
};
const ERROR = {
    lighter: "#FFE7D9",
    light: "#FFA48D",
    main: "#D03B3B",
    dark: "#B72136",
    darker: "#7A0C2E",
    contrastText: "#fff",
};

/**
 * Data-visualisation palette, kept separate from the UI palette so that
 * re-theming a button can never silently repaint a chart.
 *
 * The three categorical slots are assigned in this fixed order and never
 * cycled. They were validated as a set against the `paper` surface above
 * (all pairs, dark mode): worst CVD ΔE 9.4, worst normal-vision ΔE 20.9, and
 * all three at or above 3:1 contrast. A fourth slot would break those floors,
 * so a fourth series folds into "Other" or becomes its own chart.
 *
 * `status` mirrors the reserved good/warning/serious/critical roles and is
 * never used for a series. Red and green are near-indistinguishable under
 * deuteranopia, so anything painted with a status color also carries an icon
 * and a visible number — hue never carries the meaning alone.
 */
const VIZ = {
    categorical: ["#3987E5", "#D95926", "#199E70"],
    sequential: [
        "#CDE2FB",
        "#9EC5F4",
        "#6DA7EC",
        "#3987E5",
        "#256ABF",
        "#184F95",
        "#0D366B",
    ],
    diverging: { negative: "#D03B3B", neutral: "#383835", positive: "#3987E5" },
    status: {
        good: "#0CA30C",
        warning: "#FAB219",
        serious: "#EC835A",
        critical: "#D03B3B",
    },
    // Chart chrome, deliberately recessive: the marks carry the data, the grid
    // only helps locate them.
    grid: alpha("#919EAB", 0.16),
    axis: alpha("#919EAB", 0.32),
    muted: "#898781",
    reference: alpha("#919EAB", 0.56),
};

const palette = {
    mode: "dark",
    common: { black: "#000", white: "#fff" },
    primary: { ...PRIMARY },
    secondary: { ...SECONDARY },
    info: { ...INFO },
    success: { ...SUCCESS },
    warning: { ...WARNING },
    error: { ...ERROR },
    grey: GREY,
    viz: VIZ,
    divider: GREY[500_24],
    text: {
        primary: "#FFFFFF",
        secondary: GREY[500],
        disabled: GREY[600],
    },
    background: BACKGROUND,
    action: {
        active: GREY[500],
        hover: GREY[500_8],
        selected: GREY[500_16],
        disabled: GREY[500_48],
        disabledBackground: GREY[500_24],
        focus: GREY[500_24],
        hoverOpacity: 0.08,
        disabledOpacity: 0.48,
    },
};

export default palette;
