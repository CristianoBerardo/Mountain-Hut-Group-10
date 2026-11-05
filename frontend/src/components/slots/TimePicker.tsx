import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ITEM_HEIGHT = 36; // px, must match .time-wheel-item height in CSS
const VISIBLE_ITEMS = 5; // odd number, the middle one is the selected value

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

interface WheelProps {
    items: string[];
    value: string;
    onChange: (value: string) => void;
    label: string;
}

/** A single scroll-snapping column, like the iOS picker wheel. */
function Wheel({ items, value, onChange, label }: WheelProps) {
    const ref = useRef<HTMLDivElement>(null);
    const settleTimer = useRef<number | undefined>(undefined);

    // Keep the wheel aligned with the current value (initial render and external changes)
    useEffect(() => {
        const el = ref.current;
        const index = items.indexOf(value);
        if (!el || index < 0) return;
        const target = index * ITEM_HEIGHT;
        if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target });
    }, [items, value]);

    useEffect(() => () => window.clearTimeout(settleTimer.current), []);

    function handleScroll() {
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => {
            const el = ref.current;
            if (!el) return;
            const index = Math.min(
                items.length - 1,
                Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)),
            );
            if (items[index] !== value) onChange(items[index]);
        }, 90);
    }

    function step(delta: number) {
        const index = items.indexOf(value);
        const next = Math.min(items.length - 1, Math.max(0, index + delta));
        ref.current?.scrollTo({ top: next * ITEM_HEIGHT, behavior: "smooth" });
        onChange(items[next]);
    }

    const padding = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;

    return (
        <div
            ref={ref}
            className="time-wheel"
            style={{ height: VISIBLE_ITEMS * ITEM_HEIGHT, paddingBlock: padding }}
            onScroll={handleScroll}
            tabIndex={0}
            role="spinbutton"
            aria-label={label}
            aria-valuenow={Number(value)}
            aria-valuetext={value}
            onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    step(-1);
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    step(1);
                }
            }}
        >
            {items.map((item, i) => (
                <div
                    key={item}
                    className={`time-wheel-item ${item === value ? "selected" : ""}`}
                    onClick={() => {
                        ref.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: "smooth" });
                        onChange(item);
                    }}
                >
                    {item}
                </div>
            ))}
        </div>
    );
}

interface TimePickerProps {
    label: string;
    value: string; // 'HH:MM' or ''
    onChange: (value: string) => void;
    /** Value shown when the picker is opened while still empty. */
    defaultValue?: string;
}

/** Compact time field that opens an iOS-style hour/minute wheel popover. */
function TimePicker({ label, value, onChange, defaultValue = "12:00" }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: PointerEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const [hh, mm] = (value || defaultValue).split(":");

    return (
        <div className="time-picker" ref={rootRef}>
            <span className="time-picker-label">{label}</span>
            <button
                type="button"
                className={`time-picker-field ${open ? "open" : ""} ${value ? "" : "empty"}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                    if (!value) onChange(defaultValue);
                    setOpen((o) => !o);
                }}
            >
                <Clock size={16} />
                {value || "--:--"}
            </button>

            {open && (
                <div className="time-picker-popover" role="dialog" aria-label={label}>
                    <div className="time-picker-wheels">
                        <div className="time-picker-band" aria-hidden="true" />
                        <Wheel
                            items={HOURS}
                            value={hh}
                            label={`${label} hours`}
                            onChange={(h) => onChange(`${h}:${mm}`)}
                        />
                        <span className="time-picker-colon">:</span>
                        <Wheel
                            items={MINUTES}
                            value={mm}
                            label={`${label} minutes`}
                            onChange={(m) => onChange(`${hh}:${m}`)}
                        />
                    </div>
                    <button
                        type="button"
                        className="time-picker-done"
                        onClick={() => setOpen(false)}
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}

export default TimePicker;
