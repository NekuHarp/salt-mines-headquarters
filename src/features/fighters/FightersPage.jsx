import { Card, IconButton, InputAdornment, TextField } from "@mui/material";
import {
    formatDateTime,
    formatInteger,
    formatRatio,
    winRate,
} from "../../utils/format";
import { useMemo, useState } from "react";

import ClearIcon from "@mui/icons-material/Clear";
import { DataTable } from "../../components/DataTable";
import Page from "../../components/Page";
import { QueryState } from "../../components/QueryState";
import { SEARCH_DEBOUNCE_MS } from "../../constants";
import SearchIcon from "@mui/icons-material/Search";
import { fightersQuery } from "../../api/fighters";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useListParams } from "../../hooks/useListParams";
import { useQuery } from "@tanstack/react-query";

const COLUMNS = [
    {
        id: "name",
        label: "Fighter",
        sortable: true,
        render: (row) => row.name,
    },
    {
        id: "matches",
        label: "Matches",
        sortable: true,
        numeric: true,
        render: (row) => formatInteger(row.matches),
    },
    {
        id: "wins",
        label: "Wins",
        sortable: true,
        numeric: true,
        render: (row) => formatInteger(row.wins),
    },
    {
        id: "losses",
        label: "Losses",
        sortable: true,
        numeric: true,
        render: (row) => formatInteger(row.losses),
    },
    {
        id: "winRate",
        label: "Win rate",
        // Derived rather than stored, so the API has nothing to sort it by.
        sortable: false,
        numeric: true,
        render: (row) => formatRatio(winRate(row)),
    },
    {
        id: "updatedAt",
        label: "Last seen",
        sortable: true,
        render: (row) => formatDateTime(row.updatedAt),
    },
];

export function FightersPage() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

    // `contains` is the API's substring operator, sent in its array filter
    // syntax; the client serialises this to `name[]=contains&name[]=<value>`.
    const filters = useMemo(
        () => (debouncedSearch ? { name: ["contains", debouncedSearch] } : {}),
        [debouncedSearch],
    );

    const listParams = useListParams({ defaultSort: "-matches", filters });
    const query = useQuery(fightersQuery(listParams.params));

    return (
        <Page
            title="Fighters"
            subtitle="Every fighter the listener has recorded a result for."
            action={
                <TextField
                    label="Search name"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    sx={{ minWidth: 260 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        fontSize="small"
                                        sx={{ color: "text.disabled" }}
                                    />
                                </InputAdornment>
                            ),
                            endAdornment: search ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        edge="end"
                                        aria-label="Clear search"
                                        onClick={() => setSearch("")}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        },
                    }}
                />
            }
        >
            <Card>
                <QueryState query={query} minHeight={320}>
                    {(data) => (
                        <DataTable
                            columns={COLUMNS}
                            rows={data.rows}
                            count={data.count}
                            listParams={listParams}
                            isFetching={query.isFetching}
                            emptyMessage={
                                debouncedSearch
                                    ? `No fighter's name contains "${debouncedSearch}".`
                                    : "No fighters recorded yet."
                            }
                        />
                    )}
                </QueryState>
            </Card>
        </Page>
    );
}
