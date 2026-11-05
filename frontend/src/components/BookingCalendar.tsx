import { useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface BookingCalendarProps {
    availableDays: string[];    // 'YYYY-MM-DD', the only days that can be chosen
    selected: string;
    onSelect: (day: string) => void;
}

// Local date as 'YYYY-MM-DD'
function toDay(date: Date): string {
    return date.toLocaleDateString("en-CA");
}

// First day of the month of a 'YYYY-MM-DD' day
function monthOf(day: string): Date {
    const [year, month] = day.split("-").map(Number);

    return new Date(year, month - 1, 1);
}

function BookingCalendar({ availableDays, selected, onSelect }: BookingCalendarProps) {
    const today = toDay(new Date());

    // Until the user navigates, show the month of the selected or first available day
    const [shownMonth, setShownMonth] = useState<Date | null>(null);
    const month = shownMonth ?? monthOf(selected || availableDays[0] || today);

    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Monday-first offset of the 1st of the month
    const offset = (month.getDay() + 6) % 7;

    const canGoBack = month > monthOf(today);
    const available = new Set(availableDays);

    function changeMonth(step: number) {
        setShownMonth(new Date(year, monthIndex + step, 1));
    }

    return (
        <div className="calendar">
            <div className="calendar-header">
                <button
                    type="button"
                    className="calendar-nav"
                    onClick={() => changeMonth(-1)}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <span className="calendar-title" aria-live="polite">
                    {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </span>
                <button
                    type="button"
                    className="calendar-nav"
                    onClick={() => changeMonth(1)}
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>

            <div className="calendar-grid">
                {WEEKDAYS.map((w) => (
                    <span key={w} className="calendar-weekday">{w}</span>
                ))}

                {Array.from({ length: offset }, (_, i) => (
                    <span key={`blank-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(year, monthIndex, i + 1);
                    const day = toDay(date);
                    const isAvailable = available.has(day);

                    const classes = ["calendar-day"];
                    if (day === selected) classes.push("selected");
                    if (day === today) classes.push("today");

                    return (
                        <button
                            key={day}
                            type="button"
                            className={classes.join(" ")}
                            onClick={() => onSelect(day)}
                            disabled={!isAvailable}
                            aria-pressed={day === selected}
                            aria-label={date.toLocaleDateString("en-GB", {
                                weekday: "long",
                                day: "numeric",
                                month: "long"
                            }) + (isAvailable ? "" : ", unavailable")}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default BookingCalendar;
