import { Head, router } from "@inertiajs/react";
import {
    CheckCircle2,
    Clock3,
    FileClock,
    FileText,
    History,
    Inbox,
    LoaderCircle,
    MessageSquare,
    Package,
    Paperclip,
    RefreshCw,
    Search,
    X,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PurchaseRequestItem = {
    id: number;
    item_number: number;
    description: string;
    quantity: number | string;
    unit: string | null;
    unit_price: number | string;
    amount: number | string;
};

type Attachment = {
    id: number;
    original_name: string;
    mime_type: string | null;
    file_size: number;
    uploaded_by: number | null;
    created_at: string | null;
};

type HistoryEntry = {
    id: number;
    action: string;
    comments: string | null;
    acted_at: string | null;
    user: string | null;
};

type DocumentDetails = {
    id: number;
    tracking_number: string;
    document_type: string;
    subject: string;
    description: string | null;
    status: string;
    originating_office: string | null;
    submitter: string | null;
    submitted_at: string | null;
    created_at: string;
    template_data?: Record<string, unknown> | null;
    purchase_request_items?: PurchaseRequestItem[];
    attachments?: Attachment[];
    funding_source?: string | null;
    requested_delivery_date?: string | null;
    budget_availability?:
        | "available"
        | "unavailable"
        | "requires_correction"
        | null;
    budget_remarks?: string | null;
    budget_amount?: number | string | null;
    funding_source_assigned_by?: number | null;
    funding_source_assigned_at?: string | null;
    funding_source_assigner?: string | null;
};

type CurrentStep = {
    id: number | null;
    office_id: number | null;
    name: string | null;
    position: number | null;
    step_type: string | null;
    office: string | null;
    approver: string | null;
};

type WorkflowDetails = {
    id: number | null;
    name: string | null;
    code: string | null;
    version: number | null;
};

type Assignment = {
    id: number;
    status: string;
    started_at: string | null;
    workflow_version_id: number;
    workflow: WorkflowDetails;
    current_step: CurrentStep;
    document: DocumentDetails | null;
    history?: HistoryEntry[];
};

type Pagination = {
    data: Assignment[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Props = {
    assignments: Pagination;
};

export default function PendingApprovals({ assignments }: Props) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Assignment | null>(null);
    const [action, setAction] = useState<"approved" | "rejected" | null>(null);
    const [comments, setComments] = useState("");
    const [fundingSource, setFundingSource] = useState("");
    const [budgetAvailability, setBudgetAvailability] = useState<
        "available" | "unavailable" | "requires_correction" | ""
    >("");
    const [budgetRemarks, setBudgetRemarks] = useState("");
    const [budgetAmount, setBudgetAmount] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const query = search.trim().toLowerCase();

    function budgetAssessmentComplete(document: DocumentDetails | null) {
        if (!document || document.document_type !== "purchase_request") {
            return true;
        }

        return budgetAssessmentValuesComplete(
            document,
            document.funding_source ?? "",
            document.budget_availability ?? "",
            document.budget_amount === null ||
                document.budget_amount === undefined
                ? ""
                : String(document.budget_amount),
        );
    }

    function budgetAssessmentValuesComplete(
        document: DocumentDetails | null,
        source: string,
        availability: string,
        amountValue: string,
    ) {
        if (!document || document.document_type !== "purchase_request") {
            return true;
        }

        const amount = Number(amountValue);
        const requestedTotal = (document.purchase_request_items ?? []).reduce(
            (sum, item) => sum + toNumber(item.amount),
            0,
        );

        return Boolean(
            source.trim() &&
            availability === "available" &&
            amountValue.trim() !== "" &&
            Number.isFinite(amount) &&
            amount > 0 &&
            amount >= requestedTotal,
        );
    }

    const filteredAssignments = assignments.data.filter((assignment) => {
        const document = assignment.document;

        if (!query) return true;
        if (!document) return false;

        return [
            document.tracking_number,
            document.subject,
            document.document_type,
            document.originating_office ?? "",
            document.submitter ?? "",
            assignment.current_step.name ?? "",
            assignment.current_step.office ?? "",
        ].some((value) => value.toLowerCase().includes(query));
    });

    function loadBudgetFields(assignment: Assignment) {
        setFundingSource(assignment.document?.funding_source ?? "");
        setBudgetAvailability(assignment.document?.budget_availability ?? "");
        setBudgetRemarks(assignment.document?.budget_remarks ?? "");
        setBudgetAmount(
            assignment.document?.budget_amount !== null &&
                assignment.document?.budget_amount !== undefined
                ? String(assignment.document.budget_amount)
                : "",
        );
    }

    function openReview(assignment: Assignment) {
        setSelected(assignment);
        setAction(null);
        setComments("");
        loadBudgetFields(assignment);
    }

    function openAction(
        assignment: Assignment,
        selectedAction: "approved" | "rejected",
    ) {
        const isSameAssignment = selected?.id === assignment.id;

        setSelected(assignment);
        setAction(selectedAction);
        setComments("");

        // Preserve the values currently being edited when moving from the
        // assessment form to the approval confirmation for the same request.
        // Only hydrate from persisted document data when opening another request.
        if (!isSameAssignment) {
            loadBudgetFields(assignment);
        }
    }

    function closeAction() {
        if (processingId !== null) return;

        setSelected(null);
        setAction(null);
        setComments("");
        setFundingSource("");
        setBudgetAvailability("");
        setBudgetRemarks("");
        setBudgetAmount("");
    }

    function submitBudgetReview(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selected?.document) return;

        if (!fundingSource.trim()) {
            toast.error(
                "Enter the funding source before saving the budget assessment.",
            );
            return;
        }

        if (!budgetAvailability) {
            toast.error("Select the budget availability assessment.");
            return;
        }

        const amount = Number(budgetAmount);
        if (!budgetAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
            toast.error("Enter a budget amount greater than zero.");
            return;
        }

        const requestedTotal = (
            selected.document.purchase_request_items ?? []
        ).reduce((sum, item) => sum + toNumber(item.amount), 0);

        if (budgetAvailability === "available" && amount < requestedTotal) {
            toast.error(
                `The budget amount must cover the requested total of ${formatCurrency(requestedTotal)}.`,
            );
            return;
        }

        if (
            !window.confirm(
                `Save the Budget Office assessment for ${selected.document.tracking_number}? The workflow will remain at the Budget Office step.`,
            )
        ) {
            return;
        }

        setProcessingId(selected.id);

        router.post(
            `/admin/document-workflows/${selected.id}/budget-review`,
            {
                funding_source: fundingSource.trim(),
                budget_availability: budgetAvailability,
                budget_amount: amount,
                budget_remarks: budgetRemarks.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Keep the review modal and entered values open after saving.
                    // The backend has persisted the assessment; closing the modal
                    // and forcing a partial reload here made the workflow feel
                    // like a page refresh and discarded the in-progress review UI.
                    toast.success(
                        "Budget assessment saved. You can now approve this Purchase Request.",
                    );
                },
                onError: (errors) => {
                    const message = Object.values(errors).find(
                        (value): value is string => typeof value === "string",
                    );
                    toast.error(
                        message ??
                            "Unable to save the budget assessment. Please check your permissions and try again.",
                    );
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    function submitAction(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selected || !action || !selected.document) return;

        if (action === "rejected" && !comments.trim()) {
            toast.error("Comments are required when rejecting a document.");
            return;
        }

        const isBudgetStep =
            selected.document.document_type === "purchase_request" &&
            selected.current_step.office_id === 4;

        let parsedBudgetAmount: number | null = null;

        if (isBudgetStep && action === "approved") {
            const amount = Number(budgetAmount);
            const requestedTotal = (
                selected.document.purchase_request_items ?? []
            ).reduce((sum, item) => sum + toNumber(item.amount), 0);

            if (!fundingSource.trim()) {
                toast.error("Enter the funding source before approving.");
                return;
            }

            if (budgetAvailability !== "available") {
                toast.error(
                    "Budget availability must be Available before approving.",
                );
                return;
            }

            if (
                !budgetAmount.trim() ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                toast.error(
                    "Enter a budget amount greater than zero before approving.",
                );
                return;
            }

            if (amount < requestedTotal) {
                toast.error(
                    `The budget amount must cover the requested total of ${formatCurrency(requestedTotal)}.`,
                );
                return;
            }

            parsedBudgetAmount = amount;
        }

        const trackingNumber = selected.document.tracking_number;

        if (
            !window.confirm(
                action === "approved"
                    ? `Approve ${trackingNumber}?`
                    : `Reject ${trackingNumber}?`,
            )
        ) {
            return;
        }

        const endpoint =
            action === "approved"
                ? `/admin/document-workflows/${selected.id}/approve`
                : `/admin/document-workflows/${selected.id}/reject`;

        setProcessingId(selected.id);

        router.post(
            endpoint,
            {
                comments: comments.trim() || null,
                ...(isBudgetStep
                    ? {
                          funding_source: fundingSource.trim() || null,
                          budget_availability: budgetAvailability || null,
                          budget_amount:
                              parsedBudgetAmount ??
                              (budgetAmount.trim() || null),
                          budget_remarks: budgetRemarks.trim() || null,
                      }
                    : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        action === "approved"
                            ? "Document approved successfully."
                            : "Document rejected successfully.",
                    );
                    setSelected(null);
                    setAction(null);
                    setComments("");
                    setFundingSource("");
                    setBudgetAvailability("");
                    setBudgetRemarks("");
                    setBudgetAmount("");
                },
                onError: (errors) => {
                    const message = Object.values(errors).find(
                        (value): value is string => typeof value === "string",
                    );

                    toast.error(
                        message ??
                            "Unable to process this approval. Please check your permissions and try again.",
                    );
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Pending Approvals" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Inbox className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Pending Approvals
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review documents assigned to you or your office.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.reload({ only: ["assignments"] })}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                    >
                        <RefreshCw className="size-4" />
                        Refresh
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <SummaryCard
                        label="Pending on This Page"
                        value={filteredAssignments.length}
                        icon={<Clock3 className="size-5" />}
                    />
                    <SummaryCard
                        label="Total Pending"
                        value={assignments.total}
                        icon={<FileText className="size-5" />}
                    />
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">Approval Queue</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Select a document to review and take action.
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search pending approvals..."
                                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">
                                        Document
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Current Step
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Originating Office
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Submitted
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {filteredAssignments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <Inbox className="mx-auto mb-3 size-9 text-muted-foreground/50" />
                                            <p className="font-medium">
                                                {assignments.data.length === 0
                                                    ? "No pending approvals"
                                                    : "No matching documents"}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {assignments.data.length === 0
                                                    ? "Documents assigned to you or your office will appear here."
                                                    : "Try another search term."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssignments.map((assignment) => {
                                        const document = assignment.document;

                                        return (
                                            <tr
                                                key={assignment.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="font-medium">
                                                        {document?.subject ??
                                                            "Document unavailable"}
                                                    </div>
                                                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                                                        {document?.tracking_number ??
                                                            `Workflow #${assignment.id}`}
                                                    </div>
                                                    <div className="mt-1 text-xs capitalize text-muted-foreground">
                                                        {formatLabel(
                                                            document?.document_type ??
                                                                "Unknown type",
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-medium">
                                                        {assignment.current_step
                                                            .name ??
                                                            "Unassigned step"}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {assignment.current_step
                                                            .office ??
                                                            assignment
                                                                .current_step
                                                                .approver ??
                                                            "No assignment details"}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Step{" "}
                                                        {assignment.current_step
                                                            .position ?? "—"}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {document?.originating_office ??
                                                        "Not assigned"}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                    {formatDate(
                                                        document?.submitted_at ??
                                                            assignment.started_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openReview(
                                                                    assignment,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                                                        >
                                                            <FileText className="size-3.5" />
                                                            Review
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                processingId !==
                                                                    null ||
                                                                !document ||
                                                                (assignment
                                                                    .current_step
                                                                    .office_id ===
                                                                    4 &&
                                                                    document.document_type ===
                                                                        "purchase_request" &&
                                                                    !budgetAssessmentComplete(
                                                                        document,
                                                                    ))
                                                            }
                                                            title={
                                                                assignment
                                                                    .current_step
                                                                    .office_id ===
                                                                    4 &&
                                                                document?.document_type ===
                                                                    "purchase_request" &&
                                                                !budgetAssessmentComplete(
                                                                    document,
                                                                )
                                                                    ? "Complete and save the Budget Assessment before approving."
                                                                    : undefined
                                                            }
                                                            onClick={() =>
                                                                openAction(
                                                                    assignment,
                                                                    "approved",
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="size-3.5" />
                                                            Approve
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                processingId !==
                                                                    null ||
                                                                !document
                                                            }
                                                            onClick={() =>
                                                                openAction(
                                                                    assignment,
                                                                    "rejected",
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <XCircle className="size-3.5" />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col justify-between gap-3 border-t p-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-muted-foreground">
                            Showing {assignments.from ?? 0}–
                            {assignments.to ?? 0} of {assignments.total} pending
                            approvals
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {assignments.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            });
                                        }
                                    }}
                                    className={`min-w-9 rounded-md border px-3 py-1.5 text-sm transition ${
                                        link.active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    } disabled:cursor-not-allowed disabled:opacity-40`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-2 backdrop-blur-sm sm:p-5"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeAction();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="approval-modal-title"
                        className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-2 border-slate-400 bg-background shadow-2xl dark:border-slate-600"
                    >
                        {/* Modal header */}
                        <header className="shrink-0 bg-slate-900 text-white">
                            <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
                                <div className="flex min-w-0 items-start gap-4">
                                    <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:flex">
                                        <FileText className="size-6 text-blue-200" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                                            Electronic Document Tracking System
                                        </p>
                                        <h2
                                            id="approval-modal-title"
                                            className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
                                        >
                                            {action
                                                ? action === "approved"
                                                    ? "Approve Document"
                                                    : "Reject Document"
                                                : "Document Review"}
                                        </h2>
                                        <p className="mt-2 break-all font-mono text-sm text-slate-300">
                                            {selected.document
                                                ?.tracking_number ??
                                                `Workflow #${selected.id}`}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeAction}
                                    disabled={processingId !== null}
                                    aria-label="Close dialog"
                                    className="shrink-0 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {selected.document && (
                                <div className="flex flex-col gap-3 border-t border-white/10 bg-white/5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-white">
                                            {selected.document.subject}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-300">
                                            {formatLabel(
                                                selected.document.document_type,
                                            )}
                                            {" · "}
                                            {selected.workflow.name ??
                                                "Workflow"}
                                            {" · "}
                                            Version{" "}
                                            {selected.workflow.version ?? "—"}
                                        </p>
                                    </div>

                                    <StatusBadge
                                        status={selected.document.status}
                                    />
                                </div>
                            )}
                        </header>

                        {/* Scrollable document body */}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {!selected.document ? (
                                <div className="p-8">
                                    <EmptySection message="The document record could not be loaded. You cannot approve or reject it from this view." />
                                </div>
                            ) : (
                                <div className="space-y-7 p-4 sm:p-7">
                                    {/* Summary cards */}
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <InfoCard
                                            icon={<Inbox className="size-4" />}
                                            label="Originating Office"
                                            value={
                                                selected.document
                                                    .originating_office ??
                                                "Not assigned"
                                            }
                                        />
                                        <InfoCard
                                            icon={
                                                <FileText className="size-4" />
                                            }
                                            label="Submitted By"
                                            value={
                                                selected.document.submitter ??
                                                "Unknown"
                                            }
                                        />
                                        <InfoCard
                                            icon={<Clock3 className="size-4" />}
                                            label="Submitted Date"
                                            value={formatDate(
                                                selected.document
                                                    .submitted_at ??
                                                    selected.started_at,
                                            )}
                                        />
                                        <InfoCard
                                            icon={
                                                <FileClock className="size-4" />
                                            }
                                            label="Current Approval"
                                            value={
                                                selected.current_step.name ??
                                                "Unassigned"
                                            }
                                            detail={
                                                selected.current_step.office ??
                                                selected.current_step
                                                    .approver ??
                                                undefined
                                            }
                                        />
                                    </div>

                                    {/* Main document information */}
                                    <section>
                                        <SectionHeading
                                            icon={
                                                <FileText className="size-4" />
                                            }
                                            title="Document Information"
                                            subtitle="Document identity, status, and description"
                                        />

                                        <div className="mt-3 rounded-xl border bg-card p-4 sm:p-5">
                                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                                <Detail
                                                    label="Tracking Number"
                                                    value={
                                                        selected.document
                                                            .tracking_number
                                                    }
                                                />
                                                <Detail
                                                    label="Document Type"
                                                    value={formatLabel(
                                                        selected.document
                                                            .document_type,
                                                    )}
                                                />
                                                <Detail
                                                    label="Document Status"
                                                    value={formatLabel(
                                                        selected.document
                                                            .status,
                                                    )}
                                                />
                                                <Detail
                                                    label="Workflow"
                                                    value={
                                                        selected.workflow
                                                            .name ??
                                                        "Unknown workflow"
                                                    }
                                                />
                                                <Detail
                                                    label="Workflow Version"
                                                    value={`Version ${selected.workflow.version ?? "—"}`}
                                                />
                                                <Detail
                                                    label="Workflow Step"
                                                    value={`${selected.current_step.position ?? "—"}${selected.current_step.name ? ` · ${selected.current_step.name}` : ""}`}
                                                />
                                                {selected.document
                                                    .document_type ===
                                                    "purchase_request" && (
                                                    <>
                                                        <Detail
                                                            label="Requested Delivery Date"
                                                            value={
                                                                selected
                                                                    .document
                                                                    .requested_delivery_date ??
                                                                "—"
                                                            }
                                                        />
                                                        <Detail
                                                            label="Funding Source"
                                                            value={
                                                                selected
                                                                    .document
                                                                    .funding_source ??
                                                                "Not assigned yet"
                                                            }
                                                        />
                                                        <Detail
                                                            label="Budget Availability"
                                                            value={
                                                                selected
                                                                    .document
                                                                    .budget_availability
                                                                    ? formatLabel(
                                                                          selected
                                                                              .document
                                                                              .budget_availability,
                                                                      )
                                                                    : "Not assessed"
                                                            }
                                                        />
                                                        <Detail
                                                            label="Budget Amount"
                                                            value={
                                                                selected
                                                                    .document
                                                                    .budget_amount !==
                                                                    null &&
                                                                selected
                                                                    .document
                                                                    .budget_amount !==
                                                                    undefined
                                                                    ? formatCurrency(
                                                                          selected
                                                                              .document
                                                                              .budget_amount,
                                                                      )
                                                                    : "Not recorded"
                                                            }
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            <div className="mt-5 border-t pt-5">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Subject
                                                </p>
                                                <h3 className="mt-1 text-lg font-semibold">
                                                    {selected.document.subject}
                                                </h3>

                                                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Description
                                                </p>
                                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                                                    {selected.document
                                                        .description ||
                                                        "No description provided."}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Dynamic fields for different document types */}
                                    <DynamicDocumentDetails
                                        document={selected.document}
                                    />

                                    {/* Purchase request items */}
                                    <PurchaseRequestDetails
                                        items={
                                            selected.document
                                                .purchase_request_items ?? []
                                        }
                                    />

                                    {/* Attachments */}
                                    <AttachmentsSection
                                        attachments={
                                            selected.document.attachments ?? []
                                        }
                                    />

                                    {/* Workflow history */}
                                    <WorkflowHistorySection
                                        history={selected.history ?? []}
                                    />

                                    {!action &&
                                        selected.document.document_type ===
                                            "purchase_request" &&
                                        selected.current_step.office_id ===
                                            4 && (
                                            <form
                                                onSubmit={submitBudgetReview}
                                                className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 sm:p-5 dark:border-amber-900 dark:bg-amber-950/20"
                                            >
                                                <SectionHeading
                                                    icon={
                                                        <FileText className="size-4" />
                                                    }
                                                    title="Budget Office Assessment"
                                                    subtitle="Record the funding source and budget status without advancing the workflow."
                                                />

                                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <label
                                                            htmlFor="budget-funding-source"
                                                            className="text-sm font-semibold"
                                                        >
                                                            Funding Source{" "}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </label>
                                                        <input
                                                            id="budget-funding-source"
                                                            value={
                                                                fundingSource
                                                            }
                                                            onChange={(event) =>
                                                                setFundingSource(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            maxLength={150}
                                                            required
                                                            placeholder="e.g. General Fund, SEF, 20% Development Fund"
                                                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </div>

                                                    <div className="space-y-2 sm:col-span-2">
                                                        <label
                                                            htmlFor="budget-amount"
                                                            className="text-sm font-semibold"
                                                        >
                                                            Budget Amount (PHP){" "}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </label>
                                                        <input
                                                            id="budget-amount"
                                                            type="number"
                                                            inputMode="decimal"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={budgetAmount}
                                                            onChange={(event) =>
                                                                setBudgetAmount(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                            placeholder="Enter the budget allocated for this request"
                                                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Total requested:{" "}
                                                            <span className="font-semibold">
                                                                {formatCurrency(
                                                                    (
                                                                        selected
                                                                            .document
                                                                            .purchase_request_items ??
                                                                        []
                                                                    ).reduce(
                                                                        (
                                                                            sum,
                                                                            item,
                                                                        ) =>
                                                                            sum +
                                                                            toNumber(
                                                                                item.amount,
                                                                            ),
                                                                        0,
                                                                    ),
                                                                )}
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2 sm:col-span-2">
                                                        <label
                                                            htmlFor="budget-availability"
                                                            className="text-sm font-semibold"
                                                        >
                                                            Budget Availability{" "}
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </label>
                                                        <select
                                                            id="budget-availability"
                                                            value={
                                                                budgetAvailability
                                                            }
                                                            onChange={(event) =>
                                                                setBudgetAvailability(
                                                                    event.target
                                                                        .value as
                                                                        | "available"
                                                                        | "unavailable"
                                                                        | "requires_correction"
                                                                        | "",
                                                                )
                                                            }
                                                            required
                                                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                        >
                                                            <option value="">
                                                                Select
                                                                assessment
                                                            </option>
                                                            <option value="available">
                                                                Available
                                                            </option>
                                                            <option value="unavailable">
                                                                Unavailable
                                                            </option>
                                                            <option value="requires_correction">
                                                                Requires
                                                                Correction
                                                            </option>
                                                        </select>
                                                        {budgetAvailability ===
                                                            "unavailable" && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Saving this
                                                                assessment does
                                                                not advance the
                                                                workflow. The PR
                                                                will remain at
                                                                the Budget
                                                                Office step.
                                                            </p>
                                                        )}
                                                        {budgetAvailability ===
                                                            "requires_correction" && (
                                                            <p className="text-xs text-amber-800 dark:text-amber-200">
                                                                This records the
                                                                correction
                                                                requirement but
                                                                does not yet
                                                                return the PR to
                                                                the originating
                                                                office.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 sm:col-span-2">
                                                        <label
                                                            htmlFor="budget-remarks"
                                                            className="text-sm font-semibold"
                                                        >
                                                            Budget Remarks
                                                        </label>
                                                        <textarea
                                                            id="budget-remarks"
                                                            value={
                                                                budgetRemarks
                                                            }
                                                            onChange={(event) =>
                                                                setBudgetRemarks(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            maxLength={5000}
                                                            rows={3}
                                                            placeholder="Explain the budget assessment or required corrections..."
                                                            className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                        />
                                                        <p className="text-right text-xs text-muted-foreground">
                                                            {
                                                                budgetRemarks.length
                                                            }
                                                            /5000 characters
                                                        </p>
                                                    </div>
                                                </div>

                                                {selected.document
                                                    .funding_source && (
                                                    <div className="mt-4 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                                                        <p>
                                                            Last recorded
                                                            funding source:{" "}
                                                            <span className="font-medium text-foreground">
                                                                {
                                                                    selected
                                                                        .document
                                                                        .funding_source
                                                                }
                                                            </span>
                                                        </p>
                                                        {selected.document
                                                            .funding_source_assigner && (
                                                            <p className="mt-1">
                                                                Recorded by{" "}
                                                                {
                                                                    selected
                                                                        .document
                                                                        .funding_source_assigner
                                                                }{" "}
                                                                ·{" "}
                                                                {formatDate(
                                                                    selected
                                                                        .document
                                                                        .funding_source_assigned_at ??
                                                                        null,
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            processingId !==
                                                                null ||
                                                            !fundingSource.trim() ||
                                                            !budgetAvailability ||
                                                            !budgetAmount.trim() ||
                                                            !Number.isFinite(
                                                                Number(
                                                                    budgetAmount,
                                                                ),
                                                            ) ||
                                                            Number(
                                                                budgetAmount,
                                                            ) <= 0 ||
                                                            (budgetAvailability ===
                                                                "available" &&
                                                                Number(
                                                                    budgetAmount,
                                                                ) <
                                                                    (
                                                                        selected
                                                                            .document
                                                                            .purchase_request_items ??
                                                                        []
                                                                    ).reduce(
                                                                        (
                                                                            sum,
                                                                            item,
                                                                        ) =>
                                                                            sum +
                                                                            toNumber(
                                                                                item.amount,
                                                                            ),
                                                                        0,
                                                                    ))
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {processingId ===
                                                        selected.id ? (
                                                            <>
                                                                <LoaderCircle className="size-4 animate-spin" />{" "}
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="size-4" />{" "}
                                                                Save Budget
                                                                Assessment
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                    {!action && (
                                        <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                                            <MessageSquare className="mt-0.5 size-5 shrink-0" />
                                            <div>
                                                <p className="font-semibold">
                                                    Before you decide
                                                </p>
                                                <p className="mt-1 leading-6">
                                                    Check the submitted details,
                                                    supporting attachments, and
                                                    workflow history. Approval
                                                    advances the document to the
                                                    next workflow step.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {action && (
                                        <form
                                            onSubmit={submitAction}
                                            className="rounded-xl border p-4 sm:p-5"
                                        >
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="approval-comments"
                                                    className="flex items-center gap-2 text-sm font-semibold"
                                                >
                                                    <MessageSquare className="size-4" />
                                                    {action === "approved"
                                                        ? "Approval Remarks"
                                                        : "Reason for Rejection"}
                                                    {action === "rejected" && (
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    )}
                                                </label>

                                                <textarea
                                                    id="approval-comments"
                                                    value={comments}
                                                    onChange={(event) =>
                                                        setComments(
                                                            event.target.value,
                                                        )
                                                    }
                                                    required={
                                                        action === "rejected"
                                                    }
                                                    maxLength={5000}
                                                    rows={4}
                                                    placeholder={
                                                        action === "approved"
                                                            ? "Add approval remarks (optional)..."
                                                            : "Explain why this document is being rejected..."
                                                    }
                                                    className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />

                                                <p className="text-right text-xs text-muted-foreground">
                                                    {comments.length}/5000
                                                    characters
                                                </p>
                                            </div>

                                            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAction(null);
                                                        setComments("");
                                                    }}
                                                    disabled={
                                                        processingId !== null
                                                    }
                                                    className="rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                                                >
                                                    Back to Review
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        processingId !== null ||
                                                        !selected.document ||
                                                        (action ===
                                                            "rejected" &&
                                                            !comments.trim()) ||
                                                        (action ===
                                                            "approved" &&
                                                            selected.document
                                                                .document_type ===
                                                                "purchase_request" &&
                                                            selected
                                                                .current_step
                                                                .office_id ===
                                                                4 &&
                                                            (!fundingSource.trim() ||
                                                                budgetAvailability !==
                                                                    "available" ||
                                                                !budgetAmount.trim() ||
                                                                !Number.isFinite(
                                                                    Number(
                                                                        budgetAmount,
                                                                    ),
                                                                ) ||
                                                                Number(
                                                                    budgetAmount,
                                                                ) <= 0 ||
                                                                Number(
                                                                    budgetAmount,
                                                                ) <
                                                                    (
                                                                        selected
                                                                            .document
                                                                            .purchase_request_items ??
                                                                        []
                                                                    ).reduce(
                                                                        (
                                                                            sum,
                                                                            item,
                                                                        ) =>
                                                                            sum +
                                                                            toNumber(
                                                                                item.amount,
                                                                            ),
                                                                        0,
                                                                    )))
                                                    }
                                                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        action === "approved"
                                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                                            : "bg-red-600 hover:bg-red-700"
                                                    }`}
                                                >
                                                    {processingId ===
                                                    selected.id ? (
                                                        <>
                                                            <LoaderCircle className="size-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : action ===
                                                      "approved" ? (
                                                        <>
                                                            <CheckCircle2 className="size-4" />
                                                            Confirm Approval
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="size-4" />
                                                            Confirm Rejection
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sticky footer */}
                        {!action && (
                            <footer className="shrink-0 border-t bg-background px-4 py-3 sm:px-7">
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="hidden text-xs text-muted-foreground sm:block">
                                        EDTS · Document approval workspace
                                    </p>

                                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={closeAction}
                                            className="rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                processingId !== null ||
                                                !selected.document
                                            }
                                            onClick={() =>
                                                openAction(selected, "rejected")
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40 disabled:opacity-50"
                                        >
                                            <XCircle className="size-4" />
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                processingId !== null ||
                                                !selected.document ||
                                                (selected.current_step
                                                    .office_id === 4 &&
                                                    selected.document
                                                        .document_type ===
                                                        "purchase_request" &&
                                                    !budgetAssessmentValuesComplete(
                                                        selected.document,
                                                        fundingSource,
                                                        budgetAvailability,
                                                        budgetAmount,
                                                    ))
                                            }
                                            title={
                                                selected.current_step
                                                    .office_id === 4 &&
                                                selected.document
                                                    ?.document_type ===
                                                    "purchase_request" &&
                                                !budgetAssessmentValuesComplete(
                                                    selected.document,
                                                    fundingSource,
                                                    budgetAvailability,
                                                    budgetAmount,
                                                )
                                                    ? "Complete and save the Budget Assessment before approving."
                                                    : undefined
                                            }
                                            onClick={() =>
                                                openAction(selected, "approved")
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </footer>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}

function StatusBadge({ status }: { status: string }) {
    const normalized = status.toLowerCase();

    const styles =
        normalized === "completed" || normalized === "approved"
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
            : normalized === "rejected"
              ? "border-red-400/30 bg-red-400/10 text-red-200"
              : "border-amber-300/30 bg-amber-300/10 text-amber-200";

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
        >
            <span className="size-1.5 rounded-full bg-current" />
            {formatLabel(status)}
        </span>
    );
}

function InfoCard({
    icon,
    label,
    value,
    detail,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="min-w-0 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-xs font-medium uppercase tracking-wide">
                    {label}
                </span>
            </div>
            <p className="mt-3 break-words text-sm font-semibold">{value}</p>
            {detail && (
                <p className="mt-1 break-words text-xs text-muted-foreground">
                    {detail}
                </p>
            )}
        </div>
    );
}

function SectionHeading({
    icon,
    title,
    subtitle,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold tracking-tight">{title}</h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

function DynamicDocumentDetails({ document }: { document: DocumentDetails }) {
    const entries = Object.entries(document.template_data ?? {}).filter(
        ([key, value]) =>
            !["id", "document_id", "created_at", "updated_at"].includes(
                key.toLowerCase(),
            ) &&
            value !== null &&
            value !== undefined &&
            value !== "",
    );

    if (entries.length === 0) return null;

    return (
        <section>
            <SectionHeading
                icon={<FileText className="size-4" />}
                title="Additional Document Details"
                subtitle="Information specific to this document type"
            />

            <div className="mt-3 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 sm:p-5">
                {entries.map(([key, value]) => (
                    <div key={key} className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {formatLabel(key)}
                        </p>
                        <div className="mt-1 break-words whitespace-pre-wrap text-sm leading-6">
                            {formatDynamicValue(value)}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PurchaseRequestDetails({ items }: { items: PurchaseRequestItem[] }) {
    if (items.length === 0) return null;

    const total = items.reduce((sum, item) => sum + toNumber(item.amount), 0);

    return (
        <section>
            <SectionHeading
                icon={<Package className="size-4" />}
                title="Requested Items"
                subtitle={`${items.length} line item${items.length === 1 ? "" : "s"} in this request`}
            />

            <div className="mt-3 overflow-hidden rounded-xl border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-semibold">#</th>
                                <th className="px-4 py-3 font-semibold">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Quantity
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                    Unit
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Unit Price
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {item.item_number}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {item.description}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatNumber(item.quantity)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.unit || "—"}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                        {formatCurrency(item.unit_price)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                                        {formatCurrency(item.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-1 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Total Requested Amount
                    </p>
                    <p className="text-xl font-bold tabular-nums">
                        {formatCurrency(total)}
                    </p>
                </div>
            </div>
        </section>
    );
}

function AttachmentsSection({ attachments }: { attachments: Attachment[] }) {
    return (
        <section>
            <SectionHeading
                icon={<Paperclip className="size-4" />}
                title="Supporting Attachments"
                subtitle={`${attachments.length} file${attachments.length === 1 ? "" : "s"} attached`}
            />

            {attachments.length === 0 ? (
                <EmptySection message="No attachments were uploaded for this document." />
            ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex min-w-0 items-start gap-3 rounded-xl border bg-card p-4"
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-semibold">
                                    {attachment.original_name}
                                </p>

                                <p className="mt-1 break-words text-xs text-muted-foreground">
                                    {attachment.mime_type ||
                                        "Unknown file type"}
                                    {" · "}
                                    {formatFileSize(attachment.file_size)}
                                </p>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Uploaded {formatDate(attachment.created_at)}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    {attachment.uploaded_by
                                        ? `Uploader ID: ${attachment.uploaded_by}`
                                        : "Uploader unavailable"}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <a
                                        href={`/admin/attachments/${attachment.id}/view`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                                    >
                                        <FileText className="size-3.5" />
                                        View
                                    </a>

                                    <a
                                        href={`/admin/attachments/${attachment.id}/download`}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                                    >
                                        <Paperclip className="size-3.5" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function WorkflowHistorySection({ history }: { history: HistoryEntry[] }) {
    return (
        <section>
            <SectionHeading
                icon={<History className="size-4" />}
                title="Workflow History"
                subtitle="Recorded actions and approval remarks"
            />

            {history.length === 0 ? (
                <EmptySection message="No workflow actions have been recorded or supplied for this assignment." />
            ) : (
                <div className="mt-3 rounded-xl border bg-card p-4 sm:p-5">
                    <ol className="space-y-5">
                        {history.map((entry, index) => (
                            <li key={entry.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                                            entry.action.toLowerCase() ===
                                            "approved"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                : entry.action.toLowerCase() ===
                                                    "rejected"
                                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                  : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {entry.action.toLowerCase() ===
                                        "approved" ? (
                                            <CheckCircle2 className="size-4" />
                                        ) : entry.action.toLowerCase() ===
                                          "rejected" ? (
                                            <XCircle className="size-4" />
                                        ) : (
                                            <Clock3 className="size-4" />
                                        )}
                                    </div>
                                    {index < history.length - 1 && (
                                        <div className="mt-1 min-h-6 w-px flex-1 bg-border" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1 pb-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-semibold">
                                            {formatLabel(entry.action)}
                                        </p>
                                        <time className="text-xs text-muted-foreground">
                                            {formatDate(entry.acted_at)}
                                        </time>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        By {entry.user || "Unknown user"}
                                    </p>

                                    {entry.comments && (
                                        <div className="mt-3 rounded-lg bg-muted/50 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Remarks
                                            </p>
                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                                                {entry.comments}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </section>
    );
}

function EmptySection({ message }: { message: string }) {
    return (
        <div className="mt-3 rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
            {message}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className="text-muted-foreground">{icon}</span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                {value}
            </p>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium">{value}</p>
        </div>
    );
}

function formatDate(value: string | null): string {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatLabel(value: string): string {
    return value
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDynamicValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value, null, 2) ?? "—";
    return String(value);
}

function toNumber(value: number | string | null | undefined): number {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number | string): string {
    return new Intl.NumberFormat("en-PH", {
        maximumFractionDigits: 2,
    }).format(toNumber(value));
}

function formatCurrency(value: number | string): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(toNumber(value));
}

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

PendingApprovals.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
        {
            title: "Pending Approvals",
            href: "/admin/pending-approvals",
        },
    ] satisfies BreadcrumbItem[],
};
