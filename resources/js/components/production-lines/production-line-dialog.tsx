import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useTypedForm } from '@/hooks/use-typed';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CreateMachineData, CreateProductionLineData, ProductionLine } from '../../types/production';
import { Card, CardContent } from '../ui/card';

interface ProductionLineDialogProps {
    open: boolean;
    onClose: () => void;
    line?: ProductionLine | null;
}

const ProductionLineDialog: React.FC<ProductionLineDialogProps> = ({ open, onClose, line }) => {
    const [activeStep, setActiveStep] = useState(0);

    const { data, setData, post, patch, processing } = useTypedForm<CreateProductionLineData>({
        name: '',
        code: '',
        description: '',
        machines: [],
    });
    const [error, setError] = useState<string | null>(null);
    const [isAddMachinesNow, setIsAddMachinesNow] = useState(false);

    useEffect(() => {
        if (line) {
            setData({
                name: line.name,
                code: line.code,
                description: line.description || '',
                machines: [],
            });
            setActiveStep(0);
        } else {
            setData({
                name: '',
                code: '',
                description: '',
                machines: [],
            });
        }
    }, [line]);

    const handleInputChange = (field: keyof CreateProductionLineData, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddMachine = () => {
        const newMachine: CreateMachineData = {
            name: '',
            code: '',
            description: '',
            status: 'idle',
            ideal_cycle_time: 0,
        };

        setData((prev) => ({
            ...prev,
            machines: [...(prev.machines || []), newMachine],
        }));
    };

    const handleRemoveMachine = (index: number) => {
        setData((prev) => ({
            ...prev,
            machines: prev.machines?.filter((_, i) => i !== index) || [],
        }));
    };

    const handleMachineChange = (index: number, field: keyof CreateMachineData, value: any) => {
        setData((prev) => ({
            ...prev,
            machines: prev.machines?.map((machine, i) => (i === index ? { ...machine, [field]: value } : machine)) || [],
        }));
    };
    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        line
            ? patch(route('production-lines.update', line.id), {
                  onSuccess: () => {
                      handleClose();
                  },
                  onError: (error) => {
                      setError(error.error || 'Failed to update production line');
                  },
              })
            : post(route('production-lines.store'), {
                  onSuccess: () => {
                      handleClose();
                  },
                  onError: (err) => {
                      setError(err.code || 'Failed to create production line');
                  },
              });
    };

    const handleClose = () => {
        setData({
            name: '',
            code: '',
            description: '',
        });
        setActiveStep(0);
        onClose();
    };

    const isStepValid = () => {
        switch (activeStep) {
            case 0:
                return data.name && data.code;
            default:
                return true;
        }
    };

    const steps = line ? ['Basic Information'] : ['Basic Information', 'Machine Setup'];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{line ? 'Edit Production Line' : 'Create Production Line'}</DialogTitle>
                    <DialogDescription>
                        {line ? 'Update the production line details below.' : 'Set up a new production line with optional machine templates.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!line && (
                        <>
                            {/* Custom Stepper */}
                            <div className="mx-4 flex items-center justify-between">
                                {steps.map((step, index) => (
                                    <div key={step} className={cn('flex items-center', index + 1 < steps.length ? 'w-full' : 'flex-1')}>
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                                                    index < activeStep
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : index === activeStep
                                                          ? 'border-primary text-primary'
                                                          : 'border-muted-foreground text-muted-foreground',
                                                )}
                                            >
                                                {index < activeStep ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <span className={cn('text-sm font-medium', index === 0 && 'pr-[2px]')}>{index + 1}</span>
                                                )}
                                            </div>
                                            <span className="mt-1 text-sm text-nowrap">{step}</span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={cn('mx-4 h-0.5 w-full', index < activeStep ? 'bg-primary' : 'bg-muted-foreground')} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Separator />
                        </>
                    )}

                    {activeStep === 0 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., Main Assembly Line"
                                />
                                <p className="text-xs text-muted-foreground">Enter a descriptive name for the production line</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Code <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., AL-A, PL-1"
                                />
                                <p className="text-xs text-muted-foreground">Unique identifier (e.g., AL-A, PL-1)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Optional description..."
                                    className="min-h-[100px]"
                                />
                                <p className="text-xs text-muted-foreground">Optional description of the production line</p>
                            </div>
                        </div>
                    )}

                    {activeStep === 1 && !line && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <Label>Machine Setup</Label>
                                <RadioGroup defaultValue="manual" onValueChange={(value) => setIsAddMachinesNow(value === 'add')}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="manual" id="manual" />
                                        <Label htmlFor="manual" className="cursor-pointer font-normal">
                                            I'll add machines manually later
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="add" id="add" />
                                        <Label htmlFor="add" className="cursor-pointer font-normal">
                                            add machines now
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {/* Machines List */}
                            {isAddMachinesNow && (
                                <div className="space-y-4">
                                    {data.machines && data.machines.length > 0 ? (
                                        <div className="max-h-[388px] space-y-4 overflow-auto">
                                            {data.machines.map((machine, index) => (
                                                <Card key={index}>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            <div className="mb-4 flex items-center justify-between">
                                                                <h4 className="text-sm font-medium">Machine {index + 1}</h4>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveMachine(index)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`machine_name_${index}`}>Machine Name</Label>
                                                                    <Input
                                                                        id={`machine_name_${index}`}
                                                                        value={machine.name}
                                                                        onChange={(e) => handleMachineChange(index, 'name', e.target.value)}
                                                                        placeholder="e.g., CNC Machine 1"
                                                                        required
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`machine_code_${index}`}>Machine Code</Label>
                                                                    <Input
                                                                        id={`machine_code_${index}`}
                                                                        value={machine.code}
                                                                        onChange={(e) => handleMachineChange(index, 'code', e.target.value)}
                                                                        placeholder="e.g., CNC-001"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor={`machine_cycle_time_${index}`}>Ideal Cycle Time (seconds)</Label>
                                                                <Input
                                                                    id={`machine_cycle_time_${index}`}
                                                                    type="number"
                                                                    value={machine.ideal_cycle_time}
                                                                    onChange={(e) =>
                                                                        handleMachineChange(index, 'ideal_cycle_time', parseInt(e.target.value) || 0)
                                                                    }
                                                                    placeholder="e.g., 120"
                                                                    min="0"
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor={`machine_description_${index}`}>Description (Optional)</Label>
                                                                <Textarea
                                                                    id={`machine_description_${index}`}
                                                                    value={machine.description}
                                                                    onChange={(e) => handleMachineChange(index, 'description', e.target.value)}
                                                                    placeholder="Enter machine description..."
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="border-dashed">
                                            <CardContent className="flex flex-col items-center justify-center py-8">
                                                <p className="text-sm text-muted-foreground">No machines added yet</p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Button type="button" onClick={handleAddMachine} variant="outline" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Machine
                                    </Button>
                                </div>
                            )}
                            {/* {useTemplate && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Template:</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {templates.map((template) => (
                                                <Button
                                                    key={template.id}
                                                    type="button"
                                                    variant={selectedTemplate === template.id ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setSelectedTemplate(template.id)}
                                                >
                                                    {template.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedTemplate && (
                                        <div className="space-y-2">
                                            <Label htmlFor="machine-count">Number of Machines</Label>
                                            <Input
                                                id="machine-count"
                                                type="number"
                                                value={machineCount}
                                                onChange={(e) => setMachineCount(parseInt(e.target.value) || 1)}
                                                min={1}
                                                max={20}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                {machineCount} machines will be created based on the {selectedTemplate} template
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )} */}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        {!line && activeStep > 0 && (
                            <Button type="button" variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                        )}
                    </div>

                    {!line && activeStep < steps.length - 1 ? (
                        <Button type="button" onClick={handleNext} disabled={!isStepValid()}>
                            Next
                        </Button>
                    ) : (
                        <Button type="button" onClick={handleSubmit} disabled={processing || !isStepValid()}>
                            {processing ? 'Saving...' : line ? 'Update' : 'Create'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProductionLineDialog;
