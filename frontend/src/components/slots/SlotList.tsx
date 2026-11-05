import { CalendarDays, Plus } from "lucide-react";
import type { MealSlotDTO } from "../../dto/SlotDTO";
import { formatDate, formatTime, toDateKey } from "../../utils/slotFormat";

export interface SlotCapacity {
    tables: number;
    seats: number;
    booked: number;
}

interface SlotListProps {
    slots: MealSlotDTO[];
    capacities: Record<string, SlotCapacity>;
    selectedId: string | null;
    onSelect: (slotId: string) => void;
    onNew: () => void;
}

function SlotList({ slots, capacities, selectedId, onSelect, onNew }: SlotListProps) {
    const sorted = [...slots].sort((a, b) =>
        `${toDateKey(a.date)} ${a.starts_at}`.localeCompare(`${toDateKey(b.date)} ${b.starts_at}`),
    );

    // Group by date, preserving the sorted order
    const groups = new Map<string, MealSlotDTO[]>();
    for (const slot of sorted) {
        const key = toDateKey(slot.date);
        groups.set(key, [...(groups.get(key) ?? []), slot]);
    }

    return (
        <aside className="slots-panel slot-list">
            <div className="slot-list-header">
                <h2>Slots</h2>
                <button type="button" className="slots-btn primary small" onClick={onNew}>
                    <Plus size={16} /> New slot
                </button>
            </div>

            {groups.size === 0 && <p className="slots-empty">No slots yet.</p>}

            {[...groups.entries()].map(([dateKey, daySlots]) => (
                <div key={dateKey} className="slot-day">
                    <div className="slot-day-title">
                        <CalendarDays size={15} />
                        {formatDate(dateKey)}
                    </div>
                    <ul>
                        {daySlots.map((slot) => {
                            const cap = capacities[slot.id];
                            return (
                                <li key={slot.id}>
                                    <button
                                        type="button"
                                        className={`slot-item ${selectedId === slot.id ? "selected" : ""}`}
                                        onClick={() => onSelect(slot.id)}
                                    >
                                        <span className="slot-item-time">
                                            {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
                                        </span>
                                        <span className={`slot-item-meta ${cap ? "" : "warn"}`}>
                                            {cap
                                                ? `${cap.tables} tables · ${cap.booked}/${cap.seats} seats booked`
                                                : "No tables assigned"}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </aside>
    );
}

export default SlotList;
