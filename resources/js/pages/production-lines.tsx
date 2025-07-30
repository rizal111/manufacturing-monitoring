// resources/js/pages/production-lines/index.tsx
import ProductionLinesList from '@/components/production-lines/production-lines-list';
import { breadcrumbConfig } from '@/config/breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { ProductionLine } from '@/types/production';
import { Head } from '@inertiajs/react';

interface ProductionLinesPageProps {
    productionLines: {
        data: ProductionLine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        is_active?: boolean;
    };
}

export default function ProductionLinesPage({ productionLines, filters }: ProductionLinesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbConfig.productionLines.index}>
            <Head title="Production Lines" />
            <div className="container mx-auto py-6">
                <ProductionLinesList productionLines={productionLines} filters={filters} />
            </div>
        </AppLayout>
    );
}
