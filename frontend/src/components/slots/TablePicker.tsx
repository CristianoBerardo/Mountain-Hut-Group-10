import { Check } from "lucide-react";
import type { DiningTableDTO } from "../../dto/TableDTO";

interface TablePickerProps {
    tables: DiningTableDTO[];
    selected: Set<string>;
    onChange: (selected: Set<string>) => void;
}

function TablePicker({ tables, selected, onChange }: TablePickerProps) {
    function toggle(id: string) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange(next);
    }

    const sorted = [...tables].sort((a, b) => a.table_number - b.table_number);

    if (sorted.length === 0) {
        return <p className="slots-empty">No active tables available.</p>;
    }

    return (
        <div className="table-grid">
            {sorted.map((t) => {
                const isOn = selected.has(t.id);
                return (
                    <button
                        type="button"
                        key={t.id}
                        className={`table-chip ${isOn ? "on" : ""}`}
                        aria-pressed={isOn}
                        onClick={() => toggle(t.id)}
                    >
                        <span className="table-chip-check">{isOn && <Check size={14} />}</span>
                        <span className="table-chip-number">Table {t.table_number}</span>
                        <span className="table-chip-seats">{t.capacity} seats</span>
                    </button>
                );
            })}
        </div>
    );
}

export default TablePicker;
