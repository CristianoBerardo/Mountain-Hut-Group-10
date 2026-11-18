import { useState, type FormEvent } from "react";
import { checkTableAvailability } from "../api/slotAPI";
import Navbar from "../components/Navbar";
import type { CheckAvailabilityResponseDTO } from "../dto/SlotDTO";
import "../App.css";
import "../styles/BookTable.css";
import "../styles/CheckAvailability.css";

function CheckAvailability() {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [partySize, setPartySize] = useState("");
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<CheckAvailabilityResponseDTO | null>(null);

    function clearResult() {
        setError("");
        setResult(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearResult();

        const parsedPartySize = Number(partySize);
        if (!Number.isSafeInteger(parsedPartySize) || parsedPartySize < 1) {
            setError("Enter a valid party size.");
            return;
        }

        setChecking(true);
        try {
            const availability = await checkTableAvailability({
                date,
                time,
                party_size: parsedPartySize,
            });
            setResult(availability);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not check availability. Please try again.",
            );
        } finally {
            setChecking(false);
        }
    }

    return (
        <div className="book-table-page">
            <Navbar />
            <main className="client-booking">
                <section className="client-card" aria-labelledby="availability-title">
                    <h1 id="availability-title">Check table availability</h1>
                    <p className="client-lead">
                        Choose a date, meal start time and party size to see whether we can seat your group.
                    </p>

                    <form
                        className="availability-form"
                        onSubmit={handleSubmit}
                        aria-busy={checking}
                    >
                        <label className="client-field">
                            <span>Date</span>
                            <input
                                type="date"
                                value={date}
                                disabled={checking}
                                onChange={(event) => {
                                    setDate(event.target.value);
                                    clearResult();
                                }}
                                required
                            />
                        </label>

                        <label className="client-field">
                            <span>Meal start time</span>
                            <input
                                type="time"
                                value={time}
                                disabled={checking}
                                onChange={(event) => {
                                    setTime(event.target.value);
                                    clearResult();
                                }}
                                required
                            />
                        </label>

                        <label className="client-field">
                            <span>Number of people</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                step={1}
                                placeholder="e.g. 4"
                                value={partySize}
                                disabled={checking}
                                onChange={(event) => {
                                    setPartySize(event.target.value);
                                    clearResult();
                                }}
                                required
                            />
                        </label>

                        {error && (
                            <p className="client-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="client-button"
                            disabled={checking}
                        >
                            {checking ? "Checking…" : "Check availability"}
                        </button>
                    </form>

                    {result && (
                        <section
                            className="availability-result"
                            aria-live="polite"
                            aria-labelledby="availability-result-title"
                        >
                            <h2 id="availability-result-title">
                                {result.available ? "Availability confirmed" : "Not available"}
                            </h2>

                            {result.slot_id === null && result.available_times.length === 0 ? (
                                <p>
                                    No meal service is scheduled for this date and time.
                                </p>
                            ) : result.slot_id === null ? (
                                <>
                                    <p>
                                        No meal slot starts at {result.time}. Available start times
                                        on this date are:
                                    </p>
                                    <ul>
                                        {result.available_times.map((availableTime) => (
                                            <li key={availableTime}>{availableTime}</li>
                                        ))}
                                    </ul>
                                </>
                            ) : result.available ? (
                                <>
                                    <p>
                                        Your party can be seated. {result.available_seats}{" "}
                                        {result.available_seats === 1 ? "seat is" : "seats are"} free.
                                    </p>
                                    <h3>Seating plan</h3>
                                    <ul>
                                        {result.tables.map((table) => (
                                            <li key={table.table_id}>
                                                Table {table.table_number}: {table.seats_assigned}{" "}
                                                {table.seats_assigned === 1 ? "seat" : "seats"}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p>
                                    {result.available_seats === 0
                                        ? "There are no free seats for this meal."
                                        : `Only ${result.available_seats} ${
                                              result.available_seats === 1 ? "seat is" : "seats are"
                                          } free, but your party needs ${result.party_size}.`}
                                </p>
                            )}
                        </section>
                    )}
                </section>
            </main>
        </div>
    );
}

export default CheckAvailability;
