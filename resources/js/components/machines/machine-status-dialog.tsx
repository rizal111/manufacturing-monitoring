// components/Machines/MachineStatusDialog.tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';
import { Machine } from '../../types/production';

interface MachineStatusDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (
        status: string,
        data?: {
            reason?: string;
            description?: string;
            category?: string;
            is_planned?: boolean;
            status?: string;
        },
    ) => void;
    machine: Machine | null;
}

const MachineStatusDialog: React.FC<MachineStatusDialogProps> = ({ open, onClose, machine }) => {
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isPlanned, setIsPlanned] = useState(false);

    const handleSubmit = async () => {
        if (!machine) return;

        // try {
        //     setLoading(true);
        //     setError(null);

        //     const data: any = { status };

        //     if (status === 'maintenance' || status === 'breakdown') {
        //         data.reason = reason;
        //         data.description = description;
        //         data.category = category;
        //         data.is_planned = isPlanned;
        //     }

        //     const response = await productionApi.updateMachineStatus(machine.id, data);

        //     if (response.success) {
        //         onSave(status, data);
        //         handleClose();
        //     }
        // } catch (err: any) {
        //     setError(err.response?.data?.message || 'Failed to update machine status');
        // } finally {
        //     setLoading(false);
        // }
    };

    const handleClose = () => {
        setStatus('');
        setReason('');
        setDescription('');
        setCategory('');
        setIsPlanned(false);
        setError(null);
        onClose();
    };

    const requiresDowntimeInfo = status === 'maintenance' || status === 'breakdown';

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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Machine Status</DialogTitle>
                    <DialogDescription>Change the operational status of the machine.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {machine && (
                        <>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Machine: <span className="font-medium text-foreground">{machine.name}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Current Status:</span>
                                    <Badge variant={getStatusVariant(machine.status)}>{machine.status}</Badge>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <Label>New Status</Label>
                        <RadioGroup value={status} onValueChange={setStatus}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="running" id="running" />
                                <Label htmlFor="running" className="cursor-pointer font-normal">
                                    Running
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="idle" id="idle" />
                                <Label htmlFor="idle" className="cursor-pointer font-normal">
                                    Idle
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="maintenance" id="maintenance" />
                                <Label htmlFor="maintenance" className="cursor-pointer font-normal">
                                    Maintenance
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="breakdown" id="breakdown" />
                                <Label htmlFor="breakdown" className="cursor-pointer font-normal">
                                    Breakdown
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {requiresDowntimeInfo && (
                        <>
                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mechanical">Mechanical</SelectItem>
                                        <SelectItem value="electrical">Electrical</SelectItem>
                                        <SelectItem value="software">Software</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Select value={reason} onValueChange={setReason}>
                                    <SelectTrigger id="reason">
                                        <SelectValue placeholder="Select a reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {status === 'maintenance' ? (
                                            <>
                                                <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                                                <SelectItem value="corrective">Corrective Maintenance</SelectItem>
                                                <SelectItem value="inspection">Inspection</SelectItem>
                                                <SelectItem value="calibration">Calibration</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="component_failure">Component Failure</SelectItem>
                                                <SelectItem value="overheating">Overheating</SelectItem>
                                                <SelectItem value="power_issue">Power Issue</SelectItem>
                                                <SelectItem value="operator_error">Operator Error</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide additional details..."
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch id="planned" checked={isPlanned} onCheckedChange={setIsPlanned} />
                                <Label htmlFor="planned" className="cursor-pointer">
                                    Was this {status} planned?
                                </Label>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={!status}>
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MachineStatusDialog;
