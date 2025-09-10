import { NavUser } from '@/components/nav-user';
import { Badge } from '@/components/ui/badge';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { ChevronRight, Factory, Folder, LayoutGrid, Wrench } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Production',
        icon: Factory,
        children: [
            {
                title: 'Production Lines',
                href: '/production-lines',
                icon: Factory,
            },
            {
                title: 'Machines',
                href: '/machines',
                icon: Wrench,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/rizal111/manufacturing-tracking',
        icon: Folder,
    },
];

export function AppSidebar() {
    const { url } = usePage();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <NavMain items={mainNavItems} currentPath={url} />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <NavFooter items={footerNavItems} />
                    </SidebarGroupContent>
                </SidebarGroup>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

// Main Navigation Component
function NavMain({ items, currentPath }: { items: NavItem[]; currentPath: string }) {
    return (
        <SidebarMenu>
            {items.map((item) => (
                <NavMainItem key={item.title} item={item} currentPath={currentPath} />
            ))}
        </SidebarMenu>
    );
}

// Individual Navigation Item
function NavMainItem({ item, currentPath }: { item: NavItem; currentPath: string }) {
    const isActive = item.href === currentPath;
    const hasActiveChild = item.children?.some((child) => child.href === currentPath);
    const isOpen = isActive || hasActiveChild;

    if (!item.children) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} disabled={item.disabled}>
                    <Link href={item.href || '#'}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                                {item.badge}
                            </Badge>
                        )}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return (
        <Collapsible defaultOpen={isOpen} asChild>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={hasActiveChild}
                        className={cn('data-[state=open]:before:rotate-90', 'before:absolute before:left-2 before:transition-transform')}
                    >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.children.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={subItem.href === currentPath}
                                    {...(subItem.disabled
                                        ? { 'aria-disabled': true, tabIndex: -1, className: 'pointer-events-none opacity-50' }
                                        : {})}
                                >
                                    <Link href={subItem.href || '#'}>
                                        {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                        <span>{subItem.title}</span>
                                        {subItem.badge && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {subItem.badge}
                                            </Badge>
                                        )}
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

// Footer Navigation Component
function NavFooter({ items }: { items: NavItem[] }) {
    const { url } = usePage();

    return (
        <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.href === url} tooltip={item.title} size="sm">
                        <Link href={item.href || '#'}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}

// export function AppSidebar() {
//     const { url } = usePage();

//     return (
//         <Sidebar collapsible="icon" variant="inset">
//             <SidebarHeader>
//                 <SidebarMenu>
//                     <SidebarMenuItem>
//                         <SidebarMenuButton size="lg" asChild>
//                             <Link href="/dashboard">
//                                 <AppLogo />
//                             </Link>
//                         </SidebarMenuButton>
//                     </SidebarMenuItem>
//                 </SidebarMenu>
//             </SidebarHeader>

//             <SidebarContent>
//                 <SidebarGroup>
//                     <SidebarGroupLabel>Navigation</SidebarGroupLabel>
//                     <SidebarGroupContent>
//                         <SidebarMenu>
//                             {mainNavItems.map((item) => (
//                                 <SidebarMenuItem key={item.title}>
//                                     <SidebarMenuButton asChild isActive={item.href === url} tooltip={item.title}>
//                                         <Link href={item.href || '#'}>
//                                             <item.icon className="h-4 w-4" />
//                                             <span>{item.title}</span>
//                                             {item.badge && (
//                                                 <Badge variant="secondary" className="ml-auto">
//                                                     {item.badge}
//                                                 </Badge>
//                                             )}
//                                         </Link>
//                                     </SidebarMenuButton>
//                                 </SidebarMenuItem>
//                             ))}
//                         </SidebarMenu>
//                     </SidebarGroupContent>
//                 </SidebarGroup>

//                 <SidebarGroup className="mt-auto">
//                     <SidebarGroupLabel>Support</SidebarGroupLabel>
//                     <SidebarGroupContent>
//                         <SidebarMenu>
//                             {footerNavItems.map((item) => (
//                                 <SidebarMenuItem key={item.title}>
//                                     <SidebarMenuButton asChild isActive={item.href === url} tooltip={item.title} size="sm">
//                                         <Link href={item.href || '#'}>
//                                             <item.icon className="h-4 w-4" />
//                                             <span>{item.title}</span>
//                                         </Link>
//                                     </SidebarMenuButton>
//                                 </SidebarMenuItem>
//                             ))}
//                         </SidebarMenu>
//                     </SidebarGroupContent>
//                 </SidebarGroup>
//             </SidebarContent>

//             <SidebarFooter>
//                 <NavUser />
//             </SidebarFooter>
//         </Sidebar>
//     );
// }
