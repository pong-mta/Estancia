import { Head, Link, router } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    History,
    CalendarDays,
    Ambulance,
    FileSpreadsheet,
    Printer,
} from "lucide-react";

interface Booking {
    request_number: string;
    requester_name: string;
    purpose: string;
    purpose_details: string | null;
    pickup_address: string;
    pickup_barangay: string | null;
    destination_address: string;
    destination_barangay: string | null;
}

interface Operation {
    id: number;
    operation_number: string;
    status: string;
    dispatched_at: string | null;
    returned_at: string | null;
    booking: Booking | null;
    ambulances: Array<{
        ambulance: { vehicle_code: string } | null;
        released_at: string | null;
    }>;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedOperations {
    data: Operation[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    operations: PaginatedOperations;
    statuses: Record<string, string>;
    filters: {
        search?: string;
        status?: string;
        date?: string;
    };
}

const formatDate = (value: string | null) =>
    value
        ? new Date(value).toLocaleDateString()
        : "—";

const formatTime = (value: string | null) =>
    value
        ? new Date(value).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "Not yet returned";

const statusColor = (status: string) => {
    switch (status) {
        case "dispatched":
            return "bg-purple-100 text-purple-800";
        case "in_progress":
            return "bg-orange-100 text-orange-800";
        case "returned":
            return "bg-blue-100 text-blue-800";
        case "completed":
            return "bg-green-100 text-green-800";
        case "cancelled":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export default function DispatchHistoryIndex({
    operations,
    statuses,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [date, setDate] = useState(filters.date ?? "");

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            "/mdrrmo/dispatch-history",
            {
                search: search || undefined,
                status: status || undefined,
                date: date || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const exportUrl = (() => {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (status) params.set("status", status);
        if (date) params.set("date", date);
        const query = params.toString();
        return `/mdrrmo/dispatch-history/export${query ? `?${query}` : ""}`;
    })();

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setDate("");
        router.get(
            "/mdrrmo/dispatch-history",
            {},
            { preserveState: false, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Dispatch History" />
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 12mm;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    .dispatch-print-area,
                    .dispatch-print-area * {
                        visibility: visible !important;
                    }

                    .dispatch-print-area {
                        position: fixed !important;
                        inset: 0 auto auto 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        overflow: visible !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                    }

                    .dispatch-print-area .dispatch-print-overflow {
                        overflow: visible !important;
                    }

                    .dispatch-report-header,
                    .dispatch-report-footer {
                        display: block !important;
                    }

                    .dispatch-report-header {
                        text-align: center !important;
                        margin-bottom: 18px !important;
                        padding-bottom: 12px !important;
                        border-bottom: 2px solid #222 !important;
                    }

                    .dispatch-report-footer {
                        margin-top: 28px !important;
                        padding-top: 12px !important;
                        border-top: 1px solid #777 !important;
                    }

                    .dispatch-print-area table {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: auto !important;
                        font-size: 9pt !important;
                    }

                    .dispatch-print-area th,
                    .dispatch-print-area td {
                        padding: 6px !important;
                        color: black !important;
                        white-space: normal !important;
                    }

                    .dispatch-print-area th:last-child,
                    .dispatch-print-area td:last-child {
                        display: none !important;
                    }

                    .dispatch-print-hide {
                        display: none !important;
                    }
                }
            `}</style>
            <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Dispatch History
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review ambulance dispatches, return times, incident
                            information, and operation status.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        <a
                            href={exportUrl}
                            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            <FileSpreadsheet className="size-4" />
                            Export Excel
                        </a>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                            <Printer className="size-4" />
                            Print Report
                        </button>
                        <Link
                            href="/mdrrmo/operations/manage"
                            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            <Ambulance className="size-4" />
                            Operations Management
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-5">
                        <p className="text-sm text-muted-foreground">
                            Total Dispatch Records
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                            {operations.total}
                        </p>
                    </div>
                    <div className="rounded-xl border bg-card p-5">
                        <p className="text-sm text-muted-foreground">
                            Current Page
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                            {operations.current_page}
                            <span className="text-base font-normal text-muted-foreground">
                                {" "}of {operations.last_page}
                            </span>
                        </p>
                    </div>
                    <div className="rounded-xl border bg-card p-5">
                        <p className="text-sm text-muted-foreground">
                            Records Displayed
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                            {operations.data.length}
                        </p>
                    </div>
                </div>

                <section className="rounded-xl border bg-card p-5">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 md:grid-cols-4"
                    >
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Dispatch No., requester, or location"
                                    className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">
                                Dispatch Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                            >
                                <option value="">All statuses</option>
                                {Object.entries(statuses).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2 md:col-span-4">
                            <button
                                type="submit"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                            >
                                Apply Filters
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </section>

                <section className="dispatch-print-area overflow-hidden rounded-xl border bg-card">
                    <div className="dispatch-report-header hidden">
                        <p className="text-sm font-semibold uppercase tracking-wide">Municipal Disaster Risk Reduction and Management Office</p>
                        <h2 className="mt-2 text-xl font-bold uppercase">Dispatch History Report</h2>
                        <p className="mt-1 text-xs">Generated: {new Date().toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 border-b p-5 dispatch-print-hide">
                        <History className="size-5" />
                        <h2 className="font-semibold">Dispatch Records</h2>
                    </div>
                    <div className="dispatch-print-overflow overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Dispatch No.</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Time of Dispatch</th>
                                    <th className="px-4 py-3">Time of Arrival</th>
                                    <th className="px-4 py-3">Incident Type</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {operations.data.length ? (
                                    operations.data.map((operation) => (
                                        <tr key={operation.id} className="hover:bg-muted/30">
                                            <td className="whitespace-nowrap px-4 py-4 font-medium">
                                                {operation.operation_number}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                {formatDate(operation.dispatched_at)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                {formatTime(operation.dispatched_at)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                {formatTime(operation.returned_at)}
                                            </td>
                                            <td className="px-4 py-4">
                                                {operation.booking?.purpose ?? "—"}
                                            </td>
                                            <td className="max-w-xs px-4 py-4">
                                                <span className="line-clamp-2">
                                                    {operation.booking?.pickup_address ?? "—"}
                                                    {operation.booking?.pickup_barangay
                                                        ? `, ${operation.booking.pickup_barangay}`
                                                        : ""}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(operation.status)}`}>
                                                    {statuses[operation.status] ?? operation.status.replaceAll("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/mdrrmo/operations/${operation.id}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"
                                                >
                                                    <Eye className="size-3.5" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                            No dispatch records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="dispatch-print-hide flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {operations.data.length} of {operations.total} dispatch records
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {operations.links.map((link, index) => {
                                const label = link.label
                                    .replace("&laquo;", "«")
                                    .replace("&raquo;", "»");
                                const isPrevious = index === 0;
                                const isNext = index === operations.links.length - 1;
                                return (
                                    <button
                                        key={`${index}-${label}`}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.visit(link.url, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            })
                                        }
                                        className={`inline-flex size-9 items-center justify-center rounded-lg border text-sm disabled:opacity-40 ${link.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                        aria-label={isPrevious ? "Previous page" : isNext ? "Next page" : `Page ${label}`}
                                    >
                                        {isPrevious ? (
                                            <ChevronLeft className="size-4" />
                                        ) : isNext ? (
                                            <ChevronRight className="size-4" />
                                        ) : (
                                            label
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

DispatchHistoryIndex.layout = {
    breadcrumbs: [
        { title: "MDRRMO Operations", href: "/mdrrmo/operations" },
        { title: "Dispatch History", href: "/mdrrmo/dispatch-history" },
    ],
};
