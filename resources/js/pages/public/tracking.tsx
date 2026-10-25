import { Head, router } from "@inertiajs/react";
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    FileSearch,
    FileText,
    Search,
    XCircle,
} from "lucide-react";
import { FormEvent, useState } from "react";

type TimelineStep = {
    name: string;
    position: number;
    status: "completed" | "current" | "pending" | "rejected" | "not_reached";
    acted_at: string | null;
};

type TrackedDocument = {
    tracking_number: string;
    subject: string;
    document_type: string;
    status: string;
    submitted_at: string | null;
    completed_at: string | null;
    timeline: TimelineStep[];
};

type Props = {
    trackingNumber: string;
    document: TrackedDocument | null;
    searched: boolean;
};

function formatLabel(value: string) {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status: string) {
    switch (status) {
        case "completed":
            return "bg-emerald-50 text-emerald-700 ring-emerald-200";
        case "rejected":
            return "bg-red-50 text-red-700 ring-red-200";
        case "in_progress":
        case "submitted":
        case "current":
            return "bg-blue-50 text-blue-700 ring-blue-200";
        case "draft":
            return "bg-gray-100 text-gray-700 ring-gray-200";
        default:
            return "bg-amber-50 text-amber-700 ring-amber-200";
    }
}

function StepIcon({ status }: { status: TimelineStep["status"] }) {
    if (status === "completed") {
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    }

    if (status === "rejected") {
        return <XCircle className="h-5 w-5 text-red-600" />;
    }

    if (status === "current") {
        return <Clock3 className="h-5 w-5 text-blue-600" />;
    }

    return <span className="h-3 w-3 rounded-full border-2 border-gray-300" />;
}

function PublicTrackingPage({ trackingNumber, document, searched }: Props) {
    const [search, setSearch] = useState(trackingNumber);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const value = search.trim();

        if (!value) return;

        router.get(
            "/track-document",
            { tracking_number: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }

    return (
        <>
            <Head title="Track a Document" />

            <div className="min-h-screen bg-slate-50 text-slate-900">
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5 sm:px-8">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
                            <FileText className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                Electronic Document Tracking System
                            </h1>
                            <p className="text-sm text-slate-500">
                                Public Document Tracking
                            </p>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                            <FileSearch className="h-7 w-7" />
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Track your document
                        </h2>

                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            Enter the tracking number provided when your
                            document was submitted to view its current status
                            and processing progress.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
                    >
                        <label
                            htmlFor="tracking_number"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Document tracking number
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                <input
                                    id="tracking_number"
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="e.g. EDTS-20261024-ABC123"
                                    maxLength={50}
                                    autoComplete="off"
                                    required
                                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
                            >
                                Track document
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                            Tracking numbers are case-sensitive.
                        </p>
                    </form>

                    {searched && !document && (
                        <div
                            role="status"
                            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
                        >
                            <h3 className="font-semibold text-amber-900">
                                Document not found
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                We could not find a submitted document with that
                                tracking number. Check the number and try again.
                            </p>
                        </div>
                    )}

                    {document && (
                        <section className="mt-8 space-y-6">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-200 p-5 sm:p-7">
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Tracking number
                                            </p>
                                            <p className="mt-1 break-all font-mono text-lg font-bold text-blue-800">
                                                {document.tracking_number}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClasses(document.status)}`}
                                        >
                                            {formatLabel(document.status)}
                                        </span>
                                    </div>

                                    <h3 className="mt-5 text-xl font-bold">
                                        {document.subject}
                                    </h3>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Document type:{" "}
                                        <span className="font-medium text-slate-700">
                                            {formatLabel(
                                                document.document_type,
                                            )}
                                        </span>
                                    </p>

                                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Date submitted
                                            </p>
                                            <p className="mt-1 text-sm font-semibold">
                                                {document.submitted_at ??
                                                    "Not available"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Date completed
                                            </p>
                                            <p className="mt-1 text-sm font-semibold">
                                                {document.completed_at ??
                                                    "Not yet completed"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-7">
                                    <h4 className="text-lg font-bold">
                                        Processing progress
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Follow the steps recorded for your
                                        document.
                                    </p>

                                    {document.timeline.length > 0 ? (
                                        <ol className="mt-6">
                                            {document.timeline.map(
                                                (step, index) => (
                                                    <li
                                                        key={`${step.position}-${step.name}`}
                                                        className="relative flex gap-4 pb-7 last:pb-0"
                                                    >
                                                        {index <
                                                            document.timeline
                                                                .length -
                                                                1 && (
                                                            <span className="absolute left-[9px] top-6 h-full w-px bg-slate-200" />
                                                        )}

                                                        <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center bg-white">
                                                            <StepIcon
                                                                status={
                                                                    step.status
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">
                                                                        {
                                                                            step.name
                                                                        }
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Step{" "}
                                                                        {
                                                                            step.position
                                                                        }
                                                                    </p>
                                                                </div>

                                                                <span
                                                                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(step.status)}`}
                                                                >
                                                                    {formatLabel(
                                                                        step.status,
                                                                    )}
                                                                </span>
                                                            </div>

                                                            {step.acted_at && (
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Recorded:{" "}
                                                                    {
                                                                        step.acted_at
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ),
                                            )}
                                        </ol>
                                    ) : (
                                        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                            The document has been located, but
                                            workflow progress is not available
                                            yet.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <p className="text-center text-xs leading-5 text-slate-500">
                                This page displays general tracking information
                                only. Internal comments and staff details are
                                not available through public tracking.
                            </p>
                        </section>
                    )}

                    <footer className="mt-12 text-center text-xs text-slate-400">
                        Electronic Document Tracking System
                    </footer>
                </main>
            </div>
        </>
    );
}

/*
 * This page intentionally uses no admin layout.
 * The page resolver must respect this null layout setting.
 */
PublicTrackingPage.layout = null;

export default PublicTrackingPage;
