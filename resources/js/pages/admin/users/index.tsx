import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    CheckCircle2,
    CircleOff,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/layouts/app-layout";
import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type Office = {
    id: number;
    code: string;
    name: string;
};

type UserRecord = {
    id: number;
    name: string;
    email: string;
    office: Office | null;
    system_role: string;
    is_active: boolean;
    created_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: UserRecord[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Role = {
    value: string;
    label: string;
};

type Props = {
    users: PaginatedUsers;
    filters: {
        search: string;
    };
    offices: Office[];
    roles: Role[];
};

type UserFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    office_id: string;
    system_role: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: dashboard() },
    { title: "User Management", href: "/admin/users" },
];

const roleLabels: Record<string, string> = {
    admin: "Administrator",
    staff: "Staff",
    approver: "Approver",
    records_officer: "Records Officer",
};

function formatDate(value: string | null): string {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function UserIndex({ users, filters, offices, roles }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [pendingDeactivate, setPendingDeactivate] =
        useState<UserRecord | null>(null);

    const form = useForm<UserFormData>({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        office_id: "",
        system_role: "staff",
        is_active: true,
    });

    useEffect(() => {
        setSearch(filters.search ?? "");
    }, [filters.search]);

    function openCreateModal() {
        setEditingUser(null);

        form.reset();
        form.clearErrors();

        form.setData({
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            office_id: "",
            system_role: "staff",
            is_active: true,
        });

        setShowForm(true);
    }

    function openEditModal(user: UserRecord) {
        setEditingUser(user);

        form.clearErrors();
        form.setData({
            name: user.name,
            email: user.email,
            password: "",
            password_confirmation: "",
            office_id: user.office ? String(user.office.id) : "",
            system_role: user.system_role,
            is_active: user.is_active,
        });

        setShowForm(true);
    }

    function closeModal() {
        setShowForm(false);
        setEditingUser(null);
        form.clearErrors();
    }

    function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                toast.success(
                    editingUser
                        ? "User account successfully updated."
                        : "User account successfully created.",
                );
            },
            onError: () => {
                toast.error("Please check the form for errors.");
            },
        };

        const payload = {
            ...form.data,
            office_id: form.data.office_id || "",
        };

        if (editingUser) {
            router.put(`/admin/users/${editingUser.id}`, payload, options);
        } else {
            form.post("/admin/users", options);
        }
    }

    function deactivateUser() {
        if (!pendingDeactivate) return;

        const user = pendingDeactivate;

        router.delete(`/admin/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setPendingDeactivate(null);
                toast.success("User account successfully deactivated.");
            },
            onError: () => {
                toast.error("Unable to deactivate this user account.");
            },
        });
    }

    function searchUsers(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            "/admin/users",
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function changePage(url: string | null) {
        if (!url) return;

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <>
            <Head title="User Management" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Users className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    User Management
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage system accounts, roles, and office
                                    assignments.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                        <Plus className="size-4" />
                        Add User
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Total Accounts
                            </p>
                            <Users className="size-5 text-muted-foreground" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">
                            {users.total}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Registered system users
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Active on This Page
                            </p>
                            <CheckCircle2 className="size-5 text-emerald-600" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">
                            {users.data.filter((user) => user.is_active).length}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Active accounts on the current page
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Administrators on This Page
                            </p>
                            <ShieldCheck className="size-5 text-muted-foreground" />
                        </div>
                        <p className="mt-3 text-2xl font-semibold">
                            {
                                users.data.filter(
                                    (user) => user.system_role === "admin",
                                ).length
                            }
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Administrator accounts on this page
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">System Users</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Search and manage registered accounts.
                            </p>
                        </div>

                        <form
                            onSubmit={searchUsers}
                            className="flex w-full gap-2 sm:max-w-md"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search name, email, office, role..."
                                    className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3 font-medium">
                                        User
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Office
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        System Role
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 font-medium">
                                        Created
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-14 text-center"
                                        >
                                            <UserRound className="mx-auto mb-3 size-9 text-muted-foreground/50" />
                                            <p className="font-medium">
                                                No users found
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Try another search or create a
                                                new account.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                                                        {user.name
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {user.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                {user.office ? (
                                                    <div>
                                                        <p className="font-medium">
                                                            {user.office.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {user.office.code}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Not assigned
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                                                    {roleLabels[
                                                        user.system_role
                                                    ] ?? user.system_role}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {user.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                        <CircleOff className="size-3.5" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        title="Edit user"
                                                        onClick={() =>
                                                            openEditModal(user)
                                                        }
                                                        className="inline-flex size-9 items-center justify-center rounded-lg border transition hover:bg-muted"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>

                                                    {user.is_active && (
                                                        <button
                                                            type="button"
                                                            title="Deactivate user"
                                                            onClick={() =>
                                                                setPendingDeactivate(
                                                                    user,
                                                                )
                                                            }
                                                            className="inline-flex size-9 items-center justify-center rounded-lg border text-destructive transition hover:bg-destructive/10"
                                                        >
                                                            <CircleOff className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {users.from ?? 0}–{users.to ?? 0} of{" "}
                            {users.total} users
                        </p>

                        <div className="flex flex-wrap items-center gap-1">
                            {users.links.map((link, index) => (
                                <button
                                    key={`${index}-${link.label}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => changePage(link.url)}
                                    className={`min-w-9 rounded-md border px-3 py-2 text-xs transition ${
                                        link.active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    } disabled:cursor-not-allowed disabled:opacity-40`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingUser
                                        ? "Edit User Account"
                                        : "Create User Account"}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Set the user's details, office, and system
                                    permissions.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg p-2 transition hover:bg-muted"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={submitForm}>
                            <div className="grid gap-5 p-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Full Name
                                    </label>
                                    <input
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                "name",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        placeholder="Enter full name"
                                        required
                                    />
                                    {form.errors.name && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) =>
                                            form.setData(
                                                "email",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        placeholder="user@example.com"
                                        required
                                    />
                                    {form.errors.email && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Office
                                    </label>
                                    <select
                                        value={form.data.office_id}
                                        onChange={(event) =>
                                            form.setData(
                                                "office_id",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="">
                                            No office assigned
                                        </option>
                                        {offices.map((office) => (
                                            <option
                                                key={office.id}
                                                value={office.id}
                                            >
                                                {office.code} — {office.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.office_id && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.office_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        System Role
                                    </label>
                                    <select
                                        value={form.data.system_role}
                                        onChange={(event) =>
                                            form.setData(
                                                "system_role",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                        required
                                    >
                                        {roles.map((role) => (
                                            <option
                                                key={role.value}
                                                value={role.value}
                                            >
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.system_role && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.system_role}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        {editingUser
                                            ? "New Password (optional)"
                                            : "Password"}
                                    </label>
                                    <input
                                        type="password"
                                        autoComplete="new-password"
                                        value={form.data.password}
                                        onChange={(event) =>
                                            form.setData(
                                                "password",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                        placeholder={
                                            editingUser
                                                ? "Leave blank to keep current password"
                                                : "At least 12 characters"
                                        }
                                        minLength={12}
                                        required={!editingUser}
                                    />
                                    {form.errors.password && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {form.errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        autoComplete="new-password"
                                        value={form.data.password_confirmation}
                                        onChange={(event) =>
                                            form.setData(
                                                "password_confirmation",
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                                        placeholder="Re-enter password"
                                        required={
                                            !editingUser ||
                                            form.data.password.length > 0
                                        }
                                    />
                                </div>

                                {editingUser && (
                                    <div className="sm:col-span-2">
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                                            <input
                                                type="checkbox"
                                                checked={form.data.is_active}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "is_active",
                                                        event.target.checked,
                                                    )
                                                }
                                                className="size-4 accent-primary"
                                            />
                                            <span>
                                                <span className="block text-sm font-medium">
                                                    Account is active
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    Inactive users should not be
                                                    allowed to access the
                                                    system.
                                                </span>
                                            </span>
                                        </label>
                                        {form.errors.is_active && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {form.errors.is_active}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 p-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {form.processing
                                        ? "Saving..."
                                        : editingUser
                                          ? "Save Changes"
                                          : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {pendingDeactivate && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
                        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <CircleOff className="size-5" />
                        </div>

                        <h2 className="text-lg font-semibold">
                            Deactivate User Account?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Are you sure you want to deactivate{" "}
                            <span className="font-medium text-foreground">
                                {pendingDeactivate.name}
                            </span>
                            ? This action will mark the account as inactive.
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPendingDeactivate(null)}
                                className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deactivateUser}
                                className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

UserIndex.layout = {
    breadcrumbs,
};
