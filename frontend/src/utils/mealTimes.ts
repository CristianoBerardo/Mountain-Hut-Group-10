/**
 * Dates and meal times offered by the booking page (MH-01).
 *
 * Staging has no endpoint exposing the meal slots yet, so the times below are
 * the ones seeded in meal_slot on staging. Replace them with the slots API
 * once it exists.
 */

export interface MealTime {
    startsAt: string;   // 'HH:MM'
    endsAt: string;     // 'HH:MM'
}

export const MEAL_TIMES: MealTime[] = [
    { startsAt: "12:00", endsAt: "13:30" },
    { startsAt: "13:30", endsAt: "15:00" },
    { startsAt: "19:30", endsAt: "21:00" }
];

/** Number of days, starting today, that can be booked. */
export const BOOKING_DAYS_AHEAD = 7;

/** A hiker can book up to this many hours before the meal starts. */
export const BOOKING_NOTICE_HOURS = 2;

/**
 * @returns The bookable days as 'YYYY-MM-DD' (local time), starting today.
 */
export function bookableDays(now: Date = new Date()): string[] {
    return Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);

        // en-CA formats the local date as YYYY-MM-DD
        return day.toLocaleDateString("en-CA");
    });
}

/**
 * @returns Whether a meal still accepts bookings, i.e. starts at least
 * BOOKING_NOTICE_HOURS from now.
 */
export function isBookable(day: string, startsAt: string, now: Date = new Date()): boolean {
    const start = new Date(`${day}T${startsAt}`);

    return start.getTime() - now.getTime() >= BOOKING_NOTICE_HOURS * 60 * 60 * 1000;
}

/**
 * @returns The day in a readable form, e.g. "Wednesday 4 November 2026".
 */
export function formatDay(day: string): string {
    return new Date(`${day}T00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

/**
 * @returns The time range, e.g. "12:00 – 13:30".
 */
export function formatMealTime(meal: MealTime): string {
    return `${meal.startsAt} – ${meal.endsAt}`;
}
