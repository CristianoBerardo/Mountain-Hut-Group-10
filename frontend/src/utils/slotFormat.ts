import type { AvailableSlotDTO } from "../dto/SlotDTO";

// ---------- Slot management (MH-02) ----------

/** 'HH:MM:SS' | 'HH:MM' -> 'HH:MM' */
export function formatTime(time: string): string {
    return time.slice(0, 5);
}

/** Normalises a backend date ('YYYY-MM-DD' or ISO timestamp) to 'YYYY-MM-DD'. */
export function toDateKey(date: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return localKey(new Date(date));
}

/** 'YYYY-MM-DD' -> e.g. 'Tue 10 Nov 2026' */
export function formatDate(dateKey: string): string {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function localKey(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
}

// ---------- Booking (MH-01) ----------

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
