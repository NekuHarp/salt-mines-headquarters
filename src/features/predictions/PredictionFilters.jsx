import {
    Card,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";

import { BET_FILTERS } from "./filterParams";
import { MATCH_MODES } from "../../constants";

/**
 * Filters for the statistics view.
 *
 * These are pushed to the API rather than applied to the fetched rows: the
 * sample is capped, so filtering server-side means the cap applies to matches
 * that are actually in scope.
 */
export function PredictionFilters({ value, onChange }) {
    const update = (patch) => onChange({ ...value, ...patch });

    return (
        <Card sx={{ p: 2 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
            >
                <TextField
                    select
                    label="Mode"
                    value={value.mode}
                    onChange={(event) => update({ mode: event.target.value })}
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="">All modes</MenuItem>
                    {Object.values(MATCH_MODES).map((mode) => (
                        <MenuItem key={mode} value={mode}>
                            {mode}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label="From"
                    type="date"
                    value={value.createdAfter}
                    onChange={(event) =>
                        update({ createdAfter: event.target.value })
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                />

                <TextField
                    label="To"
                    type="date"
                    value={value.createdBefore}
                    onChange={(event) =>
                        update({ createdBefore: event.target.value })
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                />

                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={value.betFilter}
                    onChange={(event, next) => {
                        // Null means the active button was clicked again; keep
                        // the current filter rather than dropping to no state.
                        if (next !== null) update({ betFilter: next });
                    }}
                >
                    {BET_FILTERS.map((filter) => (
                        <ToggleButton key={filter.value} value={filter.value}>
                            {filter.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Stack>
        </Card>
    );
}
