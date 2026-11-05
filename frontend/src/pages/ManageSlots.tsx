import { useCallback, useEffect, useState } from "react";
import { getSlotCapacities, getSlotDetails, getSlots } from "../api/slotAPI";
import { getActiveTables } from "../api/tableAPI";
import Navbar from "../components/Navbar";
import SlotDetails from "../components/slots/SlotDetails";
import SlotForm from "../components/slots/SlotForm";
import SlotList, { type SlotCapacity } from "../components/slots/SlotList";
import type { MealSlotDTO, MealSlotDetailsDTO } from "../dto/SlotDTO";
import type { DiningTableDTO } from "../dto/TableDTO";
import "../styles/ManageSlots.css";

type View = { kind: "create" } | { kind: "details"; slotId: string } | { kind: "empty" };

/** GET /slots, GET /slots/available and GET /tables?active=true */
async function fetchOverview() {
    const [slots, capacityRows, tables] = await Promise.all([
        getSlots(),
        getSlotCapacities(),
        getActiveTables(),
    ]);
    const capacities: Record<string, SlotCapacity> = Object.fromEntries(
        capacityRows.map((c) => [
            c.slot_id,
            { tables: c.active_tables_count, seats: c.total_capacity, booked: c.total_booked },
        ]),
    );
    return { slots, tables, capacities };
}

function ManageSlots() {
    const [slots, setSlots] = useState<MealSlotDTO[]>([]);
    const [capacities, setCapacities] = useState<Record<string, SlotCapacity>>({});
    const [tables, setTables] = useState<DiningTableDTO[]>([]);
    const [details, setDetails] = useState<MealSlotDetailsDTO | null>(null);
    const [view, setView] = useState<View>({ kind: "empty" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const applyOverview = useCallback((data: Awaited<ReturnType<typeof fetchOverview>>) => {
        setSlots(data.slots);
        setTables(data.tables);
        setCapacities(data.capacities);
    }, []);

    const loadOverview = useCallback(
        async () => applyOverview(await fetchOverview()),
        [applyOverview],
    );

    useEffect(() => {
        fetchOverview()
            .then(applyOverview)
            .catch((err) => setError(err instanceof Error ? err.message : "Could not load slots"))
            .finally(() => setLoading(false));
    }, [applyOverview]);

    const loadDetails = useCallback(async (slotId: string) => {
        setDetails(await getSlotDetails(slotId));
    }, []);

    async function selectSlot(slotId: string) {
        setNotice("");
        setError("");
        setView({ kind: "details", slotId });
        setDetails(null);
        try {
            await loadDetails(slotId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load slot");
        }
    }

    function openCreate() {
        setNotice("");
        setError("");
        setView({ kind: "create" });
    }

    async function handleCreated(slot: MealSlotDTO, warning?: string) {
        await loadOverview().catch(() => undefined);
        await selectSlot(slot.id);
        setNotice(warning ?? "Slot created.");
    }

    const selectedId = view.kind === "details" ? view.slotId : null;

    return (
        <>
            <Navbar />
            <main className="slots-page">
                <header className="slots-page-header">
                    <h1>Meal slots</h1>
                </header>

                {error && (
                    <p className="slots-error banner" role="alert">
                        {error}
                    </p>
                )}
                {notice && <p className="slots-info banner">{notice}</p>}

                {loading ? (
                    <p className="slots-empty">Loading…</p>
                ) : (
                    <div className="slots-layout">
                        <SlotList
                            slots={slots}
                            capacities={capacities}
                            selectedId={selectedId}
                            onSelect={selectSlot}
                            onNew={openCreate}
                        />

                        {view.kind === "create" && (
                            <SlotForm
                                tables={tables}
                                slots={slots}
                                onCreated={handleCreated}
                                onCancel={() => setView({ kind: "empty" })}
                                onTableCreated={(t) => setTables((prev) => [...prev, t])}
                            />
                        )}

                        {view.kind === "details" &&
                            (details && details.slot.id === view.slotId ? (
                                <SlotDetails
                                    key={details.slot.id}
                                    details={details}
                                    tables={tables}
                                    onChanged={async () => {
                                        await Promise.all([loadDetails(view.slotId), loadOverview()]);
                                    }}
                                    onDeleted={async () => {
                                        setView({ kind: "empty" });
                                        setDetails(null);
                                        setNotice("Slot deleted.");
                                        await loadOverview().catch(() => undefined);
                                    }}
                                />
                            ) : (
                                <section className="slots-panel">
                                    <p className="slots-empty">Loading slot…</p>
                                </section>
                            ))}

                        {view.kind === "empty" && (
                            <section className="slots-panel slots-placeholder">
                                <p>Select a slot or create a new one.</p>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}

export default ManageSlots;
