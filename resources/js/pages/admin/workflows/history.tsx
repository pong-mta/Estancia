import { Head, Link } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FileText,
    GitBranch,
    History,
} from "lucide-react";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type VersionStep = {
    id: number;
    original_step_id?: number | null;
    name: string;
    step_type: string;
    position: number;
    office?: {
        id: number;
        code: string;
        name: string;
    } | null;
    approver?: {
        id: number;
        name: string;
        email: string;
    } | null;
    settings?: Record<string, unknown> | null;
};

type WorkflowVersionRecord = {
    id: number;
    version: number;
    status: string;
    published_at: string | null;
    publisher: {
        id: number;
        name: string;
    } | null;
    steps?: VersionStep[];
    definition: {
        name?: string;
        code?: string;
        document_type?: string;
        steps?: VersionStep[];
    };
};

type Props = {
    workflow: {
        id: number;
        name: string;
        code: string;
        version: number;
        status: string;
    };
    versions: WorkflowVersionRecord[];
};

function formatDate(value: string | null): string {
    if (!value) return "—";

    return new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: dashboard() },
    { title: "Workflow Designer", href: "/admin/workflows" },
    { title: "Version History", href: "#" },
];

function getVersionSteps(version: WorkflowVersionRecord): VersionStep[] {
    // Prefer independently stored immutable version steps.
    // Fall back to the JSON snapshot for older versions.
    const savedSteps =
        version.steps && version.steps.length > 0
            ? version.steps
            : (version.definition?.steps ?? []);

    return [...savedSteps].sort((a, b) => a.position - b.position);
}

export default function WorkflowHistory({ workflow, versions }: Props) {
    return (
        <>
            <Head title={`Version History — ${workflow.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <History className="size-4" />
                            Workflow Version History
                        </div>

                        <h1 className="text-2xl font-semibold tracking-tight">
                            {workflow.name}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Code: {workflow.code} · Current draft/published
                            version: v{workflow.version}
                        </p>
                    </div>

                    <Link
                        href="/admin/workflows"
                        className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Workflows
                    </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Saved Versions
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                            {versions.length}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Published Versions
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                            {
                                versions.filter(
                                    (version) => version.status === "published",
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Current Workflow Status
                        </p>
                        <p className="mt-2 text-2xl font-semibold capitalize">
                            {workflow.status}
                        </p>
                    </div>
                </div>

                {versions.length === 0 ? (
                    <div className="rounded-xl border bg-card px-6 py-16 text-center">
                        <History className="mx-auto mb-3 size-10 text-muted-foreground/50" />

                        <h2 className="font-semibold">
                            No published versions yet
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Publish this workflow to create its first saved
                            version snapshot.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">
                                Published Version Registry
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Review saved workflow definitions, their steps,
                                and publication details.
                            </p>
                        </div>

                        <div className="divide-y">
                            {versions.map((version) => {
                                const steps = getVersionSteps(version);

                                return (
                                    <section key={version.id} className="p-5">
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                                                    <GitBranch className="size-5 text-muted-foreground" />
                                                </div>

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold">
                                                            Version v
                                                            {version.version}
                                                        </h3>

                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700 dark:text-emerald-400">
                                                            <CheckCircle2 className="size-3.5" />
                                                            {version.status}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {version.definition
                                                            ?.document_type ??
                                                            "Document workflow"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-sm sm:text-right">
                                                <p className="flex items-center gap-1.5 text-muted-foreground sm:justify-end">
                                                    <Clock3 className="size-4" />
                                                    {formatDate(
                                                        version.published_at,
                                                    )}
                                                </p>

                                                <p className="mt-1 text-muted-foreground">
                                                    Published by{" "}
                                                    <span className="font-medium text-foreground">
                                                        {version.publisher
                                                            ?.name ??
                                                            "Unknown user"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <FileText className="size-4 text-muted-foreground" />

                                                <h4 className="text-sm font-medium">
                                                    Saved Steps ({steps.length})
                                                </h4>
                                            </div>

                                            {steps.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    No step details were saved
                                                    in this version.
                                                </p>
                                            ) : (
                                                <ol className="space-y-3">
                                                    {steps.map((step) => (
                                                        <li
                                                            key={`${version.id}-${step.id}`}
                                                            className="flex items-start gap-3"
                                                        >
                                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
                                                                {step.position}
                                                            </span>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium">
                                                                    {step.name}
                                                                </p>

                                                                <p className="mt-1 text-xs capitalize text-muted-foreground">
                                                                    {step.step_type.replace(
                                                                        /_/g,
                                                                        " ",
                                                                    )}
                                                                </p>

                                                                {step.office && (
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        Office:{" "}
                                                                        {
                                                                            step
                                                                                .office
                                                                                .name
                                                                        }
                                                                    </p>
                                                                )}

                                                                {step.approver && (
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        Approver:{" "}
                                                                        {
                                                                            step
                                                                                .approver
                                                                                .name
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ol>
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

WorkflowHistory.layout = {
    breadcrumbs,
};
