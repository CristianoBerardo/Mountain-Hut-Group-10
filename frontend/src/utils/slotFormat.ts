import type { AvailableSlotDTO } from "../dto/SlotDTO";

// A hiker can book up to this many hours before the meal starts
export const BOOKING_NOTICE_HOURS = 2;

export function slotStart(slot: AvailableSlotDTO): Date {
    return new Date(`${slot.date}T${slot.starts_at.slice(0, 5)}`);
}

export function isBookable(slot: AvailableSlotDTO, now: Date = new Date()): boolean {
    return slotStart(slot).getTime() - now.getTime() >= BOOKING_NOTICE_HOURS * 60 * 60 * 1000;
}

export function formatDay(day: string): string {
    return new Date(`${day}T00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

export function formatTimeRange(slot: AvailableSlotDTO): string {
    return `${slot.starts_at.slice(0, 5)} – ${slot.ends_at.slice(0, 5)}`;
}
