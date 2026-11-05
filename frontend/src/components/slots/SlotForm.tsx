import { Copy } from "lucide-react";
import { useState } from "react";
import { addTableToSlot, createSlot, getSlotDetails } from "../../api/slotAPI";
import type { MealSlotDTO } from "../../dto/SlotDTO";
import type { DiningTableDTO } from "../../dto/TableDTO";
import { formatDate, formatTime, toDateKey } from "../../utils/slotFormat";
import TablePicker from "./TablePicker";
import TimePicker from "./TimePicker";

/** 'HH:MM' -> one hour later (capped at 23:59) */
function nextHour(time: string): string {
    const h = Number(time.slice(0, 2)) + 1;
    return h > 23 ? "23:59" : `${String(h).padStart(2, "0")}:${time.slice(3, 5)}`;
}

interface SlotFormProps {
    tables: DiningTableDTO[];
    slots: MealSlotDTO[];
    onCreated: (slot: MealSlotDTO, warning?: string) => void;
    onCancel: () => void;
}

function SlotForm({ tables, slots, onCreated, onCancel }: SlotFormProps) {
    const [date, setDate] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [copySource, setCopySource] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const sortedSlots = [...slots].sort((a, b) =>
        `${toDateKey(b.date)} ${b.starts_at}`.localeCompare(`${toDateKey(a.date)} ${a.starts_at}`),
    );

    // GET /slots/:id/details -> preselect the same tables (MH-02: reuse a previous table list)
    async function handleCopyFrom(slotId: string) {
        setCopySource(slotId);
        setError("");
        if (!slotId) return;

        try {
            const details = await getSlotDetails(slotId);
            const activeIds = new Set(tables.map((t) => t.id));
            setSelected(new Set(details.tables.map((t) => t.id).filter((id) => activeIds.has(id))));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load tables of that slot");
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!startsAt || !endsAt) {
            setError("Start and end time are required");
            return;
        }
        if (endsAt <= startsAt) {
            setError("End time must be after start time");
            return;
        }
        if (selected.size === 0) {
            setError("Select at least one table");
            return;
        }

        setSaving(true);
        try {
            // POST /slots, then POST /slots/:id/tables for each selected table
            const slot = await createSlot({ date, starts_at: startsAt, ends_at: endsAt });

            const results = await Promise.allSettled(
                [...selected].map((tableId) => addTableToSlot(slot.id, tableId)),
            );
            const failed = results.filter((r) => r.status === "rejected").length;

            onCreated(
                slot,
                failed > 0
                    ? `Slot created, but ${failed} table${failed === 1 ? "" : "s"} could not be assigned.`
                    : undefined,
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create slot");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="slots-panel slot-form">
            <h2>New slot</h2>

            <form onSubmit={handleSubmit}>
                <div className="slot-form-row">
                    <label>
                        Date
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </label>
                    <TimePicker label="Starts at" value={startsAt} onChange={setStartsAt} />
                    <TimePicker
                        label="Ends at"
                        value={endsAt}
                        onChange={setEndsAt}
                        defaultValue={startsAt ? nextHour(startsAt) : "13:00"}
                    />
                </div>

                <div className="slot-form-section">
                    <div className="slot-form-section-title">
                        <h3>Tables</h3>
                        {sortedSlots.length > 0 && (
                            <label className="copy-from">
                                <Copy size={15} />
                                <select
                                    value={copySource}
                                    onChange={(e) => handleCopyFrom(e.target.value)}
                                >
                                    <option value="">Reuse tables from a previous slot…</option>
                                    {sortedSlots.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {formatDate(toDateKey(s.date))} ·{" "}
                                            {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </div>

                    <TablePicker tables={tables} selected={selected} onChange={setSelected} />
                </div>

                {error && (
                    <p className="slots-error" role="alert">
                        {error}
                    </p>
                )}

                <div className="slot-form-actions">
                    <button type="button" className="slots-btn ghost" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="slots-btn primary" disabled={saving}>
                        {saving ? "Creating…" : "Create slot"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default SlotForm;
