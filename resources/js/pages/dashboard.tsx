import { Head } from '@inertiajs/react';
import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import { AdvancedParetoChart } from '../components/dashboard/advancedParetoChart';
import { TotalProductionGraph } from '../components/dashboard/productionTotal';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { breadcrumbs } from '@/config/breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { MachineStatus } from '../components/dashboard/machineStatus';
import { QualityTrend } from '../components/dashboard/qualityTrend';
import { TopIssues } from '../components/dashboard/topIssues';

const chartConfig = {
    oee: {},
} satisfies ChartConfig;

// const prodTrendChartConfig = {
//     total_produced: {
//         label: 'Produced',
//         color: 'var(--chart-1)',
//     },
//     total_rejected: {
//         label: 'Rejected',
//         color: 'var(--chart-5)',
//     },
// } satisfies ChartConfig;

// const getShift: { [key: number]: string } = {
//     0: 'Morning',
//     8: 'Afternoon',
//     16: 'Night',
// };

export default function Dashboard() {
    const oee = 89;
    const availability = 92;
    const performance = 88;
    const quality = 95;
    const chartData = [{ value: oee }];

    return (
        <AppLayout breadcrumbs={breadcrumbs.dashboard}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="">
                            <CardHeader>
                                <CardTitle>Overall Equipment Effectiveness</CardTitle>
                                <CardDescription>Equipment Effectiveness Metric</CardDescription>
                            </CardHeader>
                            <CardContent className="relative grid auto-rows-min gap-4 md:grid-cols-4">
                                <HalfRadialChart label="Overall" chartData={chartData} value={oee} className="" />
                                <HalfRadialChart label="Availability" chartData={chartData} value={availability} />
                                <HalfRadialChart label="Performance" chartData={chartData} value={performance} />
                                <HalfRadialChart label="Quality" chartData={chartData} value={quality} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <TotalProductionGraph />
                <div className="grid gap-4 overflow-hidden rounded-xl md:grid-cols-2 dark:border-sidebar-border">
                    <div className="space-y-4">
                        <Card>
                            <MachineStatus />
                        </Card>
                        <Card>
                            <QualityTrend />
                        </Card>

                        <Card>
                            <TopIssues />
                        </Card>
                    </div>
                    <AdvancedParetoChart />
                </div>
            </div>
        </AppLayout>
    );
}

const HalfRadialChart = ({
    label,
    value,
    chartData,
    ...props
}: React.ComponentProps<'div'> & { label: string; value: number; chartData: any[] | undefined }) => {
    return (
        <div className="relative h-[115px] w-full overflow-hidden">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square w-[200px]" {...props}>
                <RadialBarChart data={chartData} startAngle={180} endAngle={0} innerRadius={80} outerRadius={130}>
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                            content={({ viewBox }) => {
                                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                    return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 16} className="fill-foreground text-2xl font-bold">
                                                {value + '%'}
                                            </tspan>
                                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 4} className="fill-muted-foreground">
                                                {label}
                                            </tspan>
                                        </text>
                                    );
                                }
                            }}
                        />
                    </PolarRadiusAxis>
                    <PolarAngleAxis type="number" angleAxisId={0} tick={false} domain={[0, 100]} />
                    <RadialBar
                        dataKey="value"
                        stackId="a"
                        cornerRadius={5}
                        fill="var(--chart-1)"
                        className="stroke-transparent stroke-2"
                        background
                    />
                </RadialBarChart>
            </ChartContainer>
        </div>
    );
};
