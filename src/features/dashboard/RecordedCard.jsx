import { StatCard } from "../../components/StatCard";
import { formatInteger } from "../../utils/format";
import { predictionsQuery } from "../../api/predictions";
import { useQuery } from "@tanstack/react-query";

/**
 * How many matches the listener has recorded in total.
 *
 * Reads `count` off a one-row page rather than fetching the log: findAndCountAll
 * returns the full count regardless of the limit, so `limit: 1` is the cheapest
 * way to ask "how many are there?".
 */
export function RecordedCard() {
    const query = useQuery(predictionsQuery({ limit: 1 }));

    const value = query.isError
        ? "Unavailable"
        : query.data
          ? formatInteger(query.data.count)
          : "…";

    return (
        <StatCard
            label="Matches recorded"
            value={value}
            caption={
                query.isError
                    ? query.error.message
                    : "Every match the listener has logged a prediction for."
            }
            hint="Exhibition matches are never recorded, and tournaments only when strict mode is off."
        />
    );
}
