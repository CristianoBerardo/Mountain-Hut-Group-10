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
