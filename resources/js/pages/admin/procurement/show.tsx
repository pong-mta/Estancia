import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import { ArrowLeft, Building2, CalendarDays, FileText, PlusCircle, Trash2 } from 'lucide-react';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type PRItem = { id: number; item_number: number; description: string; quantity: string | number; unit: string; unit_price: string | number; amount: string | number };
type Supplier = { id: number; name: string; contact_person: string | null; email: string | null; phone: string | null };
type QuotationItem = { id: number; purchase_request_item_id: number | null; description: string; quantity: string | number; unit: string; unit_price: string | number; amount: string | number };
type Quotation = {
    id: number;
    supplier_id: number;
    quotation_number: string | null;
    quotation_date: string | null;
    valid_until: string | null;
    delivery_days: number | null;
    payment_terms: string | null;
    notes: string | null;
    status: string;
    total_amount: string | number;
    supplier: Supplier;
    items: QuotationItem[];
};
type Procurement = {
    id: number;
    status: string;
    opened_at: string | null;
    notes: string | null;
    document: {
        id: number;
        tracking_number: string;
        subject: string;
        description: string | null;
        completed_at: string | null;
        budget_amount: string | number | null;
        originating_office?: { id: number; name: string } | null;
        submitter?: { id: number; name: string } | null;
        purchase_request_items: PRItem[];
    };
    opener?: { id: number; name: string } | null;
    quotations: Quotation[];
};
type Props = { procurement: Procurement; suppliers: Supplier[] };

const money = (value: string | number | null | undefined) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value ?? 0));
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function ProcurementShow({ procurement, suppliers }: Props) {
    const pr = procurement.document;
    const items = pr.purchase_request_items ?? [];
    const form = useForm({
        supplier_id: '',
        quotation_number: '',
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: '',
        delivery_days: '',
        payment_terms: '',
        notes: '',
        items: items.map((item) => ({ purchase_request_item_id: item.id, unit_price: '' })),
    });

    const previewTotal = useMemo(() => form.data.items.reduce((sum, input) => {
        const prItem = items.find((item) => item.id === input.purchase_request_item_id);
        return sum + Number(prItem?.quantity ?? 0) * Number(input.unit_price || 0);
    }, 0), [form.data.items, items]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(`/admin/procurement/${procurement.id}/quotations`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('supplier_id', 'quotation_number', 'valid_until', 'delivery_days', 'payment_terms', 'notes');
                form.setData('items', items.map((item) => ({ purchase_request_item_id: item.id, unit_price: '' })));
            },
        });
    }

    function removeQuotation(quotation: Quotation) {
        if (window.confirm(`Delete quotation from ${quotation.supplier.name}?`)) {
            router.delete(`/admin/procurement/${procurement.id}/quotations/${quotation.id}`, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title={`Canvassing · ${pr.tracking_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <a href="/admin/procurement" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to procurement queue</a>
                        <p className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> Procurement / Canvassing</p>
                        <h1 className="text-2xl font-semibold tracking-tight">{pr.tracking_number}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{pr.subject}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium capitalize text-emerald-700 dark:text-emerald-400">{procurement.status.replaceAll('_', ' ')}</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Originating office</p><p className="mt-1 font-semibold">{pr.originatingOffice?.name ?? '—'}</p></div>
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Requested items</p><p className="mt-1 text-2xl font-semibold">{items.length}</p></div>
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Budget amount</p><p className="mt-1 text-xl font-semibold">{money(pr.budget_amount)}</p></div>
                    <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Quotations received</p><p className="mt-1 text-2xl font-semibold">{procurement.quotations.length}</p></div>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-5"><h2 className="font-semibold">Purchase Request items</h2><p className="mt-1 text-sm text-muted-foreground">Supplier quotations should price these requested quantities and units.</p></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Item</th><th className="px-5 py-3 font-medium">Description</th><th className="px-5 py-3 font-medium">Quantity</th><th className="px-5 py-3 font-medium">Unit</th><th className="px-5 py-3 text-right font-medium">PR estimate</th></tr></thead>
                            <tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="px-5 py-4">{item.item_number}</td><td className="px-5 py-4 font-medium">{item.description}</td><td className="px-5 py-4">{item.quantity}</td><td className="px-5 py-4">{item.unit}</td><td className="px-5 py-4 text-right tabular-nums">{money(item.amount)}</td></tr>)}</tbody>
                        </table>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-5"><h2 className="font-semibold">Record supplier quotation</h2><p className="mt-1 text-sm text-muted-foreground">Enter each supplier's unit price. Line totals and quotation total are calculated by the server.</p></div>
                    {!suppliers.length ? (
                        <div className="p-6 text-sm text-muted-foreground">No active suppliers found. <a href="/admin/suppliers" className="font-medium text-primary underline underline-offset-4">Add a supplier</a> before recording quotations.</div>
                    ) : (
                        <form onSubmit={submit} className="space-y-6 p-5">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Supplier *</span><select required value={form.data.supplier_id} onChange={(event) => form.setData('supplier_id', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">Select supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>{form.errors.supplier_id && <span className="text-xs text-destructive">{form.errors.supplier_id}</span>}</label>
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Quotation number</span><input value={form.data.quotation_number} onChange={(event) => form.setData('quotation_number', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></label>
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Quotation date</span><input type="date" value={form.data.quotation_date} onChange={(event) => form.setData('quotation_date', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></label>
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Valid until</span><input type="date" value={form.data.valid_until} onChange={(event) => form.setData('valid_until', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />{form.errors.valid_until && <span className="text-xs text-destructive">{form.errors.valid_until}</span>}</label>
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Delivery days</span><input type="number" min="0" max="3650" value={form.data.delivery_days} onChange={(event) => form.setData('delivery_days', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></label>
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Payment terms</span><input value={form.data.payment_terms} onChange={(event) => form.setData('payment_terms', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></label>
                            </div>

                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full min-w-[650px] text-left text-sm">
                                    <thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">PR item</th><th className="px-4 py-3 font-medium">Quantity</th><th className="px-4 py-3 font-medium">Unit</th><th className="px-4 py-3 font-medium">Quoted unit price (₱) *</th><th className="px-4 py-3 text-right font-medium">Line estimate</th></tr></thead>
                                    <tbody className="divide-y">{items.map((item, index) => <tr key={item.id}>
                                        <td className="px-4 py-3"><p className="font-medium">{item.item_number}. {item.description}</p></td>
                                        <td className="px-4 py-3">{item.quantity}</td><td className="px-4 py-3">{item.unit}</td>
                                        <td className="px-4 py-3"><input type="number" required min="0" step="0.01" value={form.data.items[index]?.unit_price ?? ''} onChange={(event) => form.setData('items', form.data.items.map((line, lineIndex) => lineIndex === index ? { ...line, unit_price: event.target.value } : line))} className="w-44 rounded-lg border bg-background px-3 py-2 text-sm" /></td>
                                        <td className="px-4 py-3 text-right tabular-nums">{money(Number(item.quantity) * Number(form.data.items[index]?.unit_price || 0))}</td>
                                    </tr>)}</tbody>
                                    <tfoot className="border-t bg-muted/20"><tr><td colSpan={4} className="px-4 py-3 text-right font-semibold">Preview total</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{money(previewTotal)}</td></tr></tfoot>
                                </table>
                            </div>
                            {form.errors.items && <p className="text-sm text-destructive">{form.errors.items}</p>}
                            <label className="block space-y-1.5"><span className="text-sm font-medium">Notes</span><textarea rows={3} value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" placeholder="Optional notes or quotation conditions..." /></label>
                            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground">Saving records the quotation for comparison. It does not select a supplier or create a purchase order.</p>
                                <button type="submit" disabled={form.processing || !items.length} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"><PlusCircle className="h-4 w-4" /> {form.processing ? 'Saving...' : 'Save quotation'}</button>
                            </div>
                        </form>
                    )}
                </section>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b p-5"><h2 className="font-semibold">Quotation comparison</h2><p className="mt-1 text-sm text-muted-foreground">Compare submitted totals. Lowest total is not automatically selected.</p></div>
                    {!procurement.quotations.length ? <div className="p-8 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />No quotations recorded yet.</div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Supplier</th><th className="px-5 py-3 font-medium">Quotation no.</th><th className="px-5 py-3 font-medium">Date / Validity</th><th className="px-5 py-3 font-medium">Delivery</th><th className="px-5 py-3 text-right font-medium">Total</th><th className="px-5 py-3 text-right font-medium">Action</th></tr></thead>
                                <tbody className="divide-y">{[...procurement.quotations].sort((a, b) => Number(a.total_amount) - Number(b.total_amount)).map((quotation) => <tr key={quotation.id}>
                                    <td className="px-5 py-4"><p className="font-medium">{quotation.supplier?.name ?? 'Unknown supplier'}</p><p className="mt-1 text-xs text-muted-foreground">{quotation.supplier?.contact_person ?? ''}</p></td>
                                    <td className="px-5 py-4">{quotation.quotation_number || '—'}</td>
                                    <td className="px-5 py-4">{date(quotation.quotation_date)}<p className="mt-1 text-xs text-muted-foreground">Valid to {date(quotation.valid_until)}</p></td>
                                    <td className="px-5 py-4">{quotation.delivery_days == null ? '—' : `${quotation.delivery_days} days`}</td>
                                    <td className="px-5 py-4 text-right font-semibold tabular-nums">{money(quotation.total_amount)}</td>
                                    <td className="px-5 py-4 text-right"><button onClick={() => removeQuotation(quotation)} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /> Delete</button></td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

ProcurementShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Procurement', href: '/admin/procurement' },
        { title: 'Canvassing', href: '#' },
    ] satisfies BreadcrumbItem[],
};
