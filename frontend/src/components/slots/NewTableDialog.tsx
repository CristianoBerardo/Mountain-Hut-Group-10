import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createTable } from "../../api/tableAPI";
import type { DiningTableDTO } from "../../dto/TableDTO";

interface NewTableDialogProps {
    open: boolean;
    /** Existing tables, used to suggest the next free number and catch duplicates early. */
    tables: DiningTableDTO[];
    onClose: () => void;
    onCreated: (table: DiningTableDTO) => void;
}

/** Modal form that creates a dining table through POST /tables. */
function NewTableDialog({ open, tables, onClose, onCreated }: NewTableDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Sync the native <dialog> with the `open` prop (gives backdrop, focus trap and Esc for free)
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    // Portal to <body>: the picker lives inside the slot <form>, and forms cannot be nested
    return createPortal(
        <dialog
            ref={dialogRef}
            className="slots-dialog"
            aria-labelledby="new-table-title"
            onClose={onClose}
            onClick={(e) => {
                // Clicking the backdrop (the dialog element itself) closes it
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Remount the form on every open so it starts fresh */}
            {open && <NewTableForm tables={tables} onClose={onClose} onCreated={onCreated} />}
        </dialog>,
        document.body,
    );
}

function NewTableForm({ tables, onClose, onCreated }: Omit<NewTableDialogProps, "open">) {
    const nextNumber = tables.reduce((max, t) => Math.max(max, t.table_number), 0) + 1;

    const [tableNumber, setTableNumber] = useState(String(nextNumber));
    const [seats, setSeats] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // React events bubble through portals: don't let this submit reach the slot form
        event.stopPropagation();
        setError("");

        const number = Number(tableNumber);
        const capacity = Number(seats);

        if (!Number.isInteger(number) || number <= 0) {
            setError("Table number must be a positive whole number");
            return;
        }
        if (!Number.isInteger(capacity) || capacity <= 0) {
            setError("Seats must be a positive whole number");
            return;
        }
        if (tables.some((t) => t.table_number === number)) {
            setError(`Table ${number} already exists`);
            return;
        }

        setSaving(true);
        try {
            const created = await createTable({ table_number: number, capacity });
            onCreated(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create table");
            setSaving(false);
        }
    }

    return (
        <form className="slots-dialog-body" onSubmit={handleSubmit}>
            <header className="slots-dialog-header">
                <h2 id="new-table-title">New table</h2>
                <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
                    <X size={18} />
                </button>
            </header>

            <div className="slots-dialog-fields">
                <label>
                    Table number
                    <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        required
                        autoFocus
                    />
                </label>
                <label>
                    Seats
                    <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="e.g. 4"
                        value={seats}
                        onChange={(e) => setSeats(e.target.value)}
                        required
                    />
                </label>
            </div>

            {error && (
                <p className="slots-error" role="alert">
                    {error}
                </p>
            )}

            <footer className="slots-dialog-actions">
                <button type="button" className="slots-btn ghost" onClick={onClose}>
                    Cancel
                </button>
                <button type="submit" className="slots-btn primary" disabled={saving}>
                    {saving ? "Creating…" : "Create table"}
                </button>
            </footer>
        </form>
    );
}

export default NewTableDialog;
