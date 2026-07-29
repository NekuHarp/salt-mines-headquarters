import { IconButton, Tooltip } from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import { StatCard } from "../../components/StatCard";
import { balanceQuery } from "../../api/state";
import { formatCompact } from "../../utils/format";
import { useQuery } from "@tanstack/react-query";

/**
 * Salty Bet account balance.
 *
 * Every read scrapes the Salty Bet site through the API rather than hitting the
 * local database, so this polls slowly and offers a manual refresh instead.
 */
export function BalanceCard() {
    const query = useQuery(balanceQuery());

    const value = query.isError
        ? "Unavailable"
        : query.data
          ? formatCompact(query.data.balance)
          : "…";

    return (
        <StatCard
            label="Account balance"
            value={value}
            caption={
                query.isError
                    ? query.error.message
                    : "Read from Salty Bet every 30 seconds."
            }
            hint="Scraped from the Salty Bet account page, signing in first if there is no session."
            action={
                <Tooltip title="Refresh now">
                    <IconButton
                        size="small"
                        onClick={() => query.refetch()}
                        disabled={query.isFetching}
                        aria-label="Refresh balance"
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            }
        />
    );
}
