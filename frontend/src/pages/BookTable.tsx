import { useEffect, useState } from "react";

import { getTables, updateTable } from "../api/tableAPI";
import "../App.css";
import Navbar from "../components/Navbar";
import type { TableDTO } from "../dto/TableDTO";
import {
    BOOKING_NOTICE_HOURS,
    bookableDays,
    formatDay,
    formatMealTime,
    isBookable,
    MEAL_TIMES,
    type MealTime
} from "../utils/mealTimes";
import {
    assignTablesToParty,
    type TableAssignment,
    type TableFreeSeats
} from "../utils/tableAssignment";

const SESSION_BOOKINGS_KEY = "test_bookings";

interface Booking {
    day: string;
    meal: MealTime;
    partySize: number;
    tables: TableAssignment[];
}

function bookingKey(day: string, meal: MealTime): string {
    return `${day} ${meal.startsAt}`;
}

// No reservation API yet: one booking per slot is tracked per browser session
function getSessionBookings(): string[] {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_BOOKINGS_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function addSessionBooking(key: string) {
    sessionStorage.setItem(SESSION_BOOKINGS_KEY, JSON.stringify([...getSessionBookings(), key]));
}

function toFreeSeats(tables: TableDTO[]): TableFreeSeats[] {
    return tables
        .filter((t) => t.is_active)
        .map((t) => ({
            tableId: t.id,
            tableNumber: t.table_number,
            freeSeats: t.capacity - t.occupancy
        }));
}

function describeSeats(tables: TableAssignment[]): string {
    return tables
        .map((t) => `table ${t.tableNumber} (${t.seatsAssigned} ${t.seatsAssigned === 1 ? "seat" : "seats"})`)
        .join(", ");
}

function people(count: number): string {
    return `${count} ${count === 1 ? "person" : "people"}`;
}

// MH-01: a booking adds the assigned seats to each table's occupancy
function BookTable() {
    const [tables, setTables] = useState<TableDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [day, setDay] = useState("");
    const [mealStart, setMealStart] = useState("");
    const [partySize, setPartySize] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [bookedKeys, setBookedKeys] = useState<string[]>(getSessionBookings);

    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;

        async function loadTables() {
            try {
                const result = await getTables({ active: true });

                if (active) {
                    setTables(result);
                    setLoadError("");
                }
            } catch {
                if (active) {
                    setLoadError("Booking is not available right now. Please try again later.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadTables();

        return () => {
            active = false;
        };
    }, [reloadKey]);

    const days = bookableDays();
    const meal = MEAL_TIMES.find((m) => m.startsAt === mealStart);
    const freeSeats = toFreeSeats(tables).reduce((sum, t) => sum + t.freeSeats, 0);
    const size = Number(partySize);
    const validSize = Number.isInteger(size) && size > 0;
    const tooMany = validSize && !loading && size > freeSeats;

    function unavailableReason(m: MealTime): string | null {
        if (!isBookable(day, m.startsAt)) {
            return "booking closed";
        }

        if (bookedKeys.includes(bookingKey(day, m))) {
            return "already booked";
        }

        if (!loading && freeSeats === 0) {
            return "full";
        }

        return null;
    }

    function chooseDay(value: string) {
        setDay(value);
        setMealStart("");
        setError("");
    }

    function startNewBooking() {
        setBooking(null);
        setDay("");
        setMealStart("");
        setPartySize("");
        setError("");
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        // Mandatory fields: date, time, number of people
        if (!day || !meal) {
            setError("Please choose a date and a time.");
            return;
        }

        if (!validSize) {
            setError("Please enter how many people are in your party.");
            return;
        }

        // Re-checked: time may have passed since the page loaded
        if (!isBookable(day, meal.startsAt)) {
            setError(`Bookings close ${BOOKING_NOTICE_HOURS} hours before the meal. Please choose a later time.`);
            return;
        }

        if (bookedKeys.includes(bookingKey(day, meal))) {
            setError("You already have a booking for this date and time.");
            return;
        }

        setSubmitting(true);

        // Rolled back if a later update fails
        const applied: TableDTO[] = [];

        try {
            const latest = await getTables({ active: true });
            const assignment = assignTablesToParty(size, toFreeSeats(latest));

            if (!assignment) {
                const latestFree = toFreeSeats(latest).reduce((sum, t) => sum + t.freeSeats, 0);

                setTables(latest);
                setError(latestFree === 0
                    ? "Sorry, there are no free seats left."
                    : `Sorry, only ${latestFree} seats are free. Please reduce the number of people.`);
                return;
            }

            for (const seat of assignment) {
                const table = latest.find((t) => t.id === seat.tableId)!;

                await updateTable(table.id, {
                    table_number: table.table_number,
                    capacity: table.capacity,
                    occupancy: table.occupancy + seat.seatsAssigned,
                    is_active: table.is_active
                });

                applied.push(table);
            }

            const key = bookingKey(day, meal);

            addSessionBooking(key);
            setBookedKeys((keys) => [...keys, key]);
            setBooking({ day, meal, partySize: size, tables: assignment });
            setReloadKey((k) => k + 1);
        } catch {
            await Promise.allSettled(applied.map((table) =>
                updateTable(table.id, {
                    table_number: table.table_number,
                    capacity: table.capacity,
                    occupancy: table.occupancy,
                    is_active: table.is_active
                })
            ));

            setError("Sorry, your booking could not be completed. Please try again.");
            setReloadKey((k) => k + 1);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <Navbar />
            <main className="client-booking">
                {booking ? (
                    <section className="client-card" aria-live="polite">
                        <h1>Your table is booked</h1>
                        <p className="client-lead">We look forward to seeing you at the hut.</p>

                        <dl className="client-summary">
                            <div>
                                <dt>Date</dt>
                                <dd>{formatDay(booking.day)}</dd>
                            </div>
                            <div>
                                <dt>Time</dt>
                                <dd>{formatMealTime(booking.meal)}</dd>
                            </div>
                            <div>
                                <dt>Party</dt>
                                <dd>{people(booking.partySize)}</dd>
                            </div>
                            <div>
                                <dt>Seats</dt>
                                <dd>{describeSeats(booking.tables)}</dd>
                            </div>
                        </dl>

                        <button type="button" className="client-button" onClick={startNewBooking}>
                            Make another booking
                        </button>
                    </section>

                ) : (
                    <form className="client-card" onSubmit={handleSubmit} noValidate>
                        <h1>Book a table</h1>
                        <p className="client-lead">Reserve a place for your party at the hut's meal service.</p>

                        {loadError && <p className="client-error" role="alert">{loadError}</p>}

                        <label className="client-field">
                            <span>Date</span>
                            <select value={day} onChange={(e) => chooseDay(e.target.value)} required>
                                <option value="">Choose a date</option>
                                {days.map((d) => (
                                    <option key={d} value={d}>{formatDay(d)}</option>
                                ))}
                            </select>
                        </label>

                        <label className="client-field">
                            <span>Time</span>
                            <select
                                value={mealStart}
                                onChange={(e) => {
                                    setMealStart(e.target.value);
                                    setError("");
                                }}
                                disabled={!day}
                                required
                            >
                                <option value="">{day ? "Choose a time" : "Choose a date first"}</option>
                                {day && MEAL_TIMES.map((m) => {
                                    const reason = unavailableReason(m);

                                    return (
                                        <option key={m.startsAt} value={m.startsAt} disabled={reason !== null}>
                                            {formatMealTime(m)}{reason ? ` (${reason})` : ""}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        <label className="client-field">
                            <span>Number of people</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={freeSeats || undefined}
                                placeholder="e.g. 4"
                                value={partySize}
                                onChange={(e) => {
                                    setPartySize(e.target.value);
                                    setError("");
                                }}
                                required
                            />
                            {!loading && !loadError && (
                                <small className={tooMany ? "client-hint warning" : "client-hint"}>
                                    {freeSeats === 0
                                        ? "No seats are free at the moment."
                                        : `${freeSeats} seats free.`}
                                </small>
                            )}
                        </label>

                        {error && <p className="client-error" role="alert">{error}</p>}

                        <button
                            type="submit"
                            className="client-button"
                            disabled={submitting || loading || !!loadError || tooMany}
                        >
                            {submitting ? "Booking…" : "Book table"}
                        </button>

                        <p className="client-note">
                            Bookings close {BOOKING_NOTICE_HOURS} hours before the meal. Tables are shared
                            with other guests; we keep your party together whenever possible.
                        </p>
                    </form>
                )}
            </main>
        </>
    );
}

export default BookTable;
