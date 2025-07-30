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
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Copy, Edit, Eye, MoreVertical, Plus, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { ProductionLine } from '../../types/production';

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

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingLine, setDeletingLine] = useState<ProductionLine | null>(null);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        router.get(
            window.location.pathname,
            { search: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleCreate = () => {
        router.visit('/production-lines/create');
    };

    const handleEdit = (line: ProductionLine) => {
        router.visit(`/production-lines/${line.id}/edit`);
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
                <Button onClick={handleCreate}>
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

            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search production lines..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Machines</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map((line: ProductionLine) => (
                                        <TableRow key={line.id}>
                                            <TableCell>
                                                <span className="font-medium">{line.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground">{line.code}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(line.status)}>{line.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{line.machines_count || line.machines?.length || 0}</TableCell>
                                            <TableCell>
                                                <span className="block max-w-[200px] truncate text-muted-foreground">{line.description || '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleView(line)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>View</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {lines.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-12 text-center">
                                                <p className="text-muted-foreground">No production lines found</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination - only show if we have pagination data */}
                        {productionLines.last_page && productionLines.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {lines.length} of {productionLines.total} production lines
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(`${window.location.pathname}?page=${productionLines.current_page - 1}`)}
                                        disabled={productionLines.current_page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(`${window.location.pathname}?page=${productionLines.current_page + 1}`)}
                                        disabled={productionLines.current_page === productionLines.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

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
        </div>
    );
};

export default ProductionLinesList;
