import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { breadcrumbConfig } from '@/config/breadcrumbs';
import AppLayout from '@/layouts/app-layout';
import { Machine } from '@/types/production';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface MachinePageProps {
    machine: Machine;
}

export default function MachinePage({ machine }: MachinePageProps) {
    const breadcrumbs = [...breadcrumbConfig.machines.index, { title: machine.name }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Machine - ${machine.name}`} />

            <div className="container mx-auto py-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/machines">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{machine.name}</h1>
                            <p className="text-muted-foreground">Code: {machine.code}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Machine Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <Badge>{machine.status}</Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Production Line</p>
                                <p>{machine.production_line?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ideal Cycle Time</p>
                                <p>{machine.ideal_cycle_time} seconds</p>
                            </div>
                            {machine.description && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                                    <p>{machine.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add more cards for statistics, maintenance history, etc. */}
                </div>
            </div>
        </AppLayout>
    );
}
