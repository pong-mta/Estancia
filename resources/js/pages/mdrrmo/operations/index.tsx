import { Head, Link, router } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Activity,
    Ambulance,
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Users,
    CalendarDays,
} from "lucide-react";

interface Booking {
    id: number;
    request_number: string;
    requester_name: string;
    pickup_address: string;
    destination_address: string;
}

interface Operation {
    id: number;
    operation_number: string;
    status: string;
    created_at: string;
    booking: Booking | null;
    ambulances: Array<{
        ambulance: {
            id: number;
            vehicle_code: string;
        } | null;
        released_at: string | null;
    }>;
    personnel: Array<{
        personnel: {
            id: number;
            first_name: string;
            last_name: string;
        } | null;
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
        search: string;
        status: string;
    };
}

export default function OperationsIndex({
    operations,
    statuses,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            "/mdrrmo/operations/manage",
            {
                search: search || undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");

        router.get(
            "/mdrrmo/operations/manage",
            {},
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    };

    const statusColor = (value: string) => {
        switch (value) {
            case "preparing":
                return "bg-yellow-100 text-yellow-800";

            case "assigned":
                return "bg-blue-100 text-blue-800";

            case "dispatched":
                return "bg-purple-100 text-purple-800";

            case "in_progress":
                return "bg-orange-100 text-orange-800";

            case "completed":
                return "bg-green-100 text-green-800";

            case "cancelled":
                return "bg-red-100 text-red-800";

            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <>
            <Head title="Operations Management" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Page Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Operations Management
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage ambulance operations, assignments, and
                            mission progress.
                        </p>
                    </div>

                    <Link
                        href="/mdrrmo/operations"
                        className="inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                        <Activity className="size-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Total Operations
                            </p>

                            <ClipboardList className="size-5 text-muted-foreground" />
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {operations.total}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Current Page
                            </p>

                            <CalendarDays className="size-5 text-muted-foreground" />
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {operations.current_page}
                            <span className="text-base font-normal text-muted-foreground">
                                {" "}of {operations.last_page}
                            </span>
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Records Displayed
                            </p>

                            <Users className="size-5 text-muted-foreground" />
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {operations.data.length}
                        </p>
                    </div>

                </div>

                {/* Search and Filters */}
                <div className="rounded-xl border bg-card p-5">

                    <form
                        onSubmit={applyFilters}
                        className="flex flex-col gap-3 md:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search operation number, request number, or requester..."
                                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Statuses</option>

                            {Object.entries(statuses).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
                        >
                            Clear
                        </button>
                    </form>

                </div>

                {/* Operations Table */}
                <div className="overflow-hidden rounded-xl border bg-card">

                    <div className="border-b p-5">
                        <h2 className="font-semibold">
                            Operations Records
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            View and manage all ambulance operations.
                        </p>
                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-4 font-medium">
                                        Operation Number
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Requester
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Ambulances
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Personnel
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Date Created
                                    </th>

                                    <th className="px-5 py-4 text-right font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">

                                {operations.data.length > 0 ? (
                                    operations.data.map((operation) => {

                                        const activeAmbulances =
                                            operation.ambulances.filter(
                                                (item) => !item.released_at,
                                            );

                                        const activePersonnel =
                                            operation.personnel.filter(
                                                (item) => !item.released_at,
                                            );

                                        return (
                                            <tr
                                                key={operation.id}
                                                className="transition hover:bg-muted/30"
                                            >

                                                <td className="px-5 py-4">
                                                    <p className="font-semibold">
                                                        {operation.operation_number}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground">
                                                        {operation.booking?.request_number ?? "No booking"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {operation.booking?.requester_name ?? "N/A"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Ambulance className="size-4 text-muted-foreground" />

                                                        {activeAmbulances.length}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="size-4 text-muted-foreground" />

                                                        {activePersonnel.length}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusColor(operation.status)}`}
                                                    >
                                                        {statuses[operation.status] ??
                                                            operation.status.replaceAll("_", " ")}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {new Date(
                                                        operation.created_at,
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        href={`/mdrrmo/operations/${operation.id}`}
                                                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"
                                                    >
                                                        <Eye className="size-4" />
                                                        View
                                                    </Link>
                                                </td>

                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center"
                                        >
                                            <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground" />

                                            <p className="font-medium">
                                                No operations found.
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Try changing your search or
                                                status filter.
                                            </p>
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-sm text-muted-foreground">
                            Showing page {operations.current_page} of{" "}
                            {operations.last_page} ({operations.total} total
                            operations)
                        </p>

                        <div className="flex flex-wrap items-center gap-2">

                            {operations.links.map((link, index) => {

                                const isPrevious =
                                    index === 0;

                                const isNext =
                                    index === operations.links.length - 1;

                                return (
                                    <button
                                        key={index}
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                });
                                            }
                                        }}
                                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                                            link.active
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        {isPrevious ? (
                                            <ChevronLeft className="size-4" />
                                        ) : isNext ? (
                                            <ChevronRight className="size-4" />
                                        ) : null}

                                        {!isPrevious && !isNext
                                            ? link.label.replace(
                                                  /&laquo;|&raquo;/g,
                                                  "",
                                              )
                                            : null}
                                    </button>
                                );
                            })}

                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}

OperationsIndex.layout = {
    breadcrumbs: [
        {
            title: "MDRRMO Operations",
            href: "/mdrrmo/operations",
        },
        {
            title: "Operations Management",
            href: "/mdrrmo/operations/manage",
        },
    ],
};
