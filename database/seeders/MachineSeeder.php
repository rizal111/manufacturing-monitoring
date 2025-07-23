<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Machine;
use App\Models\ProductionLine;

class MachineSeeder extends Seeder
{
    public function run(): void
    {
        $lines = ProductionLine::all();

        $machineTemplates = [
            'Assembly' => [
                'types' => ['CNC Machine', 'Welding Robot', 'Assembly Station', 'Press Machine', 'Drilling Machine'],
                'cycle_times' => [45, 60, 30, 90, 40],
            ],
            'Packaging' => [
                'types' => ['Filling Machine', 'Sealing Machine', 'Labeling Machine', 'Cartoning Machine', 'Palletizer'],
                'cycle_times' => [20, 25, 15, 35, 60],
            ],
            'Quality' => [
                'types' => ['Vision Inspector', 'Weight Checker', 'Leak Tester', 'Dimension Checker', 'Function Tester'],
                'cycle_times' => [10, 5, 30, 15, 45],
            ],
        ];

        foreach ($lines as $line) {
            $lineType = str_contains($line->name, 'Assembly') ? 'Assembly' : (str_contains($line->name, 'Packaging') ? 'Packaging' : 'Quality');

            $templates = $machineTemplates[$lineType];
            $machineCount = rand(4, 6);

            for ($i = 1; $i <= $machineCount; $i++) {
                $typeIndex = ($i - 1) % count($templates['types']);
                $status = $this->getRandomStatus($line->status);

                Machine::create([
                    'production_line_id' => $line->id,
                    'name' => $line->name . ' - ' . $templates['types'][$typeIndex] . ' ' . $i,
                    'code' => $line->code . '-M' . $i,
                    'status' => $status,
                    'description' => $templates['types'][$typeIndex] . ' for ' . $line->name,
                    'ideal_cycle_time' => $templates['cycle_times'][$typeIndex] + rand(-5, 5),
                    'is_active' => true,
                ]);
            }
        }
    }

    private function getRandomStatus($lineStatus): string
    {
        if ($lineStatus === 'maintenance') {
            return 'maintenance';
        }

        $statuses = ['running', 'running', 'running', 'idle', 'maintenance', 'breakdown'];
        return $statuses[array_rand($statuses)];
    }
}
