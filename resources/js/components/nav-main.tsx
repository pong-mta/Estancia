import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-3 text-slate-100">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="mb-1 h-10 rounded-xl px-3 text-slate-300 transition-all hover:bg-white/10 hover:text-white data-[active=true]:bg-gradient-to-r data-[active=true]:from-red-700 data-[active=true]:to-red-600 data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-red-950/20"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
