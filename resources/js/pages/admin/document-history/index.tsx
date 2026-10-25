import { Head, Link, router } from "@inertiajs/react";
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Clock3,
    FileClock,
    FileText,
    RotateCcw,
    Search,
    XCircle,
} from "lucide-react";
import { useState } from "react";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type DocumentRecord = {
    id: number;
    tracking_number: string;
    document_type: string;
    subject: string;
    status: string;
    workflow_actions_count: number;
    originating_office: { id: number; name: string } | null;
    submitter: { id: number; name: string } | null;
    submitted_at: string | null;
    completed_at: string | null;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedDocuments = {
    data: DocumentRecord[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Props = {
    documents: PaginatedDocuments;
    filters: {
        search: string;
        status: string;
    };
};

export default function DocumentHistoryIndex({ documents, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            "/admin/document-history",
            {
                search: search.trim() || undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function clearFilters() {
        setSearch("");
        setStatus("");

        router.get(
            "/admin/document-history",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const completedCount = documents.data.filter(
        (document) => document.status === "completed",
    ).length;

    const rejectedCount = documents.data.filter(
        (document) => document.status === "rejected",
    ).length;

    const actionCount = documents.data.reduce(
        (total, document) => total + document.workflow_actions_count,
        0,
    );

    return (
        <>
            <Head title="Document History" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <FileClock className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Document History
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Review document decisions and follow the approval
                            audit trail.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.reload({ preserveScroll: true })}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                    >
                        <RotateCcw className="size-4" />
                        Refresh
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label="Documents with History"
                        value={documents.total}
                        icon={<FileText className="size-5" />}
                    />

                    <SummaryCard
                        label="Completed on This Page"
                        value={completedCount}
                        icon={<CheckCircle2 className="size-5" />}
                    />

                    <SummaryCard
                        label="Rejected on This Page"
                        value={rejectedCount}
                        icon={<XCircle className="size-5" />}
                    />

                    <SummaryCard
                        label="Recorded Actions on This Page"
                        value={actionCount}
                        icon={<Activity className="size-5" />}
                    />
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-4">
                        <div>
                            <h2 className="font-semibold">
                                Historical Documents
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Search tracking numbers, subjects, document
                                types, and filter by final or current status.
                            </p>
                        </div>

                        <form
                            onSubmit={applyFilters}
                            className="mt-4 flex flex-col gap-3 md:flex-row"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search tracking number or subject..."
                                    className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                aria-label="Filter by status"
                                className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                            >
                                <option value="">All statuses</option>
                                <option value="submitted">Submitted</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                            >
                                <Search className="size-4" />
                                Search
                            </button>

                            {(filters.search || filters.status) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                                >
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">
                                        Document
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Originating Office
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Submitted By
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Actions
                                    </th>
                                    <th className="px-5 py-3.5 text-right font-medium">
                                        Audit Trail
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {documents.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-16 text-center"
                                        >
                                            <FileClock className="mx-auto mb-3 size-9 text-muted-foreground/50" />

                                            <p className="font-medium">
                                                No document history found
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Documents appear here after
                                                workflow actions have been
                                                recorded.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    documents.data.map((document) => (
                                        <tr
                                            key={document.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-medium">
                                                    {document.subject}
                                                </div>

                                                <div className="mt-1 font-mono text-xs text-muted-foreground">
                                                    {document.tracking_number}
                                                </div>

                                                <div className="mt-1 text-xs capitalize text-muted-foreground">
                                                    {document.document_type.replaceAll(
                                                        "_",
                                                        " ",
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                {document.originating_office
                                                    ?.name ?? "Not assigned"}
                                            </td>

                                            <td className="px-5 py-4">
                                                {document.submitter?.name ??
                                                    "Unknown"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={document.status}
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <Clock3 className="size-4" />
                                                    {
                                                        document.workflow_actions_count
                                                    }
                                                    {document.workflow_actions_count ===
                                                    1
                                                        ? " action"
                                                        : " actions"}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                <Link
                                                    href={`/admin/document-history/${document.id}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                                                >
                                                    View History
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col justify-between gap-3 border-t p-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-muted-foreground">
                            Showing {documents.from ?? 0}–{documents.to ?? 0} of{" "}
                            {documents.total} documents
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {documents.links.map((link, index) => (
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
        </>
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

DocumentHistoryIndex.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
        {
            title: "Document History",
            href: "/admin/document-history",
        },
    ] satisfies BreadcrumbItem[],
};
