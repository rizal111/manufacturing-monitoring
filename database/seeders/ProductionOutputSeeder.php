<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Machine;
use App\Models\ProductionSchedule;
use App\Models\ProductionOutput;
use App\Models\MachineStatusLog;
use Carbon\Carbon;

// class ProductionOutputSeeder extends Seeder
// {
//     public function run(): void
//     {
//         $this->createHistoricalOutputs();
//         $this->createCurrentOutputs();
//     }

//     private function createHistoricalOutputs(): void
//     {
//         // Get all completed schedules
//         $completedSchedules = ProductionSchedule::where('status', 'completed')->get();

//         foreach ($completedSchedules as $schedule) {
//             $machines = Machine::where('production_line_id', $schedule->production_line_id)->get();

//             if ($machines->isEmpty()) continue;

//             $totalToProduced = $schedule->actual_quantity;
//             $producedSoFar = 0;
//             $outputCount = rand(20, 50); // Number of output records

//             for ($i = 0; $i < $outputCount && $producedSoFar < $totalToProduced; $i++) {
//                 $machine = $machines->random();

//                 // Check if machine was running during this schedule
//                 $recordTime = $this->getRandomTimeWithinSchedule($schedule);
//                 if (!$this->wasMachineRunning($machine, $recordTime)) {
//                     continue;
//                 }

//                 $quantity = min(
//                     rand(10, 100),
//                     $totalToProduced - $producedSoFar
//                 );

//                 $rejectRate = $this->getRejectRate($machine, $schedule);
//                 $rejected = intval($quantity * $rejectRate);

//                 ProductionOutput::create([
//                     'machine_id' => $machine->id,
//                     'production_schedule_id' => $schedule->id,
//                     'quantity_produced' => $quantity,
//                     'quantity_rejected' => $rejected,
//                     'cycle_time' => $this->getCycleTime($machine, $schedule),
//                     'recorded_at' => $recordTime,
//                 ]);

//                 $producedSoFar += $quantity;
//             }
//         }
//     }

//     private function createCurrentOutputs(): void
//     {
//         // Get current schedule
//         $currentSchedules = ProductionSchedule::where('status', 'in_progress')->get();

//         foreach ($currentSchedules as $schedule) {
//             $machines = Machine::where('production_line_id', $schedule->production_line_id)
//                 ->where('status', 'running')
//                 ->get();

//             if ($machines->isEmpty()) continue;

//             $startTime = $schedule->actual_start ?? Carbon::now()->subHours(2);
//             $currentTime = Carbon::now();
//             $interval = 15; // Create output every 15 minutes

//             $time = $startTime->copy();
//             while ($time < $currentTime) {
//                 foreach ($machines as $machine) {
//                     if (rand(0, 100) > 20) { // 80% chance of output
//                         ProductionOutput::create([
//                             'machine_id' => $machine->id,
//                             'production_schedule_id' => $schedule->id,
//                             'quantity_produced' => rand(20, 50),
//                             'quantity_rejected' => rand(0, 3),
//                             'cycle_time' => $this->getCycleTime($machine, $schedule),
//                             'recorded_at' => $time,
//                         ]);
//                     }
//                 }
//                 $time->addMinutes($interval);
//             }
//         }

//         // Create some outputs without schedule (ad-hoc production)
//         $this->createAdHocOutputs();
//     }

//     private function createAdHocOutputs(): void
//     {
//         $runningMachines = Machine::where('status', 'running')->get();

//         foreach ($runningMachines as $machine) {
//             // Last 24 hours of ad-hoc production
//             $outputs = rand(5, 15);

//             for ($i = 0; $i < $outputs; $i++) {
//                 ProductionOutput::create([
//                     'machine_id' => $machine->id,
//                     'production_schedule_id' => null,
//                     'quantity_produced' => rand(10, 30),
//                     'quantity_rejected' => rand(0, 2),
//                     'cycle_time' => $machine->ideal_cycle_time + rand(-10, 10),
//                     'recorded_at' => Carbon::now()->subHours(rand(1, 24)),
//                 ]);
//             }
//         }
//     }

//     private function getRandomTimeWithinSchedule($schedule): Carbon
//     {
//         $start = $schedule->actual_start ?? $schedule->scheduled_start;
//         $end = $schedule->actual_end ?? $schedule->scheduled_end;

//         $startTimestamp = $start->timestamp;
//         $endTimestamp = $end->timestamp;

//         $randomTimestamp = rand($startTimestamp, $endTimestamp);

//         return Carbon::createFromTimestamp($randomTimestamp);
//     }

//     private function wasMachineRunning($machine, $time): bool
//     {
//         return MachineStatusLog::where('machine_id', $machine->id)
//             ->where('status', 'running')
//             ->where('started_at', '<=', $time)
//             ->where(function ($query) use ($time) {
//                 $query->whereNull('ended_at')
//                     ->orWhere('ended_at', '>', $time);
//             })
//             ->exists();
//     }

//     private function getRejectRate($machine, $schedule): float
//     {
//         // Base reject rate
//         $baseRate = 0.02; // 2%

//         // Adjust based on product complexity
//         if (str_contains($schedule->product_name, 'Premium') || str_contains($schedule->product_name, 'Advanced')) {
//             $baseRate += 0.01;
//         }

//         // Random variation
//         return $baseRate + (rand(-10, 10) / 1000);
//     }

//     private function getCycleTime($machine, $schedule): float
//     {
//         $idealTime = $machine->ideal_cycle_time;

//         // Add variation based on product
//         if (str_contains($schedule->product_name, 'Large') || str_contains($schedule->product_name, 'Premium')) {
//             $idealTime *= 1.2;
//         } elseif (str_contains($schedule->product_name, 'Small') || str_contains($schedule->product_name, 'Basic')) {
//             $idealTime *= 0.8;
//         }

//         // Add random variation (-10% to +10%)
//         return $idealTime * (1 + (rand(-10, 10) / 100));
//     }
// }
