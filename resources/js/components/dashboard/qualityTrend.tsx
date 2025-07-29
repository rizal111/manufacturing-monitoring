'use client';

import { Badge } from '@/components/ui/badge';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

export function QualityTrend() {
    const data = [{ value: 98.5 }, { value: 98.2 }, { value: 97.8 }, { value: 98.0 }, { value: 98.3 }, { value: 98.7 }, { value: 99.1 }];

    const currentQuality = data[data.length - 1].value;
    const trend = currentQuality > data[0].value ? 'up' : 'down';

    return (
        <>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Quality Rate</CardTitle>
                    <Badge variant={currentQuality >= 98 ? 'default' : 'destructive'}>{currentQuality}%</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <Line type="monotone" dataKey="value" stroke={currentQuality >= 98 ? '#10b981' : '#ef4444'} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>7-day trend</span>
                    <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                        {trend === 'up' ? '↑' : '↓'} {Math.abs(currentQuality - data[0].value).toFixed(1)}%
                    </span>
                </div>
            </CardContent>
        </>
    );
}
