import { Link } from "@inertiajs/react";
import { home } from "@/routes";
import type { AuthLayoutProps } from "@/types";

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-blue-500/10 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
            </div>

            <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 lg:grid-cols-2">
                <section className="hidden flex-col justify-between bg-gradient-to-br from-red-700 via-red-800 to-slate-950 p-10 lg:flex">
                    <Link
                        href={home()}
                        className="inline-flex w-fit items-center gap-3"
                    >
                        <img
                            src="/images/estancia-seal.png"
                            alt="Municipality of Estancia official seal"
                            className="h-14 w-14 rounded-full object-contain"
                        />
                        <span>
                            <span className="block text-sm font-bold tracking-[0.16em]">
                                ESTANCIA OFFICES
                            </span>
                            <span className="block text-xs text-red-100/80">
                                Municipal Offices Management System
                            </span>
                        </span>
                    </Link>

                    <div className="max-w-sm">
                        <p className="text-xs font-semibold tracking-[0.22em] text-red-100/80">
                            ONE MUNICIPALITY • CONNECTED OFFICES • BETTER PUBLIC
                            SERVICE
                        </p>
                        <h1 className="mt-5 text-4xl font-bold leading-tight">
                            One Municipality.
                            <br />
                            Connected Offices.
                            <br />
                            Better Public Service.
                        </h1>
                        <p className="mt-5 text-sm leading-7 text-red-50/85">
                            A centralized digital workspace connecting the
                            municipal offices of Estancia and supporting
                            efficient public service, coordination, and service
                            delivery.
                        </p>
                    </div>

                    <p className="text-xs text-red-100/70">
                        Municipality of Estancia, Iloilo • Authorized personnel
                        access
                    </p>
                </section>

                <section className="flex items-center justify-center bg-slate-900 px-6 py-10 sm:px-10">
                    <div className="w-full max-w-sm">
                        <Link
                            href={home()}
                            className="mb-8 flex items-center justify-center gap-3 lg:hidden"
                        >
                            <img
                                src="/images/estancia-seal.png"
                                alt="Municipality of Estancia official seal"
                                className="h-12 w-12 rounded-full object-contain"
                            />
                            <span>
                                <span className="block text-sm font-bold tracking-[0.14em] text-white">
                                    ESTANCIA OFFICES
                                </span>
                                <span className="block text-xs text-slate-400">
                                    Municipal Offices Management System
                                </span>
                            </span>
                        </Link>

                        <div className="mb-8">
                            <p className="text-xs font-semibold tracking-[0.2em] text-red-400">
                                SECURE SYSTEM ACCESS
                            </p>
                            <h2 className="mt-3 text-2xl font-bold text-white">
                                {title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                {description}
                            </p>
                        </div>

                        <div className="[&_label]:text-slate-200 [&_input]:border-white/10 [&_input]:bg-slate-950 [&_input]:text-white [&_input]:placeholder:text-slate-500 [&_a]:text-red-400 [&_a:hover]:text-red-300 [&_button]:bg-red-600 [&_button]:text-white [&_button:hover]:bg-red-500">
                            {children}
                        </div>

                        <p className="mt-8 text-center text-xs text-slate-500">
                            Authorized access only. Please keep your credentials
                            secure.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
