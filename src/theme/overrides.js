/**
 * Component defaults for the dark surfaces this app uses.
 *
 * On a dark theme MUI's default elevation shadows barely register, so cards and
 * popovers are separated from the page by a hairline ring instead.
 */
export default function componentOverrides(theme) {
    const hairline = `1px solid ${theme.palette.divider}`;

    return {
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: hairline,
                    backgroundImage: "none",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                // MUI paints an overlay gradient on dark-mode Paper; it fights
                // the explicit surface colors the chart palette was validated
                // against.
                root: { backgroundImage: "none" },
            },
        },
        MuiCardHeader: {
            defaultProps: {
                titleTypographyProps: { variant: "h6" },
                subheaderTypographyProps: {
                    variant: "body2",
                    color: "text.secondary",
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: { borderBottom: hairline },
                head: {
                    backgroundColor: theme.palette.background.neutral,
                    color: theme.palette.text.secondary,
                    fontWeight: theme.typography.fontWeightMedium,
                    whiteSpace: "nowrap",
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    "&:last-of-type td": { borderBottom: "none" },
                },
            },
        },
        MuiTextField: {
            defaultProps: { size: "small" },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                notchedOutline: { borderColor: theme.palette.divider },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: theme.palette.grey[700],
                    fontSize: "0.75rem",
                },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
        },
        MuiLink: {
            defaultProps: { underline: "hover" },
        },
    };
}
