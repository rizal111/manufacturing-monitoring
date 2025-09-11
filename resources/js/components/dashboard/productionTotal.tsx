'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

// Sample production data
const productionData = [
    {
        date: 'Jan',
        planned: 1000,
        actual: 950,
        efficiency: 95,
        downtime: 20,
        defects: 30,
    },
    {
        date: 'Feb',
        planned: 1100,
        actual: 1050,
        efficiency: 95.5,
        downtime: 25,
        defects: 35,
    },
    {
        date: 'Mar',
        planned: 1200,
        actual: 1080,
        efficiency: 90,
        downtime: 40,
        defects: 80,
    },
    {
        date: 'Apr',
        planned: 1150,
        actual: 1150,
        efficiency: 100,
        downtime: 10,
        defects: 20,
    },
    {
        date: 'May',
        planned: 1300,
        actual: 1170,
        efficiency: 90,
        downtime: 50,
        defects: 60,
    },
    {
        date: 'Jun',
        planned: 1400,
        actual: 1330,
        efficiency: 95,
        downtime: 30,
        defects: 40,
    },
    {
        date: 'Jul',
        planned: 1350,
        actual: 1350,
        efficiency: 100,
        downtime: 15,
        defects: 25,
    },
    {
        date: 'Aug',
        planned: 1500,
        actual: 1425,
        efficiency: 95,
        downtime: 35,
        defects: 45,
    },
    {
        date: 'Sep',
        planned: 1450,
        actual: 1450,
        efficiency: 100,
        downtime: 20,
        defects: 30,
    },
    {
        date: 'Oct',
        planned: 1600,
        actual: 1520,
        efficiency: 95,
        downtime: 40,
        defects: 50,
    },
    {
        date: 'Nov',
        planned: 1550,
        actual: 1480,
        efficiency: 95.5,
        downtime: 35,
        defects: 40,
    },
    {
        date: 'Dec',
        planned: 1700,
        actual: 1700,
        efficiency: 100,
        downtime: 25,
        defects: 35,
    },
];
const chartConfig = {
    planned: {
        label: 'Planned',
        color: 'var(--chart-1)',
    },
    actual: {
        label: 'Actual',
        color: 'var(--chart-2)',
    },
    efficiency: {
        label: 'Efficiency %',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

export function TotalProductionGraph() {
    // const [timeRange, setTimeRange] = useState('year');
    // const [chartType, setChartType] = useState('combined');

    // Calculate totals
    const totalPlanned = productionData.reduce((sum, item) => sum + item.planned, 0);
    const totalActual = productionData.reduce((sum, item) => sum + item.actual, 0);
    const averageEfficiency = (productionData.reduce((sum, item) => sum + item.efficiency, 0) / productionData.length).toFixed(1);
    const totalDowntime = productionData.reduce((sum, item) => sum + item.downtime, 0);

    // Calculate trend
    const trend = totalActual >= totalPlanned ? 'up' : 'down';
    const trendPercentage = ((totalActual / totalPlanned - 1) * 100).toFixed(1);

    return (
        <Card className="h-full w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Total Production Overview</CardTitle>
                        <CardDescription>Production performance metrics and trends</CardDescription>
                    </div>
                    {/* NOTE feature idea : chart type and year selection */}
                    {/* <div className="flex gap-2">
                        <Select value={chartType} onValueChange={setChartType}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="combined">Combined View</SelectItem>
                                <SelectItem value="production">Production Only</SelectItem>
                                <SelectItem value="efficiency">Efficiency Focus</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="year">Year</SelectItem>
                                <SelectItem value="quarter">Quarter</SelectItem>
                                <SelectItem value="month">Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div> */}
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-4 gap-4">
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Total Production</div>
                        <div className="text-2xl font-bold">{totalActual.toLocaleString()}</div>
                        <div className="flex items-center text-sm">
                            {trend === 'up' ? (
                                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>{trendPercentage}%</span>
                        </div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Target Achievement</div>
                        <div className="text-2xl font-bold">{((totalActual / totalPlanned) * 100).toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">vs {totalPlanned.toLocaleString()} planned</div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Avg Efficiency</div>
                        <div className="text-2xl font-bold">{averageEfficiency}%</div>
                        <div className="text-sm text-muted-foreground">OEE performance</div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground">Total Downtime</div>
                        <div className="text-2xl font-bold">{totalDowntime}h</div>
                        <div className="text-sm text-muted-foreground">Production loss</div>
                    </div>
                </div>

                {/* Main Chart */}
                <ChartContainer config={chartConfig} className="h-[450px] w-full">
                    <ComposedChart data={productionData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <defs>
                            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} />

                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />

                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            label={{
                                value: 'Production Units',
                                angle: -90,
                                position: 'insideLeft',
                                style: { textAnchor: 'middle', fontSize: 14 },
                            }}
                            tick={{ fontSize: 12 }}
                        />

                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 100]}
                            label={{
                                value: 'Efficiency (%)',
                                angle: 90,
                                position: 'insideRight',
                                style: { textAnchor: 'middle', fontSize: 14 },
                            }}
                            tick={{ fontSize: 12 }}
                        />

                        <ChartTooltip content={<ChartTooltipContent />} />

                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* Planned Production - Bar */}
                        <Bar yAxisId="left" dataKey="planned" fill="var(--chart-1)" name="Planned" radius={[4, 4, 0, 0]} />

                        {/* Actual Production - Area */}
                        <Area
                            yAxisId="left"
                            type="natural"
                            dataKey="actual"
                            fill="url(#actualGradient)"
                            stroke="var(--chart-2)"
                            strokeWidth={2}
                            name="Actual"
                        />

                        {/* Efficiency Line */}
                        <Line
                            yAxisId="right"
                            type="natural"
                            dataKey="efficiency"
                            stroke="var(--chart-3)"
                            strokeWidth={2}
                            dot={{ fill: 'var(--chart-3)' }}
                            name="Efficiency %"
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ChartContainer>

                {/* Additional Metrics */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Production by Quarter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Q1</span>
                                    <span className="text-sm font-medium">3,080 units</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Q2</span>
                                    <span className="text-sm font-medium">3,650 units</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Q3</span>
                                    <span className="text-sm font-medium">4,395 units</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Q4</span>
                                    <span className="text-sm font-medium">4,700 units</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Defect Rate Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Average Defects</span>
                                    <span className="text-sm font-medium">41.7 per month</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Defect Rate</span>
                                    <span className="text-sm font-medium">2.8%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Best Month</span>
                                    <span className="text-sm font-medium">April (1.7%)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Improvement</span>
                                    <span className="text-sm font-medium text-green-600">↓ 15% YoY</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}
