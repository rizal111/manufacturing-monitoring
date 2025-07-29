'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MachineStatus() {
    const machines = [
        { id: 'M1', status: 'running', efficiency: 95 },
        { id: 'M2', status: 'running', efficiency: 88 },
        { id: 'M3', status: 'idle', efficiency: 0 },
        { id: 'M4', status: 'maintenance', efficiency: 0 },
        { id: 'M5', status: 'running', efficiency: 92 },
        { id: 'M6', status: 'running', efficiency: 97 },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-green-500';
            case 'idle':
                return 'bg-yellow-500';
            case 'maintenance':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Machine Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-2">
                    {machines.map((machine) => (
                        <div key={machine.id} className="relative rounded-lg border p-3 text-center">
                            <div className={`absolute top-1 right-1 h-2 w-2 rounded-full ${getStatusColor(machine.status)}`} />
                            <div className="text-sm font-medium">{machine.id}</div>
                            {machine.status === 'running' && <div className="text-xs text-muted-foreground">{machine.efficiency}%</div>}
                            {machine.status !== 'running' && <div className="text-xs text-muted-foreground capitalize">{machine.status}</div>}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Running: 4
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Idle: 1
                    </span>
                </div>
            </CardContent>
        </>
    );
}
