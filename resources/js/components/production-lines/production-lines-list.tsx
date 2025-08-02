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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Copy, Edit, Eye, MoreVertical, Plus, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { ProductionLine } from '../../types/production';
import ProductionLineDialog from './production-line-dialog';

interface ProductionLinesListProps {
    productionLines?: {
        data: ProductionLine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
        status?: string;
        is_active?: boolean;
    };
}

const ProductionLinesList: React.FC<ProductionLinesListProps> = ({ productionLines: propProductionLines, filters: propFilters }) => {
    const { props } = usePage<any>();

    // Use props from page or component props
    const productionLines = propProductionLines || props.productionLines;
    const filters = propFilters || props.filters || {};
    const flash = props.flash || {};

    const [ProductionLineDialogOpen, setProductionLineDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingLine, setDeletingLine] = useState<ProductionLine | null>(null);

    const handleSearch = (value: string) => {
        // setSearchTerm(value);
        // router.get(
        //     window.location.pathname,
        //     { search: value },
        //     {
        //         preserveState: true,
        //         preserveScroll: true,
        //     },
        // );
    };

    const handleEdit = (line: ProductionLine) => {
        // router.visit(`/production-lines/${line.id}/edit`);
    };

    const handleDelete = () => {
        if (!deletingLine) return;

        router.delete(`/production-lines/${deletingLine.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeletingLine(null);
            },
            onError: () => {
                // Error will be handled by flash messages
            },
        });
    };

    const handleView = (line: ProductionLine) => {
        router.visit(`/production-lines/${line.id}`);
    };

    const handleDuplicate = (line: ProductionLine) => {
        // Create a new production line with copied data
        router.post('/production-lines', {
            name: `${line.name} (Copy)`,
            code: `${line.code}-COPY`,
            description: line.description,
        });
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'running':
                return 'default';
            case 'idle':
                return 'secondary';
            case 'maintenance':
                return 'outline';
            case 'stopped':
                return 'destructive';
            default:
                return 'default';
        }
    };

    // Handle loading state
    if (!productionLines) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Loading production lines...</p>
            </div>
        );
    }

    const lines = Array.isArray(productionLines) ? productionLines : productionLines.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Production Lines</h1>
                <Button onClick={setProductionLineDialogOpen.bind(null, true)} className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Production Line
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
            <div className="relative">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search production lines..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} className="pl-8" />
            </div>

            {lines.map((line: ProductionLine) => (
                <Card key={line.id} className="mb-4">
                    <CardHeader>
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <CardTitle className="font-medium">
                                    <span className="text-muted-foreground">{line.code}</span>
                                    <span className="px-2">-</span>
                                    {line.name}
                                </CardTitle>
                                <Badge variant={getStatusVariant(line.status)}>{line.status}</Badge>
                            </div>

                            <div className="flex justify-end gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleView(line)} className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <div inert={false}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(line)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicate(line)}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setDeletingLine(line);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                        <CardDescription>{line.description || '-'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            {/* <div className="mt-2">
                                <span className="font-semibold">Machines Count: </span>
                                {line.machines_count || (line.machines ? line.machines.length : 0)}
                            </div> */}
                            <div className="mt-2">
                                <span className="font-semibold">
                                    {' '}
                                    {line.machines_count || (line.machines ? line.machines.length + ' ' : '0 ')} Machines:{' '}
                                </span>
                                {line.machines ? (
                                    Array.isArray(line.machines) && line.machines.length > 0 ? (
                                        <ul className="ml-4 list-disc">
                                            {line.machines.map((machine: any) => (
                                                <li key={machine.id} className="text-muted-foreground">
                                                    {machine.name || machine.code || 'Unnamed Machine'}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-muted-foreground">No machines</span>
                                    )
                                ) : (
                                    'No machines available'
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Production Line</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingLine?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingLine(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ProductionLineDialog
                open={ProductionLineDialogOpen}
                line={null}
                onClose={() => setProductionLineDialogOpen(false)}
                onSave={() => setProductionLineDialogOpen(false)}
            />
        </div>
    );
};

export default ProductionLinesList;
