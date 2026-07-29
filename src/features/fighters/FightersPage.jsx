import { Alert, Card, Stack, TextField } from "@mui/material";
import { formatDateTime, formatInteger, formatRatio, winRate } from "../../utils/format";
import { useMemo, useState } from "react";

import { DataTable } from "../../components/DataTable";
import Page from "../../components/Page";
import { QueryState } from "../../components/QueryState";
import { fightersQuery } from "../../api/fighters";
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
    const [name, setName] = useState("");

    // The API's fighter validator declares `name` as a plain string, so this is
    // an exact match — there is no `contains` operator available on this field.
    const filters = useMemo(() => (name ? { name } : {}), [name]);

    const listParams = useListParams({ defaultSort: "-matches", filters });
    const query = useQuery(fightersQuery(listParams.params));

    return (
        <Page
            title="Fighters"
            subtitle="Every fighter the listener has recorded a result for."
            action={
                <TextField
                    label="Exact name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    sx={{ minWidth: 260 }}
                />
            }
        >
            <Stack spacing={2}>
                {name ? (
                    <Alert severity="info" variant="outlined">
                        The API matches fighter names exactly, so partial names
                        return nothing. Clear the field to browse all fighters.
                    </Alert>
                ) : null}

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
                                    name
                                        ? `No fighter is named exactly "${name}".`
                                        : "No fighters recorded yet."
                                }
                            />
                        )}
                    </QueryState>
                </Card>
            </Stack>
        </Page>
    );
}
