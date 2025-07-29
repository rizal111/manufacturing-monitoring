'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Sample data for downtime causes
const rawData = [
    { cause: 'Machine Failure', downtime: 120 },
    { cause: 'Material Shortage', downtime: 80 },
    { cause: 'Operator Error', downtime: 60 },
    { cause: 'Maintenance', downtime: 45 },
    { cause: 'Power Outage', downtime: 30 },
    { cause: 'Quality Issues', downtime: 25 },
    { cause: 'Setup Time', downtime: 20 },
    { cause: 'Other', downtime: 15 },
];

// Process data to add cumulative percentage
const processData = (data: typeof rawData) => {
    // Sort by downtime descending
    const sorted = [...data].sort((a, b) => b.downtime - a.downtime);

    // Calculate total and cumulative percentage
    const total = sorted.reduce((sum, item) => sum + item.downtime, 0);
    let cumulative = 0;

    return sorted.map((item, index) => {
        cumulative += item.downtime;
        const cumulativePercentage = (cumulative / total) * 100;

        return {
            ...item,
            index: index + 1,
            percentage: ((item.downtime / total) * 100).toFixed(1),
            cumulativePercentage: cumulativePercentage.toFixed(1),
            cumulativePercentageNum: cumulativePercentage,
        };
    });
};

const chartConfig = {
    downtime: {
        label: 'Downtime',
        color: 'var(--chart-1)',
    },
    cumulativePercentage: {
        label: 'Cumulative %',
        color: 'var(--chart-5)',
    },
} satisfies ChartConfig;

export function AdvancedParetoChart() {
    const data = processData(rawData);
    const [showReferenceLine, setShowReferenceLine] = useState(true);

    // Find where cumulative percentage crosses 80%
    const eightyPercentIndex = data.findIndex((item) => parseFloat(item.cumulativePercentage) >= 80);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Downtime Pareto Analysis</CardTitle>
                    <CardDescription>Identifying the vital few causes that contribute to 80% of downtime</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setShowReferenceLine(!showReferenceLine)}>
                        {showReferenceLine ? 'Hide' : 'Show'} 80% Line
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        {eightyPercentIndex >= 0 && `First ${eightyPercentIndex + 1} causes account for 80% of total downtime`}
                    </div>
                </div>

                <ChartContainer config={chartConfig} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid vertical={false} />

                            {/* X Axis */}
                            <XAxis
                                dataKey="cause"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                interval={0}
                                tick={{ fontSize: 12 }}
                                className="text-xs"
                            />

                            {/* Left Y Axis - Downtime */}
                            <YAxis
                                yAxisId="left"
                                orientation="left"
                                label={{
                                    value: 'Downtime (hours)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { textAnchor: 'middle', fontSize: 14 },
                                }}
                                tick={{ fontSize: 12 }}
                            />

                            {/* Right Y Axis - Percentage */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                ticks={[0, 20, 40, 60, 80, 100]}
                                label={{
                                    value: 'Cumulative Percentage (%)',
                                    angle: 90,
                                    position: 'insideRight',
                                    style: { textAnchor: 'middle', fontSize: 14 },
                                }}
                                tick={{ fontSize: 12 }}
                            />

                            {/* 80% Reference Line */}
                            {showReferenceLine && (
                                <ReferenceLine
                                    yAxisId="right"
                                    y={80}
                                    stroke="var(--destructive)"
                                    strokeDasharray="5 5"
                                    label={{
                                        position: 'right',
                                        style: { fill: 'var(--destructive)', fontSize: 12 },
                                    }}
                                />
                            )}

                            <ChartTooltip content={<ChartTooltipContent />} />

                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />

                            {/* Bars for downtime */}
                            <Bar yAxisId="left" dataKey="downtime" fill="var(--color-downtime)" radius={4} />

                            {/* Line for cumulative percentage */}
                            <Line
                                yAxisId="right"
                                type="natural"
                                dataKey="cumulativePercentage"
                                stroke="var(--color-cumulativePercentage)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--color-cumulativePercentage)' }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Total Downtime</div>
                        <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.downtime, 0)} hours</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Top Cause</div>
                        <div className="text-2xl font-bold">{data[0]?.cause}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Top Cause Impact</div>
                        <div className="text-2xl font-bold">{data[0]?.percentage}%</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
