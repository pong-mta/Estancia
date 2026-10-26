import { Head, router, useForm } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import {
    Search,
    Plus,
    Eye,
    Pencil,
    UserRound,
    Users,
    CheckCircle2,
    Clock3,
    UserCheck,
    UserX,
    RefreshCw,
    X,
    Save,
    Phone,
    Mail,
    IdCard,
    CalendarDays,
    ShieldCheck,
    Power,
    RotateCcw,
    FileText,
} from "lucide-react";

type Personnel = {
    id: number;
    employee_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    phone: string | null;
    email: string | null;
    role: string;
    license_number: string | null;
    license_class: string | null;
    license_expiry: string | null;
    employment_status: string;
    availability_status: string;
    address: string | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
};

type PaginatedPersonnel = {
    data: Personnel[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    personnel: PaginatedPersonnel;
    filters: {
        search: string;
        role: string;
        employment_status: string;
        availability_status: string;
    };
    roles: Record<string, string>;
    employmentStatuses: Record<string, string>;
    availabilityStatuses: Record<string, string>;
    stats: {
        total: number;
        active: number;
        available: number;
        assigned: number;
        inactive: number;
    };
};

type FormData = {
    employee_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    phone: string;
    email: string;
    role: string;
    license_number: string;
    license_class: string;
    license_expiry: string;
    employment_status: string;
    availability_status: string;
    address: string;
    notes: string;
};

const emptyForm: FormData = {
    employee_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    phone: "",
    email: "",
    role: "driver",
    license_number: "",
    license_class: "",
    license_expiry: "",
    employment_status: "active",
    availability_status: "off_duty",
    address: "",
    notes: "",
};

type ModalMode = "create" | "view" | "edit" | null;

function fullName(person: Personnel) {
    return [
        person.first_name,
        person.middle_name,
        person.last_name,
        person.suffix,
    ]
        .filter(Boolean)
        .join(" ");
}

function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
          });
}

function statusClasses(status: string) {
    switch (status) {
        case "available":
            return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
        case "assigned":
            return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
        case "on_duty":
            return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
        case "active":
            return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
        case "inactive":
            return "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
        default:
            return "border-border bg-muted text-muted-foreground";
    }
}

function humanize(value: string | null | undefined) {
    if (!value) return "—";
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function PersonnelIndex({
    personnel,
    filters,
    roles,
    employmentStatuses,
    availabilityStatuses,
    stats,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [roleFilter, setRoleFilter] = useState(filters.role ?? "");
    const [employmentFilter, setEmploymentFilter] = useState(
        filters.employment_status ?? "",
    );
    const [availabilityFilter, setAvailabilityFilter] = useState(
        filters.availability_status ?? "",
    );
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selected, setSelected] = useState<Personnel | null>(null);

    const form = useForm<FormData>({ ...emptyForm });

    const hasActiveFilters = Boolean(
        search || roleFilter || employmentFilter || availabilityFilter,
    );

    const isDriver = form.data.role === "driver";

    const modalTitle = useMemo(() => {
        if (modalMode === "create") return "Add personnel";
        if (modalMode === "edit") return "Edit personnel";
        if (modalMode === "view") return "Personnel details";
        return "";
    }, [modalMode]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeModal();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // closeModal only updates local state; listener is installed once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function closeModal() {
        setModalMode(null);
        setSelected(null);
        form.reset();
        form.clearErrors();
    }

    function applyFilters(
        overrides?: Partial<{
            search: string;
            role: string;
            employment_status: string;
            availability_status: string;
        }>,
    ) {
        const next = {
            search,
            role: roleFilter,
            employment_status: employmentFilter,
            availability_status: availabilityFilter,
            ...overrides,
        };

        if (overrides?.search !== undefined) setSearch(overrides.search);
        if (overrides?.role !== undefined) setRoleFilter(overrides.role);
        if (overrides?.employment_status !== undefined)
            setEmploymentFilter(overrides.employment_status);
        if (overrides?.availability_status !== undefined)
            setAvailabilityFilter(overrides.availability_status);

        router.get("/mdrrmo/personnel", next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function resetFilters() {
        setSearch("");
        setRoleFilter("");
        setEmploymentFilter("");
        setAvailabilityFilter("");
        router.get(
            "/mdrrmo/personnel",
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function openCreate() {
        form.reset();
        form.clearErrors();
        form.setData({ ...emptyForm });
        setSelected(null);
        setModalMode("create");
    }

    function openView(person: Personnel) {
        setSelected(person);
        setModalMode("view");
    }

    function openEdit(person: Personnel) {
        setSelected(person);
        form.clearErrors();
        form.setData({
            employee_id: person.employee_id ?? "",
            first_name: person.first_name ?? "",
            middle_name: person.middle_name ?? "",
            last_name: person.last_name ?? "",
            suffix: person.suffix ?? "",
            phone: person.phone ?? "",
            email: person.email ?? "",
            role: person.role ?? "driver",
            license_number: person.license_number ?? "",
            license_class: person.license_class ?? "",
            license_expiry: person.license_expiry
                ? person.license_expiry.slice(0, 10)
                : "",
            employment_status: person.employment_status ?? "active",
            availability_status: person.availability_status ?? "off_duty",
            address: person.address ?? "",
            notes: person.notes ?? "",
        });
        setModalMode("edit");
    }

    function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    modalMode === "create"
                        ? "Personnel added successfully."
                        : "Personnel updated successfully.",
                );
                closeModal();
            },
            onError: () => {
                toast.error("Please check the form for errors.");
            },
        };

        if (modalMode === "create") {
            form.post("/mdrrmo/personnel", options);
        } else if (modalMode === "edit" && selected) {
            form.put(`/mdrrmo/personnel/${selected.id}`, options);
        }
    }

    function changePersonnelStatus(
        person: Personnel,
        action: "deactivate" | "reactivate",
    ) {
        const isDeactivate = action === "deactivate";
        const message = isDeactivate
            ? `Deactivate ${fullName(person)}? They will no longer be considered active personnel.`
            : `Reactivate ${fullName(person)}? Their availability will be set to Off Duty.`;

        if (!window.confirm(message)) return;

        router.patch(
            `/mdrrmo/personnel/${person.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        isDeactivate
                            ? "Personnel deactivated successfully."
                            : "Personnel reactivated successfully.",
                    );
                    if (selected?.id === person.id) closeModal();
                },
                onError: () =>
                    toast.error("Unable to update personnel status."),
            },
        );
    }

    const inputClass =
        "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";
    const labelClass = "block text-xs font-semibold text-foreground";
    const errorClass = "mt-1 text-xs text-destructive";

    return (
        <>
            <Head title="Drivers & Personnel" />

            <div className="flex h-full w-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Drivers & Personnel
                                </h1>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Manage MDRRMO drivers and emergency response
                                    personnel.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Add personnel
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        title="Total personnel"
                        value={stats.total}
                        icon={<Users className="size-5" />}
                    />
                    <StatCard
                        title="Active"
                        value={stats.active}
                        icon={<UserCheck className="size-5" />}
                    />
                    <StatCard
                        title="Available"
                        value={stats.available}
                        icon={<CheckCircle2 className="size-5" />}
                    />
                    <StatCard
                        title="Assigned"
                        value={stats.assigned}
                        icon={<Clock3 className="size-5" />}
                    />
                    <StatCard
                        title="Inactive"
                        value={stats.inactive}
                        icon={<UserX className="size-5" />}
                    />
                </div>

                {/* Personnel table */}
                <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {/* Single-row search and filters */}
                    <div className="border-b border-border bg-muted/20 p-4 md:p-5">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters();
                            }}
                            className="flex w-full flex-col gap-3 xl:flex-row xl:items-end"
                        >
                            <div className="shrink-0 xl:w-44 xl:pb-1">
                                <h2 className="text-sm font-semibold">
                                    Find personnel
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Search and filter directory
                                </p>
                            </div>

                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    aria-label="Search personnel"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search name, employee ID, phone, email, or license..."
                                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                                />
                            </div>

                            <select
                                aria-label="Filter by role"
                                value={roleFilter}
                                onChange={(event) =>
                                    applyFilters({ role: event.target.value })
                                }
                                className="h-11 w-full shrink-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 xl:w-44"
                            >
                                <option value="">All roles</option>
                                {Object.entries(roles).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            <select
                                aria-label="Filter by employment status"
                                value={employmentFilter}
                                onChange={(event) =>
                                    applyFilters({
                                        employment_status: event.target.value,
                                    })
                                }
                                className="h-11 w-full shrink-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 xl:w-40"
                            >
                                <option value="">All employment</option>
                                {Object.entries(employmentStatuses).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>

                            <select
                                aria-label="Filter by availability"
                                value={availabilityFilter}
                                onChange={(event) =>
                                    applyFilters({
                                        availability_status: event.target.value,
                                    })
                                }
                                className="h-11 w-full shrink-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 xl:w-40"
                            >
                                <option value="">All availability</option>
                                {Object.entries(availabilityStatuses).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>

                            <div className="flex shrink-0 gap-2">
                                <button
                                    type="submit"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                                >
                                    <Search className="size-4" />
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium transition hover:bg-muted"
                                    title="Reset search and filters"
                                >
                                    <RefreshCw className="size-4" />
                                    Reset
                                </button>
                            </div>
                        </form>

                        {hasActiveFilters && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium">
                                    Active filters:
                                </span>
                                {search && (
                                    <FilterChip>Search: {search}</FilterChip>
                                )}
                                {roleFilter && (
                                    <FilterChip>
                                        Role: {roles[roleFilter] ?? roleFilter}
                                    </FilterChip>
                                )}
                                {employmentFilter && (
                                    <FilterChip>
                                        Employment:{" "}
                                        {employmentStatuses[employmentFilter] ??
                                            employmentFilter}
                                    </FilterChip>
                                )}
                                {availabilityFilter && (
                                    <FilterChip>
                                        Availability:{" "}
                                        {availabilityStatuses[
                                            availabilityFilter
                                        ] ?? availabilityFilter}
                                    </FilterChip>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                        <p className="text-sm font-medium">
                            Personnel directory
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Showing {personnel.from ?? 0}–{personnel.to ?? 0} of{" "}
                            {personnel.total} personnel
                        </p>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">
                                        Personnel
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Employee ID
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Contact
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Availability
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Employment
                                    </th>
                                    <th className="px-5 py-3 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {personnel.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <Users className="size-5" />
                                            </div>
                                            <p className="mt-3 font-semibold">
                                                No personnel found
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Add personnel or adjust your
                                                search and filters.
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={resetFilters}
                                                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    personnel.data.map((person) => (
                                        <tr
                                            key={person.id}
                                            className="transition hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                        {(person
                                                            .first_name?.[0] ??
                                                            "") +
                                                            (person
                                                                .last_name?.[0] ??
                                                                "")}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold">
                                                            {fullName(person)}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {person.license_number
                                                                ? `License: ${person.license_number}`
                                                                : "No license recorded"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-mono text-xs">
                                                {person.employee_id}
                                            </td>
                                            <td className="px-4 py-4">
                                                {roles[person.role] ??
                                                    humanize(person.role)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    {person.phone ? (
                                                        <p className="flex items-center gap-1.5 text-xs">
                                                            <Phone className="size-3.5 text-muted-foreground" />
                                                            {person.phone}
                                                        </p>
                                                    ) : null}
                                                    {person.email ? (
                                                        <p className="flex max-w-[200px] items-center gap-1.5 truncate text-xs text-muted-foreground">
                                                            <Mail className="size-3.5 shrink-0" />
                                                            {person.email}
                                                        </p>
                                                    ) : null}
                                                    {!person.phone &&
                                                        !person.email && (
                                                            <span className="text-xs text-muted-foreground">
                                                                No contact
                                                                details
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(person.availability_status)}`}
                                                >
                                                    {availabilityStatuses[
                                                        person
                                                            .availability_status
                                                    ] ??
                                                        humanize(
                                                            person.availability_status,
                                                        )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(person.employment_status)}`}
                                                >
                                                    {employmentStatuses[
                                                        person.employment_status
                                                    ] ??
                                                        humanize(
                                                            person.employment_status,
                                                        )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <ActionButton
                                                        label="View details"
                                                        onClick={() =>
                                                            openView(person)
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                    </ActionButton>
                                                    <ActionButton
                                                        label="Edit personnel"
                                                        onClick={() =>
                                                            openEdit(person)
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                    </ActionButton>
                                                    {person.employment_status ===
                                                    "active" ? (
                                                        <ActionButton
                                                            label="Deactivate personnel"
                                                            onClick={() =>
                                                                changePersonnelStatus(
                                                                    person,
                                                                    "deactivate",
                                                                )
                                                            }
                                                            danger
                                                        >
                                                            <Power className="size-4" />
                                                        </ActionButton>
                                                    ) : (
                                                        <ActionButton
                                                            label="Reactivate personnel"
                                                            onClick={() =>
                                                                changePersonnelStatus(
                                                                    person,
                                                                    "reactivate",
                                                                )
                                                            }
                                                        >
                                                            <RotateCcw className="size-4" />
                                                        </ActionButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {personnel.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
                            <p className="text-xs text-muted-foreground">
                                Page {personnel.current_page} of{" "}
                                {personnel.last_page}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {personnel.links.map((link, index) => {
                                    const label = link.label
                                        .replace("&laquo;", "«")
                                        .replace("&raquo;", "»");
                                    return (
                                        <button
                                            key={`${index}-${label}`}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                })
                                            }
                                            className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                                link.active
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background hover:bg-muted"
                                            } disabled:cursor-not-allowed disabled:opacity-40`}
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: label,
                                                }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal */}
            {modalMode && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="personnel-modal-title"
                        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    {modalMode === "view" ? (
                                        <Eye className="size-5" />
                                    ) : modalMode === "edit" ? (
                                        <Pencil className="size-5" />
                                    ) : (
                                        <UserRound className="size-5" />
                                    )}
                                </div>
                                <div>
                                    <h2
                                        id="personnel-modal-title"
                                        className="font-semibold"
                                    >
                                        {modalTitle}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {modalMode === "view"
                                            ? "Personnel record and qualifications"
                                            : "Fields marked with * are required"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {modalMode === "view" && selected ? (
                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                                <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
                                    <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                                        {selected.first_name?.[0]}
                                        {selected.last_name?.[0]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold">
                                            {fullName(selected)}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {selected.employee_id} ·{" "}
                                            {roles[selected.role] ??
                                                humanize(selected.role)}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(selected.employment_status)}`}
                                            >
                                                {employmentStatuses[
                                                    selected.employment_status
                                                ] ??
                                                    humanize(
                                                        selected.employment_status,
                                                    )}
                                            </span>
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(selected.availability_status)}`}
                                            >
                                                {availabilityStatuses[
                                                    selected.availability_status
                                                ] ??
                                                    humanize(
                                                        selected.availability_status,
                                                    )}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(selected)}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold hover:bg-muted"
                                    >
                                        <Pencil className="size-4" /> Edit
                                    </button>
                                </div>

                                <DetailSection
                                    title="Contact information"
                                    icon={<Phone className="size-4" />}
                                >
                                    <Detail
                                        label="Phone"
                                        value={selected.phone}
                                    />
                                    <Detail
                                        label="Email"
                                        value={selected.email}
                                    />
                                    <Detail
                                        label="Address"
                                        value={selected.address}
                                    />
                                </DetailSection>
                                <DetailSection
                                    title="Role & license"
                                    icon={<ShieldCheck className="size-4" />}
                                >
                                    <Detail
                                        label="Role"
                                        value={
                                            roles[selected.role] ??
                                            humanize(selected.role)
                                        }
                                    />
                                    <Detail
                                        label="License number"
                                        value={selected.license_number}
                                    />
                                    <Detail
                                        label="License class"
                                        value={selected.license_class}
                                    />
                                    <Detail
                                        label="License expiry"
                                        value={formatDate(
                                            selected.license_expiry,
                                        )}
                                    />
                                </DetailSection>
                                <DetailSection
                                    title="Additional notes"
                                    icon={<FileText className="size-4" />}
                                >
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                        {selected.notes || "No notes recorded."}
                                    </p>
                                </DetailSection>
                                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                                    {selected.employment_status === "active" ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changePersonnelStatus(
                                                    selected,
                                                    "deactivate",
                                                )
                                            }
                                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/5"
                                        >
                                            <Power className="size-4" />{" "}
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changePersonnelStatus(
                                                    selected,
                                                    "reactivate",
                                                )
                                            }
                                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                                        >
                                            <RotateCcw className="size-4" />{" "}
                                            Reactivate
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form
                                onSubmit={submitForm}
                                className="flex min-h-0 flex-1 flex-col"
                            >
                                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                                    <FormSection
                                        title="Personnel information"
                                        description="Basic identity and contact details."
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <Field
                                                label="Employee ID *"
                                                error={form.errors.employee_id}
                                                className="sm:col-span-1"
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={
                                                        form.data.employee_id
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "employee_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. MDRRMO-001"
                                                />
                                            </Field>
                                            <Field
                                                label="First name *"
                                                error={form.errors.first_name}
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={form.data.first_name}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "first_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="First name"
                                                />
                                            </Field>
                                            <Field
                                                label="Middle name"
                                                error={form.errors.middle_name}
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={
                                                        form.data.middle_name
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "middle_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Middle name"
                                                />
                                            </Field>
                                            <Field
                                                label="Last name *"
                                                error={form.errors.last_name}
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={form.data.last_name}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "last_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Last name"
                                                />
                                            </Field>
                                            <Field
                                                label="Suffix"
                                                error={form.errors.suffix}
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={form.data.suffix}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "suffix",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Jr., Sr., III"
                                                />
                                            </Field>
                                            <Field
                                                label="Role *"
                                                error={form.errors.role}
                                            >
                                                <select
                                                    className={inputClass}
                                                    value={form.data.role}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "role",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    {Object.entries(roles).map(
                                                        ([value, label]) => (
                                                            <option
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </Field>
                                            <Field
                                                label="Phone number"
                                                error={form.errors.phone}
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={form.data.phone}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "phone",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="09XX XXX XXXX"
                                                />
                                            </Field>
                                            <Field
                                                label="Email address"
                                                error={form.errors.email}
                                            >
                                                <input
                                                    type="email"
                                                    className={inputClass}
                                                    value={form.data.email}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "email",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="name@example.com"
                                                />
                                            </Field>
                                        </div>
                                    </FormSection>

                                    <FormSection
                                        title="Driver's license"
                                        description="Required for personnel whose role is Driver."
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <Field
                                                label={`License number${isDriver ? " *" : ""}`}
                                                error={
                                                    form.errors.license_number
                                                }
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={
                                                        form.data.license_number
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "license_number",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Driver's license number"
                                                />
                                            </Field>
                                            <Field
                                                label="License class"
                                                error={
                                                    form.errors.license_class
                                                }
                                            >
                                                <input
                                                    className={inputClass}
                                                    value={
                                                        form.data.license_class
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "license_class",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. A, B, B1"
                                                />
                                            </Field>
                                            <Field
                                                label={`License expiry${isDriver ? " *" : ""}`}
                                                error={
                                                    form.errors.license_expiry
                                                }
                                            >
                                                <input
                                                    type="date"
                                                    className={inputClass}
                                                    value={
                                                        form.data.license_expiry
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "license_expiry",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </div>
                                    </FormSection>

                                    <FormSection
                                        title="Operational status"
                                        description="Inactive personnel cannot be selected for new dispatch assignments."
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Field
                                                label="Employment status *"
                                                error={
                                                    form.errors
                                                        .employment_status
                                                }
                                            >
                                                <select
                                                    className={inputClass}
                                                    value={
                                                        form.data
                                                            .employment_status
                                                    }
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value;
                                                        form.setData(
                                                            (current) => ({
                                                                ...current,
                                                                employment_status:
                                                                    value,
                                                                availability_status:
                                                                    value ===
                                                                    "inactive"
                                                                        ? "off_duty"
                                                                        : current.availability_status,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    {Object.entries(
                                                        employmentStatuses,
                                                    ).map(([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                            <Field
                                                label="Availability *"
                                                error={
                                                    form.errors
                                                        .availability_status
                                                }
                                            >
                                                <select
                                                    className={inputClass}
                                                    value={
                                                        form.data
                                                            .availability_status
                                                    }
                                                    disabled={
                                                        form.data
                                                            .employment_status ===
                                                        "inactive"
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "availability_status",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    {Object.entries(
                                                        availabilityStatuses,
                                                    ).map(([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                        </div>
                                    </FormSection>

                                    <FormSection
                                        title="Additional details"
                                        description="Optional address and internal notes."
                                    >
                                        <div className="grid grid-cols-1 gap-4">
                                            <Field
                                                label="Address"
                                                error={form.errors.address}
                                            >
                                                <textarea
                                                    className="mt-1.5 min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                                    value={form.data.address}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "address",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Residential or contact address"
                                                />
                                            </Field>
                                            <Field
                                                label="Notes"
                                                error={form.errors.notes}
                                            >
                                                <textarea
                                                    className="mt-1.5 min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                                    value={form.data.notes}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "notes",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Additional qualifications, remarks, or internal notes"
                                                />
                                            </Field>
                                        </div>
                                    </FormSection>
                                </div>

                                <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="h-10 rounded-lg border border-input bg-background px-4 text-sm font-semibold transition hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Save className="size-4" />
                                        {form.processing
                                            ? "Saving..."
                                            : modalMode === "create"
                                              ? "Add personnel"
                                              : "Save changes"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                    {title}
                </p>
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {icon}
                </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
                {value ?? 0}
            </p>
        </div>
    );
}

function FilterChip({ children }: { children: React.ReactNode }) {
    return (
        <span className="rounded-full border border-border bg-muted px-2.5 py-1">
            {children}
        </span>
    );
}

function ActionButton({
    children,
    label,
    onClick,
    danger = false,
}: {
    children: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`flex size-9 items-center justify-center rounded-lg border transition ${
                danger
                    ? "border-transparent text-destructive hover:border-destructive/20 hover:bg-destructive/5"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
            }`}
        >
            {children}
        </button>
    );
}

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-3 border-b border-border pb-3">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    error,
    children,
    className = "",
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="block text-xs font-semibold text-foreground">
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function DetailSection({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold">
                <span className="text-muted-foreground">{icon}</span>
                {title}
            </h3>
            {children}
        </section>
    );
}

function Detail({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">
                {value || "—"}
            </p>
        </div>
    );
}

PersonnelIndex.layout = {
    breadcrumbs: [
        {
            title: "Drivers & Personnel",
            href: "/mdrrmo/personnel",
        },
    ],
};
