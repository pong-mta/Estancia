import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

function MdrRmoMark({ className = 'h-12 w-12' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950/30 ${className}`}>
            <svg viewBox="0 0 48 48" fill="none" className="h-7 w-7" aria-hidden="true">
                <path d="M24 4 40 10v12c0 10.2-6.7 17.5-16 22C14.7 39.5 8 32.2 8 22V10L24 4Z" stroke="currentColor" strokeWidth="2.8" />
                <path d="M21 13h6v8h8v6h-8v8h-6v-8h-8v-6h8v-8Z" fill="currentColor" />
            </svg>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props as { auth: { user?: unknown } };

    return (
        <>
            <Head title="Estancia Offices | Municipal Office Portal" />
            <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-red-600/10 blur-3xl" />
                    <div className="absolute -bottom-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                </div>

                <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
                    <Link href="/" className="flex items-center gap-3">
                        <MdrRmoMark />
                        <span>
                            <span className="block text-sm font-bold tracking-[0.16em]">ESTANCIA OFFICES</span>
                            <span className="block text-xs text-slate-400">Municipal Office Portal</span>
                        </span>
                    </Link>
                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href={dashboard()} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">Dashboard</Link>
                        ) : (
                            <>
                                <Link href={login()} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white">Log in</Link>
                                <Link href={register()} className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10">Register</Link>
                            </>
                        )}
                    </nav>
                </header>

                <section className="relative z-10 mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-7xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-16">
                    <div className="max-w-2xl">
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-red-300">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            PUBLIC SAFETY • RESPONSE • COORDINATION
                        </div>
                        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Ready to respond.
                            <span className="mt-2 block text-red-500">Ready to serve.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                            A centralized operations platform supporting the Estancia Municipal Disaster Risk Reduction and Management Office in coordinating emergency resources and response activities.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            {auth.user ? (
                                <Link href={dashboard()} className="rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500">Open dashboard <span aria-hidden="true">→</span></Link>
                            ) : (
                                <Link href={login()} className="rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500">Access the system <span aria-hidden="true">→</span></Link>
                            )}
                            <div className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-300">Estancia, Iloilo</div>
                        </div>
                        <div className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-7">
                            <div><p className="text-xl font-bold text-white">01</p><p className="mt-1 text-xs text-slate-400">Coordinate</p></div>
                            <div><p className="text-xl font-bold text-white">02</p><p className="mt-1 text-xs text-slate-400">Respond</p></div>
                            <div><p className="text-xl font-bold text-white">03</p><p className="mt-1 text-xs text-slate-400">Recover</p></div>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-lg">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
                            <div className="flex items-center justify-between border-b border-white/10 pb-5">
                                <div className="flex items-center gap-3">
                                    <MdrRmoMark className="h-11 w-11" />
                                    <div><p className="font-semibold">Estancia Offices</p><p className="text-xs text-slate-400">Municipal Office Portal</p></div>
                                </div>
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-emerald-300">SYSTEM PORTAL</span>
                            </div>
                            <div className="py-8">
                                <p className="text-xs font-semibold tracking-[0.2em] text-red-300">ONE CENTRALIZED PLATFORM</p>
                                <h2 className="mt-3 text-2xl font-bold">Emergency response coordination</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-300">Manage ambulance resources, booking requests, personnel assignments, and field operations through one organized workspace.</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ['Ambulance Management', 'Monitor fleet availability and status.'],
                                    ['Booking Management', 'Review and process service requests.'],
                                    ['Personnel Management', 'Coordinate response team availability.'],
                                    ['Operations Management', 'Assign resources and track missions.'],
                                ].map(([title, description], index) => (
                                    <div key={title} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                                        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-sm font-bold text-red-300">0{index + 1}</div>
                                        <h3 className="text-sm font-semibold">{title}</h3>
                                        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="mt-5 text-center text-xs text-slate-500">For authorized personnel of the Estancia MDRRMO.</p>
                    </div>
                </section>
            </main>
        </>
    );
}
