<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionSchedule;
use App\Services\ProductionScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductionScheduleController extends Controller
{
    public function __construct(
        private ProductionScheduleService $scheduleService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'shift' => 'nullable|in:morning,afternoon,night',
        ]);

        $query = ProductionSchedule::with('productionLine');

        if (isset($validated['line_id'])) {
            $query->where('production_line_id', $validated['line_id']);
        }

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['shift'])) {
            $query->where('shift', $validated['shift']);
        }

        $schedules = $query->orderBy('scheduled_start', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
        ]);

        $line = isset($validated['line_id'])
            ? \App\Models\ProductionLine::find($validated['line_id'])
            : null;

        $overview = $this->scheduleService->getScheduleOverview($line);

        return response()->json([
            'success' => true,
            'data' => $overview,
        ]);
    }

    public function performance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'period' => 'nullable|in:day,week,month,quarter,year',
        ]);

        $line = isset($validated['line_id'])
            ? \App\Models\ProductionLine::find($validated['line_id'])
            : null;

        $period = $validated['period'] ?? 'week';

        $performance = $this->scheduleService->getPlannedVsActual($line, $period);

        return response()->json([
            'success' => true,
            'data' => $performance,
        ]);
    }

    public function shiftAnalysis(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'days' => 'nullable|integer|min:1|max:90',
        ]);

        $line = isset($validated['line_id'])
            ? \App\Models\ProductionLine::find($validated['line_id'])
            : null;

        $days = $validated['days'] ?? 7;

        $analysis = $this->scheduleService->getShiftAnalysis($line, $days);

        return response()->json([
            'success' => true,
            'data' => $analysis,
        ]);
    }

    public function start(ProductionSchedule $schedule): JsonResponse
    {
        if ($schedule->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Schedule must be in pending status to start',
            ], 400);
        }

        $schedule->update([
            'status' => 'in_progress',
            'actual_start' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Production schedule started successfully',
            'data' => $schedule->fresh(),
        ]);
    }

    public function complete(ProductionSchedule $schedule): JsonResponse
    {
        if ($schedule->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Schedule must be in progress to complete',
            ], 400);
        }

        $schedule->update([
            'status' => 'completed',
            'actual_end' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Production schedule completed successfully',
            'data' => $schedule->fresh(),
        ]);
    }

    public function updateProgress(Request $request, ProductionSchedule $schedule): JsonResponse
    {
        $validated = $request->validate([
            'actual_quantity' => 'required|integer|min:0',
        ]);

        if ($schedule->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Schedule must be in progress to update quantity',
            ], 400);
        }

        $schedule->update([
            'actual_quantity' => $validated['actual_quantity'],
        ]);

        // Auto-complete if target reached
        if ($schedule->actual_quantity >= $schedule->planned_quantity) {
            $schedule->update([
                'status' => 'completed',
                'actual_end' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Production progress updated successfully',
            'data' => $schedule->fresh(),
        ]);
    }
}
