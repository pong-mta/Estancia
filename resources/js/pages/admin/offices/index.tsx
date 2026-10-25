import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Building2,
    CheckCircle2,
    CircleOff,
    Plus,
    Search,
    X,
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/layouts/app-layout";
import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type Office = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedOffices = {
    data: Office[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Props = {
    offices: PaginatedOffices;
    filters: {
        search: string;
    };
};

export default function OfficeIndex({ offices, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [editingOffice, setEditingOffice] = useState<Office | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm({
        code: "",
        name: "",
        description: "",
        is_active: true,
    });

    useEffect(() => {
        setSearch(filters.search ?? "");
    }, [filters.search]);

    function openCreateForm() {
        setEditingOffice(null);

        form.reset();
        form.clearErrors();
        form.setData({
            code: "",
            name: "",
            description: "",
            is_active: true,
        });

        setShowForm(true);
    }

    function openEditForm(office: Office) {
        setEditingOffice(office);

        form.clearErrors();
        form.setData({
            code: office.code,
            name: office.name,
            description: office.description ?? "",
            is_active: office.is_active,
        });

        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingOffice(null);
        form.clearErrors();
    }

    function searchOffices(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            "/admin/offices",
            { search: search.trim() },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (editingOffice) {
            form.put(`/admin/offices/${editingOffice.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                    setEditingOffice(null);
                    form.reset();
                    toast.success("Office successfully updated.");
                },
                onError: () => {
                    toast.error("Please check the form for errors.");
                },
            });

            return;
        }

        form.post("/admin/offices", {
            preserveScroll: true,
            onSuccess: () => {
                setShowForm(false);
                form.reset();
                toast.success("Office successfully added.");
            },
            onError: () => {
                toast.error("Please check the form for errors.");
            },
        });
    }

    function deactivateOffice(office: Office) {
        if (!window.confirm(`Deactivate "${office.name}"?`)) {
            return;
        }

        router.delete(`/admin/offices/${office.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Office successfully deactivated.");
            },
            onError: () => {
                toast.error("Unable to deactivate the office.");
            },
        });
    }

    return (
        <>
            <Head title="Office Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Page heading */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="size-6 text-primary" />

                            <h1 className="text-2xl font-semibold tracking-tight">
                                Office Management
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage municipal offices and departments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Add Office
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        label="Total Offices"
                        value={offices.total}
                        icon={<Building2 className="size-5" />}
                    />

                    <SummaryCard
                        label="Active on This Page"
                        value={
                            offices.data.filter((office) => office.is_active)
                                .length
                        }
                        icon={<CheckCircle2 className="size-5" />}
                    />

                    <SummaryCard
                        label="Inactive on This Page"
                        value={
                            offices.data.filter((office) => !office.is_active)
                                .length
                        }
                        icon={<CircleOff className="size-5" />}
                    />
                </div>

                {/* Office table */}
                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">Municipal Offices</h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                View and manage registered offices.
                            </p>
                        </div>

                        <form
                            onSubmit={searchOffices}
                            className="flex w-full gap-2 sm:max-w-md"
                        >
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search offices..."
                                    className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                            >
                                Search
                            </button>

                            {filters.search && (
                                <Link
                                    href="/admin/offices"
                                    className="rounded-lg border px-3 py-2.5 text-sm hover:bg-muted"
                                >
                                    Clear
                                </Link>
                            )}
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">
                                        Office
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Code
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Description
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-3.5 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {offices.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <Building2 className="mx-auto mb-3 size-9 text-muted-foreground/50" />

                                            <p className="font-medium">
                                                No offices found
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Add an office or change your
                                                search.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    offices.data.map((office) => (
                                        <tr
                                            key={office.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-medium">
                                                    {office.name}
                                                </div>

                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    Office ID: {office.id}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs">
                                                    {office.code}
                                                </span>
                                            </td>

                                            <td className="max-w-sm px-5 py-4 text-muted-foreground">
                                                {office.description ||
                                                    "No description provided"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        office.is_active
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                            : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${
                                                            office.is_active
                                                                ? "bg-emerald-600"
                                                                : "bg-muted-foreground"
                                                        }`}
                                                    />

                                                    {office.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(office)
                                                        }
                                                        className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                                                    >
                                                        Edit
                                                    </button>

                                                    {office.is_active && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deactivateOffice(
                                                                    office,
                                                                )
                                                            }
                                                            className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col justify-between gap-3 border-t p-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-muted-foreground">
                            Showing {offices.from ?? 0}–{offices.to ?? 0} of{" "}
                            {offices.total} offices
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {offices.links.map((link, index) => (
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

            {/* Add / Edit modal */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeForm();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="office-modal-title"
                        className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b px-6 py-5">
                            <div>
                                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Building2 className="size-5" />
                                </div>

                                <h2
                                    id="office-modal-title"
                                    className="text-xl font-semibold tracking-tight"
                                >
                                    {editingOffice
                                        ? "Edit Office"
                                        : "Add Office"}
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {editingOffice
                                        ? "Update the office details below."
                                        : "Enter the details of the municipal office."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                aria-label="Close modal"
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={submitForm}>
                            <div className="space-y-5 p-6">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="office-code"
                                            className="text-sm font-medium"
                                        >
                                            Office Code{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="office-code"
                                            autoFocus
                                            value={form.data.code}
                                            onChange={(event) =>
                                                form.setData(
                                                    "code",
                                                    event.target.value.toUpperCase(),
                                                )
                                            }
                                            required
                                            maxLength={30}
                                            placeholder="e.g. MAYOR"
                                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />

                                        {form.errors.code && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.code}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="office-name"
                                            className="text-sm font-medium"
                                        >
                                            Office Name{" "}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="office-name"
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    "name",
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            maxLength={150}
                                            placeholder="Office of the Municipal Mayor"
                                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />

                                        {form.errors.name && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="office-description"
                                        className="text-sm font-medium"
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        id="office-description"
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                "description",
                                                event.target.value,
                                            )
                                        }
                                        rows={4}
                                        maxLength={5000}
                                        placeholder="Describe the responsibilities of this office..."
                                        className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.description && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.description}
                                        </p>
                                    )}
                                </div>

                                {editingOffice && (
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.data.is_active}
                                            onChange={(event) =>
                                                form.setData(
                                                    "is_active",
                                                    event.target.checked,
                                                )
                                            }
                                            className="size-4 accent-primary"
                                        />
                                        Office is active
                                    </label>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={form.processing}
                                    className="rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing
                                        ? "Saving..."
                                        : editingOffice
                                          ? "Save Changes"
                                          : "Create Office"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
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

OfficeIndex.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
        {
            title: "Office Management",
            href: "/admin/offices",
        },
    ] satisfies BreadcrumbItem[],
};
