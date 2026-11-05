import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { addTableToSlot, deleteSlot, removeTableFromSlot } from "../../api/slotAPI";
import type { MealSlotDetailsDTO } from "../../dto/SlotDTO";
import type { DiningTableDTO } from "../../dto/TableDTO";
import { formatDate, formatTime, toDateKey } from "../../utils/slotFormat";

interface SlotDetailsProps {
    details: MealSlotDetailsDTO;
    tables: DiningTableDTO[];
    /** Reload this slot (and the list) after a change. */
    onChanged: () => Promise<void>;
    onDeleted: () => void;
}

function SlotDetails({ details, tables, onChanged, onDeleted }: SlotDetailsProps) {
    const { slot, tables: slotTables } = details;

    const [toAdd, setToAdd] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const assignedIds = new Set(slotTables.map((t) => t.id));
    const addable = tables
        .filter((t) => !assignedIds.has(t.id))
        .sort((a, b) => a.table_number - b.table_number);

    async function run(action: () => Promise<unknown>) {
        setBusy(true);
        setError("");
        try {
            await action();
            await onChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setBusy(false);
        }
    }

    // DELETE /slots/:id
    async function handleDelete() {
        setBusy(true);
        setError("");
        try {
            await deleteSlot(slot.id);
            onDeleted();
        } catch (err) {
            setError(
                err instanceof Error && err.message === "Internal server error"
                    ? "This slot cannot be deleted, probably because it already has reservations."
                    : err instanceof Error
                      ? err.message
                      : "Could not delete slot",
            );
            setBusy(false);
            setConfirmDelete(false);
        }
    }

    return (
        <section className="slots-panel slot-details">
            <header className="slot-details-header">
                <div>
                    <p className="slot-details-date">{formatDate(toDateKey(slot.date))}</p>
                    <h2>
                        {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
                    </h2>
                </div>
                <div className="slot-details-actions">
                    {confirmDelete ? (
                        <>
                            <button
                                type="button"
                                className="slots-btn danger small"
                                onClick={handleDelete}
                                disabled={busy}
                            >
                                Confirm delete
                            </button>
                            <button
                                type="button"
                                className="slots-btn ghost small"
                                onClick={() => setConfirmDelete(false)}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="slots-btn danger-outline small"
                            onClick={() => setConfirmDelete(true)}
                            disabled={busy}
                        >
                            <Trash2 size={15} /> Delete
                        </button>
                    )}
                </div>
            </header>

            {/* GET /slots/:id/details */}
            {slotTables.length === 0 ? (
                <p className="slots-empty warn">This slot has no tables.</p>
            ) : (
                <table className="slot-table">
                    <thead>
                        <tr>
                            <th>Table</th>
                            <th>Seats</th>
                            <th>Booked</th>
                            <th>Available</th>
                            <th aria-label="Actions" />
                        </tr>
                    </thead>
                    <tbody>
                        {slotTables.map((t) => (
                            <tr key={t.id}>
                                <td>Table {t.table_number}</td>
                                <td>{t.capacity}</td>
                                <td>{t.booked_seats}</td>
                                <td>{t.available_seats}</td>
                                <td>
                                    {/* DELETE /slots/:id/tables/:tableId */}
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        disabled={busy || t.booked_seats > 0}
                                        title={
                                            t.booked_seats > 0
                                                ? "Cannot remove: this table has reservations in this slot"
                                                : "Remove table from slot"
                                        }
                                        aria-label={`Remove table ${t.table_number}`}
                                        onClick={() => run(() => removeTableFromSlot(slot.id, t.id))}
                                    >
                                        <X size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* POST /slots/:id/tables */}
            <div className="add-table-row">
                <select
                    value={toAdd}
                    onChange={(e) => setToAdd(e.target.value)}
                    disabled={addable.length === 0}
                >
                    <option value="">
                        {addable.length === 0 ? "All active tables are assigned" : "Add a table…"}
                    </option>
                    {addable.map((t) => (
                        <option key={t.id} value={t.id}>
                            Table {t.table_number} · {t.capacity} seats
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className="slots-btn primary small"
                    disabled={!toAdd || busy}
                    onClick={() =>
                        run(async () => {
                            await addTableToSlot(slot.id, toAdd);
                            setToAdd("");
                        })
                    }
                >
                    Add
                </button>
            </div>

            {error && (
                <p className="slots-error" role="alert">
                    {error}
                </p>
            )}
        </section>
    );
}

export default SlotDetails;
