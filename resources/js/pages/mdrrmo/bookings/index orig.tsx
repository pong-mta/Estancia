import { Head, router, useForm } from "@inertiajs/react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
    Search,
    RefreshCw,
    Eye,
    X,
    CheckCircle2,
    XCircle,
    Clock3,
    CalendarDays,
    MapPin,
    Phone,
    UserRound,
    ClipboardList,
    FileText,
    Check,
    Ban,
    Plus,
    Save,
    Mail,
} from "lucide-react";

type Reviewer = {
    id: number;
    name: string;
};

type Booking = {
    id: number;
    request_number: string;
    requester_name: string;
    requester_phone: string;
    requester_email: string | null;
    purpose: string;
    purpose_details: string | null;
    passenger_count: number;
    pickup_address: string;
    pickup_barangay: string | null;
    destination_address: string;
    destination_barangay: string | null;
    requested_date: string;
    requested_time: string;
    status: string;
    rejection_reason: string | null;
    internal_notes: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    created_at: string;
    reviewer?: Reviewer | null;
};

type PaginatedBookings = {
    data: Booking[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type Props = {
    bookings: PaginatedBookings;
    filters: {
        search?: string;
        status?: string;
        date?: string;
    };
    statuses: Record<string, string>;
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        completed: number;
    };
};

type CreateBookingData = {
    requester_name: string;
    requester_phone: string;
    requester_email: string;
    purpose: string;
    purpose_details: string;
    passenger_count: string;
    pickup_address: string;
    pickup_barangay: string;
    destination_address: string;
    destination_barangay: string;
    requested_date: string;
    requested_time: string;
    internal_notes: string;
};

type ReviewData = {
    internal_notes: string;
};

type RejectData = {
    rejection_reason: string;
    internal_notes: string;
};

const inputClass =
    "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export default function BookingRequestsIndex({
    bookings,
    filters,
    statuses,
    stats,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [date, setDate] = useState(filters.date ?? "");

    const [createOpen, setCreateOpen] = useState(false);
    const [selected, setSelected] = useState<Booking | null>(null);
    const [modal, setModal] = useState<"view" | "reject" | null>(null);

    const createForm = useForm<CreateBookingData>({
        requester_name: "",
        requester_phone: "",
        requester_email: "",
        purpose: "medical",
        purpose_details: "",
        passenger_count: "1",
        pickup_address: "",
        pickup_barangay: "",
        destination_address: "",
        destination_barangay: "",
        requested_date: "",
        requested_time: "",
        internal_notes: "",
    });

    const reviewForm = useForm<ReviewData>({
        internal_notes: "",
    });

    const rejectForm = useForm<RejectData>({
        rejection_reason: "",
        internal_notes: "",
    });

    function applyFilters(event?: FormEvent) {
        event?.preventDefault();

        router.get(
            "/mdrrmo/bookings",
            {
                search: search || undefined,
                status: status || undefined,
                date: date || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setSearch("");
        setStatus("");
        setDate("");

        router.get(
            "/mdrrmo/bookings",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function openCreateModal() {
        createForm.reset();
        createForm.clearErrors();
        setCreateOpen(true);
    }

    function closeCreateModal() {
        setCreateOpen(false);
        createForm.reset();
        createForm.clearErrors();
    }

    function submitCreateBooking(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createForm.post("/mdrrmo/bookings", {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Booking created and placed in Pending Review.");
                closeCreateModal();
            },
            onError: () => {
                toast.error(
                    "Unable to create booking. Check the form details.",
                );
            },
        });
    }

    function openBooking(booking: Booking) {
        setSelected(booking);
        setModal("view");
        reviewForm.setData("internal_notes", booking.internal_notes ?? "");
        reviewForm.clearErrors();
    }

    function closeModal() {
        setSelected(null);
        setModal(null);
        reviewForm.reset();
        reviewForm.clearErrors();
        rejectForm.reset();
        rejectForm.clearErrors();
    }

    function approve(booking: Booking) {
        router.patch(
            `/mdrrmo/bookings/${booking.id}/approve`,
            {
                internal_notes: reviewForm.data.internal_notes || "",
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        "Booking approved. Ambulance assignment and dispatch are separate operations.",
                    );
                    closeModal();
                },
                onError: () => {
                    toast.error("Unable to approve this booking.");
                },
            },
        );
    }

    function openRejectModal() {
        rejectForm.reset();
        rejectForm.clearErrors();
        setModal("reject");
    }

    function submitRejection(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selected) return;

        rejectForm.patch(`/mdrrmo/bookings/${selected.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Booking request rejected.");
                closeModal();
            },
            onError: () => {
                toast.error("Unable to reject this booking.");
            },
        });
    }

    return (
        <>
            <Head title="Booking Requests" />

            <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Page heading */}
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Booking Requests
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage ambulance booking requests and review
                            scheduled trips.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                            Approval does not dispatch an ambulance.
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                        >
                            <Plus className="size-4" />
                            Create Booking
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        title="Total Requests"
                        value={stats.total}
                        icon={<ClipboardList className="size-5" />}
                    />
                    <StatCard
                        title="Pending Review"
                        value={stats.pending}
                        icon={<Clock3 className="size-5" />}
                    />
                    <StatCard
                        title="Approved"
                        value={stats.approved}
                        icon={<CheckCircle2 className="size-5" />}
                    />
                    <StatCard
                        title="Rejected"
                        value={stats.rejected}
                        icon={<XCircle className="size-5" />}
                    />
                    <StatCard
                        title="Completed"
                        value={stats.completed}
                        icon={<Check className="size-5" />}
                    />
                </div>

                {/* Filters */}
                <form
                    onSubmit={applyFilters}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                        <div className="min-w-0 flex-1">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Request number, requester, phone, address..."
                                    className={`${inputClass} pl-9`}
                                />
                            </div>
                        </div>

                        <div className="w-full xl:w-52">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className={inputClass}
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

                        <div className="w-full xl:w-48">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Requested date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(event) =>
                                    setDate(event.target.value)
                                }
                                className={inputClass}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                <Search className="size-4" />
                                Filter
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Reset filters"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-semibold hover:bg-muted"
                            >
                                <RefreshCw className="size-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </form>

                {/* Bookings table */}
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                Ambulance Booking Requests
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {bookings.total} request
                                {bookings.total === 1 ? "" : "s"} found
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">
                                        Request
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Requester
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Schedule
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Route
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Purpose
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {bookings.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                                                <ClipboardList className="size-6 text-muted-foreground" />
                                            </div>
                                            <p className="mt-3 font-semibold">
                                                No booking requests found
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Create a booking or adjust your
                                                filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.data.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="transition hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold">
                                                    {booking.request_number}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    ID #{booking.id}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium">
                                                    {booking.requester_name}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="size-3" />
                                                    {booking.requester_phone}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="flex items-center gap-2 font-medium">
                                                    <CalendarDays className="size-4 text-muted-foreground" />
                                                    {formatDate(
                                                        booking.requested_date,
                                                    )}
                                                </p>
                                                <p className="mt-1 pl-6 text-xs text-muted-foreground">
                                                    {formatTime(
                                                        booking.requested_time,
                                                    )}
                                                </p>
                                            </td>

                                            <td className="max-w-64 px-5 py-4">
                                                <p className="line-clamp-2">
                                                    {booking.pickup_address}
                                                </p>
                                                <p className="my-1 text-xs text-muted-foreground">
                                                    to
                                                </p>
                                                <p className="line-clamp-2 text-muted-foreground">
                                                    {
                                                        booking.destination_address
                                                    }
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium">
                                                    {humanize(booking.purpose)}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {booking.passenger_count}{" "}
                                                    passenger
                                                    {booking.passenger_count ===
                                                    1
                                                        ? ""
                                                        : "s"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={booking.status}
                                                    label={
                                                        statuses[
                                                            booking.status
                                                        ] ??
                                                        humanize(booking.status)
                                                    }
                                                />
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end">
                                                    <IconButton
                                                        label="View booking"
                                                        onClick={() =>
                                                            openBooking(booking)
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            Showing {bookings.from ?? 0}–{bookings.to ?? 0} of{" "}
                            {bookings.total} requests
                        </p>

                        <div className="flex flex-wrap items-center gap-1">
                            {bookings.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(
                                                link.url,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            );
                                        }
                                    }}
                                    className={`min-w-9 rounded-md border px-3 py-2 text-xs ${
                                        link.active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border hover:bg-muted"
                                    } disabled:cursor-not-allowed disabled:opacity-40`}
                                >
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create booking modal */}
            {createOpen && (
                <ModalShell
                    title="Create Booking Request"
                    subtitle="Register a booking received by MDRRMO."
                    icon={<Plus className="size-5" />}
                    onClose={closeCreateModal}
                    size="max-w-4xl"
                >
                    <form
                        onSubmit={submitCreateBooking}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                                This request will be created as{" "}
                                <strong>Pending Review</strong>. It will not
                                automatically assign or dispatch an ambulance.
                            </div>

                            <section>
                                <SectionTitle>
                                    Requester information
                                </SectionTitle>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <FormField
                                        label="Requester name"
                                        required
                                        error={createForm.errors.requester_name}
                                    >
                                        <input
                                            required
                                            maxLength={150}
                                            value={
                                                createForm.data.requester_name
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "requester_name",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Full name"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Contact number"
                                        required
                                        error={
                                            createForm.errors.requester_phone
                                        }
                                    >
                                        <input
                                            required
                                            maxLength={30}
                                            value={
                                                createForm.data.requester_phone
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "requester_phone",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="09XXXXXXXXX"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Email address"
                                        error={
                                            createForm.errors.requester_email
                                        }
                                    >
                                        <input
                                            type="email"
                                            maxLength={150}
                                            value={
                                                createForm.data.requester_email
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "requester_email",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Optional email"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Passenger count"
                                        required
                                        error={
                                            createForm.errors.passenger_count
                                        }
                                    >
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={100}
                                            value={
                                                createForm.data.passenger_count
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "passenger_count",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </FormField>
                                </div>
                            </section>

                            <section>
                                <SectionTitle>Trip details</SectionTitle>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <FormField
                                        label="Purpose"
                                        required
                                        error={createForm.errors.purpose}
                                    >
                                        <select
                                            required
                                            value={createForm.data.purpose}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "purpose",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="medical">
                                                Medical assistance / appointment
                                            </option>
                                            <option value="emergency">
                                                Emergency response
                                            </option>
                                            <option value="hospital_transfer">
                                                Hospital transfer
                                            </option>
                                            <option value="inter_facility_transfer">
                                                Inter-facility transfer
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                    </FormField>

                                    <FormField
                                        label="Purpose details"
                                        error={
                                            createForm.errors.purpose_details
                                        }
                                    >
                                        <input
                                            maxLength={1000}
                                            value={
                                                createForm.data.purpose_details
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "purpose_details",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Optional details"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Pickup address"
                                        required
                                        error={createForm.errors.pickup_address}
                                    >
                                        <textarea
                                            required
                                            rows={3}
                                            maxLength={2000}
                                            value={
                                                createForm.data.pickup_address
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "pickup_address",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Street, landmark, sitio..."
                                        />
                                    </FormField>

                                    <FormField
                                        label="Destination address"
                                        required
                                        error={
                                            createForm.errors
                                                .destination_address
                                        }
                                    >
                                        <textarea
                                            required
                                            rows={3}
                                            maxLength={2000}
                                            value={
                                                createForm.data
                                                    .destination_address
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "destination_address",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Hospital or destination address..."
                                        />
                                    </FormField>

                                    <FormField
                                        label="Pickup barangay"
                                        error={
                                            createForm.errors.pickup_barangay
                                        }
                                    >
                                        <input
                                            maxLength={100}
                                            value={
                                                createForm.data.pickup_barangay
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "pickup_barangay",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Barangay"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Destination barangay"
                                        error={
                                            createForm.errors
                                                .destination_barangay
                                        }
                                    >
                                        <input
                                            maxLength={100}
                                            value={
                                                createForm.data
                                                    .destination_barangay
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "destination_barangay",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Barangay"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Requested date"
                                        required
                                        error={createForm.errors.requested_date}
                                    >
                                        <input
                                            type="date"
                                            required
                                            value={
                                                createForm.data.requested_date
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "requested_date",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Requested time"
                                        required
                                        error={createForm.errors.requested_time}
                                    >
                                        <input
                                            type="time"
                                            required
                                            value={
                                                createForm.data.requested_time
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "requested_time",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </FormField>
                                </div>
                            </section>

                            <section>
                                <SectionTitle>Internal notes</SectionTitle>

                                <FormField
                                    label="Notes for MDRRMO (optional)"
                                    error={createForm.errors.internal_notes}
                                >
                                    <textarea
                                        rows={3}
                                        maxLength={5000}
                                        value={createForm.data.internal_notes}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "internal_notes",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Information for internal use only..."
                                    />
                                </FormField>
                            </section>
                        </div>

                        <ModalFooter>
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="h-10 rounded-lg border border-input px-4 text-sm font-semibold hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                                <Save className="size-4" />
                                {createForm.processing
                                    ? "Creating..."
                                    : "Create Pending Booking"}
                            </button>
                        </ModalFooter>
                    </form>
                </ModalShell>
            )}

            {/* View and reject booking modal */}
            {modal && selected && (
                <ModalShell
                    title={
                        modal === "reject"
                            ? "Reject booking request"
                            : "Booking request details"
                    }
                    subtitle={selected.request_number}
                    icon={<ClipboardList className="size-5" />}
                    onClose={closeModal}
                    size="max-w-3xl"
                >
                    {modal === "reject" ? (
                        <form
                            onSubmit={submitRejection}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                                    Provide a clear reason why this booking
                                    cannot be approved.
                                </div>

                                <FormField
                                    label="Rejection reason"
                                    required
                                    error={rejectForm.errors.rejection_reason}
                                >
                                    <textarea
                                        required
                                        minLength={3}
                                        maxLength={5000}
                                        rows={5}
                                        value={rejectForm.data.rejection_reason}
                                        onChange={(e) =>
                                            rejectForm.setData(
                                                "rejection_reason",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Explain why this request cannot be approved..."
                                    />
                                </FormField>

                                <FormField
                                    label="Internal notes (optional)"
                                    error={rejectForm.errors.internal_notes}
                                >
                                    <textarea
                                        rows={3}
                                        maxLength={5000}
                                        value={rejectForm.data.internal_notes}
                                        onChange={(e) =>
                                            rejectForm.setData(
                                                "internal_notes",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Internal notes for MDRRMO..."
                                    />
                                </FormField>
                            </div>

                            <ModalFooter>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-10 rounded-lg border border-input px-4 text-sm font-semibold hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                                >
                                    <Ban className="size-4" />
                                    {rejectForm.processing
                                        ? "Rejecting..."
                                        : "Confirm rejection"}
                                </button>
                            </ModalFooter>
                        </form>
                    ) : (
                        <>
                            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Current status
                                        </p>
                                        <div className="mt-2">
                                            <StatusBadge
                                                status={selected.status}
                                                label={
                                                    statuses[selected.status] ??
                                                    humanize(selected.status)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="text-sm sm:text-right">
                                        <p className="text-xs text-muted-foreground">
                                            Requested schedule
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {formatDate(
                                                selected.requested_date,
                                            )}{" "}
                                            at{" "}
                                            {formatTime(
                                                selected.requested_time,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <DetailGroup
                                    title="Requester information"
                                    icon={<UserRound className="size-4" />}
                                >
                                    <Detail
                                        label="Requester"
                                        value={selected.requester_name}
                                    />
                                    <Detail
                                        label="Phone"
                                        value={selected.requester_phone}
                                    />
                                    <Detail
                                        label="Email"
                                        value={selected.requester_email}
                                    />
                                    <Detail
                                        label="Passengers"
                                        value={String(selected.passenger_count)}
                                    />
                                </DetailGroup>

                                <DetailGroup
                                    title="Trip details"
                                    icon={<MapPin className="size-4" />}
                                >
                                    <Detail
                                        label="Purpose"
                                        value={humanize(selected.purpose)}
                                    />
                                    <Detail
                                        label="Purpose details"
                                        value={selected.purpose_details}
                                    />
                                    <Detail
                                        label="Pickup address"
                                        value={[
                                            selected.pickup_address,
                                            selected.pickup_barangay,
                                        ]
                                            .filter(Boolean)
                                            .join(", ")}
                                    />
                                    <Detail
                                        label="Destination"
                                        value={[
                                            selected.destination_address,
                                            selected.destination_barangay,
                                        ]
                                            .filter(Boolean)
                                            .join(", ")}
                                    />
                                </DetailGroup>

                                {selected.status === "rejected" &&
                                    selected.rejection_reason && (
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                                            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                                                Rejection reason
                                            </p>
                                            <p className="mt-2 whitespace-pre-wrap text-sm text-rose-800 dark:text-rose-300">
                                                {selected.rejection_reason}
                                            </p>
                                        </div>
                                    )}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Detail
                                        label="Submitted"
                                        value={formatDate(selected.created_at)}
                                    />
                                    <Detail
                                        label="Reviewed at"
                                        value={
                                            selected.reviewed_at
                                                ? new Date(
                                                      selected.reviewed_at,
                                                  ).toLocaleString()
                                                : "Not reviewed"
                                        }
                                    />
                                    <Detail
                                        label="Reviewed by"
                                        value={selected.reviewer?.name ?? "—"}
                                    />
                                </div>

                                {selected.status === "pending" && (
                                    <FormField
                                        label="Internal notes (optional)"
                                        error={reviewForm.errors.internal_notes}
                                    >
                                        <textarea
                                            rows={3}
                                            maxLength={5000}
                                            value={
                                                reviewForm.data.internal_notes
                                            }
                                            onChange={(e) =>
                                                reviewForm.setData(
                                                    "internal_notes",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Notes for MDRRMO review..."
                                        />
                                    </FormField>
                                )}
                            </div>

                            <ModalFooter>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-10 rounded-lg border border-input px-4 text-sm font-semibold hover:bg-muted"
                                >
                                    Close
                                </button>

                                {selected.status === "pending" && (
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={openRejectModal}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 text-sm font-semibold text-destructive hover:bg-destructive/5"
                                        >
                                            <Ban className="size-4" />
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => approve(selected)}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                                        >
                                            <Check className="size-4" />
                                            Approve request
                                        </button>
                                    </div>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalShell>
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
    icon: ReactNode;
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

function StatusBadge({ status, label }: { status: string; label: string }) {
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}
        >
            {label}
        </span>
    );
}

function statusStyle(status: string) {
    switch (status) {
        case "pending":
            return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
        case "approved":
            return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";
        case "rejected":
            return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300";
        case "cancelled":
            return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300";
        case "completed":
            return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300";
        default:
            return "border-border bg-muted text-muted-foreground";
    }
}

function humanize(value: string | null | undefined) {
    if (!value) return "—";

    return value
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    const date = value.slice(0, 10);
    const parsed = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
          });
}

function formatTime(value: string | null | undefined) {
    if (!value) return "—";

    const match = value.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return value;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const parsed = new Date();

    parsed.setHours(hours, minutes, 0, 0);

    return parsed.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
}

function FormField({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block text-sm font-medium">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
            {children}
            {error && (
                <span className="mt-1 block text-xs font-normal text-destructive">
                    {error}
                </span>
            )}
        </label>
    );
}

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold">
            {children}
        </h3>
    );
}

function ModalShell({
    title,
    subtitle,
    icon,
    onClose,
    size = "max-w-3xl",
    children,
}: {
    title: string;
    subtitle?: string;
    icon: ReactNode;
    onClose: () => void;
    size?: string;
    children: ReactNode;
}) {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                className={`flex max-h-[94vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl`}
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            {icon}
                        </div>
                        <div>
                            <h2 className="font-semibold">{title}</h2>
                            {subtitle && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {children}
        </div>
    );
}

function DetailGroup({
    title,
    icon,
    children,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold">
                <span className="text-muted-foreground">{icon}</span>
                {title}
            </h3>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {children}
            </div>
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

function IconButton({
    children,
    label,
    onClick,
}: {
    children: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className="flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
        >
            {children}
        </button>
    );
}

BookingRequestsIndex.layout = {
    breadcrumbs: [
        {
            title: "Booking Request",
            href: "/mdrrmo/bookings",
        },
    ],
};
