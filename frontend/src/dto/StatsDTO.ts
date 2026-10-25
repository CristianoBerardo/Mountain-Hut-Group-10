export type AggregationType = "day" | "week" | "month";

export interface StatsDTO {
    service_type: string;
    ticket_created: number;
    ticket_served: number;
    avg_elapsed_time: number | null;
}