<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Machine;
use App\Models\MachineStatusLog;
use Carbon\Carbon;

class MachineStatusLogSeeder extends Seeder
{
    public function run(): void
    {
        $machines = Machine::all();

        foreach ($machines as $machine) {
            $this->createStatusLogsForMachine($machine);
        }
    }

    private function createStatusLogsForMachine($machine): void
    {
        $startDate = Carbon::now()->subDays(30);
        $currentDate = $startDate->copy();

        while ($currentDate < Carbon::now()) {
            $status = $this->getRandomStatusSequence($machine->status);
            $duration = $this->getDurationForStatus($status);

            // Don't create logs that extend beyond current time
            if ($currentDate->copy()->addSeconds($duration) > Carbon::now()) {
                // Create current status log (still active)
                MachineStatusLog::create([
                    'machine_id' => $machine->id,
                    'status' => $machine->status,
                    'started_at' => $currentDate,
                    'ended_at' => null,
                    'duration' => null,
                ]);
                break;
            }

            MachineStatusLog::create([
                'machine_id' => $machine->id,
                'status' => $status,
                'started_at' => $currentDate,
                'ended_at' => $currentDate->copy()->addSeconds($duration),
                'duration' => $duration,
            ]);

            $currentDate->addSeconds($duration);
        }
    }

    private function getRandomStatusSequence($preferredStatus): string
    {
        // Weighted random selection to create realistic patterns
        $weights = [
            'running' => 60,
            'idle' => 25,
            'maintenance' => 10,
            'breakdown' => 5,
        ];

        // Increase weight of preferred status
        if (isset($weights[$preferredStatus])) {
            $weights[$preferredStatus] += 20;
        }

        $rand = rand(1, array_sum($weights));
        $sum = 0;

        foreach ($weights as $status => $weight) {
            $sum += $weight;
            if ($rand <= $sum) {
                return $status;
            }
        }

        return 'idle';
    }

    private function getDurationForStatus($status): int
    {
        // Return duration in seconds based on status
        return match ($status) {
            'running' => rand(3600, 14400),      // 1-4 hours
            'idle' => rand(300, 3600),           // 5-60 minutes
            'maintenance' => rand(1800, 7200),   // 30 min - 2 hours
            'breakdown' => rand(600, 3600),      // 10-60 minutes
            default => rand(600, 3600),
        };
    }
}
