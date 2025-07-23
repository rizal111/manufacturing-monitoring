<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionLine;

class ProductionLineSeeder extends Seeder
{
    public function run(): void
    {
        $lines = [
            [
                'name' => 'Assembly Line A',
                'code' => 'AL-A',
                'description' => 'Main assembly line for Product A series',
                'status' => 'running',
                'is_active' => true,
            ],
            [
                'name' => 'Assembly Line B',
                'code' => 'AL-B',
                'description' => 'Secondary assembly line for Product B series',
                'status' => 'running',
                'is_active' => true,
            ],
            [
                'name' => 'Packaging Line 1',
                'code' => 'PL-1',
                'description' => 'Primary packaging line',
                'status' => 'idle',
                'is_active' => true,
            ],
            [
                'name' => 'Packaging Line 2',
                'code' => 'PL-2',
                'description' => 'Secondary packaging line',
                'status' => 'maintenance',
                'is_active' => true,
            ],
            [
                'name' => 'Quality Control Line',
                'code' => 'QC-1',
                'description' => 'Quality inspection and testing line',
                'status' => 'running',
                'is_active' => true,
            ],
        ];

        foreach ($lines as $line) {
            ProductionLine::create($line);
        }
    }
}
