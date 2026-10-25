import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock3,
    FileClock,
    FileText,
    GitBranch,
    UserRound,
    XCircle,
} from "lucide-react";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type Office = {
    id: number;
    name: string;
};

type User = {
    id: number;
    name: string;
};

type WorkflowStep = {
    id: number;
    original_step_id: number | null;
    name: string;
    position: number;
    step_type: string;
    office: Office | null;
    approver: User | null;
};

type WorkflowAction = {
    id: number;
    workflow_step_id: number | null;
    workflow_version_step_id: number | null;
    action: string;
    comments: string | null;
    acted_at: string | null;
    user: User | null;
    workflow_version_step: WorkflowStep | null;
    workflow_step?: WorkflowStep | null;
};

type WorkflowVersion = {
    id: number;
    version: number;
    status: string;
    steps: WorkflowStep[];
    workflow: {
        id: number;
        name: string;
        code: string;
    } | null;
};

type WorkflowAssignment = {
    id: number;
    status: string;
    current_step_id: number | null;
    current_version_step_id: number | null;
    started_at: string | null;
    completed_at: string | null;
    workflow_version: WorkflowVersion | null;
    actions: WorkflowAction[];
};

type DocumentRecord = {
    id: number;
    tracking_number: string;
    document_type: string;
    subject: string;
    description: string | null;
    status: string;
    originating_office: Office | null;
    submitter: User | null;
    submitted_at: string | null;
    completed_at: string | null;
    created_at: string;
    workflow_assignments: WorkflowAssignment[];
};

type Props = {
    document: DocumentRecord;
};

type TimelineStatus =
    | "completed"
    | "current"
    | "pending"
    | "rejected"
    | "not_reached";

type TimelineItem = {
    step: WorkflowStep;
    status: TimelineStatus;
    action: WorkflowAction | null;
};

export default function DocumentHistoryShow({ document }: Props) {
    const assignments = [...(document.workflow_assignments ?? [])].sort(
        (a, b) => b.id - a.id,
    );

    const latestAssignment = assignments[0] ?? null;

    const actions = assignments
        .flatMap((assignment) =>
            (assignment.actions ?? []).map((action) => ({
                ...action,
                assignment,
            })),
        )
        .sort((a, b) => {
            const dateA = a.acted_at ? new Date(a.acted_at).getTime() : 0;
            const dateB = b.acted_at ? new Date(b.acted_at).getTime() : 0;

            return dateA - dateB;
        });

    const latestVersion = latestAssignment?.workflow_version ?? null;

    const versionSteps = [...(latestVersion?.steps ?? [])].sort(
        (a, b) => a.position - b.position,
    );

    const latestActions = latestAssignment?.actions ?? [];

    const rejectedAction = latestActions.find((action) =>
        ["reject", "rejected"].includes(action.action.toLowerCase()),
    );

    const timeline: TimelineItem[] = versionSteps.map((step) => {
        const action =
            latestActions.find(
                (item) => item.workflow_version_step_id === step.id,
            ) ??
            latestActions.find(
                (item) =>
                    item.workflow_version_step_id == null &&
                    item.workflow_step_id != null &&
                    item.workflow_step_id === step.original_step_id,
            ) ??
            null;

        const actionName = action?.action.toLowerCase();

        let status: TimelineStatus;

        if (["reject", "rejected"].includes(actionName ?? "")) {
            status = "rejected";
        } else if (["approve", "approved"].includes(actionName ?? "")) {
            status = "completed";
        } else if (latestAssignment?.status === "rejected") {
            status = "not_reached";
        } else if (
            latestAssignment?.status === "in_progress" &&
            latestAssignment.current_version_step_id === step.id
        ) {
            status = "current";
        } else if (latestAssignment?.status === "completed") {
            // A completed workflow should have an action for every
            // actionable step. Do not invent a completed action.
            status = "not_reached";
        } else {
            status = "pending";
        }

        return { step, status, action };
    });

    const currentTimelineItem = timeline.find(
        (item) => item.status === "current",
    );

    const nextOffice =
        currentTimelineItem?.step.office?.name ??
        currentTimelineItem?.step.approver?.name ??
        null;

    return (
        <>
            <Head title={`Document History — ${document.tracking_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <Link
                            href="/admin/document-history"
                            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Document History
                        </Link>

                        <div className="flex items-center gap-2">
                            <FileClock className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Document Audit Trail
                            </h1>
                        </div>

                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                            {document.tracking_number}
                        </p>
                    </div>

                    <StatusBadge status={document.status} />
                </div>

                <section className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
                    <div className="mb-5 flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        <h2 className="font-semibold">Document Information</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoField label="Subject" value={document.subject} />

                        <InfoField
                            label="Document Type"
                            value={document.document_type.replaceAll("_", " ")}
                        />

                        <InfoField
                            label="Tracking Number"
                            value={document.tracking_number}
                            mono
                        />

                        <InfoField
                            label="Originating Office"
                            value={
                                document.originating_office?.name ??
                                "Not assigned"
                            }
                        />

                        <InfoField
                            label="Submitted By"
                            value={document.submitter?.name ?? "Unknown"}
                        />

                        <InfoField
                            label="Date Created"
                            value={formatDate(document.created_at)}
                        />

                        <InfoField
                            label="Date Submitted"
                            value={formatDate(document.submitted_at)}
                        />

                        <InfoField
                            label="Date Completed"
                            value={formatDate(document.completed_at)}
                        />
                    </div>

                    {document.description && (
                        <div className="mt-5 border-t pt-5">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Description
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm">
                                {document.description}
                            </p>
                        </div>
                    )}
                </section>

                <section className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-5">
                        <div className="flex items-center gap-2">
                            <GitBranch className="size-5 text-primary" />
                            <h2 className="font-semibold">
                                Workflow Information
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            The published workflow version assigned to this
                            document.
                        </p>
                    </div>

                    {assignments.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No workflow assignment was found for this document.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {assignment.workflow_version
                                                ?.workflow?.name ?? "Workflow"}
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Version{" "}
                                            {assignment.workflow_version
                                                ?.version ?? "—"}
                                            {" · "}
                                            Started{" "}
                                            {formatDate(assignment.started_at)}
                                        </p>
                                    </div>

                                    <StatusBadge status={assignment.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-5">
                        <div className="flex items-center gap-2">
                            <GitBranch className="size-5 text-primary" />
                            <h2 className="font-semibold">
                                Complete Workflow Timeline
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Every step in the assigned workflow version,
                            including steps that have not been reached.
                        </p>

                        {nextOffice && (
                            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Awaiting action from
                                </p>
                                <p className="mt-1 font-semibold">
                                    {nextOffice}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {currentTimelineItem?.step.name}
                                </p>
                            </div>
                        )}
                    </div>

                    {timeline.length === 0 ? (
                        <div className="p-10 text-center">
                            <Clock3 className="mx-auto mb-3 size-9 text-muted-foreground/50" />

                            <p className="font-medium">
                                No workflow steps available
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                The assigned workflow version has no immutable
                                step records.
                            </p>
                        </div>
                    ) : (
                        <div className="p-5 md:p-8">
                            <div className="relative space-y-0">
                                {timeline.map((item, index) => (
                                    <div
                                        key={item.step.id}
                                        className="relative flex gap-4 pb-8 last:pb-0"
                                    >
                                        {index < timeline.length - 1 && (
                                            <div className="absolute bottom-0 left-[17px] top-9 w-px bg-border" />
                                        )}

                                        <TimelineIcon status={item.status} />

                                        <div
                                            className={`min-w-0 flex-1 rounded-xl border p-4 ${
                                                item.status === "current"
                                                    ? "border-primary/50 bg-primary/5"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                                <div>
                                                    <p className="font-semibold">
                                                        Step{" "}
                                                        {item.step.position}:{" "}
                                                        {item.step.name}
                                                    </p>

                                                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                                                        {item.step.step_type.replaceAll(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </p>
                                                </div>

                                                <TimelineStatusBadge
                                                    status={item.status}
                                                />
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <div className="flex items-start gap-2">
                                                    <UserRound className="mt-0.5 size-4 text-muted-foreground" />

                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Assigned Approver
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {item.step.approver
                                                                ?.name ??
                                                                "Office assignment"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <FileText className="mt-0.5 size-4 text-muted-foreground" />

                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Responsible Office
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {item.step.office
                                                                ?.name ??
                                                                "Not specified"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {item.action && (
                                                <div className="mt-4 border-t pt-4">
                                                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                                        <p className="text-sm">
                                                            <span className="text-muted-foreground">
                                                                Action by:{" "}
                                                            </span>
                                                            <span className="font-medium">
                                                                {item.action
                                                                    .user
                                                                    ?.name ??
                                                                    "Unknown user"}
                                                            </span>
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDateTime(
                                                                item.action
                                                                    .acted_at,
                                                            )}
                                                        </p>
                                                    </div>

                                                    {item.action.comments && (
                                                        <div className="mt-3 rounded-lg bg-muted/40 p-3">
                                                            <p className="text-xs font-medium text-muted-foreground">
                                                                Comments
                                                            </p>
                                                            <p className="mt-1 whitespace-pre-wrap text-sm">
                                                                {
                                                                    item.action
                                                                        .comments
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {item.status === "not_reached" && (
                                                <p className="mt-3 text-xs text-muted-foreground">
                                                    This step has no recorded
                                                    action in this workflow run.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
                                <TimelineLegend status="completed" />
                                <TimelineLegend status="current" />
                                <TimelineLegend status="pending" />
                                <TimelineLegend status="rejected" />
                                <TimelineLegend status="not_reached" />
                            </div>
                        </div>
                    )}
                </section>

                <section className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                Recorded Approval Actions
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                The chronological audit log of actions actually
                                recorded by EDTS.
                            </p>
                        </div>

                        <span className="text-sm text-muted-foreground">
                            {actions.length}{" "}
                            {actions.length === 1 ? "action" : "actions"}
                        </span>
                    </div>

                    {actions.length === 0 ? (
                        <div className="p-10 text-center text-sm text-muted-foreground">
                            No workflow actions have been recorded.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {actions.map((item) => {
                                const step =
                                    item.workflow_version_step ??
                                    item.workflow_step ??
                                    null;

                                return (
                                    <div
                                        key={`${item.assignment.id}-${item.id}`}
                                        className="p-5"
                                    >
                                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                            <div>
                                                <p className="font-medium capitalize">
                                                    {item.action.replaceAll(
                                                        "_",
                                                        " ",
                                                    )}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {step?.name ??
                                                        "Workflow step"}
                                                    {step?.office?.name
                                                        ? ` · ${step.office.name}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(item.acted_at)}
                                            </p>
                                        </div>

                                        <p className="mt-3 text-sm">
                                            <span className="text-muted-foreground">
                                                Recorded by:{" "}
                                            </span>
                                            {item.user?.name ?? "Unknown user"}
                                        </p>

                                        {item.comments && (
                                            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">
                                                {item.comments}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <div>
                    <Link
                        href="/admin/document-history"
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Document History
                    </Link>
                </div>
            </div>
        </>
    );
}

function TimelineIcon({ status }: { status: TimelineStatus }) {
    const styles: Record<TimelineStatus, string> = {
        completed:
            "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950",
        current: "border-primary bg-primary/10 text-primary",
        pending: "border-border bg-muted text-muted-foreground",
        rejected:
            "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950",
        not_reached: "border-border bg-muted/50 text-muted-foreground",
    };

    return (
        <div
            className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border ${styles[status]}`}
        >
            {status === "completed" ? (
                <CheckCircle2 className="size-5" />
            ) : status === "current" ? (
                <Clock3 className="size-5" />
            ) : status === "rejected" ? (
                <XCircle className="size-5" />
            ) : (
                <Circle className="size-5" />
            )}
        </div>
    );
}

function TimelineStatusBadge({ status }: { status: TimelineStatus }) {
    const labels: Record<TimelineStatus, string> = {
        completed: "Completed",
        current: "Current step",
        pending: "Pending",
        rejected: "Rejected",
        not_reached: "Not reached",
    };

    const styles: Record<TimelineStatus, string> = {
        completed:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        current:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        pending: "bg-muted text-muted-foreground",
        rejected:
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        not_reached: "bg-muted/70 text-muted-foreground",
    };

    return (
        <span
            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}

function TimelineLegend({ status }: { status: TimelineStatus }) {
    return <TimelineStatusBadge status={status} />;
}

function InfoField({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p
                className={`mt-1 break-words text-sm font-medium capitalize ${
                    mono ? "font-mono normal-case" : ""
                }`}
            >
                {value || "—"}
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: "bg-muted text-muted-foreground",
        submitted:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        in_progress:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        completed:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        rejected:
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                styles[status] ?? "bg-muted text-muted-foreground"
            }`}
        >
            {status.replaceAll("_", " ")}
        </span>
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
    }).format(date);
}

function formatDateTime(value: string | null): string {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

DocumentHistoryShow.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
        {
            title: "Document History",
            href: "/admin/document-history",
        },
        {
            title: "Audit Trail",
            href: "#",
        },
    ] satisfies BreadcrumbItem[],
};
