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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Copy, Edit, Filter, MoreVertical, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
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

interface DropdownMenuAction {
    action: 'edit' | 'delete' | 'view' | 'duplicate' | '';
    data: Record<string, any>;
}

const ProductionLinesList: React.FC<ProductionLinesListProps> = ({ productionLines: propProductionLines, filters: propFilters }) => {
    const { props } = usePage<any>();

    // Use props from page or component props
    const productionLines = propProductionLines || props.productionLines;
    const filters = propFilters || props.filters || {};
    const flash = props.flash || {};

    const [ProductionLineDialogOpen, setProductionLineDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [activeFilter, setActiveFilter] = useState(filters.is_active || 'all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);
    const [deletingLine, setDeletingLine] = useState<ProductionLine | null>(null);
    const [dropdownMenuAction, setDropdownMenuAction] = useState<DropdownMenuAction>({ action: '', data: {} });

    // Debounce timer reference
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const applyFilters = useCallback((newFilters: Record<string, any>) => {
        // Build query parameters
        const queryParams: Record<string, any> = {};

        if (newFilters.search !== '') queryParams.search = newFilters.search;
        if (newFilters.status !== 'all') queryParams.status = newFilters.status;
        if (newFilters.is_active !== 'all') queryParams.is_active = newFilters.is_active;

        console.log('Applying filters:', queryParams);

        router.get(window.location.pathname, queryParams, {
            preserveState: true,
            preserveScroll: true,
            only: ['productionLines', 'filters'],
        });
    }, []);

    const handleSearch = (value: string) => {
        setSearchTerm(value);

        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout for debounced search
        const newTimeout = setTimeout(() => {
            applyFilters({
                search: value,
                status: statusFilter,
                is_active: activeFilter,
            });
        }, 300);

        setSearchTimeout(newTimeout);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        applyFilters({
            search: searchTerm,
            status: value,
            is_active: activeFilter,
        });
    };

    const handleActiveChange = (value: string) => {
        setActiveFilter(value);
        applyFilters({
            search: searchTerm,
            status: statusFilter,
            is_active: value,
        });
    };

    const clearFilters = () => {
        console.log(searchTerm);
        setSearchTerm('');
        setStatusFilter('all');
        setActiveFilter('all');

        router.get(
            window.location.pathname,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['productionLines', 'filters'],
            },
        );
    };

    const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || activeFilter !== 'all';

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

    const handleDuplicate = (line: ProductionLine) => {
        // Create a new production line with copied data
        router.post('/production-lines', {
            name: `${line.name} (Copy)`,
            code: `${line.code}-COPY`,
            description: line.description,
        });
    };

    const handleCloseComplete = () => {
        if (dropdownMenuAction.action === '') return;

        switch (dropdownMenuAction.action) {
            case 'delete':
                if (dropdownMenuAction.data) {
                    setDeletingLine(dropdownMenuAction.data as ProductionLine);
                    setDeleteDialogOpen(true);
                }
                break;
            case 'edit':
                if (dropdownMenuAction.data) {
                    setProductionLine(dropdownMenuAction.data as ProductionLine);
                    setProductionLineDialogOpen(true);
                }
        }
        setDropdownMenuAction({ action: '', data: {} });
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
            {/* Filter Section */}
            <div className="space-y-4">
                <div className="flex gap-2 sm:flex-row lg:grid-cols-4">
                    {/* Search Input */}
                    <div className="relative grow">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search production lines..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="w-[127px]">
                        <Select value={statusFilter} onValueChange={handleStatusChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="running">Running</SelectItem>
                                <SelectItem value="idle">Idle</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="stopped">Stopped</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Filter */}
                    <div className="w-[126px]">
                        <Select value={activeFilter} onValueChange={handleActiveChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Lines" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Lines</SelectItem>
                                <SelectItem value="true">Active Only</SelectItem>
                                <SelectItem value="false">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Filters Button */}
                    <Button variant="outline" disabled={!hasActiveFilters} onClick={clearFilters} className="flex items-center">
                        <X className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>

                {/* Active filters display */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span>Active filters:</span>
                        {searchTerm && (
                            <Badge variant="secondary" className="font-normal">
                                Search: {searchTerm}
                            </Badge>
                        )}
                        {statusFilter !== 'all' && (
                            <Badge variant="secondary" className="font-normal">
                                Status: {statusFilter}
                            </Badge>
                        )}
                        {activeFilter !== 'all' && (
                            <Badge variant="secondary" className="font-normal">
                                {activeFilter === 'true' ? 'Active Only' : 'Inactive Only'}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                Showing {lines.length} of {productionLines.total || lines.length} production lines
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
                                {/*  FIXME - When Dropmenu is used, opening alert dialog make ui not working. error : aria focus */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onCloseAutoFocus={handleCloseComplete}>
                                        <DropdownMenuItem onClick={() => setDropdownMenuAction({ action: 'edit', data: line })}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicate(line)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setDropdownMenuAction({ action: 'delete', data: line });
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
                        <CardDescription>{line.description || '-'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mt-2">
                                <span className="font-semibold">
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
                        <Button onClick={handleDelete} variant="destructive" asChild>
                            <AlertDialogAction asChild>
                                <button>Delete</button>
                            </AlertDialogAction>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ProductionLineDialog
                open={ProductionLineDialogOpen}
                line={productionLine}
                onClose={() => {
                    setProductionLineDialogOpen(false), setProductionLine(null);
                }}
                onSave={() => {
                    setProductionLineDialogOpen(false), setProductionLine(null);
                }}
            />
        </div>
    );
};

export default ProductionLinesList;
