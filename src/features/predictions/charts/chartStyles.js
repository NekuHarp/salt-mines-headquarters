/**
 * Shared chart chrome.
 *
 * MUI X inherits some of its colours from the theme but not all of them, and the
 * defaults are tuned for a light surface. Centralising the overrides keeps every
 * chart in this app reading as one system, and keeps the recessive grid/axis
 * treatment from drifting per chart.
 */
export function chartSx(theme) {
    const { viz } = theme.palette;

    return {
        // 2px lines with round caps, and markers ringed in the surface colour so
        // they stay legible where they cross a line.
        "& .MuiLineElement-root": {
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
        "& .MuiMarkElement-root": {
            strokeWidth: 2,
            stroke: theme.palette.background.paper,
            r: 4,
        },
        // Hairline, solid, one step off the surface.
        "& .MuiChartsGrid-line": {
            stroke: viz.grid,
            strokeWidth: 1,
        },
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
            stroke: viz.axis,
        },
        "& .MuiChartsAxis-tickLabel": {
            fill: viz.muted,
            fontVariantNumeric: "tabular-nums",
        },
        "& .MuiChartsAxis-label": {
            fill: theme.palette.text.secondary,
        },
    };
}

/** Legend is suppressed everywhere: identity comes from direct labels instead. */
export const HIDDEN_LEGEND = { legend: { hidden: true } };

export const CHART_MARGIN = { left: 10, right: 16, top: 10, bottom: 10 };
