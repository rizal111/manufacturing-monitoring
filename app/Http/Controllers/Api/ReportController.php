// app/Http/Controllers/Api/ReportController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OEECalculatorService;
use App\Services\ProductionMetricsService;
use App\Services\DowntimeAnalysisService;
use App\Models\ProductionLine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __construct(
        private OEECalculatorService $oeeService,
        private ProductionMetricsService $metricsService,
        private DowntimeAnalysisService $downtimeService
    ) {}

    public function oeeReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'group_by' => 'nullable|in:day,week,month',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $groupBy = $validated['group_by'] ?? 'day';

        $data = [];

        if (isset($validated['line_id'])) {
            $line = ProductionLine::find($validated['line_id']);
            $data['line'] = [
                'id' => $line->id,
                'name' => $line->name,
                'oee_summary' => $this->oeeService->calculateLineOEE($line, $startDate, $endDate),
            ];
        } else {
            $lines = ProductionLine::where('is_active', true)->get();
            $data['lines'] = $lines->map(function ($line) use ($startDate, $endDate) {
                return [
                    'id' => $line->id,
                    'name' => $line->name,
                    'oee' => $this->oeeService->calculateLineOEE($line, $startDate, $endDate)['oee'],
                ];
            });
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function productionReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        $query = DB::table('production_outputs')
            ->join('machines', 'production_outputs.machine_id', '=', 'machines.id')
            ->join('production_lines', 'machines.production_line_id', '=', 'production_lines.id')
            ->whereBetween('production_outputs.recorded_at', [$startDate, $endDate]);

        if (isset($validated['line_id'])) {
            $query->where('production_lines.id', $validated['line_id']);
        }

        $productionData = $query->selectRaw('
                production_lines.id as line_id,
                production_lines.name as line_name,
                COUNT(DISTINCT machines.id) as machines_used,
                SUM(production_outputs.quantity_produced) as total_produced,
                SUM(production_outputs.quantity_rejected) as total_rejected,
                AVG(production_outputs.cycle_time) as avg_cycle_time
            ')
            ->groupBy('production_lines.id', 'production_lines.name')
            ->get();

        $scheduleData = DB::table('production_schedules')
            ->whereBetween('scheduled_start', [$startDate, $endDate])
            ->when(isset($validated['line_id']), function ($query) use ($validated) {
                return $query->where('production_line_id', $validated['line_id']);
            })
            ->selectRaw('
                COUNT(*) as total_schedules,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed,
                SUM(planned_quantity) as total_planned,
                SUM(actual_quantity) as total_actual
            ')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'production' => $productionData,
                'schedules' => $scheduleData,
                'efficiency' => $scheduleData->total_planned > 0
                    ? round(($scheduleData->total_actual / $scheduleData->total_planned) * 100, 2)
                    : 0,
            ],
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    public function downtimeReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        $line = isset($validated['line_id']) ? ProductionLine::find($validated['line_id']) : null;

        $downtimeHistory = $this->downtimeService->getDowntimeHistory($line, $startDate, $endDate);
        $categoryStats = $this->downtimeService->getDowntimeStatsByCategory($line, 'custom');

        // Top 10 machines by downtime
        $topMachines = DB::table('downtimes')
            ->join('machines', 'downtimes.machine_id', '=', 'machines.id')
            ->whereBetween('downtimes.started_at', [$startDate, $endDate])
            ->when($line, function ($query) use ($line) {
                return $query->where('machines.production_line_id', $line->id);
            })
            ->selectRaw('
                machines.id,
                machines.name,
                COUNT(*) as downtime_count,
                SUM(downtimes.duration) as total_downtime
            ')
            ->groupBy('machines.id', 'machines.name')
            ->orderByDesc('total_downtime')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_incidents' => $downtimeHistory->count(),
                    'total_downtime_hours' => round($downtimeHistory->sum('duration') / 3600, 2),
                    'avg_downtime_minutes' => $downtimeHistory->count() > 0
                        ? round($downtimeHistory->avg('duration') / 60, 2)
                        : 0,
                ],
                'by_category' => $categoryStats,
                'top_machines' => $topMachines,
            ],
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }
}
