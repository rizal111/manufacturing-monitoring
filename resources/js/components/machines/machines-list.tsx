import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Edit, Eye, Pause, Play, Plus, Search, Trash2, Wrench } from 'lucide-react';
import React, { useState } from 'react';
import { Machine, ProductionLine } from '../../types/production';
// import MachineStatusDialog from './machine-status-dialog';

interface MachinesListProps {
    machines?: {
        data: Machine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    productionLines?: ProductionLine[];
    filters?: {
        search?: string;
        line_id?: string;
        status?: string;
    };
}

const MachinesList: React.FC<MachinesListProps> = ({ machines: propMachines, productionLines: propProductionLines, filters: propFilters }) => {
    const { props } = usePage<any>();

    // Use props from page or component props
    const machines = propMachines || props.machines;
    const productionLines = propProductionLines || props.productionLines || [];
    const filters = propFilters || props.filters || {};
    const flash = props.flash || {};

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [filterLineId, setFilterLineId] = useState(filters.line_id || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

    const handleFilter = (key: string, value: string) => {
        const newFilters: any = {
            ...filters,
            [key]: value || undefined,
        };

        // Update local state
        if (key === 'search') setSearchTerm(value);
        if (key === 'line_id') setFilterLineId(value);
        if (key === 'status') setFilterStatus(value);

        // Apply filters
        router.get(window.location.pathname, newFilters, {
            preserveState: true,
            preserveScroll: true,
            only: ['machines', 'filters'],
        });
    };

    const handleCreate = () => {
        router.visit('/machines/create');
    };

    const handleEdit = (machine: Machine) => {
        router.visit(`/machines/${machine.id}/edit`);
    };

    const handleStatusUpdate = (machine: Machine) => {
        setSelectedMachine(machine);
        setStatusDialogOpen(true);
    };

    const handleStatusSave = (status: string, data?: any) => {
        if (!selectedMachine) return;

        router.patch(
            `/machines/${selectedMachine.id}/status`,
            {
                status,
                ...data,
            },
            {
                onSuccess: () => {
                    setStatusDialogOpen(false);
                    setSelectedMachine(null);
                },
            },
        );
    };

    const handleDelete = () => {
        if (!deletingMachine) return;

        router.delete(`/machines/${deletingMachine.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingMachine(null);
            },
        });
    };

    const handleView = (machine: Machine) => {
        router.visit(`/machines/${machine.id}`);
    };

    const getStatusIcon = (status: string) => {
        const iconClass = 'h-4 w-4';
        switch (status) {
            case 'running':
                return <Play className={`${iconClass} text-green-600`} />;
            case 'idle':
                return <Pause className={`${iconClass} text-yellow-600`} />;
            case 'maintenance':
                return <Wrench className={`${iconClass} text-blue-600`} />;
            case 'breakdown':
                return <AlertCircle className={`${iconClass} text-red-600`} />;
            default:
                return null;
        }
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'running':
                return 'default';
            case 'idle':
                return 'secondary';
            case 'maintenance':
                return 'outline';
            case 'breakdown':
                return 'destructive';
            default:
                return 'default';
        }
    };

    if (!machines) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Loading machines...</p>
            </div>
        );
    }

    const machineList = Array.isArray(machines) ? machines : machines.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Machine
                </Button>
            </div>

            {flash?.error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{flash.error}</AlertDescription>
                </Alert>
            )}

            {flash?.success && (
                <Alert>
                    <AlertDescription>{flash.success}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Search and filter machines</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search machines..."
                                value={searchTerm}
                                onChange={(e) => handleFilter('search', e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <Select value={filterLineId} onValueChange={(value) => handleFilter('line_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Production Lines" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* <SelectItem value="">All Lines</SelectItem>
                                {productionLines.map((line: ProductionLine) => (
                                    <SelectItem key={line.id} value={line.id.toString()}>
                                        {line.name}
                                    </SelectItem>
                                ))} */}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={(value) => handleFilter('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* <SelectItem value="">All Statuses</SelectItem>
                                <SelectItem value="running">Running</SelectItem>
                                <SelectItem value="idle">Idle</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="breakdown">Breakdown</SelectItem> */}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Machine</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Production Line</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Cycle Time (s)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {machineList.map((machine: Machine) => (
                                    <TableRow key={machine.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(machine.status)}
                                                <span className="font-medium">{machine.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">{machine.code}</span>
                                        </TableCell>
                                        <TableCell>{machine.production_line?.name || machine.production_line?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(machine.status)}
                                                className="cursor-pointer"
                                                onClick={() => handleStatusUpdate(machine)}
                                            >
                                                {machine.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{machine.ideal_cycle_time}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleView(machine)}
                                                                className="h-8 w-8"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View Details</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(machine)}
                                                                className="h-8 w-8"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setDeletingMachine(machine);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                className="h-8 w-8 hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {machineList.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center">
                                            <p className="text-muted-foreground">No machines found</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {machines.last_page && machines.last_page > 1 && (
                        <div className="flex items-center justify-between p-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {machineList.length} of {machines.total} machines
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(`${window.location.pathname}?page=${machines.current_page - 1}`)}
                                    disabled={machines.current_page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.get(`${window.location.pathname}?page=${machines.current_page + 1}`)}
                                    disabled={machines.current_page === machines.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* 
            <MachineStatusDialog
                open={statusDialogOpen}
                onClose={() => {
                    setStatusDialogOpen(false);
                    setSelectedMachine(null);
                }}
                onSave={handleStatusSave}
                machine={selectedMachine}
            /> */}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Machine</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingMachine?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingMachine(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MachinesList;
