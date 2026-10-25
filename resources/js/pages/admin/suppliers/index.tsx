import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Search, Plus, Pencil, Power, Building2 } from 'lucide-react';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Supplier = {
    id: number;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    tin: string | null;
    is_active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    suppliers: Paginated<Supplier>;
    filters: { search: string };
};

const emptySupplier = {
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tin: '',
    is_active: true,
};

function Field({
    label,
    value,
    onChange,
    type = 'text',
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                required={required}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
        </label>
    );
}

export default function SupplierIndex({ suppliers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm({ ...emptySupplier });

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    function openCreate() {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setShowForm(true);
    }

    function openEdit(supplier: Supplier) {
        setEditing(supplier);
        form.setData({
            name: supplier.name,
            contact_person: supplier.contact_person ?? '',
            email: supplier.email ?? '',
            phone: supplier.phone ?? '',
            address: supplier.address ?? '',
            tin: supplier.tin ?? '',
            is_active: supplier.is_active,
        });
        form.clearErrors();
        setShowForm(true);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowForm(false);
                setEditing(null);
                form.reset();
            },
        };

        if (editing) {
            form.put(`/admin/suppliers/${editing.id}`, options);
        } else {
            form.post('/admin/suppliers', options);
        }
    }

    function toggleActive(supplier: Supplier) {
        if (window.confirm(`${supplier.is_active ? 'Deactivate' : 'Activate'} ${supplier.name}?`)) {
            router.patch(`/admin/suppliers/${supplier.id}/toggle-active`, {}, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Supplier Management" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" /> Procurement
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Supplier Management</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Maintain the supplier directory used for procurement canvassing.</p>
                    </div>
                    <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
                        <Plus className="h-4 w-4" /> Add supplier
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Total suppliers</p>
                        <p className="mt-1 text-2xl font-semibold">{suppliers.total}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Active on this page</p>
                        <p className="mt-1 text-2xl font-semibold">{suppliers.data.filter((supplier) => supplier.is_active).length}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Inactive on this page</p>
                        <p className="mt-1 text-2xl font-semibold">{suppliers.data.filter((supplier) => !supplier.is_active).length}</p>
                    </div>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-semibold">Supplier directory</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Search by supplier, contact, email, phone, or TIN.</p>
                        </div>
                        <form
                            className="relative w-full md:max-w-sm"
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get('/admin/suppliers', { search }, { preserveState: true, preserveScroll: true, replace: true });
                            }}
                        >
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search suppliers..." className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </form>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Supplier</th>
                                    <th className="px-5 py-3 font-medium">Contact</th>
                                    <th className="px-5 py-3 font-medium">TIN</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {suppliers.data.length ? suppliers.data.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-muted/20">
                                        <td className="px-5 py-4">
                                            <p className="font-medium">{supplier.name}</p>
                                            <p className="mt-1 text-muted-foreground">{supplier.email || 'No email'}{supplier.phone ? ` · ${supplier.phone}` : ''}</p>
                                        </td>
                                        <td className="px-5 py-4">{supplier.contact_person || '—'}</td>
                                        <td className="px-5 py-4">{supplier.tin || '—'}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${supplier.is_active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                                {supplier.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(supplier)} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                                                <button onClick={() => toggleActive(supplier)} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"><Power className="h-3.5 w-3.5" /> {supplier.is_active ? 'Deactivate' : 'Activate'}</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No suppliers found. Add a supplier to begin canvassing.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <span>Page {suppliers.current_page} of {suppliers.last_page} · {suppliers.total} suppliers</span>
                        <div className="flex flex-wrap gap-1">
                            {suppliers.links.map((link, index) => (
                                <button key={`${index}-${link.label}`} disabled={!link.url} onClick={() => link.url && router.visit(link.url, { preserveScroll: true })} className={`min-w-9 rounded-md border px-3 py-2 text-xs ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'} disabled:cursor-not-allowed disabled:opacity-40`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                </section>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 sm:pt-16" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
                        <form onSubmit={submit} className="w-full max-w-2xl rounded-xl border bg-card p-5 shadow-xl sm:p-6">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 id="supplier-form-title" className="text-lg font-semibold">{editing ? 'Edit supplier' : 'Add supplier'}</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">Supplier information for quotation canvassing.</p>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted">✕</button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <Field label="Supplier / business name" value={form.data.name} onChange={(v) => form.setData('name', v)} required />
                                    {form.errors.name && <p className="mt-1 text-xs text-destructive">{form.errors.name}</p>}
                                </div>
                                <Field label="Contact person" value={form.data.contact_person} onChange={(v) => form.setData('contact_person', v)} />
                                <Field label="Email" type="email" value={form.data.email} onChange={(v) => form.setData('email', v)} />
                                <Field label="Phone" value={form.data.phone} onChange={(v) => form.setData('phone', v)} />
                                <Field label="TIN" value={form.data.tin} onChange={(v) => form.setData('tin', v)} />
                                <label className="sm:col-span-2 block space-y-1.5">
                                    <span className="text-sm font-medium">Address</span>
                                    <textarea value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                </label>
                                {editing && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} className="h-4 w-4 rounded border" />
                                        Supplier is active
                                    </label>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
                                <button type="submit" disabled={form.processing} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{form.processing ? 'Saving...' : editing ? 'Save changes' : 'Create supplier'}</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}

SupplierIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Supplier Management', href: '/admin/suppliers' },
    ] satisfies BreadcrumbItem[],
};
