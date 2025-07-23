// app/Http/Controllers/Api/ProductionOutputController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionOutput;
use App\Models\Machine;
use App\Models\ProductionSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductionOutputController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'machine_id' => 'required|exists:machines,id',
            'production_schedule_id' => 'nullable|exists:production_schedules,id',
            'quantity_produced' => 'required|integer|min:1',
            'quantity_rejected' => 'nullable|integer|min:0',
            'cycle_time' => 'nullable|numeric|min:0',
        ]);

        $output = ProductionOutput::create([
            'machine_id' => $validated['machine_id'],
            'production_schedule_id' => $validated['production_schedule_id'] ?? null,
            'quantity_produced' => $validated['quantity_produced'],
            'quantity_rejected' => $validated['quantity_rejected'] ?? 0,
            'cycle_time' => $validated['cycle_time'] ?? null,
            'recorded_at' => now(),
        ]);

        // Update production schedule actual quantity if linked
        if ($output->production_schedule_id) {
            $schedule = ProductionSchedule::find($output->production_schedule_id);
            $schedule->increment('actual_quantity', $validated['quantity_produced']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Production output recorded successfully',
            'data' => $output->load(['machine', 'productionSchedule']),
        ], 201);
    }

    public function machineOutputs(Machine $machine, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = $machine->productionOutputs()
            ->with('productionSchedule');

        if (isset($validated['start_date'])) {
            $query->where('recorded_at', '>=', $validated['start_date']);
        }

        if (isset($validated['end_date'])) {
            $query->where('recorded_at', '<=', $validated['end_date']);
        }

        $outputs = $query->orderBy('recorded_at', 'desc')->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $outputs,
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'machine_id' => 'nullable|exists:machines,id',
            'line_id' => 'nullable|exists:production_lines,id',
            'period' => 'nullable|in:hour,day,week,month',
        ]);

        $period = $validated['period'] ?? 'day';
        $startDate = $this->getStartDate($period);

        $query = DB::table('production_outputs')
            ->join('machines', 'production_outputs.machine_id', '=', 'machines.id')
            ->where('production_outputs.recorded_at', '>=', $startDate);

        if (isset($validated['machine_id'])) {
            $query->where('production_outputs.machine_id', $validated['machine_id']);
        }

        if (isset($validated['line_id'])) {
            $query->where('machines.production_line_id', $validated['line_id']);
        }

        $summary = $query->selectRaw('
                COUNT(*) as total_entries,
                SUM(quantity_produced) as total_produced,
                SUM(quantity_rejected) as total_rejected,
                AVG(cycle_time) as avg_cycle_time,
                MIN(cycle_time) as min_cycle_time,
                MAX(cycle_time) as max_cycle_time
            ')
            ->first();

        $quality_rate = $summary->total_produced > 0
            ? round((($summary->total_produced - $summary->total_rejected) / $summary->total_produced) * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'start_date' => $startDate,
                'summary' => [
                    'total_entries' => $summary->total_entries,
                    'total_produced' => $summary->total_produced,
                    'total_rejected' => $summary->total_rejected,
                    'quality_rate' => $quality_rate,
                    'cycle_time' => [
                        'average' => round($summary->avg_cycle_time, 2),
                        'min' => round($summary->min_cycle_time, 2),
                        'max' => round($summary->max_cycle_time, 2),
                    ],
                ],
            ],
        ]);
    }

    private function getStartDate(string $period): string
    {
        return match ($period) {
            'hour' => now()->subHour(),
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            default => now()->startOfDay(),
        };
    }
}
