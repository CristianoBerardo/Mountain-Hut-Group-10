import { useEffect, useRef, useState } from "react";

import { createReservation } from "../api/reservationAPI";
import { getAvailableSlots } from "../api/slotAPI";
import "../App.css";
import BookingCalendar from "../components/BookingCalendar";
import Navbar from "../components/Navbar";
import type { AssignedTableDTO } from "../dto/ReservationDTO";
import type { AvailableSlotDTO } from "../dto/SlotDTO";
import "../styles/BookTable.css";
import {
  BOOKING_NOTICE_HOURS,
  formatDay,
  formatTimeRange,
  isBookable,
} from "../utils/slotFormat";

interface Booking {
  slot: AvailableSlotDTO;
  partySize: number;
  tables: AssignedTableDTO[];
}

// Total seats assigned across all tables, e.g. "3 seats"
function describeSeats(tables: AssignedTableDTO[]): string {
  const seats = tables.reduce((sum, t) => sum + t.seats_assigned, 0);
  return `${seats} ${seats === 1 ? "seat" : "seats"}`;
}

function people(count: number): string {
  return `${count} ${count === 1 ? "person" : "people"}`;
}

// Backend error message (requestJSON throws ApiError with the server's text)
function serverMessage(err: unknown): string {
  return err instanceof Error
    ? err.message
    : "Sorry, your booking could not be completed. Please try again.";
}

// MH-01: the hiker picks an available slot and a party size; the backend assigns the tables
function BookTable() {
  const [slots, setSlots] = useState<AvailableSlotDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [day, setDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [partySize, setPartySize] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [confirmation, setConfirmation] = useState<{
    slot: AvailableSlotDTO;
    partySize: number;
  } | null>(null);
  const confirmationDialogRef = useRef<HTMLDialogElement>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const dialog = confirmationDialogRef.current;
    if (!dialog) return;

    if (confirmation && !dialog.open) dialog.showModal();
    if (!confirmation && dialog.open) dialog.close();
  }, [confirmation]);

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      try {
        const result = await getAvailableSlots();

        if (active) {
          setSlots(result);
          setLoadError("");

          const saved = sessionStorage.getItem("tableAvailabilitySearch");
          if (!saved) return;

          // Consume the saved selection once, after the slot list has loaded.
          sessionStorage.removeItem("tableAvailabilitySearch");

          try {
            const pending = JSON.parse(saved);

            if (
              typeof pending?.slot_id !== "string" ||
              !Number.isSafeInteger(pending?.party_size) ||
              pending.party_size <= 0 ||
              !Number.isFinite(pending?.expires_at) ||
              Date.now() >= pending.expires_at
            ) {
              setError("Your saved selection has expired or is invalid.");
              return;
            }

            const selectedSlot = result.find(
              (slot) => slot.slot_id === pending.slot_id,
            );

            if (
              !selectedSlot ||
              !isBookable(selectedSlot) ||
              selectedSlot.available_seats <= 0
            ) {
              setError("The selected meal is no longer available.");
              return;
            }

            setDay(selectedSlot.date);
            setSlotId(selectedSlot.slot_id);
            setPartySize(String(pending.party_size));
          } catch {
            setError("Could not restore your saved selection.");
          }
        }
      } catch {
        if (active) {
          setLoadError(
            "Booking is not available right now. Please try again later.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSlots();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Only dates that still have a bookable slot with free seats
  const bookableSlots = slots.filter(
    (s) => isBookable(s) && s.available_seats > 0,
  );
  const days = [...new Set(bookableSlots.map((s) => s.date))];
  const daySlots = slots.filter((s) => s.date === day);
  const slot = slots.find((s) => s.slot_id === slotId);

  const size = Number(partySize);
  const validSize = Number.isInteger(size) && size > 0;
  const tooMany = !!slot && validSize && size > slot.available_seats;

  function unavailableReason(s: AvailableSlotDTO): string | null {
    if (!isBookable(s)) {
      return "booking closed";
    }

    if (s.available_seats === 0) {
      return "full";
    }

    return null;
  }

  function chooseDay(value: string) {
    setDay(value);
    setSlotId("");
    setError("");
  }

  function startNewBooking() {
    setBooking(null);
    setDay("");
    setSlotId("");
    setPartySize("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Mandatory fields: date, time, number of people
    if (!day || !slot) {
      setError("Please choose a date and a time.");
      return;
    }

    if (!validSize) {
      setError("Please enter how many people are in your party.");
      return;
    }

    // Re-checked: time may have passed since the page loaded
    if (!isBookable(slot)) {
      setError(
        `Bookings close ${BOOKING_NOTICE_HOURS} hours before the meal. Please choose a later time.`,
      );
      return;
    }

    if (tooMany) {
      setError(
        `Sorry, only ${slot.available_seats} seats are free. Please reduce the number of people.`,
      );
      return;
    }

    // Set at login: the reservation belongs to the logged-in user
    const hikerId = sessionStorage.getItem("user_id");
    if (!hikerId) {
      setError(
        "Your session is missing your account details. Please log out and log in again.",
      );
      return;
    }

    setConfirmation({ slot, partySize: size });
  }

  async function confirmBooking() {
    if (!confirmation || submitting) return;

    const hikerId = sessionStorage.getItem("user_id");
    if (!hikerId) {
      setConfirmation(null);
      setError(
        "Your session is missing your account details. Please log out and log in again.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createReservation({
        hiker_id: hikerId,
        slot_id: confirmation.slot.slot_id,
        party_size: confirmation.partySize,
      });

      sessionStorage.removeItem("tableAvailabilitySearch");
      setBooking({ ...confirmation, tables: result.tables });
      setConfirmation(null);
    } catch (err) {
      setConfirmation(null);
      setError(serverMessage(err));
    } finally {
      setSubmitting(false);
      setReloadKey((k) => k + 1);
    }
  }

  return (
    <div className="book-table-page">
      <Navbar />
      <main className="client-booking">
        {booking ? (
          <section className="client-card" aria-live="polite">
            <h1>Your table is booked</h1>
            <p className="client-lead">
              We look forward to seeing you at the hut.
            </p>

            <dl className="client-summary">
              <div>
                <dt>Date</dt>
                <dd>{formatDay(booking.slot.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{formatTimeRange(booking.slot)}</dd>
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

            <button
              type="button"
              className="client-button"
              onClick={startNewBooking}
            >
              Make another booking
            </button>
          </section>
        ) : (
          <form className="client-card" onSubmit={handleSubmit} noValidate>
            <h1>Book a table</h1>
            <p className="client-lead">
              Reserve a place for your party at the hut's meal service.
            </p>

            {loadError && (
              <p className="client-error" role="alert">
                {loadError}
              </p>
            )}

            {!loading && !loadError && days.length === 0 && (
              <p className="client-error" role="alert">
                There are no meals open for booking at the moment.
              </p>
            )}

            <div className="client-field">
              <span>Date</span>
              <BookingCalendar
                availableDays={days}
                selected={day}
                onSelect={chooseDay}
              />
              <small className="client-hint">
                {loading
                  ? "Loading available dates…"
                  : day
                    ? formatDay(day)
                    : "Choose one of the highlighted dates."}
              </small>
            </div>

            <label className="client-field">
              <span>Time</span>
              <select
                value={slotId}
                onChange={(e) => {
                  setSlotId(e.target.value);
                  setError("");
                }}
                disabled={!day}
                required
              >
                <option value="">
                  {day ? "Choose a time" : "Choose a date first"}
                </option>
                {daySlots.map((s) => {
                  const reason = unavailableReason(s);

                  return (
                    <option
                      key={s.slot_id}
                      value={s.slot_id}
                      disabled={reason !== null}
                    >
                      {formatTimeRange(s)}
                      {reason ? ` (${reason})` : ""}
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
                max={slot?.available_seats}
                placeholder="e.g. 4"
                value={partySize}
                onChange={(e) => {
                  setPartySize(e.target.value);
                  setError("");
                }}
                required
              />
              {slot && (
                <small
                  className={tooMany ? "client-hint warning" : "client-hint"}
                >
                  {slot.available_seats} seats free at this time.
                </small>
              )}
            </label>

            {error && (
              <p className="client-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="client-button"
              disabled={submitting || loading || !!loadError || tooMany}
            >
              {submitting ? "Booking…" : "Book table"}
            </button>

            <p className="client-note">
              Bookings close {BOOKING_NOTICE_HOURS} hours before the meal.
              Tables are shared with other guests; we keep your party together
              whenever possible.
            </p>
          </form>
        )}
      </main>
      <dialog
        ref={confirmationDialogRef}
        className="client-confirm-dialog"
        aria-labelledby="booking-confirmation-title"
        aria-describedby="booking-confirmation-message"
        onClose={() => setConfirmation(null)}
        onCancel={(event) => {
          if (submitting) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !submitting) {
            setConfirmation(null);
          }
        }}
      >
        {confirmation && (
          <div className="client-confirm-content">
            <h2 id="booking-confirmation-title">Confirm your booking</h2>
            <p id="booking-confirmation-message">
              {people(confirmation.partySize)}
            </p>
            <p>
              {formatDay(confirmation.slot.date)}
            </p>
            <p>
              {formatTimeRange(confirmation.slot)}
            </p>
            <div className="client-confirm-actions">
              <button
                type="button"
                className="client-confirm-cancel"
                onClick={() => setConfirmation(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="client-button"
                onClick={confirmBooking}
                disabled={submitting}
              >
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

export default BookTable;
