import { Head, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    GitBranch,
    Plus,
    Search,
    Pencil,
    X,
    FileText,
    Workflow as WorkflowIcon,
    Clock3,
    CheckCircle2,
    ListOrdered,
    History,
} from "lucide-react";
import { toast } from "sonner";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type WorkflowRecord = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    document_type: string;
    status: string;
    version: number;
    steps_count: number;
    creator: {
        id: number;
        name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedWorkflows = {
    data: WorkflowRecord[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type DocumentType = {
    value: string;
    label: string;
};

type Props = {
    workflows: PaginatedWorkflows;
    filters: {
        search: string;
        status: string;
    };
    documentTypes: DocumentType[];
};

type WorkflowFormData = {
    name: string;
    code: string;
    description: string;
    document_type: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: dashboard() },
    { title: "Workflow Designer", href: "/admin/workflows" },
];

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

function formatDate(value: string | null): string {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function statusClass(status: string): string {
    if (status === "published") {
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    }

    if (status === "archived") {
        return "bg-muted text-muted-foreground";
    }

    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
}

export default function WorkflowIndex({
    workflows,
    filters,
    documentTypes,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [showForm, setShowForm] = useState(false);
    const [editingWorkflow, setEditingWorkflow] =
        useState<WorkflowRecord | null>(null);

    const form = useForm<WorkflowFormData>({
        name: "",
        code: "",
        description: "",
        document_type: "purchase_request",
    });

    useEffect(() => {
        setSearch(filters.search ?? "");
        setStatus(filters.status ?? "");
    }, [filters.search, filters.status]);

    function openCreateModal() {
        setEditingWorkflow(null);
        form.clearErrors();
        form.setData({
            name: "",
            code: "",
            description: "",
            document_type: "purchase_request",
        });
        setShowForm(true);
    }

    function openEditModal(workflow: WorkflowRecord) {
        setEditingWorkflow(workflow);
        form.clearErrors();
        form.setData({
            name: workflow.name,
            code: workflow.code,
            description: workflow.description ?? "",
            document_type: workflow.document_type,
        });
        setShowForm(true);
    }

    function closeModal() {
        setShowForm(false);
        setEditingWorkflow(null);
        form.clearErrors();
    }

    function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                toast.success(
                    editingWorkflow
                        ? "Workflow draft updated successfully."
                        : "Workflow draft created successfully.",
                );
            },
            onError: () => {
                toast.error("Please check the form for errors.");
            },
        };

        if (editingWorkflow) {
            router.put(
                `/admin/workflows/${editingWorkflow.id}`,
                form.data,
                options,
            );
        } else {
            form.post("/admin/workflows", options);
        }
    }

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            "/admin/workflows",
            { search, status },
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
            "/admin/workflows",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function changePage(url: string | null) {
        if (!url) return;

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <>
            <Head title="Workflow Designer" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <GitBranch className="size-5" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Workflow Designer
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Configure document approval workflows for your
                                municipal offices.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Create Workflow
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Total Workflows
                            </p>
                            <WorkflowIcon className="size-5 text-muted-foreground" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">
                            {workflows.total}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Configured workflow definitions
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Drafts on This Page
                            </p>
                            <Clock3 className="size-5 text-amber-600" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">
                            {
                                workflows.data.filter(
                                    (workflow) => workflow.status === "draft",
                                ).length
                            }
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Workflows awaiting configuration
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Published on This Page
                            </p>
                            <CheckCircle2 className="size-5 text-emerald-600" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">
                            {
                                workflows.data.filter(
                                    (workflow) =>
                                        workflow.status === "published",
                                ).length
                            }
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Published workflow definitions
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="border-b p-4">
                        <div className="mb-4">
                            <h2 className="font-semibold">Workflow Registry</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage document types, workflow definitions, and
                                their current versions.
                            </p>
                        </div>

                        <form
                            onSubmit={applyFilters}
                            className="flex flex-col gap-2 lg:flex-row"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search workflow name, code, or document type..."
                                    className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary lg:w-48"
                            >
                                <option value="">All statuses</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>

                            <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
                            >
                                <Search className="size-4" />
                                Apply Filters
                            </button>

                            {(search !== "" || status !== "") && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="h-10 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3 font-medium">
                                        Workflow
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Document Type
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Steps
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Version
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Updated
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {workflows.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-14 text-center"
                                        >
                                            <GitBranch className="mx-auto mb-3 size-9 text-muted-foreground/50" />
                                            <p className="font-medium">
                                                No workflows found
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Create a workflow draft to get
                                                started.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    workflows.data.map((workflow) => (
                                        <tr
                                            key={workflow.id}
                                            className="transition hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                                                        <FileText className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {workflow.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {workflow.code}
                                                        </p>
                                                        {workflow.description && (
                                                            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                                                {
                                                                    workflow.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                {documentTypeLabels[
                                                    workflow.document_type
                                                ] ?? workflow.document_type}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                    <ListOrdered className="size-4" />
                                                    {workflow.steps_count}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-md border px-2 py-1 text-xs font-medium">
                                                    v{workflow.version}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(workflow.status)}`}
                                                >
                                                    {workflow.status}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                {formatDate(
                                                    workflow.updated_at,
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {workflow.status ===
                                                        "draft" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                title="Manage workflow steps"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/admin/workflows/${workflow.id}/steps`,
                                                                    )
                                                                }
                                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted"
                                                            >
                                                                <GitBranch className="size-4" />
                                                                Manage Steps
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Edit workflow draft"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        workflow,
                                                                    )
                                                                }
                                                                className="inline-flex size-9 items-center justify-center rounded-lg border transition hover:bg-muted"
                                                            >
                                                                <Pencil className="size-4" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Publish workflow"
                                                                onClick={() => {
                                                                    if (
                                                                        window.confirm(
                                                                            `Publish "${workflow.name}"? The workflow will become read-only.`,
                                                                        )
                                                                    ) {
                                                                        router.post(
                                                                            `/admin/workflows/${workflow.id}/publish`,
                                                                            {},
                                                                            {
                                                                                preserveScroll: true,
                                                                                onSuccess:
                                                                                    () =>
                                                                                        toast.success(
                                                                                            "Workflow published successfully.",
                                                                                        ),
                                                                                onError:
                                                                                    () =>
                                                                                        toast.error(
                                                                                            "Unable to publish workflow. Check its steps and assignments.",
                                                                                        ),
                                                                            },
                                                                        );
                                                                    }
                                                                }}
                                                                className="inline-flex size-9 items-center justify-center rounded-lg border border-emerald-600/30 text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-400"
                                                            >
                                                                <CheckCircle2 className="size-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {workflow.status ===
                                                        "published" && (
                                                        <button
                                                            type="button"
                                                            title="Create a new draft version"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        `Create a new draft version of "${workflow.name}"?`,
                                                                    )
                                                                ) {
                                                                    router.post(
                                                                        `/admin/workflows/${workflow.id}/new-version`,
                                                                        {},
                                                                        {
                                                                            preserveScroll: true,
                                                                            onSuccess:
                                                                                () =>
                                                                                    toast.success(
                                                                                        "New workflow version created successfully.",
                                                                                    ),
                                                                            onError:
                                                                                () =>
                                                                                    toast.error(
                                                                                        "Unable to create a new workflow version.",
                                                                                    ),
                                                                        },
                                                                    );
                                                                }
                                                            }}
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted"
                                                        >
                                                            <GitBranch className="size-4" />
                                                            New Version
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        title="View workflow version history"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/admin/workflows/${workflow.id}/history`,
                                                            )
                                                        }
                                                        className="inline-flex size-9 items-center justify-center rounded-lg border transition hover:bg-muted"
                                                    >
                                                        <History className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {workflows.from ?? 0}–{workflows.to ?? 0} of{" "}
                            {workflows.total} workflows
                        </p>

                        <div className="flex flex-wrap items-center gap-1">
                            {workflows.links.map((link, index) => (
                                <button
                                    key={`${index}-${link.label}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => changePage(link.url)}
                                    className={`min-w-9 rounded-md border px-3 py-2 text-xs transition ${
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
                </div>
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingWorkflow
                                        ? "Edit Workflow Draft"
                                        : "Create Workflow Draft"}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Define the workflow identity before
                                    configuring its approval steps.
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
                            <div className="grid gap-5 p-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Workflow Name
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
                                        placeholder="e.g. Purchase Request Approval"
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
                                        Workflow Code
                                    </label>
                                    <input
                                        value={form.data.code}
                                        onChange={(event) =>
                                            form.setData(
                                                "code",
                                                event.target.value
                                                    .toUpperCase()
                                                    .replace(
                                                        /[^A-Z0-9_-]/g,
                                                        "",
                                                    ),
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm uppercase outline-none focus:border-primary"
                                        placeholder="PURCHASE_REQUEST"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Unique identifier; letters, numbers,
                                        hyphens, and underscores.
                                    </p>
                                    {form.errors.code && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.code}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Document Type
                                    </label>
                                    <select
                                        value={form.data.document_type}
                                        onChange={(event) =>
                                            form.setData(
                                                "document_type",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                        required
                                    >
                                        {documentTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.document_type && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.document_type}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Description
                                    </label>
                                    <textarea
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                "description",
                                                event.target.value,
                                            )
                                        }
                                        rows={4}
                                        className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                                        placeholder="Describe the purpose and scope of this workflow..."
                                    />
                                    {form.errors.description && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.description}
                                        </p>
                                    )}
                                </div>
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
                                        : editingWorkflow
                                          ? "Save Draft"
                                          : "Create Draft"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

WorkflowIndex.layout = {
    breadcrumbs,
};
