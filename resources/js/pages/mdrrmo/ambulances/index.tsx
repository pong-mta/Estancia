import { Head, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
    Ambulance as AmbulanceIcon,
    Search,
    Plus,
    Pencil,
    Eye,
    Trash2,
    CheckCircle,
    Clock,
    Radio,
    Wrench,
    RefreshCw,
    X,
    Save,
    ArrowUpRight,
    CalendarDays,
    ShieldCheck,
    FileText,
    Hash,
    Truck,
} from "lucide-react";

type AmbulanceRecord = {
    id: number;
    vehicle_code: string;
    plate_number: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
    ambulance_type: string;
    status: string;
    registration_number: string | null;
    registration_expiry: string | null;
    insurance_expiry: string | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    ambulances: {
        data: AmbulanceRecord[];
        current_page: number;
        last_page: number;
        total: number;
        links: PaginationLink[];
    };
    filters: {
        search: string;
        status: string;
        type: string;
    };
    statuses: Record<string, string>;
    types: Record<string, string>;
    stats: {
        total: number;
        available: number;
        assigned: number;
        onMission: number;
        maintenance: number;
    };
};

type FormFields = {
    vehicle_code: string;
    plate_number: string;
    make: string;
    model: string;
    year: string;
    ambulance_type: string;
    status: string;
    registration_number: string;
    registration_expiry: string;
    insurance_expiry: string;
    notes: string;
};

type ModalMode = "create" | "edit" | "view" | null;

const emptyForm: FormFields = {
    vehicle_code: "",
    plate_number: "",
    make: "",
    model: "",
    year: "",
    ambulance_type: "basic",
    status: "available",
    registration_number: "",
    registration_expiry: "",
    insurance_expiry: "",
    notes: "",
};

const statusStyles: Record<string, string> = {
    available:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    assigned:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
    on_mission:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-300",
    maintenance:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    inactive: "border-border bg-muted text-muted-foreground",
};

function formatDate(value: string | null | undefined): string {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

function formFromAmbulance(ambulance: AmbulanceRecord): FormFields {
    return {
        vehicle_code: ambulance.vehicle_code ?? "",
        plate_number: ambulance.plate_number ?? "",
        make: ambulance.make ?? "",
        model: ambulance.model ?? "",
        year: ambulance.year ? String(ambulance.year) : "",
        ambulance_type: ambulance.ambulance_type,
        status: ambulance.status,
        registration_number: ambulance.registration_number ?? "",
        registration_expiry: ambulance.registration_expiry?.slice(0, 10) ?? "",
        insurance_expiry: ambulance.insurance_expiry?.slice(0, 10) ?? "",
        notes: ambulance.notes ?? "",
    };
}

function StatusBadge({
    status,
    statuses,
}: {
    status: string;
    statuses: Record<string, string>;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                statusStyles[status] ?? statusStyles.inactive
            }`}
        >
            <span className="size-1.5 rounded-full bg-current" />
            {statuses[status] ?? status.replaceAll("_", " ")}
        </span>
    );
}

export default function AmbulanceIndex({
    ambulances,
    filters,
    statuses,
    types,
    stats,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [typeFilter, setTypeFilter] = useState(filters.type);
    const [modal, setModal] = useState<ModalMode>(null);
    const [selected, setSelected] = useState<AmbulanceRecord | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<FormFields>({ ...emptyForm });

    function closeModal() {
        setModal(null);
        setSelected(null);
        reset();
        clearErrors();
    }

    function openCreate() {
        reset();
        clearErrors();
        setData({ ...emptyForm });
        setSelected(null);
        setModal("create");
    }

    function openEdit(ambulance: AmbulanceRecord) {
        reset();
        clearErrors();
        setData(formFromAmbulance(ambulance));
        setSelected(ambulance);
        setModal("edit");
    }

    function openView(ambulance: AmbulanceRecord) {
        setSelected(ambulance);
        setModal("view");
    }

    useEffect(() => {
        if (!modal) return;

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") closeModal();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [modal]);

    function applyFilters(
        overrides: {
            search?: string;
            status?: string;
            type?: string;
        } = {},
    ) {
        const next = {
            search,
            status: statusFilter,
            type: typeFilter,
            ...overrides,
        };

        setSearch(next.search);
        setStatusFilter(next.status);
        setTypeFilter(next.type);

        router.get("/mdrrmo/ambulances", next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const isEditing = modal === "edit" && selected !== null;

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                toast.success(
                    isEditing
                        ? "Ambulance updated successfully."
                        : "Ambulance registered successfully.",
                );
            },
            onError: (validationErrors: Record<string, string>) => {
                const message =
                    Object.values(validationErrors)[0] ??
                    "Please check the form and try again.";
                toast.error(String(message));
            },
        };

        if (isEditing && selected) {
            put(`/mdrrmo/ambulances/${selected.id}`, options);
        } else if (modal === "create") {
            post("/mdrrmo/ambulances", options);
        }
    }

    function removeAmbulance(ambulance: AmbulanceRecord) {
        const confirmed = window.confirm(
            `Remove ${ambulance.vehicle_code} from the active fleet?`,
        );

        if (!confirmed) return;

        router.delete(`/mdrrmo/ambulances/${ambulance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    `Ambulance ${ambulance.vehicle_code} removed successfully.`,
                );
            },
            onError: (errors) => {
                const message =
                    errors.ambulance ??
                    Object.values(errors)[0] ??
                    "Unable to remove this ambulance.";
                toast.error(String(message));
            },
        });
    }

    const summaryCards = [
        {
            label: "Total Fleet",
            value: stats.total,
            description: "Registered vehicles",
            icon: Truck,
            iconStyle:
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        },
        {
            label: "Available",
            value: stats.available,
            description: "Ready for assignment",
            icon: CheckCircle,
            iconStyle:
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        },
        {
            label: "Assigned",
            value: stats.assigned,
            description: "Reserved for operations",
            icon: Clock,
            iconStyle:
                "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        },
        {
            label: "On Mission",
            value: stats.onMission,
            description: "Currently responding",
            icon: Radio,
            iconStyle:
                "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        },
        {
            label: "Maintenance",
            value: stats.maintenance,
            description: "Service or inspection",
            icon: Wrench,
            iconStyle:
                "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        },
    ];

    const inputClass = (error?: string) =>
        `mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
            error
                ? "border-destructive focus:ring-destructive/20"
                : "border-input"
        }`;

    function textField(
        name: keyof FormFields,
        label: string,
        options: {
            type?: string;
            placeholder?: string;
            required?: boolean;
        } = {},
    ) {
        return (
            <div key={name} className="min-w-0">
                <label htmlFor={name} className="text-sm font-medium">
                    {label}
                    {options.required && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </label>

                <input
                    id={name}
                    type={options.type ?? "text"}
                    required={options.required}
                    placeholder={options.placeholder}
                    value={data[name]}
                    onChange={(event) => setData(name, event.target.value)}
                    className={inputClass(errors[name])}
                />

                {errors[name] && (
                    <p className="mt-1 text-xs text-destructive">
                        {errors[name]}
                    </p>
                )}
            </div>
        );
    }

    function selectField(
        name: "ambulance_type" | "status",
        label: string,
        options: Record<string, string>,
    ) {
        return (
            <div key={name} className="min-w-0">
                <label htmlFor={name} className="text-sm font-medium">
                    {label}
                    <span className="ml-1 text-destructive">*</span>
                </label>

                <select
                    id={name}
                    required
                    value={data[name]}
                    onChange={(event) => setData(name, event.target.value)}
                    className={inputClass(errors[name])}
                >
                    {Object.entries(options).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>

                {errors[name] && (
                    <p className="mt-1 text-xs text-destructive">
                        {errors[name]}
                    </p>
                )}
            </div>
        );
    }

    function detailItem(
        label: string,
        value: string | number | null | undefined,
    ) {
        return (
            <div
                key={label}
                className="min-w-0 border-b border-border/70 py-3 last:border-0"
            >
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-medium">
                    {value === null || value === undefined || value === ""
                        ? "Not provided"
                        : value}
                </dd>
            </div>
        );
    }

    return (
        <>
            <Head title="Ambulance Fleet" />

            <div className="flex h-full w-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Page heading */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary/10 p-3 text-primary">
                            <AmbulanceIcon className="size-7" />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Ambulance Fleet
                                </h1>
                                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium">
                                    MDRRMO
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Fleet inventory, vehicle readiness, and
                                operational status.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Register Ambulance
                    </button>
                </div>

                {/* Fleet summary */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    {summaryCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.label}
                                className="min-w-0 rounded-xl border border-sidebar-border/70 bg-card p-5 transition-shadow hover:shadow-sm dark:border-sidebar-border"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {card.label}
                                        </p>
                                        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
                                            {card.value}
                                        </p>
                                    </div>

                                    <div
                                        className={`rounded-xl p-3 ${card.iconStyle}`}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    {card.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Fleet table */}
                <section className="w-full min-w-0 overflow-hidden rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-5">
                        <div>
                            <h2 className="font-semibold">
                                Registered Vehicles
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {ambulances.total} vehicle
                                {ambulances.total === 1 ? "" : "s"} in the fleet
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                router.reload({ only: ["ambulances", "stats"] })
                            }
                            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-input px-3 text-sm font-medium transition hover:bg-muted md:self-auto"
                        >
                            <RefreshCw className="size-4" />
                            Refresh
                        </button>
                    </div>

                    {/* Search and filters */}
                    <div className="border-b border-border bg-muted/20 p-4 md:p-5">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters();
                            }}
                            className="flex w-full flex-col gap-3 xl:flex-row xl:items-end"
                        >
                            {/* Title */}
                            <div className="shrink-0 xl:w-44 xl:pb-2">
                                <h3 className="text-sm font-semibold">
                                    Find an ambulance
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Search and filter fleet
                                </p>
                            </div>

                            {/* Search */}
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    aria-label="Search ambulances"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search vehicle code, plate, make, or model..."
                                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                                />
                            </div>

                            {/* Status */}
                            <div className="w-full shrink-0 xl:w-44">
                                <select
                                    aria-label="Filter by operational status"
                                    value={statusFilter}
                                    onChange={(event) =>
                                        applyFilters({
                                            status: event.target.value,
                                        })
                                    }
                                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                >
                                    <option value="">All statuses</option>
                                    {Object.entries(statuses).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* Ambulance type */}
                            <div className="w-full shrink-0 xl:w-52">
                                <select
                                    aria-label="Filter by ambulance type"
                                    value={typeFilter}
                                    onChange={(event) =>
                                        applyFilters({
                                            type: event.target.value,
                                        })
                                    }
                                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                                >
                                    <option value="">
                                        All ambulance types
                                    </option>
                                    {Object.entries(types).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* Actions */}
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
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("");
                                        setTypeFilter("");

                                        router.get(
                                            "/mdrrmo/ambulances",
                                            {},
                                            {
                                                replace: true,
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        );
                                    }}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium transition hover:bg-muted"
                                    title="Clear search and filters"
                                >
                                    <RefreshCw className="size-4" />
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-muted/40">
                                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-5 py-4 font-semibold">
                                        Vehicle
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Registration
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Ambulance Type
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {ambulances.data.map((ambulance) => (
                                    <tr
                                        key={ambulance.id}
                                        className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/30"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                    <AmbulanceIcon className="size-5 text-muted-foreground" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-semibold">
                                                        {ambulance.vehicle_code}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {[
                                                            ambulance.make,
                                                            ambulance.model,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" ") ||
                                                            "Vehicle details not specified"}
                                                        {ambulance.year
                                                            ? ` · ${ambulance.year}`
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium">
                                                {ambulance.plate_number || "—"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {ambulance.registration_number ||
                                                    "No registration record"}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            {types[ambulance.ambulance_type] ??
                                                ambulance.ambulance_type}
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge
                                                status={ambulance.status}
                                                statuses={statuses}
                                            />
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    title="View details"
                                                    onClick={() =>
                                                        openView(ambulance)
                                                    }
                                                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                >
                                                    <Eye className="size-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Edit ambulance"
                                                    onClick={() =>
                                                        openEdit(ambulance)
                                                    }
                                                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>

                                                {/* <button
                                                    type="button"
                                                    title="Remove ambulance"
                                                    onClick={() =>
                                                        removeAmbulance(
                                                            ambulance,
                                                        )
                                                    }
                                                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {ambulances.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
                                                <AmbulanceIcon className="size-7 text-muted-foreground" />
                                            </div>
                                            <h3 className="mt-4 font-semibold">
                                                No ambulances found
                                            </h3>
                                            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                                                There are no vehicles matching
                                                these filters. Register an
                                                ambulance or reset your search.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={openCreate}
                                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                                            >
                                                <Plus className="size-4" />
                                                Register Ambulance
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {ambulances.current_page} of{" "}
                            {Math.max(ambulances.last_page, 1)}
                            {" · "}
                            {ambulances.total} total vehicles
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {ambulances.links.map((link, index) => (
                                <button
                                    key={`${index}-${link.label}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            });
                                        }
                                    }}
                                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${
                                        link.active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-input hover:bg-muted"
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

            {/* Modal backdrop */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ambulance-modal-title"
                        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                    >
                        {/* Modal header */}
                        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    {modal === "view" ? (
                                        <Eye className="size-5" />
                                    ) : modal === "edit" ? (
                                        <Pencil className="size-5" />
                                    ) : (
                                        <AmbulanceIcon className="size-5" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="ambulance-modal-title"
                                        className="text-lg font-bold tracking-tight"
                                    >
                                        {modal === "create"
                                            ? "Register Ambulance"
                                            : modal === "edit"
                                              ? "Edit Ambulance"
                                              : "Ambulance Details"}
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {modal === "create"
                                            ? "Add a vehicle to the municipal fleet."
                                            : modal === "edit"
                                              ? `Updating ${selected?.vehicle_code ?? "vehicle"}`
                                              : `Vehicle record: ${selected?.vehicle_code ?? ""}`}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </header>

                        {/* Create / Edit modal */}
                        {(modal === "create" || modal === "edit") && (
                            <form
                                onSubmit={submitForm}
                                className="flex min-h-0 flex-1 flex-col"
                            >
                                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                                    <div>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold">
                                                Vehicle Information
                                            </h3>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Identification, specifications,
                                                and operational status.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {textField(
                                                "vehicle_code",
                                                "Vehicle Code",
                                                {
                                                    required: true,
                                                    placeholder:
                                                        "MDRRMO-AMB-001",
                                                },
                                            )}
                                            {textField(
                                                "plate_number",
                                                "Plate Number",
                                                {
                                                    placeholder:
                                                        "Vehicle plate number",
                                                },
                                            )}
                                            {textField("make", "Make", {
                                                placeholder: "e.g. Toyota",
                                            })}
                                            {textField("model", "Model", {
                                                placeholder: "e.g. HiAce",
                                            })}
                                            {textField("year", "Year", {
                                                type: "number",
                                                placeholder: "e.g. 2025",
                                            })}
                                            {selectField(
                                                "ambulance_type",
                                                "Ambulance Type",
                                                types,
                                            )}
                                            {selectField(
                                                "status",
                                                "Operational Status",
                                                statuses,
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-5">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold">
                                                Registration & Insurance
                                            </h3>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Keep the vehicle's legal
                                                documents current.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {textField(
                                                "registration_number",
                                                "Registration Number",
                                            )}
                                            {textField(
                                                "registration_expiry",
                                                "Registration Expiry",
                                                { type: "date" },
                                            )}
                                            {textField(
                                                "insurance_expiry",
                                                "Insurance Expiry",
                                                { type: "date" },
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-5">
                                        <label
                                            htmlFor="ambulance-notes"
                                            className="text-sm font-medium"
                                        >
                                            Additional Notes
                                        </label>
                                        <textarea
                                            id="ambulance-notes"
                                            rows={3}
                                            maxLength={5000}
                                            value={data.notes}
                                            onChange={(event) =>
                                                setData(
                                                    "notes",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Vehicle condition, equipment, or other relevant details..."
                                            className={`mt-1.5 w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
                                                errors.notes
                                                    ? "border-destructive"
                                                    : "border-input"
                                            }`}
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {errors.notes}
                                            </p>
                                        )}
                                    </div>

                                    {modal === "edit" && (
                                        <p className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                            Changing a vehicle's status must not
                                            override an active booking,
                                            assignment, or mission. The backend
                                            should enforce these operational
                                            checks.
                                        </p>
                                    )}
                                </div>

                                <footer className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="size-4" />
                                        {processing
                                            ? "Saving..."
                                            : modal === "create"
                                              ? "Register Ambulance"
                                              : "Save Changes"}
                                    </button>
                                </footer>
                            </form>
                        )}

                        {/* View details modal */}
                        {modal === "view" && selected && (
                            <>
                                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
                                        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <AmbulanceIcon className="size-7" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-bold">
                                                {selected.vehicle_code}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {[selected.make, selected.model]
                                                    .filter(Boolean)
                                                    .join(" ") ||
                                                    "Vehicle details not specified"}
                                                {selected.year
                                                    ? ` · ${selected.year}`
                                                    : ""}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
                                                    {types[
                                                        selected.ambulance_type
                                                    ] ??
                                                        selected.ambulance_type}
                                                </span>
                                                <StatusBadge
                                                    status={selected.status}
                                                    statuses={statuses}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openEdit(selected)}
                                            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
                                        >
                                            <Pencil className="size-4" />
                                            Edit
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                        <section className="min-w-0 rounded-xl border border-border p-4">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                                <Hash className="size-4 text-muted-foreground" />
                                                Vehicle Information
                                            </h3>
                                            <dl className="mt-3">
                                                {detailItem(
                                                    "Vehicle Code",
                                                    selected.vehicle_code,
                                                )}
                                                {detailItem(
                                                    "Plate Number",
                                                    selected.plate_number,
                                                )}
                                                {detailItem(
                                                    "Make",
                                                    selected.make,
                                                )}
                                                {detailItem(
                                                    "Model",
                                                    selected.model,
                                                )}
                                                {detailItem(
                                                    "Year",
                                                    selected.year,
                                                )}
                                                {detailItem(
                                                    "Ambulance Type",
                                                    types[
                                                        selected.ambulance_type
                                                    ] ??
                                                        selected.ambulance_type,
                                                )}
                                            </dl>
                                        </section>

                                        <section className="min-w-0 rounded-xl border border-border p-4">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                                <ShieldCheck className="size-4 text-muted-foreground" />
                                                Registration & Insurance
                                            </h3>
                                            <dl className="mt-3">
                                                {detailItem(
                                                    "Registration Number",
                                                    selected.registration_number,
                                                )}
                                                {detailItem(
                                                    "Registration Expiry",
                                                    formatDate(
                                                        selected.registration_expiry,
                                                    ),
                                                )}
                                                {detailItem(
                                                    "Insurance Expiry",
                                                    formatDate(
                                                        selected.insurance_expiry,
                                                    ),
                                                )}
                                            </dl>
                                        </section>

                                        <section className="min-w-0 rounded-xl border border-border p-4 lg:col-span-2">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                                <FileText className="size-4 text-muted-foreground" />
                                                Additional Notes
                                            </h3>
                                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                                                {selected.notes ||
                                                    "No additional notes recorded."}
                                            </p>
                                        </section>

                                        <section className="min-w-0 rounded-xl border border-border p-4 lg:col-span-2">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                                <CalendarDays className="size-4 text-muted-foreground" />
                                                Record Information
                                            </h3>
                                            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Date Registered
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {formatDate(
                                                            selected.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Last Updated
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium">
                                                        {formatDate(
                                                            selected.updated_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <footer className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
                                    <span className="text-xs text-muted-foreground">
                                        Fleet record #{selected.id}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                    >
                                        Close
                                    </button>
                                </footer>
                            </>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}

AmbulanceIndex.layout = {
    breadcrumbs: [
        { title: "MDRRMO Operations", href: "/mdrrmo/operations" },
        { title: "Ambulance Fleet", href: "/mdrrmo/ambulances" },
    ],
};
