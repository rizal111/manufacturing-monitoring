import { BreadcrumbItem } from '@/types/common';

export const breadcrumbConfig = {
    // Base breadcrumbs
    dashboard: {
        title: 'Dashboard',
        href: '/dashboard',
    },

    // Production breadcrumbs
    production: {
        index: {
            title: 'Production',
            href: '/production',
        },
        machines: {
            index: {
                title: 'Machines',
                href: '/machines',
            },
            create: {
                title: 'Add Machine',
            },
            edit: {
                title: 'Edit Machine',
            },
        },
        productionLines: {
            index: {
                title: 'Production Lines',
                href: '/production-lines',
            },
            create: {
                title: 'Add Production Line',
            },
            edit: {
                title: 'Edit Production Line',
            },
        },
    },

    // Settings breadcrumbs
    settings: {
        index: {
            title: 'Settings',
            href: '/settings',
        },
        users: {
            title: 'Users',
            href: '/settings/users',
        },
    },
    productionLines: {
        index: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Production Lines', href: '/production-lines' },
        ],
        show: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Production Lines', href: '/production-lines' },
        ],
    },

    machines: {
        index: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Machines', href: '/machines' },
        ],
        show: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Machines', href: '/machines' },
        ],
    },
};

// Helper function to build breadcrumb arrays
export const buildBreadcrumbs = (...items: BreadcrumbItem[]): BreadcrumbItem[] => {
    return [breadcrumbConfig.dashboard, ...items];
};

// Pre-built breadcrumb arrays for common pages
export const breadcrumbs = {
    // Dashboard
    dashboard: [breadcrumbConfig.dashboard],

    // Machines
    machines: buildBreadcrumbs(breadcrumbConfig.production.index, breadcrumbConfig.production.machines.index),
    machineCreate: buildBreadcrumbs(
        breadcrumbConfig.production.index,
        breadcrumbConfig.production.machines.index,
        breadcrumbConfig.production.machines.create,
    ),
    machineEdit: buildBreadcrumbs(
        breadcrumbConfig.production.index,
        breadcrumbConfig.production.machines.index,
        breadcrumbConfig.production.machines.edit,
    ),

    // Production Lines
    productionLines: buildBreadcrumbs(breadcrumbConfig.production.index, breadcrumbConfig.production.productionLines.index),
    productionLineCreate: buildBreadcrumbs(
        breadcrumbConfig.production.index,
        breadcrumbConfig.production.productionLines.index,
        breadcrumbConfig.production.productionLines.create,
    ),
};
