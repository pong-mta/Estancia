import { Head, Link, usePage } from "@inertiajs/react";
import { dashboard, login, register } from "@/routes";

export default function Welcome() {
    const { auth } = usePage().props as { auth: { user?: unknown } };

    // ==========================================
    // SECTION 1: SHARED BRANDING ASSETS
    // Change these paths if you store the images
    // in a different folder inside public/.
    // ==========================================
    const municipalSeal = "/images/estancia-seal.png";
    const municipalHallBackground = "/images/estancia-municipal-hall.jpg";

    // ==========================================
    // SECTION 2: PORTAL FEATURE CARDS
    // Edit these entries to change the feature
    // cards displayed on the right side.
    // Keep the descriptions aligned with features
    // that are actually available in your system.
    // ==========================================
    const portalFeatures = [
        {
            number: "01",
            title: "Document Tracking",
            description:
                "Monitor documents and follow their progress across the municipal office workflow.",
        },
        {
            number: "02",
            title: "Requests & Approvals",
            description:
                "Review submitted requests and manage approval activities.",
        },
        {
            number: "03",
            title: "Task Coordination",
            description:
                "Organize assigned tasks and keep office work coordinated.",
        },
        {
            number: "04",
            title: "Records & History",
            description:
                "Access recorded activities and maintain an organized work history.",
        },
    ];

    return (
        <>
            {/* ==========================================
                SECTION 3: BROWSER PAGE TITLE
                Change the title shown in the browser tab here.
            ========================================== */}
            <Head title="Estancia Offices | Municipal Office Portal" />

            {/* ==========================================
                SECTION 4: MAIN PAGE & MUNICIPAL HALL BACKGROUND
                Place the municipal hall photo at:
                public/images/estancia-municipal-hall.jpg
                Adjust the overlay opacity below if the
                background is too dark or too bright.
            ========================================== */}
            <main className="relative min-h-screen overflow-hidden bg-[#071629] text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${municipalHallBackground})`,
                    }}
                    aria-hidden="true"
                />
                {/* Dark overlay keeps the text readable over the photo. */}
                <div
                    className="absolute inset-0 bg-[#061326]/85"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-gradient-to-r from-[#061326]/95 via-[#061326]/80 to-[#061326]/65"
                    aria-hidden="true"
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    aria-hidden="true"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />

                {/* ==========================================
                    SECTION 5: TOP NAVIGATION
                    Edit the municipal seal, portal name, and
                    Login/Register navigation links here.
                ========================================== */}
                <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
                    <Link href="/" className="flex items-center gap-3">
                        <img
                            src={municipalSeal}
                            alt="Municipality of Estancia official seal"
                            className="h-14 w-14 rounded-full bg-white object-contain p-1 shadow-lg"
                        />
                        <span>
                            <span className="block text-sm font-bold tracking-[0.16em] sm:text-base">
                                ESTANCIA OFFICES
                            </span>
                            <span className="block text-xs text-slate-300">
                                Municipal Offices Management System
                            </span>
                        </span>
                    </Link>

                    <nav
                        className="flex items-center gap-2 sm:gap-3"
                        aria-label="Main navigation"
                    >
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#071629] transition hover:bg-[#F2D12E]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#F2D12E] hover:bg-white/10"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* ==========================================
                    SECTION 6: HERO CONTENT
                    Update the main heading and supporting
                    message here. This copy represents the
                    whole municipality, not one office.
                ========================================== */}
                <section className="relative z-10 mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:py-16">
                    <div className="max-w-2xl">
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#F2D12E]/30 bg-[#F2D12E]/10 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[#F7DF70]">
                            <span className="h-2 w-2 rounded-full bg-[#F2D12E]" />
                            MUNICIPAL SERVICES • CONNECTED • ACCESSIBLE
                        </div>

                        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            One Municipality.
                            <span className="mt-2 block text-[#F2D12E]">
                                Connected Offices.
                            </span>
                            <span className="mt-2 block">
                                Better Public Service.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
                            A centralized digital platform connecting the
                            municipal offices of Estancia, Iloilo. Access office
                            services, track documents, coordinate tasks, and
                            support efficient public service through one
                            organized portal.
                        </p>

                        {/* Primary call-to-action buttons. */}
                        <div className="mt-9 flex flex-wrap gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-lg bg-[#D71920] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/30 transition hover:bg-red-700"
                                >
                                    Open dashboard{" "}
                                    <span aria-hidden="true">→</span>
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="rounded-lg bg-[#D71920] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/30 transition hover:bg-red-700"
                                >
                                    Access the portal{" "}
                                    <span aria-hidden="true">→</span>
                                </Link>
                            )}
                            <div className="rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-slate-100 backdrop-blur-sm">
                                Estancia, Iloilo
                            </div>
                        </div>

                        {/* Municipal identity strip. Edit these labels as needed. */}
                        <div className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-white/20 pt-7">
                            <div>
                                <p className="text-xl font-bold text-[#F2D12E]">
                                    01
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    Connect Offices
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#F2D12E]">
                                    02
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    Coordinate Services
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#F2D12E]">
                                    03
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    Serve the Community
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ==========================================
                        SECTION 7: PORTAL FEATURES PANEL
                        Add, remove, or rename feature cards in
                        the portalFeatures array near the top.
                    ========================================== */}
                    <div className="mx-auto w-full max-w-lg">
                        <div className="rounded-3xl border border-white/15 bg-[#0B1F3A]/85 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
                            <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-5">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={municipalSeal}
                                        alt="Municipality of Estancia seal"
                                        className="h-11 w-11 rounded-full bg-white object-contain p-1"
                                    />
                                    <div>
                                        <p className="font-semibold">
                                            Estancia Offices
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            Municipal Offices Portal
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full border border-[#F2D12E]/30 bg-[#F2D12E]/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-[#F7DF70]">
                                    OFFICIAL PORTAL
                                </span>
                            </div>

                            <div className="py-7">
                                <p className="text-xs font-semibold tracking-[0.2em] text-[#F7DF70]">
                                    ONE CENTRALIZED PLATFORM
                                </p>
                                <h2 className="mt-3 text-2xl font-bold">
                                    Municipal services, connected.
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-slate-200">
                                    A shared digital workspace designed to help
                                    municipal offices organize documents,
                                    requests, tasks, and service activities.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {portalFeatures.map((feature) => (
                                    <div
                                        key={feature.number}
                                        className="rounded-xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-[#F2D12E]/40 hover:bg-white/[0.09]"
                                    >
                                        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#D71920]/25 text-sm font-bold text-[#FFB4B4]">
                                            {feature.number}
                                        </div>
                                        <h3 className="text-sm font-semibold">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-1 text-xs leading-5 text-slate-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ==========================================
                            SECTION 8: ACCESS NOTICE
                            Change this short note if portal access
                            rules or audience descriptions change.
                        ========================================== */}
                        <p className="mt-5 text-center text-xs text-slate-300">
                            A centralized portal for authorized Estancia
                            municipal office personnel.
                        </p>
                    </div>
                </section>

                {/* ==========================================
                    SECTION 9: FOOTER
                    Edit the municipality name or footer text here.
                ========================================== */}
                <footer className="relative z-10 border-t border-white/10 bg-[#061326]/60 px-6 py-5 text-center text-xs text-slate-300">
                    Municipality of Estancia, Iloilo · Estancia Offices Portal
                </footer>
            </main>
        </>
    );
}
