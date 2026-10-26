import { Head } from "@inertiajs/react";
import {
    LayoutDashboard,
    Ambulance,
    Users,
    CalendarDays,
    Radio,
    History,
    CheckCircle,
    Clock,
    Activity,
} from "lucide-react";

interface DashboardStats {
    totalAmbulances: number;
    availableAmbulances: number;
    pendingBookings: number;
    activeDispatches: number;
    completedMissionsToday: number;
}

interface DashboardProps {
    stats: DashboardStats;
}

const statCards = (stats: DashboardStats) => [
    {
        title: "Total Ambulances",
        value: stats.totalAmbulances,
        icon: Ambulance,
        description: "Registered fleet",
    },
    {
        title: "Available Ambulances",
        value: stats.availableAmbulances,
        icon: CheckCircle,
        description: "Ready for assignment",
    },
    {
        title: "Pending Bookings",
        value: stats.pendingBookings,
        icon: Clock,
        description: "Awaiting approval",
    },
    {
        title: "Active Dispatches",
        value: stats.activeDispatches,
        icon: Radio,
        description: "Ongoing operations",
    },
    {
        title: "Completed Today",
        value: stats.completedMissionsToday,
        icon: Activity,
        description: "Completed missions",
    },
];

const operationLinks = [
    {
        title: "Ambulance Fleet",
        description: "Manage ambulance vehicles and availability.",
        href: "/mdrrmo/ambulances",
        icon: Ambulance,
    },
    {
        title: "Drivers & Personnel",
        description: "Manage ambulance drivers and assigned personnel.",
        href: "/mdrrmo/drivers",
        icon: Users,
    },
    {
        title: "Booking Requests",
        description: "Review, approve, or reject ambulance requests.",
        href: "/mdrrmo/bookings",
        icon: CalendarDays,
    },
    {
        title: "Dispatch Operations",
        description: "Assign vehicles and drivers and monitor responses.",
        href: "/mdrrmo/dispatch",
        icon: Radio,
    },
    {
        title: "Mission History",
        description: "Review completed ambulance missions.",
        href: "/mdrrmo/missions",
        icon: History,
    },
];

export default function Dashboard({ stats }: DashboardProps) {
    const cards = statCards(stats);

    return (
        <>
            <Head title="MDRRMO Operations Dashboard" />

            <div className="flex h-full w-full min-w-0 flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            MDRRMO Operations
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ambulance scheduling, fleet availability, and
                            dispatch monitoring.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LayoutDashboard className="size-4" />
                        Operations Center
                    </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                className="min-w-0 rounded-xl border border-sidebar-border/70 bg-card p-5 dark:border-sidebar-border"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground">
                                            {card.title}
                                        </p>
                                        <p className="mt-3 text-3xl font-bold tabular-nums">
                                            {card.value}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted p-2">
                                        <Icon className="size-5 text-muted-foreground" />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    {card.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <section className="w-full min-w-0">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            Operations Management
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Access the tools for daily ambulance operations.
                        </p>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {operationLinks.map((item) => {
                            const Icon = item.icon;

                            return (
                                <a
                                    key={item.title}
                                    href={item.href}
                                    className="group flex min-w-0 items-start gap-4 rounded-xl border border-sidebar-border/70 bg-card p-5 transition-colors hover:bg-muted/50 dark:border-sidebar-border"
                                >
                                    <div className="shrink-0 rounded-lg bg-muted p-3">
                                        <Icon className="size-6 text-muted-foreground" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold group-hover:underline">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>

                <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <p className="text-sm font-medium">Emergency Notice</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Online ambulance bookings require MDRRMO approval. For
                        urgent emergencies, contact your local emergency
                        response service directly instead of waiting for online
                        booking approval.
                    </p>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: "MDRRMO Operations",
            href: "/mdrrmo/operations",
        },
    ],
};
