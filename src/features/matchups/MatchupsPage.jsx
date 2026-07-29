import { formatDateTime, formatInteger } from "../../utils/format";

import { Card } from "@mui/material";
import { DataTable } from "../../components/DataTable";
import Page from "../../components/Page";
import { QueryState } from "../../components/QueryState";
import { matchupsQuery } from "../../api/matchups";
import { useListParams } from "../../hooks/useListParams";
import { useQuery } from "@tanstack/react-query";

const COLUMNS = [
    {
        id: "P1_name",
        label: "Fighter 1",
        sortable: true,
        render: (row) => row.P1?.name ?? row.p1Uuid,
    },
    {
        id: "P2_name",
        label: "Fighter 2",
        sortable: true,
        render: (row) => row.P2?.name ?? row.p2Uuid,
    },
    {
        id: "matches",
        label: "Matches",
        // Sortable on fighters but not on matchups: the API's matchup sort
        // allowlist covers only the two names and the timestamps.
        sortable: false,
        numeric: true,
        render: (row) => formatInteger(row.matches),
    },
    {
        id: "p1Wins",
        label: "Fighter 1 wins",
        sortable: false,
        numeric: true,
        render: (row) => formatInteger(row.p1Wins),
    },
    {
        id: "p2Wins",
        label: "Fighter 2 wins",
        sortable: false,
        numeric: true,
        render: (row) => formatInteger(row.p2Wins),
    },
    {
        id: "updatedAt",
        label: "Last met",
        sortable: true,
        render: (row) => formatDateTime(row.updatedAt),
    },
];

export function MatchupsPage() {
    const listParams = useListParams({ defaultSort: "-updatedAt" });
    const query = useQuery(matchupsQuery(listParams.params));

    return (
        <Page
            title="Matchups"
            subtitle="Head-to-head records for every pair of fighters that has met."
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
                            emptyMessage="No matchups recorded yet."
                        />
                    )}
                </QueryState>
            </Card>
        </Page>
    );
}
