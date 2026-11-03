export function isValidDateString(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

export function isValidTimeString(timeStr: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(timeStr);
}

export function timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const s = parts[2] ?? 0;
    return h * 3600 + m * 60 + s;
}

export function validateFlexibleTimes(startsAt: string, endsAt: string): void {
    if (!isValidTimeString(startsAt) || !isValidTimeString(endsAt)) {
        throw new Error("INVALID_TIME_FORMAT");
    }
    if (timeToSeconds(startsAt) >= timeToSeconds(endsAt)) {
        throw new Error("START_TIME_MUST_BE_BEFORE_END_TIME");
    }
}