import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    Archive,
    CheckCircle2,
    Clock3,
    FilePlus2,
    FileText,
    Pencil,
    Search,
    Send,
    Upload,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { dashboard } from "@/routes";
import type { BreadcrumbItem } from "@/types";

type Office = {
    id: number;
    name: string;
};

type User = {
    id: number;
    name: string;
};

type DocumentTypeOption = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    allows_upload: boolean;
    allows_template: boolean;
};

type DocumentRecord = {
    id: number;
    tracking_number: string;
    document_type: string;
    subject: string;
    description: string | null;
    status: string;
    originating_office: Office | null;
    submitter: User | null;
    submitted_at: string | null;
    completed_at: string | null;
    created_at: string;
    requested_delivery_date?: string | null;
    template_data?: { purpose?: string | null } | null;
    purchase_request_items?: Array<{
        id: number;
        description: string;
        quantity: number | string;
        unit: string;
        unit_price: number | string;
    }>;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedDocuments = {
    data: DocumentRecord[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type PurchaseRequestItemInput = {
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
};

type DocumentFormData = {
    document_type: string;
    subject: string;
    description: string;
    purpose: string;
    requested_delivery_date: string;
    items: PurchaseRequestItemInput[];
    submit: boolean;
    attachment: File | null;
};

function createBlankPurchaseRequestItem(): PurchaseRequestItemInput {
    return {
        description: "",
        quantity: "1",
        unit: "pcs",
        unit_price: "0.00",
    };
}

function createInitialItems(documentType: string): PurchaseRequestItemInput[] {
    return documentType === "purchase_request"
        ? [createBlankPurchaseRequestItem()]
        : [];
}

type Props = {
    documents: PaginatedDocuments;
    documentTypes: DocumentTypeOption[];
};

export default function DocumentIndex({ documents, documentTypes }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingDocumentId, setEditingDocumentId] = useState<number | null>(
        null,
    );
    const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(
        null,
    );
    const [search, setSearch] = useState("");
    const [submittingDocumentId, setSubmittingDocumentId] = useState<
        number | null
    >(null);

    const form = useForm<DocumentFormData>({
        document_type: documentTypes[0]?.code ?? "",
        subject: "",
        description: "",
        purpose: "",
        requested_delivery_date: "",
        items: createInitialItems(documentTypes[0]?.code ?? ""),
        submit: false,
        attachment: null,
    });

    const selectedDocumentType = documentTypes.find(
        (type) => type.code === form.data.document_type,
    );

    const isPurchaseRequest = form.data.document_type === "purchase_request";
    const purchaseRequestTotal = form.data.items.reduce((total, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        return total + quantity * unitPrice;
    }, 0);

    function getItemError(index: number, field: string): string | undefined {
        const errors = form.errors as Record<string, string | undefined>;
        return errors[`items.${index}.${field}`];
    }

    function updateItem(
        index: number,
        field: keyof PurchaseRequestItemInput,
        value: string,
    ) {
        form.setData(
            "items",
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    }

    function openForm() {
        setEditingDocumentId(null);
        form.reset();
        form.clearErrors();
        form.setData({
            document_type: documentTypes[0]?.code ?? "",
            subject: "",
            description: "",
            purpose: "",
            requested_delivery_date: "",
            items: createInitialItems(documentTypes[0]?.code ?? ""),
            submit: false,
            attachment: null,
        });
        setShowForm(true);
    }

    function editDocument(document: DocumentRecord) {
        if (document.status !== "draft") return;

        setEditingDocumentId(document.id);
        form.clearErrors();
        form.setData({
            document_type: document.document_type,
            subject: document.subject,
            description: document.description ?? "",
            purpose: document.template_data?.purpose ?? "",
            requested_delivery_date: document.requested_delivery_date
                ? document.requested_delivery_date.slice(0, 10)
                : "",
            items:
                document.document_type === "purchase_request"
                    ? (document.purchase_request_items ?? []).map((item) => ({
                          description: item.description,
                          quantity: String(item.quantity),
                          unit: item.unit,
                          unit_price: String(item.unit_price),
                      }))
                    : [],
            submit: false,
            attachment: null,
        });
        setShowForm(true);
    }

    function closeForm() {
        if (form.processing) return;

        setShowForm(false);
        setEditingDocumentId(null);
        form.clearErrors();
    }

    function deleteDraft(document: DocumentRecord) {
        if (document.status !== "draft" || deletingDocumentId !== null) return;

        const confirmed = window.confirm(
            `Move draft ${document.tracking_number} to deleted records? This action will not permanently erase the document.`,
        );
        if (!confirmed) return;

        setDeletingDocumentId(document.id);
        router.delete(`/admin/documents/${document.id}`, {
            preserveScroll: true,
            onSuccess: () =>
                toast.success(
                    `Draft ${document.tracking_number} moved to deleted records.`,
                ),
            onError: (errors) => {
                const message =
                    errors.document ??
                    Object.values(errors)[0] ??
                    "Unable to delete this draft.";
                toast.error(String(message));
            },
            onFinish: () => setDeletingDocumentId(null),
        });
    }

    function submitForm(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (documentTypes.length === 0) {
            toast.error("No active document types are available.");
            return;
        }

        if (form.data.attachment && !selectedDocumentType?.allows_upload) {
            toast.error("File uploads are not allowed for this document type.");
            return;
        }

        if (
            form.data.document_type === "purchase_request" &&
            form.data.items.length === 0
        ) {
            toast.error("Add at least one item to the Purchase Request.");
            return;
        }

        const isEditing = editingDocumentId !== null;
        const url = isEditing
            ? `/admin/documents/${editingDocumentId}`
            : "/admin/documents";

        // Configure the payload first. In this Inertia version, transform()
        // does not return the form, so do not chain .post() after it.
        form.transform((data) => ({
            ...data,
            ...(isEditing ? { _method: "put" } : {}),
            submit: isEditing ? false : data.submit,
        }));

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowForm(false);
                setEditingDocumentId(null);
                form.reset();
                toast.success(
                    isEditing
                        ? "Draft document updated successfully."
                        : "Document successfully saved.",
                );
            },
            onError: (errors) => {
                const message =
                    Object.values(errors)[0] ??
                    "Please check the document details and attachment.";
                toast.error(String(message));
            },
        });
    }

    function submitDraft(document: DocumentRecord) {
        if (document.status !== "draft" || submittingDocumentId !== null) {
            return;
        }

        const confirmed = window.confirm(
            `Submit document ${document.tracking_number} for approval? This will start its configured workflow.`,
        );

        if (!confirmed) return;

        setSubmittingDocumentId(document.id);

        router.post(
            `/admin/documents/${document.id}/submit`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Document ${document.tracking_number} submitted successfully.`,
                    );
                },
                onError: (errors) => {
                    const message =
                        errors.document ??
                        errors.workflow ??
                        Object.values(errors)[0] ??
                        "Unable to submit this document.";

                    toast.error(String(message));
                },
                onFinish: () => {
                    setSubmittingDocumentId(null);
                },
            },
        );
    }

    function getDocumentTypeName(code: string): string {
        const documentType = documentTypes.find((type) => type.code === code);

        return documentType?.name ?? code.replaceAll("_", " ");
    }

    const normalizedSearch = search.trim().toLowerCase();

    const filteredDocuments = documents.data.filter((document) => {
        if (!normalizedSearch) return true;

        return [
            document.tracking_number,
            document.subject,
            getDocumentTypeName(document.document_type),
            document.document_type,
            document.status,
            document.originating_office?.name ?? "",
            document.submitter?.name ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });

    const draftCount = documents.data.filter(
        (document) => document.status === "draft",
    ).length;

    const inProgressCount = documents.data.filter(
        (document) =>
            document.status === "submitted" ||
            document.status === "in_progress",
    ).length;

    const completedCount = documents.data.filter(
        (document) => document.status === "completed",
    ).length;

    return (
        <>
            <Head title="Document Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="size-6 text-primary" />

                            <h1 className="text-2xl font-semibold tracking-tight">
                                Document Management
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Register, submit, and track municipal documents.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openForm}
                        disabled={documentTypes.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FilePlus2 className="size-4" />
                        New Document
                    </button>
                </div>

                {documentTypes.length === 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        No active document types are configured. Activate or
                        create a document type before registering documents.
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label="All Documents"
                        value={documents.total}
                        icon={<FileText className="size-5" />}
                    />

                    <SummaryCard
                        label="Drafts on This Page"
                        value={draftCount}
                        icon={<Archive className="size-5" />}
                    />

                    <SummaryCard
                        label="In Progress on This Page"
                        value={inProgressCount}
                        icon={<Clock3 className="size-5" />}
                    />

                    <SummaryCard
                        label="Completed on This Page"
                        value={completedCount}
                        icon={<CheckCircle2 className="size-5" />}
                    />
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                Registered Documents
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                View tracking numbers, origin offices, and
                                document status.
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search this page..."
                                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">
                                        Document
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Originating Office
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Submitted By
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-3.5 font-medium">
                                        Date
                                    </th>
                                    <th className="px-5 py-3.5 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {filteredDocuments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-16 text-center"
                                        >
                                            <FileText className="mx-auto mb-3 size-9 text-muted-foreground/50" />

                                            <p className="font-medium">
                                                {documents.data.length === 0
                                                    ? "No documents yet"
                                                    : "No matching documents"}
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {documents.data.length === 0
                                                    ? "Create a document to begin tracking."
                                                    : "Try a different search term."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDocuments.map((document) => (
                                        <tr
                                            key={document.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-medium">
                                                    {document.subject}
                                                </div>

                                                <div className="mt-1 font-mono text-xs text-muted-foreground">
                                                    {document.tracking_number}
                                                </div>

                                                <div className="mt-1 text-xs capitalize text-muted-foreground">
                                                    {getDocumentTypeName(
                                                        document.document_type,
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                {document.originating_office
                                                    ?.name ?? "Not assigned"}
                                            </td>

                                            <td className="px-5 py-4">
                                                {document.submitter?.name ??
                                                    "Unknown"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={document.status}
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                {formatDate(
                                                    document.created_at,
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                {document.status === "draft" ? (
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                editDocument(
                                                                    document,
                                                                )
                                                            }
                                                            disabled={
                                                                form.processing ||
                                                                deletingDocumentId !==
                                                                    null
                                                            }
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteDraft(
                                                                    document,
                                                                )
                                                            }
                                                            disabled={
                                                                deletingDocumentId !==
                                                                    null ||
                                                                submittingDocumentId !==
                                                                    null
                                                            }
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            {deletingDocumentId ===
                                                            document.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                submitDraft(
                                                                    document,
                                                                )
                                                            }
                                                            disabled={
                                                                submittingDocumentId !==
                                                                    null ||
                                                                deletingDocumentId !==
                                                                    null
                                                            }
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Send className="size-3.5" />
                                                            {submittingDocumentId ===
                                                            document.id
                                                                ? "Submitting..."
                                                                : "Submit"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col justify-between gap-3 border-t p-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-muted-foreground">
                            Showing {documents.from ?? 0}–{documents.to ?? 0} of{" "}
                            {documents.total} documents
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {documents.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            });
                                        }
                                    }}
                                    className={`min-w-9 rounded-md border px-3 py-1.5 text-sm transition ${
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
                </section>
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeForm();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="document-modal-title"
                        className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-2xl"
                    >
                        <div className="flex items-start justify-between border-b px-6 py-5">
                            <div>
                                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <FilePlus2 className="size-5" />
                                </div>

                                <h2
                                    id="document-modal-title"
                                    className="text-xl font-semibold tracking-tight"
                                >
                                    {editingDocumentId !== null
                                        ? "Edit Draft Document"
                                        : "New Document"}
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Enter the document details and optionally
                                    attach an existing file.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={form.processing}
                                aria-label="Close modal"
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={submitForm}
                            encType="multipart/form-data"
                        >
                            <div className="max-h-[calc(90vh-170px)] space-y-5 overflow-y-auto p-6">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="document-type"
                                        className="text-sm font-medium"
                                    >
                                        Document Type
                                    </label>

                                    <select
                                        id="document-type"
                                        required
                                        value={form.data.document_type}
                                        onChange={(event) => {
                                            const nextTypeCode =
                                                event.target.value;
                                            const nextType = documentTypes.find(
                                                (type) =>
                                                    type.code === nextTypeCode,
                                            );

                                            form.setData({
                                                ...form.data,
                                                document_type: nextTypeCode,
                                                attachment:
                                                    nextType?.allows_upload
                                                        ? form.data.attachment
                                                        : null,
                                                purpose:
                                                    nextTypeCode ===
                                                    "purchase_request"
                                                        ? form.data.purpose
                                                        : "",
                                                requested_delivery_date:
                                                    nextTypeCode ===
                                                    "purchase_request"
                                                        ? form.data
                                                              .requested_delivery_date
                                                        : "",
                                                items:
                                                    nextTypeCode ===
                                                    "purchase_request"
                                                        ? form.data.items
                                                              .length > 0
                                                            ? form.data.items
                                                            : [
                                                                  createBlankPurchaseRequestItem(),
                                                              ]
                                                        : [],
                                            });
                                        }}
                                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="" disabled>
                                            Select a document type
                                        </option>

                                        {documentTypes.map((type) => (
                                            <option
                                                key={type.id}
                                                value={type.code}
                                            >
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedDocumentType?.description && (
                                        <p className="text-xs text-muted-foreground">
                                            {selectedDocumentType.description}
                                        </p>
                                    )}

                                    {form.errors.document_type && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.document_type}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="document-subject"
                                        className="text-sm font-medium"
                                    >
                                        Subject{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="document-subject"
                                        autoFocus
                                        required
                                        maxLength={255}
                                        value={form.data.subject}
                                        onChange={(event) =>
                                            form.setData(
                                                "subject",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter the document subject"
                                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.subject && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.subject}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="document-description"
                                        className="text-sm font-medium"
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        id="document-description"
                                        rows={4}
                                        maxLength={10000}
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                "description",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Provide additional details about this document..."
                                        className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    {form.errors.description && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.description}
                                        </p>
                                    )}
                                </div>

                                {isPurchaseRequest && (
                                    <section className="space-y-5 rounded-xl border p-4 sm:p-5">
                                        <div>
                                            <h3 className="text-base font-semibold">
                                                Purchase Request Details
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Enter the purpose and list each
                                                requested item. Amounts and the
                                                estimated total are calculated
                                                automatically.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label
                                                htmlFor="purchase-request-purpose"
                                                className="text-sm font-medium"
                                            >
                                                Purpose{" "}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                id="purchase-request-purpose"
                                                rows={3}
                                                maxLength={10000}
                                                required={isPurchaseRequest}
                                                value={form.data.purpose}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "purpose",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Explain why these items are needed..."
                                                className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            />
                                            {form.errors.purpose && (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.purpose}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="purchase-request-delivery-date"
                                                    className="text-sm font-medium"
                                                >
                                                    Requested Delivery Date{" "}
                                                </label>
                                                <input
                                                    id="purchase-request-delivery-date"
                                                    type="date"
                                                    min={
                                                        editingDocumentId ===
                                                        null
                                                            ? getTodayDate()
                                                            : undefined
                                                    }
                                                    value={
                                                        form.data
                                                            .requested_delivery_date
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            "requested_delivery_date",
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                                {form.errors
                                                    .requested_delivery_date && (
                                                    <p className="text-sm text-destructive">
                                                        {
                                                            form.errors
                                                                .requested_delivery_date
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div>
                                                <h4 className="font-semibold">
                                                    Requested Items
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Add one row for each supply,
                                                    equipment, or service.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData("items", [
                                                        ...form.data.items,
                                                        createBlankPurchaseRequestItem(),
                                                    ])
                                                }
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
                                            >
                                                <Plus className="size-4" />
                                                Add Item
                                            </button>
                                        </div>

                                        {form.errors.items && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.items}
                                            </p>
                                        )}

                                        <div className="space-y-4">
                                            {form.data.items.map(
                                                (item, index) => {
                                                    const quantity =
                                                        Number(item.quantity) ||
                                                        0;
                                                    const unitPrice =
                                                        Number(
                                                            item.unit_price,
                                                        ) || 0;
                                                    const amount =
                                                        quantity * unitPrice;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="rounded-lg border bg-muted/10 p-3 sm:p-4"
                                                        >
                                                            <div className="mb-3 flex items-center justify-between">
                                                                <span className="text-sm font-semibold">
                                                                    Item{" "}
                                                                    {index + 1}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        form
                                                                            .data
                                                                            .items
                                                                            .length ===
                                                                        1
                                                                    }
                                                                    onClick={() =>
                                                                        form.setData(
                                                                            "items",
                                                                            form.data.items.filter(
                                                                                (
                                                                                    _,
                                                                                    itemIndex,
                                                                                ) =>
                                                                                    itemIndex !==
                                                                                    index,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    aria-label={`Remove item ${index + 1}`}
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    Remove
                                                                </button>
                                                            </div>

                                                            <div className="grid gap-3 sm:grid-cols-12">
                                                                <div className="space-y-1.5 sm:col-span-12">
                                                                    <label
                                                                        htmlFor={`item-description-${index}`}
                                                                        className="text-xs font-medium"
                                                                    >
                                                                        Item
                                                                        description
                                                                        *
                                                                    </label>
                                                                    <input
                                                                        id={`item-description-${index}`}
                                                                        required
                                                                        maxLength={
                                                                            2000
                                                                        }
                                                                        value={
                                                                            item.description
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "description",
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="e.g. Bond paper, A4 size"
                                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                                    />
                                                                    {getItemError(
                                                                        index,
                                                                        "description",
                                                                    ) && (
                                                                        <p className="text-xs text-destructive">
                                                                            {getItemError(
                                                                                index,
                                                                                "description",
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-1.5 sm:col-span-3">
                                                                    <label
                                                                        htmlFor={`item-quantity-${index}`}
                                                                        className="text-xs font-medium"
                                                                    >
                                                                        Quantity
                                                                        *
                                                                    </label>
                                                                    <input
                                                                        id={`item-quantity-${index}`}
                                                                        type="number"
                                                                        required
                                                                        min="0.01"
                                                                        max="9999999999"
                                                                        step="0.01"
                                                                        value={
                                                                            item.quantity
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "quantity",
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                                    />
                                                                    {getItemError(
                                                                        index,
                                                                        "quantity",
                                                                    ) && (
                                                                        <p className="text-xs text-destructive">
                                                                            {getItemError(
                                                                                index,
                                                                                "quantity",
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-1.5 sm:col-span-3">
                                                                    <label
                                                                        htmlFor={`item-unit-${index}`}
                                                                        className="text-xs font-medium"
                                                                    >
                                                                        Unit *
                                                                    </label>
                                                                    <input
                                                                        id={`item-unit-${index}`}
                                                                        required
                                                                        maxLength={
                                                                            50
                                                                        }
                                                                        value={
                                                                            item.unit
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "unit",
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="pcs, reams, boxes"
                                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                                    />
                                                                    {getItemError(
                                                                        index,
                                                                        "unit",
                                                                    ) && (
                                                                        <p className="text-xs text-destructive">
                                                                            {getItemError(
                                                                                index,
                                                                                "unit",
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-1.5 sm:col-span-3">
                                                                    <label
                                                                        htmlFor={`item-price-${index}`}
                                                                        className="text-xs font-medium"
                                                                    >
                                                                        Unit
                                                                        Price
                                                                        (₱) *
                                                                    </label>
                                                                    <input
                                                                        id={`item-price-${index}`}
                                                                        type="number"
                                                                        required
                                                                        min="0"
                                                                        max="9999999999999.99"
                                                                        step="0.01"
                                                                        value={
                                                                            item.unit_price
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                "unit_price",
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                                    />
                                                                    {getItemError(
                                                                        index,
                                                                        "unit_price",
                                                                    ) && (
                                                                        <p className="text-xs text-destructive">
                                                                            {getItemError(
                                                                                index,
                                                                                "unit_price",
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-1.5 sm:col-span-3">
                                                                    <label className="text-xs font-medium">
                                                                        Amount
                                                                    </label>
                                                                    <div className="flex min-h-9 items-center rounded-lg bg-muted px-3 py-2 text-sm font-semibold tabular-nums">
                                                                        {formatCurrency(
                                                                            amount,
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 rounded-lg bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Estimated total
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Based on the quantities and
                                                    unit prices entered.
                                                </p>
                                            </div>
                                            <p className="text-2xl font-semibold tabular-nums">
                                                {formatCurrency(
                                                    purchaseRequestTotal,
                                                )}
                                            </p>
                                        </div>
                                    </section>
                                )}

                                <div className="space-y-2 rounded-lg border p-4">
                                    <label
                                        htmlFor="document-attachment"
                                        className="flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Upload className="size-4" />
                                        Attach Existing Document
                                    </label>

                                    {selectedDocumentType?.allows_upload ? (
                                        <>
                                            <input
                                                id="document-attachment"
                                                type="file"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                disabled={form.processing}
                                                onChange={(event) => {
                                                    const file =
                                                        event.target
                                                            .files?.[0] ?? null;

                                                    if (
                                                        file &&
                                                        file.size >
                                                            20 * 1024 * 1024
                                                    ) {
                                                        toast.error(
                                                            "The file must not exceed 20 MB.",
                                                        );
                                                        event.target.value = "";
                                                        form.setData(
                                                            "attachment",
                                                            null,
                                                        );
                                                        return;
                                                    }

                                                    form.setData(
                                                        "attachment",
                                                        file,
                                                    );
                                                }}
                                                className="block w-full rounded-lg border bg-background text-sm file:mr-4 file:border-0 file:bg-muted file:px-4 file:py-2.5 file:font-medium"
                                            />

                                            <p className="text-xs text-muted-foreground">
                                                PDF, DOC, DOCX, JPG, or PNG.
                                                Maximum file size: 20 MB.
                                            </p>

                                            {form.data.attachment && (
                                                <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {
                                                                form.data
                                                                    .attachment
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {(
                                                                form.data
                                                                    .attachment
                                                                    .size /
                                                                (1024 * 1024)
                                                            ).toFixed(2)}{" "}
                                                            MB
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            form.setData(
                                                                "attachment",
                                                                null,
                                                            );

                                                            const input =
                                                                window.document.getElementById(
                                                                    "document-attachment",
                                                                ) as HTMLInputElement | null;

                                                            if (input) {
                                                                input.value =
                                                                    "";
                                                            }
                                                        }}
                                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                                                        aria-label="Remove selected file"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {form.errors.attachment && (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.attachment}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            File uploads are disabled for this
                                            document type.
                                        </p>
                                    )}
                                </div>

                                {editingDocumentId === null && (
                                    <div className="rounded-lg border bg-muted/20 p-4">
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={form.data.submit}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "submit",
                                                        event.target.checked,
                                                    )
                                                }
                                                className="mt-1 size-4 accent-primary"
                                            />

                                            <span>
                                                <span className="block text-sm font-medium">
                                                    Submit immediately
                                                </span>

                                                <span className="mt-1 block text-xs text-muted-foreground">
                                                    Start the configured
                                                    approval workflow after
                                                    creating the document. Leave
                                                    unchecked to save a draft.
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {form.hasErrors && (
                                    <p className="text-sm text-destructive">
                                        Please correct the highlighted fields
                                        before continuing.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={form.processing}
                                    className="rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        documentTypes.length === 0
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? (
                                        "Saving..."
                                    ) : editingDocumentId !== null ? (
                                        <>
                                            <Pencil className="size-4" />
                                            Update Draft
                                        </>
                                    ) : form.data.submit ? (
                                        <>
                                            <Send className="size-4" />
                                            Save and Submit
                                        </>
                                    ) : (
                                        <>
                                            <Archive className="size-4" />
                                            Save Draft
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className="text-muted-foreground">{icon}</span>
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                {value}
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: "bg-muted text-muted-foreground",
        submitted:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        in_progress:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        completed:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        rejected:
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                styles[status] ?? "bg-muted text-muted-foreground"
            }`}
        >
            {status.replaceAll("_", " ")}
        </span>
    );
}

function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string | null): string {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(date);
}

DocumentIndex.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
        {
            title: "Document Management",
            href: "/admin/documents",
        },
    ] satisfies BreadcrumbItem[],
};
