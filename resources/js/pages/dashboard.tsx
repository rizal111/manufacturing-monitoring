import { Head } from '@inertiajs/react';
import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import { type BreadcrumbItem } from '@/types';

import { AdvancedParetoChart } from '../components/dashboard/advancedParetoChart';
import { TotalProductionGraph } from '../components/dashboard/productionTotal';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import AppLayout from '@/layouts/app-layout';
import { MachineStatus } from '../components/dashboard/machineStatus';
import { QualityTrend } from '../components/dashboard/qualityTrend';
import { TopIssues } from '../components/dashboard/topIssues';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const chartConfig = {
    oee: {},
} satisfies ChartConfig;

const prodTrendChartConfig = {
    total_produced: {
        label: 'Produced',
        color: 'var(--chart-1)',
    },
    total_rejected: {
        label: 'Rejected',
        color: 'var(--chart-5)',
    },
} satisfies ChartConfig;

const getShift: { [key: number]: string } = {
    0: 'Morning',
    8: 'Afternoon',
    16: 'Night',
};

const dashboardData = {
    success: true,
    data: {
        overview: {
            total_machines: 15,
            running_machines: 9,
            idle_machines: 4,
            maintenance_machines: 1,
            breakdown_machines: 1,
            utilization_rate: 60.0,
        },
        oee: {
            oee: 82.5,
            availability: 90.2,
            performance: 95.3,
            quality: 96.1,
            details: {
                planned_production_time: 57600,
                run_time: 51984,
                downtime: 5616,
                total_produced: 4850,
                good_parts: 4662,
                rejected_parts: 188,
            },
        },
        production: {
            trends: [
                {
                    period: '2025-07-01 00:00:00',
                    total_produced: 650,
                    total_rejected: 12,
                    machines_used: 8,
                    avg_cycle_time: 62.5,
                    efficiency: 98.15,
                },
                {
                    period: '2025-07-01 08:00:00',
                    total_produced: 780,
                    total_rejected: 18,
                    machines_used: 9,
                    avg_cycle_time: 58.3,
                    efficiency: 97.69,
                },
                {
                    period: '2025-07-01 16:00:00',
                    total_produced: 720,
                    total_rejected: 22,
                    machines_used: 9,
                    avg_cycle_time: 61.2,
                    efficiency: 96.94,
                },
                {
                    period: '2025-07-02 00:00:00',
                    total_produced: 580,
                    total_rejected: 15,
                    machines_used: 7,
                    avg_cycle_time: 64.8,
                    efficiency: 97.41,
                },
                {
                    period: '2025-07-02 08:00:00',
                    total_produced: 820,
                    total_rejected: 25,
                    machines_used: 10,
                    avg_cycle_time: 57.9,
                    efficiency: 96.95,
                },
                {
                    period: '2025-07-02 16:00:00',
                    total_produced: 790,
                    total_rejected: 20,
                    machines_used: 9,
                    avg_cycle_time: 59.7,
                    efficiency: 97.47,
                },
                {
                    period: '2025-07-03 00:00:00',
                    total_produced: 510,
                    total_rejected: 8,
                    machines_used: 6,
                    avg_cycle_time: 66.2,
                    efficiency: 98.43,
                },
            ],
            machine_comparison: [
                {
                    id: 1,
                    name: 'Assembly Line A - Machine 1',
                    code: 'AL-A-M1',
                    total_produced: 1250,
                    total_rejected: 28,
                    avg_cycle_time: 58.5,
                    production_runs: 42,
                    efficiency: 97.76,
                    current_status: 'running',
                    status_duration: 7200,
                },
                {
                    id: 2,
                    name: 'Assembly Line A - Machine 2',
                    code: 'AL-A-M2',
                    total_produced: 1180,
                    total_rejected: 35,
                    avg_cycle_time: 61.2,
                    production_runs: 40,
                    efficiency: 97.03,
                    current_status: 'running',
                    status_duration: 5400,
                },
                {
                    id: 3,
                    name: 'Assembly Line A - Machine 3',
                    code: 'AL-A-M3',
                    total_produced: 980,
                    total_rejected: 42,
                    avg_cycle_time: 63.8,
                    production_runs: 38,
                    efficiency: 95.71,
                    current_status: 'idle',
                    status_duration: 1800,
                },
                {
                    id: 4,
                    name: 'Assembly Line B - Machine 1',
                    code: 'AL-B-M1',
                    total_produced: 920,
                    total_rejected: 18,
                    avg_cycle_time: 59.9,
                    production_runs: 35,
                    efficiency: 98.04,
                    current_status: 'running',
                    status_duration: 10800,
                },
                {
                    id: 5,
                    name: 'Assembly Line B - Machine 2',
                    code: 'AL-B-M2',
                    total_produced: 850,
                    total_rejected: 22,
                    avg_cycle_time: 64.5,
                    production_runs: 32,
                    efficiency: 97.41,
                    current_status: 'maintenance',
                    status_duration: 3600,
                },
            ],
            total_production: 4850,
            total_rejected: 158,
            average_efficiency: 97.39,
        },
        downtime: {
            pareto: {
                data: [
                    {
                        reason: 'Material shortage',
                        category: 'material',
                        frequency: 15,
                        total_duration: 18000,
                        avg_duration: 1200,
                        percentage: 32.14,
                        cumulative_percentage: 32.14,
                    },
                    {
                        reason: 'Mechanical failure',
                        category: 'mechanical',
                        frequency: 8,
                        total_duration: 14400,
                        avg_duration: 1800,
                        percentage: 25.71,
                        cumulative_percentage: 57.85,
                    },
                    {
                        reason: 'Changeover',
                        category: 'changeover',
                        frequency: 12,
                        total_duration: 9600,
                        avg_duration: 800,
                        percentage: 17.14,
                        cumulative_percentage: 75.0,
                    },
                    {
                        reason: 'Operator break',
                        category: 'operator',
                        frequency: 20,
                        total_duration: 6000,
                        avg_duration: 300,
                        percentage: 10.71,
                        cumulative_percentage: 85.71,
                    },
                    {
                        reason: 'Electrical issue',
                        category: 'electrical',
                        frequency: 4,
                        total_duration: 4800,
                        avg_duration: 1200,
                        percentage: 8.57,
                        cumulative_percentage: 94.28,
                    },
                    {
                        reason: 'Quality inspection',
                        category: 'other',
                        frequency: 6,
                        total_duration: 3200,
                        avg_duration: 533,
                        percentage: 5.71,
                        cumulative_percentage: 100.0,
                    },
                ],
                total_downtime: 56000,
                period: 'day',
                start_date: '2025-01-03',
            },
            current_downtimes: [
                {
                    id: 45,
                    machine: {
                        id: 5,
                        name: 'Assembly Line B - Machine 2',
                        line: 'Assembly Line B',
                    },
                    reason: 'Scheduled maintenance',
                    category: 'maintenance',
                    started_at: '2025-01-03T14:30:00Z',
                    duration: 60,
                    is_planned: true,
                },
            ],
            category_stats: [
                {
                    category: 'material',
                    count: 15,
                    total_duration: 18000,
                    avg_duration: 1200,
                    min_duration: 300,
                    max_duration: 2400,
                    percentage: 32.14,
                },
                {
                    category: 'mechanical',
                    count: 8,
                    total_duration: 14400,
                    avg_duration: 1800,
                    min_duration: 600,
                    max_duration: 3600,
                    percentage: 25.71,
                },
                {
                    category: 'changeover',
                    count: 12,
                    total_duration: 9600,
                    avg_duration: 800,
                    min_duration: 600,
                    max_duration: 1200,
                    percentage: 17.14,
                },
                {
                    category: 'operator',
                    count: 20,
                    total_duration: 6000,
                    avg_duration: 300,
                    min_duration: 180,
                    max_duration: 600,
                    percentage: 10.71,
                },
                {
                    category: 'electrical',
                    count: 4,
                    total_duration: 4800,
                    avg_duration: 1200,
                    min_duration: 900,
                    max_duration: 1800,
                    percentage: 8.57,
                },
                {
                    category: 'other',
                    count: 6,
                    total_duration: 3200,
                    avg_duration: 533,
                    min_duration: 300,
                    max_duration: 900,
                    percentage: 5.71,
                },
            ],
            total_downtime_hours: 15.56,
        },
        schedule: {
            current_schedule: {
                id: 78,
                product_name: 'Product A',
                product_code: 'PRD-A',
                planned_quantity: 500,
                actual_quantity: 285,
                completion_percentage: 57.0,
                scheduled_start: '2025-01-03T06:00:00Z',
                scheduled_end: '2025-01-03T14:00:00Z',
                actual_start: '2025-01-03T06:15:00Z',
                time_elapsed: 495,
                time_remaining: -15,
            },
            upcoming_schedules: [
                {
                    id: 79,
                    product_name: 'Product B',
                    planned_quantity: 600,
                    scheduled_start: '2025-01-03T14:00:00Z',
                    scheduled_end: '2025-01-03T22:00:00Z',
                    shift: 'afternoon',
                },
                {
                    id: 80,
                    product_name: 'Product C',
                    planned_quantity: 450,
                    scheduled_start: '2025-01-03T22:00:00Z',
                    scheduled_end: '2025-01-04T06:00:00Z',
                    shift: 'night',
                },
                {
                    id: 81,
                    product_name: 'Product A',
                    planned_quantity: 550,
                    scheduled_start: '2025-01-04T06:00:00Z',
                    scheduled_end: '2025-01-04T14:00:00Z',
                    shift: 'morning',
                },
                {
                    id: 82,
                    product_name: 'Product B',
                    planned_quantity: 500,
                    scheduled_start: '2025-01-04T14:00:00Z',
                    scheduled_end: '2025-01-04T22:00:00Z',
                    shift: 'afternoon',
                },
                {
                    id: 83,
                    product_name: 'Product C',
                    planned_quantity: 480,
                    scheduled_start: '2025-01-04T22:00:00Z',
                    scheduled_end: '2025-01-05T06:00:00Z',
                    shift: 'night',
                },
            ],
            planned_vs_actual: {
                summary: {
                    total_schedules: 12,
                    completed: 7,
                    in_progress: 1,
                    pending: 4,
                    cancelled: 0,
                    total_planned_quantity: 5800,
                    total_actual_quantity: 4850,
                    achievement_rate: 83.62,
                },
                daily: [
                    {
                        date: '2025-01-01',
                        planned: 1800,
                        actual: 1650,
                        schedule_count: 3,
                    },
                    {
                        date: '2025-01-02',
                        planned: 2000,
                        actual: 1890,
                        schedule_count: 4,
                    },
                    {
                        date: '2025-01-03',
                        planned: 1500,
                        actual: 1025,
                        schedule_count: 3,
                    },
                ],
                period: 'day',
                start_date: '2025-01-03TMorningZ',
            },
            delayed_schedules: [
                {
                    id: 78,
                    product_name: 'Product A',
                    product_code: 'PRD-A',
                    line: 'Assembly Line A',
                    scheduled_end: '2025-01-03T14:00:00Z',
                    delay_hours: 0.25,
                    completion_percentage: 57.0,
                    remaining_quantity: 215,
                },
            ],
            delayed_count: 1,
        },
        real_time: {
            metrics: {
                line_status: 'running',
                machines_running: 9,
                machines_total: 15,
                utilization_rate: 60.0,
                last_hour_production: 320,
                current_shift: {
                    produced: 1025,
                    rejected: 28,
                    quality_rate: 97.27,
                    start_time: '2025-01-03T06:00:00Z',
                },
            },
            status: {
                line: {
                    id: 1,
                    name: 'Assembly Line A',
                    status: 'running',
                    total_machines: 5,
                    status_counts: {
                        running: 3,
                        idle: 1,
                        maintenance: 0,
                        breakdown: 1,
                    },
                    efficiency: 60.0,
                },
                machines: [
                    {
                        id: 1,
                        name: 'Assembly Line A - Machine 1',
                        code: 'AL-A-M1',
                        status: 'running',
                        status_duration: '2h 0m',
                        status_since: '2025-01-03T13:30:00Z',
                    },
                    {
                        id: 2,
                        name: 'Assembly Line A - Machine 2',
                        code: 'AL-A-M2',
                        status: 'running',
                        status_duration: '1h 30m',
                        status_since: '2025-01-03T14:00:00Z',
                    },
                    {
                        id: 3,
                        name: 'Assembly Line A - Machine 3',
                        code: 'AL-A-M3',
                        status: 'idle',
                        status_duration: '30m 0s',
                        status_since: '2025-01-03T15:00:00Z',
                    },
                    {
                        id: 4,
                        name: 'Assembly Line A - Machine 4',
                        code: 'AL-A-M4',
                        status: 'running',
                        status_duration: '3h 45m',
                        status_since: '2025-01-03T11:45:00Z',
                    },
                    {
                        id: 5,
                        name: 'Assembly Line A - Machine 5',
                        code: 'AL-A-M5',
                        status: 'breakdown',
                        status_duration: '45m 0s',
                        status_since: '2025-01-03T14:45:00Z',
                    },
                ],
                last_updated: '2025-01-03T15:30:00Z',
            },
        },
        period: 'day',
        timestamp: '2025-01-03T15:30:00Z',
        lines: [
            {
                id: 1,
                name: 'Assembly Line A',
                status: 'running',
                oee: 85.2,
                machines_running: 3,
                machines_total: 5,
                current_shift_production: 425,
            },
            {
                id: 2,
                name: 'Assembly Line B',
                status: 'running',
                oee: 78.8,
                machines_running: 4,
                machines_total: 5,
                current_shift_production: 380,
            },
            {
                id: 3,
                name: 'Packaging Line 1',
                status: 'idle',
                oee: 82.5,
                machines_running: 2,
                machines_total: 5,
                current_shift_production: 220,
            },
        ],
    },
};

export default function Dashboard() {
    const oee = 89;
    const availability = 92;
    const performance = 88;
    const quality = 95;
    const chartData = [{ value: oee }];

    const prodTrendChartData = dashboardData.data.production.trends;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="">
                            <CardHeader>
                                <CardTitle>OEE</CardTitle>
                            </CardHeader>
                            <CardContent className="relative grid auto-rows-min gap-4 md:grid-cols-4">
                                <HalfRadialChart label="Overall" chartData={chartData} value={oee} className="" />
                                <HalfRadialChart label="Availability" chartData={chartData} value={availability} />
                                <HalfRadialChart label="Performance" chartData={chartData} value={performance} />
                                <HalfRadialChart label="Quality" chartData={chartData} value={quality} />
                            </CardContent>
                        </Card>
                    </div>
                    {/* <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="flex flex-col">
                            <CardContent className="flex flex-1 items-center pb-0">
                                <HalfRadialChart label="Availability" chartData={chartData} value={oee} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="flex flex-col">
                            <CardContent className="flex flex-1 items-center pb-0">
                                <HalfRadialChart label="Performance" chartData={chartData} value={oee} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="flex flex-col">
                            <CardContent className="flex flex-1 items-center pb-0">
                                <HalfRadialChart label="Quality" chartData={chartData} value={oee} />
                            </CardContent>
                        </Card>
                    </div> */}
                </div>
                <TotalProductionGraph />
                <div className="grid gap-4 overflow-hidden rounded-xl md:grid-cols-2 dark:border-sidebar-border">
                    <Card>
                        <MachineStatus />
                        <QualityTrend />
                        <TopIssues />
                    </Card>
                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Production Total</CardTitle>
                       
                        </CardHeader>
                        <CardContent>
                            <ChartContainer className="h-[250px] w-full" config={prodTrendChartConfig}>
                                <LineChart
                                    accessibilityLayer
                                    data={prodTrendChartData}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return date.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            });
                                        }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                hideIndicator
                                                labelFormatter={(value) => {
                                                    const date = new Date(value);

                                                    const dateString = date.toLocaleDateString('ms-MY', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    });

                                                    const shift = getShift[date.getHours()];

                                                    return dateString + ' ' + shift;
                                                }}
                                            />
                                        }
                                    />
                                    <Line
                                        dataKey="total_produced"
                                        type="natural"
                                        stroke="var(--color-total_produced)"
                                        strokeWidth={2}
                                        dot={{
                                            fill: 'var(--total_produced)',
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                    />
                                    <Line
                                        dataKey="total_rejected"
                                        type="natural"
                                        stroke="var(--color-total_rejected)"
                                        strokeWidth={2}
                                        dot={{
                                            fill: 'var(--total_rejected)',
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2 text-sm">
                            <div className="flex gap-2 leading-none font-medium">
                                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground">Showing total visitors for the last 6 months</div>
                        </CardFooter>
                    </Card> */}
                    <AdvancedParetoChart />
                </div>
            </div>
        </AppLayout>
    );
}

const HalfRadialChart = ({
    className,
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
