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
import { AlertCircle, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CreateProductionLineData, ProductionLine } from '../../types/production';

interface ProductionLineDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    line?: ProductionLine | null;
}

const ProductionLineDialog: React.FC<ProductionLineDialogProps> = ({ open, onClose, onSave, line }) => {
    const [activeStep, setActiveStep] = useState(0);

    const [error, setError] = useState<string | null>(null);

    const { data, setData, post, processing } = useTypedForm<CreateProductionLineData>({
        name: '',
        code: '',
        description: '',
        machine_template: undefined,
        machine_count: undefined,
        machines: [],
    });

    const [useTemplate, setUseTemplate] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [machineCount, setMachineCount] = useState(5);

    useEffect(() => {
        if (line) {
            setData({
                name: line.name,
                code: line.code,
                description: line.description || '',
                machine_template: undefined,
                machine_count: line.machines_count ? line.machines_count : undefined,
                machines: [],
            });
            setActiveStep(0);
            setUseTemplate(false);
        } else {
            setData({
                name: '',
                code: '',
                description: '',
                machine_template: undefined,
                machine_count: undefined,
                machines: [],
            });
        }
    }, [line]);

    const handleInputChange = (field: keyof CreateProductionLineData, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    function submit(e: any) {
        e.preventDefault();
        console.log(data);
        post('/production-lines/store');
    }

    const handleSubmit = async () => {
        console.log(data);
        // try {
        //     setLoading(true);
        //     setError(null);
        //     let data = { ...data };
        //     if (!line && useTemplate && selectedTemplate) {
        //         data.machine_template = selectedTemplate as any;
        //         data.machine_count = machineCount;
        //     }
        //     const response = line
        //         ? await productionApi.updateProductionLine(line.id, data)
        //         : useTemplate
        //           ? await productionApi.createProductionLineWithMachines(data)
        //           : await productionApi.createProductionLine(data);
        //     if (response.success) {
        //         onSave();
        //         handleClose();
        //     }
        // } catch (err: any) {
        //     setError(err.response?.data?.message || 'Failed to save production line');
        // } finally {
        //     setLoading(false);
        // }
    };

    const handleClose = () => {
        setData({
            name: '',
            code: '',
            description: '',
        });
        setActiveStep(0);
        setUseTemplate(false);
        setSelectedTemplate('');
        setMachineCount(5);
        setError(null);
        onClose();
    };

    const isStepValid = () => {
        switch (activeStep) {
            case 0:
                return data.name && data.code;
            case 1:
                return !useTemplate || (selectedTemplate && machineCount > 0);
            default:
                return true;
        }
    };

    const steps = line ? ['Basic Information'] : ['Basic Information', 'Machine Setup'];

    const templates = [
        { id: 'assembly', label: 'Assembly Line' },
        { id: 'packaging', label: 'Packaging Line' },
        { id: 'quality', label: 'Quality Control' },
    ];

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
                            <div className="flex items-center justify-between">
                                {steps.map((step, index) => (
                                    <div key={step} className="flex items-center">
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
                                                    <span className="text-sm font-medium">{index + 1}</span>
                                                )}
                                            </div>
                                            <span className="mt-1 text-sm">{step}</span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={cn('mx-4 h-0.5 w-24', index < activeStep ? 'bg-primary' : 'bg-muted-foreground')} />
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
                                <RadioGroup
                                    value={useTemplate ? 'template' : 'manual'}
                                    onValueChange={(value) => setUseTemplate(value === 'template')}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="manual" id="manual" />
                                        <Label htmlFor="manual" className="cursor-pointer font-normal">
                                            I'll add machines manually later
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="template" id="template" />
                                        <Label htmlFor="template" className="cursor-pointer font-normal">
                                            Use a template to create machines automatically
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {useTemplate && (
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
                            )}
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
