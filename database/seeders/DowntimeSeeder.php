<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Machine;
use App\Models\Downtime;
use App\Models\MachineStatusLog;
use Carbon\Carbon;

class DowntimeSeeder extends Seeder
{
    private $downtimeReasons = [
        'mechanical' => [
            'Belt replacement',
            'Bearing failure',
            'Motor overheating',
            'Gear box issue',
            'Hydraulic leak',
            'Pneumatic failure',
        ],
        'electrical' => [
            'Power supply failure',
            'Control panel error',
            'Sensor malfunction',
            'Wiring issue',
            'PLC error',
            'Drive fault',
        ],
        'material' => [
            'Material shortage',
            'Wrong material delivered',
            'Material quality issue',
            'Waiting for material',
            'Material changeover',
        ],
        'operator' => [
            'Operator break',
            'Shift change',
            'Training session',
            'Operator not available',
            'Safety briefing',
        ],
        'changeover' => [
            'Product changeover',
            'Tool change',
            'Setup adjustment',
            'Cleaning required',
            'Format change',
        ],
        'other' => [
            'Quality inspection',
            'Preventive maintenance',
            'Emergency stop',
            'Power outage',
            'IT system issue',
        ],
    ];

    public function run(): void
    {
        $machines = Machine::all();

        foreach ($machines as $machine) {
            // Get maintenance and breakdown logs for this machine
            $downtimeLogs = MachineStatusLog::where('machine_id', $machine->id)
                ->whereIn('status', ['maintenance', 'breakdown'])
                ->whereNotNull('ended_at')
                ->get();

            foreach ($downtimeLogs as $log) {
                $category = $this->getCategoryForStatus($log->status);
                $reasons = $this->downtimeReasons[$category];
                $reason = $reasons[array_rand($reasons)];

                Downtime::create([
                    'machine_id' => $machine->id,
                    'reason' => $reason,
                    'description' => $this->generateDescription($reason, $log->status),
                    'started_at' => $log->started_at,
                    'ended_at' => $log->ended_at,
                    'duration' => $log->duration,
                    'category' => $category,
                    'is_planned' => $this->isPlannedDowntime($reason),
                ]);
            }

            // Add some additional downtime records for variety
            $this->createAdditionalDowntimes($machine);
        }

        // Create current downtimes for machines in maintenance/breakdown status
        $this->createCurrentDowntimes();
    }

    private function getCategoryForStatus($status): string
    {
        if ($status === 'maintenance') {
            $categories = ['mechanical', 'electrical', 'other', 'changeover'];
            return $categories[array_rand($categories)];
        } else { // breakdown
            $categories = ['mechanical', 'electrical', 'material'];
            return $categories[array_rand($categories)];
        }
    }

    private function generateDescription($reason, $status): string
    {
        $descriptions = [
            'Belt replacement' => 'Conveyor belt worn out, immediate replacement required',
            'Bearing failure' => 'Main bearing showing excessive wear, needs replacement',
            'Motor overheating' => 'Motor temperature exceeded safe limits, cooling required',
            'Power supply failure' => 'Main power supply unit failed, backup system activated',
            'Material shortage' => 'Waiting for raw material delivery from warehouse',
            'Operator break' => 'Scheduled operator break time',
            'Product changeover' => 'Changing from Product A to Product B configuration',
            'Quality inspection' => 'Routine quality check and calibration',
        ];

        return $descriptions[$reason] ?? "Downtime due to {$reason}. Status: {$status}";
    }

    private function isPlannedDowntime($reason): bool
    {
        $plannedReasons = [
            'Preventive maintenance',
            'Operator break',
            'Shift change',
            'Training session',
            'Product changeover',
            'Tool change',
            'Setup adjustment',
            'Cleaning required',
            'Quality inspection',
            'Safety briefing',
        ];

        return in_array($reason, $plannedReasons);
    }

    private function createAdditionalDowntimes($machine): void
    {
        $count = rand(5, 15);

        for ($i = 0; $i < $count; $i++) {
            $category = array_rand($this->downtimeReasons);
            $reasons = $this->downtimeReasons[$category];
            $reason = $reasons[array_rand($reasons)];

            $startTime = Carbon::now()->subDays(rand(1, 30))->subMinutes(rand(0, 1440));
            $duration = rand(300, 7200); // 5 minutes to 2 hours

            Downtime::create([
                'machine_id' => $machine->id,
                'reason' => $reason,
                'description' => $this->generateDescription($reason, 'completed'),
                'started_at' => $startTime,
                'ended_at' => $startTime->copy()->addSeconds($duration),
                'duration' => $duration,
                'category' => $category,
                'is_planned' => $this->isPlannedDowntime($reason),
            ]);
        }
    }

    private function createCurrentDowntimes(): void
    {
        $currentDownMachines = Machine::whereIn('status', ['maintenance', 'breakdown'])->get();

        foreach ($currentDownMachines as $machine) {
            $category = $this->getCategoryForStatus($machine->status);
            $reasons = $this->downtimeReasons[$category];
            $reason = $reasons[array_rand($reasons)];

            // Check if there's already a current downtime
            $existingDowntime = Downtime::where('machine_id', $machine->id)
                ->whereNull('ended_at')
                ->first();

            if (!$existingDowntime) {
                Downtime::create([
                    'machine_id' => $machine->id,
                    'reason' => $reason,
                    'description' => $this->generateDescription($reason, $machine->status),
                    'started_at' => Carbon::now()->subMinutes(rand(10, 120)),
                    'ended_at' => null,
                    'duration' => null,
                    'category' => $category,
                    'is_planned' => $machine->status === 'maintenance' && rand(0, 100) > 30,
                ]);
            }
        }
    }
}
