import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Ambulance as AmbulanceIcon, Save, Users, Send, Play, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

interface Booking { request_number: string; requester_name: string; pickup_address: string; destination_address: string; }
interface Ambulance { id: number; vehicle_code: string; plate_number: string | null; ambulance_type: string; }
interface Personnel { id: number; employee_id: string; first_name: string; middle_name: string | null; last_name: string; role: string; }
interface Operation {
    id: number; operation_number: string; status: string; notes: string | null; created_at: string;
    booking: Booking | null;
    ambulances: { id: number; ambulance_id: number; released_at: string | null; ambulance: Ambulance | null }[];
    personnel: { id: number; personnel_id: number; assignment_role: string | null; released_at: string | null; personnel: Personnel | null }[];
}
interface Props { operation: Operation; statuses: Record<string, string>; availableAmbulances: Ambulance[]; availablePersonnel: Personnel[]; }

export default function OperationShow({ operation, statuses, availableAmbulances, availablePersonnel }: Props) {
    const activeAmbulances = operation.ambulances.filter((x) => !x.released_at);
    const activePersonnel = operation.personnel.filter((x) => !x.released_at);
    const form = useForm({
        ambulance_ids: activeAmbulances.map((x) => x.ambulance_id),
        personnel_ids: activePersonnel.map((x) => x.personnel_id),
    });
    const [actionProcessing, setActionProcessing] = useState(false);
    const canEdit = ["preparing", "assigned"].includes(operation.status);
    const toggle = (ids: number[], id: number, checked: boolean) => checked ? [...ids, id] : ids.filter((x) => x !== id);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.patch(`/mdrrmo/operations/${operation.id}/resources`, { preserveScroll: true });
    };
    const runAction = (action: "dispatch" | "start" | "complete" | "cancel", message: string) => {
        if (!window.confirm(message)) return;
        setActionProcessing(true);
        router.patch(`/mdrrmo/operations/${operation.id}/${action}`, {}, {
            preserveScroll: true,
            onFinish: () => setActionProcessing(false),
        });
    };
    const statusLabel = statuses[operation.status] ?? operation.status.replaceAll("_", " ");

    return <>
        <Head title={`Operation ${operation.operation_number}`} />
        <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
            <div>
                <Link href="/mdrrmo/operations/manage" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" /> Back to Operations
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Operation Details</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Review booking information and manage the operation lifecycle.</p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800">{statusLabel}</span>
                </div>
            </div>

            <section className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">Operation Information</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Info label="Operation Number" value={operation.operation_number} />
                    <Info label="Booking Number" value={operation.booking?.request_number ?? "N/A"} />
                    <Info label="Requester" value={operation.booking?.requester_name ?? "N/A"} />
                    <Info label="Date Created" value={new Date(operation.created_at).toLocaleString()} />
                    <Info label="Pickup Address" value={operation.booking?.pickup_address ?? "N/A"} />
                    <Info label="Destination" value={operation.booking?.destination_address ?? "N/A"} />
                </div>
                {operation.notes && <div className="mt-4 rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Operation Notes</p><p className="mt-1 whitespace-pre-wrap text-sm">{operation.notes}</p></div>}
            </section>

            {canEdit && <form onSubmit={submit} className="flex flex-col gap-6">
                <section className="rounded-xl border bg-card">
                    <div className="border-b p-5">
                        <h2 className="flex items-center gap-2 font-semibold"><AmbulanceIcon className="size-5" /> Assign Ambulances</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Select available ambulances for this operation.</p>
                    </div>
                    <div className="grid gap-3 p-5 md:grid-cols-2">
                        {availableAmbulances.length ? availableAmbulances.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
                            <input type="checkbox" className="mt-1 size-4 accent-primary" checked={form.data.ambulance_ids.includes(item.id)} disabled={form.processing || actionProcessing}
                                onChange={(e) => form.setData("ambulance_ids", toggle(form.data.ambulance_ids, item.id, e.target.checked))} />
                            <span><span className="block font-medium">{item.vehicle_code}</span><span className="text-xs text-muted-foreground">{item.plate_number || "No plate number"} · {item.ambulance_type}</span></span>
                        </label>) : <Empty>No additional available ambulances. Existing assignments are listed below.</Empty>}
                    </div>
                    {form.errors.ambulance_ids && <p className="px-5 pb-4 text-sm text-destructive">{form.errors.ambulance_ids}</p>}
                </section>

                <section className="rounded-xl border bg-card">
                    <div className="border-b p-5">
                        <h2 className="flex items-center gap-2 font-semibold"><Users className="size-5" /> Assign Personnel</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Select available MDRRMO personnel for this operation.</p>
                    </div>
                    <div className="grid gap-3 p-5 md:grid-cols-2">
                        {availablePersonnel.length ? availablePersonnel.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
                            <input type="checkbox" className="mt-1 size-4 accent-primary" checked={form.data.personnel_ids.includes(item.id)} disabled={form.processing || actionProcessing}
                                onChange={(e) => form.setData("personnel_ids", toggle(form.data.personnel_ids, item.id, e.target.checked))} />
                            <span><span className="block font-medium">{item.first_name} {item.middle_name ? `${item.middle_name} ` : ""}{item.last_name}</span><span className="text-xs text-muted-foreground">{item.employee_id} · {item.role}</span></span>
                        </label>) : <Empty>No additional available personnel. Existing assignments are listed below.</Empty>}
                    </div>
                    {form.errors.personnel_ids && <p className="px-5 pb-4 text-sm text-destructive">{form.errors.personnel_ids}</p>}
                </section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">Saving replaces the current selections. Unchecked resources will be released.</p>
                    <button type="submit" disabled={form.processing || actionProcessing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                        <Save className="size-4" />{form.processing ? "Saving..." : "Save Assignments"}
                    </button>
                </div>
            </form>}

            <section className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">Current Active Assignments</h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <div><h3 className="mb-2 text-sm font-medium">Ambulances</h3>
                        {activeAmbulances.length ? activeAmbulances.map((x) => <p key={x.id} className="mb-2 rounded-lg bg-muted/50 p-3 text-sm">{x.ambulance?.vehicle_code ?? `Ambulance #${x.ambulance_id}`}</p>) : <Empty>No ambulances assigned yet.</Empty>}
                    </div>
                    <div><h3 className="mb-2 text-sm font-medium">Personnel</h3>
                        {activePersonnel.length ? activePersonnel.map((x) => <p key={x.id} className="mb-2 rounded-lg bg-muted/50 p-3 text-sm">{x.personnel ? `${x.personnel.first_name} ${x.personnel.last_name} · ${x.assignment_role ?? x.personnel.role}` : `Personnel #${x.personnel_id}`}</p>) : <Empty>No personnel assigned yet.</Empty>}
                    </div>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">Operation Actions</h2>
                <p className="mt-1 text-sm text-muted-foreground">Available actions depend on the current operation status.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    {operation.status === "assigned" && <Action icon={<Send className="size-4" />} disabled={actionProcessing || form.processing} onClick={() => runAction("dispatch", "Dispatch this operation now? The assigned resources will be committed to the mission.")}>{actionProcessing ? "Processing..." : "Dispatch Operation"}</Action>}
                    {operation.status === "dispatched" && <Action icon={<Play className="size-4" />} disabled={actionProcessing} onClick={() => runAction("start", "Mark this operation as In Progress?")}>{actionProcessing ? "Processing..." : "Start Operation"}</Action>}
                    {["dispatched", "in_progress"].includes(operation.status) && <Action icon={<CheckCircle2 className="size-4" />} disabled={actionProcessing} onClick={() => runAction("complete", "Mark this operation as Completed and release its assigned resources?")}>{actionProcessing ? "Processing..." : "Complete Operation"}</Action>}
                    {["preparing", "assigned"].includes(operation.status) && <button type="button" disabled={actionProcessing || form.processing} onClick={() => runAction("cancel", "Cancel this operation? Its assigned resources will be released.")} className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"><XCircle className="size-4" /> Cancel Operation</button>}
                    {operation.status === "preparing" && <p className="text-sm text-muted-foreground">Assign at least one ambulance and one personnel member to enable dispatch.</p>}
                    {operation.status === "completed" && <p className="text-sm font-medium text-green-600">This operation has been completed.</p>}
                    {operation.status === "cancelled" && <p className="text-sm text-muted-foreground">This operation has been cancelled.</p>}
                </div>
            </section>
        </main>
    </>;
}

function Action({ children, icon, disabled, onClick }: { children: string; icon: ReactNode; disabled: boolean; onClick: () => void }) {
    return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{icon}{children}</button>;
}
function Info({ label, value }: { label: string; value: string }) {
    return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div>;
}
function Empty({ children }: { children: string }) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
}
OperationShow.layout = {
    breadcrumbs: [
        { title: "MDRRMO Operations", href: "/mdrrmo/operations" },
        { title: "Operations Management", href: "/mdrrmo/operations/manage" },
        { title: "Operation Details", href: "#" },
    ],
};
