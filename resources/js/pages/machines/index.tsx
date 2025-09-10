import MachinesList from '@/components/machines/machines-list';
import { breadcrumbConfig } from '@/config/breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { Machine, ProductionLine } from '@/types/production';
import { Head } from '@inertiajs/react';

interface MachinesPageProps {
    machines: {
        data: Machine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    productionLines: ProductionLine[];
}

export default function MachinesPage({ machines, productionLines }: MachinesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbConfig.machines.index}>
            <Head title="Machines" />
            <div className="container mx-auto py-6">
                <MachinesList machines={machines} productionLines={productionLines} />
            </div>
        </AppLayout>
    );
}
