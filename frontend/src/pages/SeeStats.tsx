import { useEffect, useState } from "react";

import type {
    AggregationType,
    StatsDTO,
} from "../dto/StatsDTO";

import { getStats } from "../api/statsAPI";
import "../App.css";
import Navbar from "../components/Navbar";

/**
 * Formats seconds into minutes and seconds.
 */
function formatElapsedTime(seconds: number): string {
    const totalSeconds = Math.round(seconds);

    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getPeriodLabel(aggregation: AggregationType): string {
    switch (aggregation) {
        case "day":
            return "Today";

        case "week":
            return "Last 7 days";

        case "month":
            return "Last month";
    }
}

function getDateRange(days: number): string {
    const today = new Date();
    const startDate = new Date(today);

    startDate.setDate(today.getDate() - days);

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString("en-GB");
    };

    return `${formatDate(startDate)} - ${formatDate(today)}`;
}

function Stats() {
    const [aggregation, setAggregation] =
        useState<AggregationType>("day");
    
    const [stats, setStats] = useState<StatsDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadStats() {
            setLoading(true);
            setError("");

            try {
                const data = await getStats(aggregation);

                if (active) {
                    setStats(data);
                }

            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load statistics"
                    );
                }

            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadStats();

        return () => {
            active = false;
        };

    }, [aggregation]);

    return (
        <>
            <Navbar />
            <div>

                <main className="stats-container">
                    <h1>Ticket Statistics</h1>

                    <p>
                        View ticket statistics aggregated by day, week or month.
                    </p>

                    {/* Aggregation selector */}
                    <div className="stats-controls">
                        <label htmlFor="aggregation">
                            Aggregate by:
                        </label>

                        <select
                            id="aggregation"
                            value={aggregation}
                            onChange={(event) =>
                                setAggregation(
                                    event.target.value as AggregationType
                                )
                            }
                        >
                            <option value="day">Day</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                        </select>
                    </div>

                    {/* Statistics table */}
                    <div className="stats-table-wrapper">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Service Type</th>
                                    <th>Tickets Created</th>
                                    <th>Tickets Served</th>
                                    <th>Avg Elapsed Time</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5}>
                                            Loading statistics...
                                        </td>
                                    </tr>

                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} role="alert">
                                            {error}
                                        </td>
                                    </tr>

                                ) : stats.length === 0 ? (
                                    <tr>
                                            <td colSpan={5}>
                                            No statistics available.
                                        </td>
                                    </tr>

                                ) : (
                                    stats.map((stat) => (
                                        <tr key={stat.service_type}>

                                            <td>
                                                {getPeriodLabel(aggregation)}
                                            </td>

                                            <td>
                                                {stat.service_type}
                                            </td>

                                            <td>
                                                {stat.ticket_created}
                                            </td>

                                            <td>
                                                {stat.ticket_served}
                                            </td>

                                            <td>
                                                {stat.avg_elapsed_time === null
                                                    ? "N/A"
                                                    : formatElapsedTime(
                                                        stat.avg_elapsed_time
                                                    )}
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <p className="stats-note">
                        {aggregation === "day" &&
                            `Showing daily statistics (${new Date().toLocaleDateString("en-GB")}).`}

                        {aggregation === "week" &&
                            `Showing weekly statistics (${getDateRange(7)}).`}

                        {aggregation === "month" &&
                            `Showing monthly statistics (${getDateRange(30)}).`}
                    </p>

                    <p className="stats-note">
                        Currently displaying sample data.
                    </p>
                </main>
            </div>
        </>
    );
}

export default Stats;