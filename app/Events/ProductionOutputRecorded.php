<?php

namespace App\Events;

use App\Models\ProductionOutput;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductionOutputRecorded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ProductionOutput $output;

    public function __construct(ProductionOutput $output)
    {
        $this->output = $output->load(['machine.productionLine', 'productionSchedule']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('production-line.' . $this->output->machine->production_line_id),
            new Channel('machine.' . $this->output->machine_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'output' => [
                'id' => $this->output->id,
                'machine_id' => $this->output->machine_id,
                'machine_name' => $this->output->machine->name,
                'quantity_produced' => $this->output->quantity_produced,
                'quantity_rejected' => $this->output->quantity_rejected,
                'quality_rate' => $this->output->quality_rate,
                'cycle_time' => $this->output->cycle_time,
                'recorded_at' => $this->output->recorded_at->toIso8601String(),
            ],
        ];
    }
}
