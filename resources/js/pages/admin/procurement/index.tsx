import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Search, ClipboardList, ArrowUpRight, FileText } from 'lucide-react';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: number;
    item_number: number;
    description: string;
    quantity: string | number;
    unit: string;
    amount: string | number;
};

type PR = {
    id: number;
    tracking_number: string;
    subject: string;
    status: string;
    completed_at: string | null;
    requested_total: string | number | null;
    originating_office?: { id: number; name: string } | null;
    submitter?: { id: number; name: string } | null;
    purchase_request_items: Item[];
    procurement?: { id: number; status: string; opened_at: string | null } | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = { purchaseRequests: Paginated<PR>; filters: { search: string } };

const money = (value: string | number | null | undefined) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value ?? 0));

const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function ProcurementIndex({ purchaseRequests, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    useEffect(() => setSearch(filters.search ?? ''), [filters.search]);

    function submitSearch(event: FormEvent) {
        event.preventDefault();
        router.get('/admin/procurement', { search }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function startProcurement(pr: PR) {
        if (window.confirm(`Open procurement canvassing for ${pr.tracking_number}?`)) {
            router.post(`/admin/procurement/${pr.id}/start`, {}, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Procurement" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><ClipboardList className="h-4 w-4" /> Procurement / Canvassing</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Approved Purchase Requests</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Open canvassing for approved requests and compare supplier quotations.</p>
                    </div>
                    <a href="/admin/suppliers" className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">Manage suppliers <ArrowUpRight className="h-4 w-4" /></a>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Approved PRs shown</p><p className="mt-1 text-2xl font-semibold">{purchaseRequests.total}</p></div>
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Canvassing opened (this page)</p><p className="mt-1 text-2xl font-semibold">{purchaseRequests.data.filter((pr) => !!pr.procurement).length}</p></div>
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Awaiting canvassing (this page)</p><p className="mt-1 text-2xl font-semibold">{purchaseRequests.data.filter((pr) => !pr.procurement).length}</p></div>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <div><h2 className="font-semibold">Purchase request queue</h2><p className="mt-1 text-sm text-muted-foreground">Only completed Purchase Requests are eligible for procurement.</p></div>
                        <form onSubmit={submitSearch} className="relative w-full md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tracking no., subject, office..." className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </form>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Purchase Request</th><th className="px-5 py-3 font-medium">Originating office</th><th className="px-5 py-3 font-medium">Items</th><th className="px-5 py-3 font-medium">Requested total</th><th className="px-5 py-3 font-medium">Approved date</th><th className="px-5 py-3 text-right font-medium">Action</th></tr></thead>
                            <tbody className="divide-y">
                                {purchaseRequests.data.length ? purchaseRequests.data.map((pr) => (
                                    <tr key={pr.id} className="align-top hover:bg-muted/20">
                                        <td className="px-5 py-4"><p className="font-medium">{pr.tracking_number}</p><p className="mt-1 max-w-xs text-muted-foreground">{pr.subject}</p><p className="mt-1 text-xs text-muted-foreground">Submitted by {pr.submitter?.name ?? '—'}</p></td>
                                        <td className="px-5 py-4">{pr.originating_office?.name ?? '—'}</td>
                                        <td className="px-5 py-4"><span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{pr.purchase_request_items?.length ?? 0} items</span></td>
                                        <td className="px-5 py-4 font-medium tabular-nums">{money(pr.requested_total)}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{date(pr.completed_at)}</td>
                                        <td className="px-5 py-4 text-right">
                                            {pr.procurement ? (
                                                <a href={`/admin/procurement/${pr.procurement.id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">Open canvassing <ArrowUpRight className="h-3.5 w-3.5" /></a>
                                            ) : (
                                                <button onClick={() => startProcurement(pr)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted"><FileText className="h-3.5 w-3.5" /> Start procurement</button>
                                            )}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No fully approved Purchase Requests found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <span>Page {purchaseRequests.current_page} of {purchaseRequests.last_page} · {purchaseRequests.total} requests</span>
                        <div className="flex flex-wrap gap-1">{purchaseRequests.links.map((link, index) => <button key={`${index}-${link.label}`} disabled={!link.url} onClick={() => link.url && router.visit(link.url, { preserveScroll: true })} className={`min-w-9 rounded-md border px-3 py-2 text-xs ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'} disabled:cursor-not-allowed disabled:opacity-40`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>
                    </div>
                </section>
            </div>
        </>
    );
}

ProcurementIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Procurement', href: '/admin/procurement' },
    ] satisfies BreadcrumbItem[],
};
