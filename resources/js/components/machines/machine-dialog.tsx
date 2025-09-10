import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTypedForm } from '@/hooks/use-typed';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CreateMachineData, Machine, ProductionLine } from '../../types/production';

interface MachineDialogProps {
    open: boolean;
    onClose: () => void;
    machine?: Machine | null;
    productionLines: ProductionLine[];
}

const MachineDialog: React.FC<MachineDialogProps> = ({ open, onClose, machine, productionLines }) => {
    const [error, setError] = useState<string | null>(null);

    const { data, setData, post, patch, processing } = useTypedForm<CreateMachineData>({
        production_line_id: 0,
        name: '',
        code: '',
        description: '',
        status: 'idle',
        ideal_cycle_time: 60,
    });

    useEffect(() => {
        if (machine) {
            setData({
                production_line_id: machine.production_line_id,
                name: machine.name,
                code: machine.code,
                status: machine.status,
                description: machine.description || '',
                ideal_cycle_time: machine.ideal_cycle_time,
            });
        } else {
            setData({
                production_line_id: productionLines[0]?.id || 0,
                name: '',
                code: '',
                status: 'idle',
                description: '',
                ideal_cycle_time: 60,
            });
        }
    }, [machine, productionLines, setData]);

    const handleInputChange = <K extends keyof CreateMachineData>(field: K, value: CreateMachineData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (machine) {
            patch(route('machines.update', machine.id), {
                onError: (error) => {
                    setError(error.error || 'Failed to update machine');
                },
            });
        } else {
            post(route('machines.store'), {
                onSuccess: () => {
                    handleClose();
                },
                onError: (error) => {
                    setError(error.error || 'Failed to create machine');
                },
            });
        }
    };

    const handleClose = () => {
        setData({
            production_line_id: 0,
            name: '',
            code: '',
            description: '',
            status: 'idle',
            ideal_cycle_time: 60,
        });
        setError(null);
        onClose();
    };

    const isFormValid = data.name && data.code && (data.production_line_id ?? 0) > 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{machine ? 'Edit Machine' : 'Create Machine'}</DialogTitle>
                    <DialogDescription>
                        {machine ? 'Update the machine details below.' : 'Add a new machine to your production line.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="production-line" className="text-sm font-medium">
                            Production Line <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={(data.production_line_id ?? 0).toString()}
                            onValueChange={(value) => handleInputChange('production_line_id', parseInt(value))}
                        >
                            <SelectTrigger id="production-line">
                                <SelectValue placeholder="Select a production line" />
                            </SelectTrigger>
                            <SelectContent>
                                {productionLines.map((line) => (
                                    <SelectItem key={line.id} value={line.id.toString()}>
                                        {line.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Machine Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., Injection Molding Machine 1"
                        />
                        <p className="text-xs text-muted-foreground">Enter a descriptive name for the machine</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="code" className="text-sm font-medium">
                            Machine Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                            placeholder="e.g., AL-A-M1"
                        />
                        <p className="text-xs text-muted-foreground">Unique identifier (e.g., AL-A-M1)</p>
                    </div>
                    <div className="space-y-3">
                        <Label>Status</Label>
                        <RadioGroup
                            value={data.status}
                            onValueChange={(value) => handleInputChange('status', value as CreateMachineData['status'])}
                            className="grid grid-cols-2 gap-2"
                        >
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

                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Additional details about the machine..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cycle-time" className="text-sm font-medium">
                            Ideal Cycle Time (seconds) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="cycle-time"
                            type="number"
                            value={data.ideal_cycle_time}
                            onChange={(e) => handleInputChange('ideal_cycle_time', parseInt(e.target.value) || 1)}
                            min={1}
                            max={3600}
                            placeholder="60"
                        />
                        <p className="text-xs text-muted-foreground">Expected time to produce one unit</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={processing || !isFormValid}>
                        {processing ? 'Saving...' : machine ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MachineDialog;
