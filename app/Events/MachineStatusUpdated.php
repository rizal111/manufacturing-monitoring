<?php

namespace App\Events;

use App\Models\Machine;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MachineStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Machine $machine;
    public string $previousStatus;

    public function __construct(Machine $machine, string $previousStatus)
    {
        $this->machine = $machine;
        $this->previousStatus = $previousStatus;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('production-line.' . $this->machine->production_line_id),
            new Channel('machine.' . $this->machine->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'machine' => [
                'id' => $this->machine->id,
                'name' => $this->machine->name,
                'status' => $this->machine->status,
                'previous_status' => $this->previousStatus,
                'production_line_id' => $this->machine->production_line_id,
                'timestamp' => now()->toIso8601String(),
            ],
        ];
    }
}
