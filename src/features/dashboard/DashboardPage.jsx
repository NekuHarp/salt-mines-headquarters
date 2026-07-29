import { BalanceCard } from "./BalanceCard";
import { Grid } from "@mui/material";
import { ListenerCard } from "./ListenerCard";
import { MatchCard } from "./MatchCard";
import Page from "../../components/Page";
import { RecordedCard } from "./RecordedCard";

/**
 * Monitoring view: what is happening right now, and the controls for the process
 * driving it.
 */
export function DashboardPage() {
    return (
        <Page
            title="Live"
            subtitle="The current Salty Bet match and the state of the recording listener."
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <BalanceCard />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <RecordedCard />
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }}>
                    <MatchCard />
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <ListenerCard />
                </Grid>
            </Grid>
        </Page>
    );
}
