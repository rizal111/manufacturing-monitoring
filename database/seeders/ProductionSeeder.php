<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ProductionLine;
use App\Models\Machine;
use App\Models\ProductionSchedule;
use App\Models\ProductionOutput;
use App\Models\Downtime;
use App\Models\MachineStatusLog;
use Carbon\Carbon;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data first (optional - use with caution in production)
        $this->clearExistingData();

        // Create Production Lines
        $lines = [
            ['name' => 'Assembly Line A', 'code' => 'AL-A', 'description' => 'Main assembly line'],
            ['name' => 'Assembly Line B', 'code' => 'AL-B', 'description' => 'Secondary assembly line'],
            ['name' => 'Packaging Line 1', 'code' => 'PL-1', 'description' => 'Primary packaging line'],
        ];

        foreach ($lines as $lineData) {
            $line = ProductionLine::create($lineData);

            // Create Machines for each line
            $this->createMachinesForLine($line);

            // Create Production Schedules
            $this->createSchedulesForLine($line);

            // Create Historical Data
            $this->createHistoricalData($line);
        }
    }

    private function clearExistingData(): void
    {
        // Disable foreign key checks for SQLite
        if (config('database.default') === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        // Clear tables in correct order (child tables first)
        ProductionOutput::truncate();
        Downtime::truncate();
        MachineStatusLog::truncate();
        ProductionSchedule::truncate();
        Machine::truncate();
        ProductionLine::truncate();

        // Re-enable foreign key checks
        if (config('database.default') === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    private function createMachinesForLine(ProductionLine $line): void
    {
        $machineCount = rand(3, 6);

        for ($i = 1; $i <= $machineCount; $i++) {
            $machineCode = "{$line->code}-M{$i}";

            // Use updateOrCreate to avoid duplicates
            $machine = Machine::updateOrCreate(
                ['code' => $machineCode],
                [
                    'production_line_id' => $line->id,
                    'name' => "{$line->name} - Machine {$i}",
                    'status' => $this->randomStatus(),
                    'ideal_cycle_time' => rand(30, 120),
                    'description' => "Machine {$i} on {$line->name}",
                ]
            );

            // Create current status log only if machine was just created
            if ($machine->wasRecentlyCreated) {
                MachineStatusLog::create([
                    'machine_id' => $machine->id,
                    'status' => $machine->status,
                    'started_at' => now()->subHours(rand(1, 8)),
                ]);
            }
        }
    }

    private function createSchedulesForLine(ProductionLine $line): void
    {
        $products = [
            ['name' => 'Product A', 'code' => 'PRD-A'],
            ['name' => 'Product B', 'code' => 'PRD-B'],
            ['name' => 'Product C', 'code' => 'PRD-C'],
        ];

        // Current and upcoming schedules
        for ($i = 0; $i < 5; $i++) {
            $product = $products[array_rand($products)];
            $startTime = now()->addHours($i * 8);

            ProductionSchedule::create([
                'production_line_id' => $line->id,
                'product_name' => $product['name'],
                'product_code' => $product['code'],
                'planned_quantity' => rand(100, 1000),
                'actual_quantity' => $i === 0 ? rand(0, 500) : 0,
                'scheduled_start' => $startTime,
                'scheduled_end' => $startTime->copy()->addHours(8),
                'actual_start' => $i === 0 ? now()->subHours(2) : null,
                'status' => $i === 0 ? 'in_progress' : 'pending',
                'shift' => $this->getShiftForTime($startTime),
            ]);
        }

        // Historical schedules
        for ($i = 1; $i <= 10; $i++) {
            $product = $products[array_rand($products)];
            $startTime = now()->subDays($i)->setTime(8, 0);
            $plannedQty = rand(100, 1000);

            ProductionSchedule::create([
                'production_line_id' => $line->id,
                'product_name' => $product['name'],
                'product_code' => $product['code'],
                'planned_quantity' => $plannedQty,
                'actual_quantity' => rand(intval($plannedQty * 0.8), intval($plannedQty * 1.1)),
                'scheduled_start' => $startTime,
                'scheduled_end' => $startTime->copy()->addHours(8),
                'actual_start' => $startTime->copy()->addMinutes(rand(-30, 30)),
                'actual_end' => $startTime->copy()->addHours(8)->addMinutes(rand(-60, 60)),
                'status' => 'completed',
                'shift' => $this->getShiftForTime($startTime),
            ]);
        }
    }

    private function createHistoricalData(ProductionLine $line): void
    {
        $machines = $line->machines;

        foreach ($machines as $machine) {
            // Only create historical data if machine was recently created
            if ($machine->wasRecentlyCreated || !$machine->statusLogs()->exists()) {
                // Create status logs for the past week
                $this->createStatusLogs($machine);

                // Create downtime records
                $this->createDowntimeRecords($machine);

                // Create production outputs
                $this->createProductionOutputs($machine);
            }
        }
    }

    private function createStatusLogs(Machine $machine): void
    {
        $startDate = now()->subDays(7);
        $currentDate = $startDate->copy();

        while ($currentDate < now()->subHours(8)) {
            $status = $this->randomStatus();
            $duration = rand(1800, 14400); // 30 min to 4 hours

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

    private function createDowntimeRecords(Machine $machine): void
    {
        $downtimeReasons = [
            'Mechanical failure' => 'mechanical',
            'Electrical issue' => 'electrical',
            'Material shortage' => 'material',
            'Operator break' => 'operator',
            'Changeover' => 'changeover',
            'Maintenance' => 'other',
        ];

        for ($i = 0; $i < rand(3, 10); $i++) {
            $reason = array_rand($downtimeReasons);
            $startTime = now()->subDays(rand(1, 7))->subHours(rand(0, 23));
            $duration = rand(600, 7200); // 10 min to 2 hours

            Downtime::create([
                'machine_id' => $machine->id,
                'reason' => $reason,
                'description' => "Details about {$reason}",
                'started_at' => $startTime,
                'ended_at' => $startTime->copy()->addSeconds($duration),
                'duration' => $duration,
                'category' => $downtimeReasons[$reason],
                'is_planned' => $downtimeReasons[$reason] === 'changeover' || rand(0, 10) > 8,
            ]);
        }
    }

    private function createProductionOutputs(Machine $machine): void
    {
        $schedules = ProductionSchedule::where('production_line_id', $machine->production_line_id)
            ->where('status', 'completed')
            ->get();

        foreach ($schedules as $schedule) {
            $outputCount = rand(5, 20);

            for ($i = 0; $i < $outputCount; $i++) {
                $recordedAt = $schedule->actual_start->copy()->addMinutes(rand(0, 480));

                ProductionOutput::create([
                    'machine_id' => $machine->id,
                    'production_schedule_id' => $schedule->id,
                    'quantity_produced' => rand(10, 100),
                    'quantity_rejected' => rand(0, 5),
                    'cycle_time' => $machine->ideal_cycle_time + rand(-10, 20),
                    'recorded_at' => $recordedAt,
                ]);
            }
        }
    }

    private function randomStatus(): string
    {
        $statuses = ['running', 'idle', 'maintenance', 'breakdown'];
        $weights = [60, 25, 10, 5]; // Weighted probability

        $rand = rand(1, 100);
        $sum = 0;

        foreach ($weights as $i => $weight) {
            $sum += $weight;
            if ($rand <= $sum) {
                return $statuses[$i];
            }
        }

        return 'idle';
    }

    private function getShiftForTime(Carbon $time): string
    {
        $hour = $time->hour;

        if ($hour >= 6 && $hour < 14) {
            return 'morning';
        } elseif ($hour >= 14 && $hour < 22) {
            return 'afternoon';
        } else {
            return 'night';
        }
    }
}
