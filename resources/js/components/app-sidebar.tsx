import { Link, usePage } from "@inertiajs/react";
import {
    Activity,
    Building2,
    ClipboardCheck,
    FileClock,
    FileText,
    GitBranch,
    LayoutDashboard,
    Settings,
    Users,
    Send,
    Tags,
    BriefcaseBusiness,
    Calculator,
    Scale,
    Landmark,
    ShieldCheck,
    Ambulance,
    CalendarDays,
    Radio,
    History,
} from "lucide-react";

import AppLogo from "@/components/app-logo";
import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboard } from "@/routes";
import type { NavItem } from "@/types";

type AuthUser = {
    office_code?: string | null;
    system_role?: string | null;
};

type SharedPageProps = {
    auth: {
        user: AuthUser | null;
    };
};

const commonNavItems: NavItem[] = [
    { title: "Dashboard", href: dashboard(), icon: LayoutDashboard },
    { title: "Document Tracking", href: "/admin/documents", icon: FileText },
    {
        title: "Pending Approvals",
        href: "/admin/pending-approvals",
        icon: Send,
    },
    { title: "My Tasks", href: "/admin/tasks", icon: ClipboardCheck },
    {
        title: "Document History",
        href: "/admin/document-history",
        icon: FileClock,
    },
];

const officeNavItems: Record<string, NavItem[]> = {
    GSO: [
        { title: "Procurement", href: "/admin/procurement", icon: Tags },
        {
            title: "Manage Suppliers",
            href: "/admin/suppliers",
            icon: Building2,
        },
    ],
    BUDGET: [
        {
            title: "Budget Review",
            href: "/admin/pending-approvals",
            icon: Calculator,
        },
        {
            title: "Document Tracking",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    ACCOUNTING: [
        {
            title: "Accounting Review",
            href: "/admin/pending-approvals",
            icon: Calculator,
        },
        {
            title: "Document Tracking",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    MAYOR: [
        {
            title: "Final Approvals",
            href: "/admin/pending-approvals",
            icon: ShieldCheck,
        },
        {
            title: "Document Tracking",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    HRMO: [
        { title: "Personnel Documents", href: "/admin/documents", icon: Users },
        { title: "My Tasks", href: "/admin/tasks", icon: ClipboardCheck },
    ],
    BAC: [
        {
            title: "Bidding & Procurement",
            href: "/admin/documents",
            icon: Scale,
        },
        { title: "My Tasks", href: "/admin/tasks", icon: ClipboardCheck },
    ],
    VICE_MAYOR: [
        {
            title: "Legislative Documents",
            href: "/admin/documents",
            icon: Landmark,
        },
    ],
    SB: [
        {
            title: "Council Documents",
            href: "/admin/documents",
            icon: Landmark,
        },
    ],
    SB_SECRETARY: [
        {
            title: "Legislative Records",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    ADMIN: [
        {
            title: "Office Coordination",
            href: "/admin/documents",
            icon: BriefcaseBusiness,
        },
    ],
    LEGAL: [
        { title: "Legal Documents", href: "/admin/documents", icon: Scale },
    ],
    PIO: [
        { title: "Office Documents", href: "/admin/documents", icon: FileText },
    ],
    TREASURER: [
        {
            title: "Treasury Documents",
            href: "/admin/documents",
            icon: Calculator,
        },
    ],
    ASSESSOR: [
        {
            title: "Assessment Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    PROCUREMENT: [
        {
            title: "Procurement Documents",
            href: "/admin/documents",
            icon: Tags,
        },
    ],
    PROPERTY: [
        {
            title: "Property Documents",
            href: "/admin/documents",
            icon: Building2,
        },
    ],
    INTERNAL_AUDIT: [
        {
            title: "Audit Documents",
            href: "/admin/documents",
            icon: ShieldCheck,
        },
    ],
    MPDO: [
        {
            title: "Planning Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    ENGINEERING: [
        {
            title: "Engineering Documents",
            href: "/admin/documents",
            icon: Building2,
        },
    ],
    CIVIL_REGISTRY: [
        {
            title: "Registry Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    BPLO: [
        { title: "Permit Documents", href: "/admin/documents", icon: FileText },
    ],
    MENRO: [
        {
            title: "Environment Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    TOURISM: [
        {
            title: "Tourism Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    PESO: [
        {
            title: "Employment Documents",
            href: "/admin/documents",
            icon: Users,
        },
    ],
    ECONOMIC_ENTERPRISE: [
        {
            title: "Enterprise Documents",
            href: "/admin/documents",
            icon: BriefcaseBusiness,
        },
    ],
    HEALTH: [
        {
            title: "Health Office Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    MSWDO: [
        {
            title: "Social Welfare Documents",
            href: "/admin/documents",
            icon: Users,
        },
    ],
    AGRICULTURE: [
        {
            title: "Agriculture Documents",
            href: "/admin/documents",
            icon: FileText,
        },
    ],
    MDRRMO: [
        {
            title: "Disaster Management Documents",
            href: "/admin/documents",
            icon: ShieldCheck,
        },
    ],
    CIVIL_SECURITY: [
        {
            title: "Public Safety Documents",
            href: "/admin/documents",
            icon: ShieldCheck,
        },
    ],
    OSCA: [
        {
            title: "Senior Citizens' Documents",
            href: "/admin/documents",
            icon: Users,
        },
    ],
    PDAO: [{ title: "PDAO Documents", href: "/admin/documents", icon: Users }],
    GAD: [{ title: "GAD Documents", href: "/admin/documents", icon: FileText }],
    YOUTH: [
        {
            title: "Youth Development Documents",
            href: "/admin/documents",
            icon: Users,
        },
    ],
};

const systemAdminNavItems: NavItem[] = [
    { title: "Workflow Designer", href: "/admin/workflows", icon: GitBranch },
    { title: "Office Management", href: "/admin/offices", icon: Building2 },
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
];

// Only for MDRRMO Operations Admin users.
const operationsNavItems: NavItem[] = [
    {
        title: "Operations Dashboard",
        href: "/mdrrmo/operations",
        icon: LayoutDashboard,
    },
    {
        title: "Ambulance Fleet",
        href: "/mdrrmo/ambulances",
        icon: Ambulance,
    },
    {
        title: "Drivers & Personnel",
        href: "/mdrrmo/personnel",
        icon: Users,
    },
    {
        title: "Booking Requests",
        href: "/mdrrmo/bookings",
        icon: CalendarDays,
    },
    {
        title: "Dispatch Operations",
        href: "/mdrrmo/dispatch",
        icon: Radio,
    },
    {
        title: "Mission History",
        href: "/mdrrmo/missions",
        icon: History,
    },
];

const footerNavItems: NavItem[] = [
    { title: "Settings", href: "/settings/profile", icon: Settings },
];

export function AppSidebar() {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user;

    const officeCode = user?.office_code ?? "";
    const isSystemAdmin = user?.system_role === "admin";

    const isMdrrmoOperationsAdmin =
        officeCode === "MDRRMO" &&
        user?.system_role === "mdrrmo_operations_admin";

    // Operations Admin gets operations-only navigation.
    // Other EDTS users keep their existing navigation.
    const visibleNavItems: NavItem[] = isMdrrmoOperationsAdmin
        ? operationsNavItems
        : [
              ...commonNavItems,
              ...(officeNavItems[officeCode] ?? []),
              ...(isSystemAdmin ? systemAdminNavItems : []),
          ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={
                                    isMdrrmoOperationsAdmin
                                        ? "/mdrrmo/operations"
                                        : dashboard()
                                }
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
