'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Wrench } from 'lucide-react';

export function TopIssues() {
    const issues = [
        { type: 'Machine Stop', count: 5, duration: '45 min', icon: AlertCircle, color: 'text-red-500' },
        { type: 'Material Wait', count: 3, duration: '30 min', icon: Clock, color: 'text-orange-500' },
        { type: 'Tool Change', count: 8, duration: '20 min', icon: Wrench, color: 'text-blue-500' },
    ];

    return (
        <>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Issues Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {issues.map((issue, index) => {
                    const Icon = issue.icon;
                    return (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${issue.color}`} />
                                <span className="text-sm">{issue.type}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-medium">{issue.count}x</span>
                                <span className="ml-2 text-xs text-muted-foreground">{issue.duration}</span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </>
    );
}
