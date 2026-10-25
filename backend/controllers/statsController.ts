import type { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";

export async function getStats(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const aggregation = req.query.aggregation ?? "day";

        // We can only have aggregations of day, week, or month. If the user provides an invalid aggregation, we return a 400 Bad Request error.
        if (
            aggregation !== "day" &&
            aggregation !== "week" &&
            aggregation !== "month"
        ) {
            res.status(400).json({
                error: "Invalid aggregation"
            });
            return;
        }

        // DAY: Today
        // WEEK: Last 7 days
        // MONTH: Last 30 days
        // AGGREGATION BY SERVICE TYPE: We group the results by service type and count the number of tickets for each service type.
        // We also calculate the average elapsed time for each service type.
        const result = await pool.query(
            `
            SELECT
                service_type,

                COUNT(*)::int AS ticket_created,

                COUNT(*)FILTER (
                    WHERE expiration_date IS NOT NULL
                )::int AS ticket_served,

                ROUND(
                    AVG(
                        EXTRACT(
                            EPOCH FROM (expiration_date - creation_date)
                        )
                    )
                )::int AS avg_elapsed_time

            FROM ticket

            WHERE
                (
                    $1::text = 'day'
                    AND creation_date >= CURRENT_DATE
                    AND creation_date < CURRENT_DATE + INTERVAL '1 day'
                )
                OR
                (
                    $1::text = 'week'
                    AND creation_date >= CURRENT_DATE - INTERVAL '6 days'
                    AND creation_date < CURRENT_DATE + INTERVAL '1 day'
                )
                OR
                (
                    $1::text = 'month'
                    AND creation_date >= NOW() - INTERVAL '1 month'
                    AND creation_date <= NOW()
                )

            GROUP BY service_type
            ORDER BY service_type ASC
            `,
            [aggregation]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Error retrieving statistics:", error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
}