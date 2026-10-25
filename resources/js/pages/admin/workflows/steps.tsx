import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CheckCircle2,
    Circle,
    ClipboardCheck,
    FileText,
    GitBranch,
    GripVertical,
    Plus,
    Save,
    Trash2,
    UserRound,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type Office = {
    id: number;
    code: string;
    name: string;
};

type Approver = {
    id: number;
    name: string;
    email: string;
    office_id: number | null;
};

type WorkflowRecord = {
    id: number;
    name: string;
    code: string;
    document_type: string;
    status: string;
    version: number;
};

type WorkflowStepRecord = {
    id: number;
    name: string;
    step_type: string;
    position: number;
    office: Office | null;
    approver: Approver | null;
    settings: Record<string, unknown> | null;
};

type StepType = {
    value: string;
    label: string;
};

type Props = {
    workflow: WorkflowRecord;
    steps: WorkflowStepRecord[];
    offices: Office[];
    approvers: Approver[];
    stepTypes: StepType[];
};

type StepFormData = {
    name: string;
    step_type: string;
    office_id: string;
    approver_id: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: dashboard() },
    { title: "Workflow Designer", href: "/admin/workflows" },
    { title: "Workflow Steps", href: "#" },
];

const stepTypeLabels: Record<string, string> = {
    approval: "Approval",
    review: "Review",
    submission: "Submission",
    notification: "Notification",
};

const documentTypeLabels: Record<string, string> = {
    purchase_request: "Purchase Request",
    travel_order: "Travel Order",
    disbursement_voucher: "Disbursement Voucher",
    payroll: "Payroll",
    leave_application: "Leave Application",
    incoming_document: "Incoming Document",
    outgoing_document: "Outgoing Document",
    other: "Other",
};

export default function WorkflowSteps({
    workflow,
    steps,
    offices,
    approvers,
    stepTypes,
}: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingStep, setEditingStep] = useState<WorkflowStepRecord | null>(
        null,
    );
    const [pendingDelete, setPendingDelete] =
        useState<WorkflowStepRecord | null>(null);
    const [orderedSteps, setOrderedSteps] = useState(steps);
    const [savingOrder, setSavingOrder] = useState(false);

    const form = useForm<StepFormData>({
        name: "",
        step_type: "approval",
        office_id: "",
        approver_id: "",
    });

    const isDraft = workflow.status === "draft";

    // Keep local list synchronized with fresh Inertia props.
    useEffect(() => {
        setOrderedSteps(steps);
    }, [steps]);

    function syncOrder(nextSteps: WorkflowStepRecord[]) {
        setOrderedSteps(
            nextSteps.map((step, index) => ({
                ...step,
                position: index + 1,
            })),
        );
    }

    function openCreateModal() {
        setEditingStep(null);
        form.clearErrors();
        form.setData({
            name: "",
            step_type: "approval",
            office_id: "",
            approver_id: "",
        });
        setShowForm(true);
    }

    function openEditModal(step: WorkflowStepRecord) {
        setEditingStep(step);
        form.clearErrors();
        form.setData({
            name: step.name,
            step_type: step.step_type,
            office_id: step.office ? String(step.office.id) : "",
            approver_id: step.approver ? String(step.approver.id) : "",
        });
        setShowForm(true);
    }

    function closeModal() {
        setShowForm(false);
        setEditingStep(null);
        form.clearErrors();
    }

    function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload = {
            name: form.data.name,
            step_type: form.data.step_type,
            office_id: form.data.office_id || null,
            approver_id: form.data.approver_id || null,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                toast.success(
                    editingStep
                        ? "Workflow step updated successfully."
                        : "Workflow step added successfully.",
                );
            },
            onError: () => {
                toast.error("Please check the step details for errors.");
            },
        };

        if (editingStep) {
            router.put(
                `/admin/workflows/${workflow.id}/steps/${editingStep.id}`,
                payload,
                options,
            );
        } else {
            form.transform(() => payload);
            form.post(`/admin/workflows/${workflow.id}/steps`, options);
        }
    }

    function moveStep(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;

        if (!isDraft || targetIndex < 0 || targetIndex >= orderedSteps.length) {
            return;
        }

        const nextSteps = [...orderedSteps];
        const [movingStep] = nextSteps.splice(index, 1);
        nextSteps.splice(targetIndex, 0, movingStep);

        syncOrder(nextSteps);
    }

    function saveOrder() {
        if (!isDraft || orderedSteps.length === 0) return;

        setSavingOrder(true);

        router.put(
            `/admin/workflows/${workflow.id}/steps/reorder`,
            {
                step_ids: orderedSteps.map((step) => step.id),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Workflow step order saved.");
                },
                onError: () => {
                    toast.error("Unable to save workflow step order.");
                },
                onFinish: () => {
                    setSavingOrder(false);
                },
            },
        );
    }

    function deleteStep() {
        if (!pendingDelete) return;

        const step = pendingDelete;

        router.delete(`/admin/workflows/${workflow.id}/steps/${step.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setPendingDelete(null);
                setOrderedSteps((current) =>
                    current
                        .filter((item) => item.id !== step.id)
                        .map((item, index) => ({
                            ...item,
                            position: index + 1,
                        })),
                );
                toast.success("Workflow step removed successfully.");
            },
            onError: () => {
                toast.error("Unable to remove this workflow step.");
            },
        });
    }

    return (
        <>
            <Head title={`Workflow Steps — ${workflow.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link
                            href="/admin/workflows"
                            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Workflow Registry
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <GitBranch className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Workflow Steps
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {workflow.name} · {workflow.code}
                                </p>
                            </div>
                        </div>
                    </div>

                    {isDraft && (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            <Plus className="size-4" />
                            Add Step
                        </button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Document Type
                        </p>
                        <p className="mt-2 font-semibold">
                            {documentTypeLabels[workflow.document_type] ??
                                workflow.document_type}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Workflow Version
                        </p>
                        <p className="mt-2 font-semibold">
                            Version {workflow.version}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="mt-2 flex items-center gap-2 font-semibold capitalize">
                            {workflow.status === "published" ? (
                                <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : (
                                <Circle className="size-4 text-amber-600" />
                            )}
                            {workflow.status}
                        </p>
                    </div>
                </div>

                {!isDraft && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                        <p className="font-medium">Read-only workflow</p>
                        <p className="mt-1 text-muted-foreground">
                            This workflow is not a draft. Its steps cannot be
                            changed here. Create a new workflow version to make
                            changes safely.
                        </p>
                    </div>
                )}

                <div className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">Approval Sequence</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {orderedSteps.length} step
                                {orderedSteps.length === 1 ? "" : "s"}{" "}
                                configured for this workflow.
                            </p>
                        </div>

                        {isDraft && orderedSteps.length > 1 && (
                            <button
                                type="button"
                                onClick={saveOrder}
                                disabled={savingOrder}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {savingOrder ? "Saving..." : "Save Order"}
                            </button>
                        )}
                    </div>

                    {orderedSteps.length === 0 ? (
                        <div className="p-10 text-center">
                            <ClipboardCheck className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                            <h3 className="font-medium">
                                No workflow steps yet
                            </h3>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                                Add the first step to begin defining the
                                approval sequence for this workflow.
                            </p>
                            {isDraft && (
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                                >
                                    <Plus className="size-4" />
                                    Add First Step
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="mx-auto max-w-3xl">
                                {orderedSteps.map((step, index) => (
                                    <div key={step.id}>
                                        <div className="rounded-xl border bg-background p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                                                    {index + 1}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold">
                                                            {step.name}
                                                        </h3>
                                                        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                                            {stepTypeLabels[
                                                                step.step_type
                                                            ] ?? step.step_type}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                                        <div className="flex items-start gap-2 text-muted-foreground">
                                                            <FileText className="mt-0.5 size-4 shrink-0" />
                                                            <div>
                                                                <p className="text-xs">
                                                                    Assigned
                                                                    Office
                                                                </p>
                                                                <p className="mt-0.5 font-medium text-foreground">
                                                                    {step.office
                                                                        ? `${step.office.code} — ${step.office.name}`
                                                                        : "No office assigned"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-2 text-muted-foreground">
                                                            <UserRound className="mt-0.5 size-4 shrink-0" />
                                                            <div>
                                                                <p className="text-xs">
                                                                    Specific
                                                                    Approver
                                                                </p>
                                                                <p className="mt-0.5 font-medium text-foreground">
                                                                    {step.approver
                                                                        ? step
                                                                              .approver
                                                                              .name
                                                                        : "Any eligible approver"}
                                                                </p>
                                                                {step.approver && (
                                                                    <p className="text-xs">
                                                                        {
                                                                            step
                                                                                .approver
                                                                                .email
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isDraft && (
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <button
                                                            type="button"
                                                            title="Move up"
                                                            disabled={
                                                                index === 0
                                                            }
                                                            onClick={() =>
                                                                moveStep(
                                                                    index,
                                                                    -1,
                                                                )
                                                            }
                                                            className="inline-flex size-8 items-center justify-center rounded-md border transition hover:bg-muted disabled:opacity-30"
                                                        >
                                                            <ArrowUp className="size-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Move down"
                                                            disabled={
                                                                index ===
                                                                orderedSteps.length -
                                                                    1
                                                            }
                                                            onClick={() =>
                                                                moveStep(
                                                                    index,
                                                                    1,
                                                                )
                                                            }
                                                            className="inline-flex size-8 items-center justify-center rounded-md border transition hover:bg-muted disabled:opacity-30"
                                                        >
                                                            <ArrowDown className="size-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Edit step"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    step,
                                                                )
                                                            }
                                                            className="inline-flex size-8 items-center justify-center rounded-md border transition hover:bg-muted"
                                                        >
                                                            <ClipboardCheck className="size-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Remove step"
                                                            onClick={() =>
                                                                setPendingDelete(
                                                                    step,
                                                                )
                                                            }
                                                            className="inline-flex size-8 items-center justify-center rounded-md border text-destructive transition hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isDraft && (
                                                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <GripVertical className="size-3.5" />
                                                    Use the arrows to change the
                                                    step order, then save the
                                                    order.
                                                </div>
                                            )}
                                        </div>

                                        {index < orderedSteps.length - 1 && (
                                            <div className="flex justify-center py-2">
                                                <ArrowDown className="size-5 text-muted-foreground/60" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingStep
                                        ? "Edit Workflow Step"
                                        : "Add Workflow Step"}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Configure the step type and responsible
                                    office or approver.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg p-2 transition hover:bg-muted"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={submitForm}>
                            <div className="grid gap-5 p-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Step Name
                                    </label>
                                    <input
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                "name",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g. Budget Office Review"
                                        required
                                    />
                                    {form.errors.name && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Step Type
                                    </label>
                                    <select
                                        value={form.data.step_type}
                                        onChange={(event) =>
                                            form.setData(
                                                "step_type",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                        required
                                    >
                                        {stepTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.step_type && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.step_type}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Assigned Office
                                    </label>
                                    <select
                                        value={form.data.office_id}
                                        onChange={(event) =>
                                            form.setData(
                                                "office_id",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="">
                                            No office assigned
                                        </option>
                                        {offices.map((office) => (
                                            <option
                                                key={office.id}
                                                value={office.id}
                                            >
                                                {office.code} — {office.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.office_id && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.office_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Specific Approver (Optional)
                                    </label>
                                    <select
                                        value={form.data.approver_id}
                                        onChange={(event) =>
                                            form.setData(
                                                "approver_id",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="">
                                            Any eligible approver
                                        </option>
                                        {approvers.map((approver) => (
                                            <option
                                                key={approver.id}
                                                value={approver.id}
                                            >
                                                {approver.name} —{" "}
                                                {approver.email}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.approver_id && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.approver_id}
                                        </p>
                                    )}
                                </div>

                                <p className="text-xs leading-5 text-muted-foreground">
                                    Approval execution and conditional routing
                                    will be connected when we implement the
                                    workflow engine.
                                </p>
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 p-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {form.processing
                                        ? "Saving..."
                                        : editingStep
                                          ? "Save Changes"
                                          : "Add Step"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {pendingDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
                        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <Trash2 className="size-5" />
                        </div>

                        <h2 className="text-lg font-semibold">
                            Remove Workflow Step?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Are you sure you want to remove{" "}
                            <span className="font-medium text-foreground">
                                {pendingDelete.name}
                            </span>
                            ? The remaining steps will be reordered.
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteStep}
                                className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                            >
                                Remove Step
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

WorkflowSteps.layout = {
    breadcrumbs,
};
