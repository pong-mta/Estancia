import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    ClipboardCheck,
    FileText,
    Send,
    ShieldCheck,
} from 'lucide-react';
import { dashboard } from '@/routes';

const shortcuts = [
    {
        title: 'Document Tracking',
        description: 'View and manage documents moving through your office.',
        href: '/admin/documents',
        icon: FileText,
    },
    {
        title: 'Pending Approvals',
        description: 'Review items that need your attention and approval.',
        href: '/admin/pending-approvals',
        icon: Send,
    },
    {
        title: 'My Tasks',
        description: 'Keep track of the work assigned to you.',
        href: '/admin/tasks',
        icon: ClipboardCheck,
    },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="min-h-full space-y-8 bg-slate-50 p-4 sm:p-6 lg:p-8">
                <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#B91C1C] via-[#7F1D1D] to-[#020617] px-6 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-11">
                    <div className="absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full border-[36px] border-white/5" />
                    <div className="absolute -bottom-28 right-1/3 -z-10 h-64 w-64 rounded-full bg-red-400/10 blur-3xl" />

                    <div className="flex max-w-3xl items-start gap-4">
                        <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner sm:block">
                            <ShieldCheck className="size-8" />
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-red-100">
                                Estancia Municipal Portal
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Welcome to your workspace
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-red-50/90 sm:text-base">
                                Access your office tools, follow document
                                progress, and stay on top of your assigned work
                                from one place.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                            Quick access
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                            Your workspace
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Choose a section to continue.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {shortcuts.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-red-950/5"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="rounded-xl bg-red-50 p-3 text-red-700 transition-colors group-hover:bg-red-700 group-hover:text-white">
                                            <Icon className="size-5" />
                                        </div>
                                        <ArrowUpRight className="size-5 text-slate-300 transition-colors group-hover:text-red-700" />
                                    </div>
                                    <h3 className="mt-5 font-semibold text-slate-900">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {item.description}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                A clearer view of your work
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Use the navigation menu to open the tools
                                available to your account.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
