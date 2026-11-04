// Seeded meal_slot times; replace with the slots API once it exists

export interface MealTime {
    startsAt: string;   // 'HH:MM'
    endsAt: string;     // 'HH:MM'
}

export const MEAL_TIMES: MealTime[] = [
    { startsAt: "12:00", endsAt: "13:30" },
    { startsAt: "13:30", endsAt: "15:00" },
    { startsAt: "19:30", endsAt: "21:00" }
];

export const BOOKING_DAYS_AHEAD = 7;

export const BOOKING_NOTICE_HOURS = 2;

export function bookableDays(now: Date = new Date()): string[] {
    return Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);

        // en-CA gives YYYY-MM-DD
        return day.toLocaleDateString("en-CA");
    });
}

export function isBookable(day: string, startsAt: string, now: Date = new Date()): boolean {
    const start = new Date(`${day}T${startsAt}`);

    return start.getTime() - now.getTime() >= BOOKING_NOTICE_HOURS * 60 * 60 * 1000;
}

export function formatDay(day: string): string {
    return new Date(`${day}T00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

export function formatMealTime(meal: MealTime): string {
    return `${meal.startsAt} – ${meal.endsAt}`;
}
