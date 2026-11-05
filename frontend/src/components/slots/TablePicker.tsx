import { Check, Plus } from "lucide-react";
import { useState } from "react";
import type { DiningTableDTO } from "../../dto/TableDTO";
import NewTableDialog from "./NewTableDialog";

interface TablePickerProps {
    tables: DiningTableDTO[];
    selected: Set<string>;
    onChange: (selected: Set<string>) => void;
    /** Called after POST /tables succeeds, so the parent can add it to the catalogue. */
    onTableCreated: (table: DiningTableDTO) => void;
}

function TablePicker({ tables, selected, onChange, onTableCreated }: TablePickerProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    function toggle(id: string) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange(next);
    }

    const sorted = [...tables].sort((a, b) => a.table_number - b.table_number);

    return (
        <>
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

                {/* Trailing card: create a table that does not exist yet */}
                <button
                    type="button"
                    className="table-chip add"
                    onClick={() => setDialogOpen(true)}
                >
                    <Plus size={20} />
                    <span>New table</span>
                </button>
            </div>

            <NewTableDialog
                open={dialogOpen}
                tables={tables}
                onClose={() => setDialogOpen(false)}
                onCreated={(table) => {
                    onTableCreated(table);
                    onChange(new Set(selected).add(table.id)); // preselect the new table
                    setDialogOpen(false);
                }}
            />
        </>
    );
}

export default TablePicker;
