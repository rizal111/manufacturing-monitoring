<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionSchedule;
use App\Models\ProductionLine;
use Carbon\Carbon;

class ProductionScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $lines = ProductionLine::all();

        $products = [
            ['name' => 'Product A - Standard', 'code' => 'PRD-A-STD'],
            ['name' => 'Product A - Premium', 'code' => 'PRD-A-PRM'],
            ['name' => 'Product B - Small', 'code' => 'PRD-B-SM'],
            ['name' => 'Product B - Large', 'code' => 'PRD-B-LG'],
            ['name' => 'Product C - Basic', 'code' => 'PRD-C-BSC'],
            ['name' => 'Product C - Advanced', 'code' => 'PRD-C-ADV'],
        ];

        foreach ($lines as $line) {
            // Historical schedules (past 30 days)
            $this->createHistoricalSchedules($line, $products);

            // Current schedule (today)
            $this->createCurrentSchedule($line, $products);

            // Future schedules (next 7 days)
            $this->createFutureSchedules($line, $products);
        }
    }

    private function createHistoricalSchedules($line, $products): void
    {
        for ($daysAgo = 30; $daysAgo > 0; $daysAgo--) {
            $date = Carbon::now()->subDays($daysAgo);

            // Morning shift
            $this->createSchedule($line, $products, $date->copy()->setTime(6, 0), 'morning', 'completed');

            // Afternoon shift
            $this->createSchedule($line, $products, $date->copy()->setTime(14, 0), 'afternoon', 'completed');

            // Night shift
            if (rand(0, 100) > 20) { // 80% chance of night shift
                $this->createSchedule($line, $products, $date->copy()->setTime(22, 0), 'night', 'completed');
            }
        }
    }

    private function createCurrentSchedule($line, $products): void
    {
        $now = Carbon::now();
        $currentHour = $now->hour;

        if ($currentHour >= 6 && $currentHour < 14) {
            // Morning shift in progress
            $this->createSchedule($line, $products, Carbon::today()->setTime(6, 0), 'morning', 'in_progress');
            $this->createSchedule($line, $products, Carbon::today()->setTime(14, 0), 'afternoon', 'pending');
            $this->createSchedule($line, $products, Carbon::today()->setTime(22, 0), 'night', 'pending');
        } elseif ($currentHour >= 14 && $currentHour < 22) {
            // Afternoon shift in progress
            $this->createSchedule($line, $products, Carbon::today()->setTime(6, 0), 'morning', 'completed');
            $this->createSchedule($line, $products, Carbon::today()->setTime(14, 0), 'afternoon', 'in_progress');
            $this->createSchedule($line, $products, Carbon::today()->setTime(22, 0), 'night', 'pending');
        } else {
            // Night shift in progress
            $this->createSchedule($line, $products, Carbon::today()->setTime(22, 0), 'night', 'in_progress');
        }
    }

    private function createFutureSchedules($line, $products): void
    {
        for ($daysAhead = 1; $daysAhead <= 7; $daysAhead++) {
            $date = Carbon::now()->addDays($daysAhead);

            // Morning shift
            $this->createSchedule($line, $products, $date->copy()->setTime(6, 0), 'morning', 'pending');

            // Afternoon shift
            $this->createSchedule($line, $products, $date->copy()->setTime(14, 0), 'afternoon', 'pending');

            // Night shift
            if (rand(0, 100) > 20) { // 80% chance of night shift
                $this->createSchedule($line, $products, $date->copy()->setTime(22, 0), 'night', 'pending');
            }
        }
    }

    private function createSchedule($line, $products, $startTime, $shift, $status): void
    {
        $product = $products[array_rand($products)];
        $plannedQty = rand(200, 1000) * 10; // Round to nearest 10

        $schedule = [
            'production_line_id' => $line->id,
            'product_name' => $product['name'],
            'product_code' => $product['code'],
            'planned_quantity' => $plannedQty,
            'scheduled_start' => $startTime,
            'scheduled_end' => $startTime->copy()->addHours(8),
            'shift' => $shift,
            'status' => $status,
            'metadata' => json_encode([
                'priority' => rand(1, 5),
                'customer' => 'Customer ' . rand(1, 20),
                'order_number' => 'ORD-' . rand(10000, 99999),
            ]),
        ];

        if ($status === 'completed') {
            $actualQty = rand(intval($plannedQty * 0.85), intval($plannedQty * 1.05));
            $schedule['actual_quantity'] = $actualQty;
            $schedule['actual_start'] = $startTime->copy()->addMinutes(rand(-15, 15));
            $schedule['actual_end'] = $startTime->copy()->addHours(8)->addMinutes(rand(-30, 30));
        } elseif ($status === 'in_progress') {
            $progress = rand(20, 80);
            $schedule['actual_quantity'] = intval($plannedQty * $progress / 100);
            $schedule['actual_start'] = $startTime->copy()->addMinutes(rand(-10, 10));
        }

        ProductionSchedule::create($schedule);
    }
}
