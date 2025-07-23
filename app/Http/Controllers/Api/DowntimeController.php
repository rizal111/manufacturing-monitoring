<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Downtime;
use App\Models\Machine;
use App\Services\DowntimeAnalysisService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DowntimeController extends Controller
{
    public function __construct(
        private DowntimeAnalysisService $downtimeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'machine_id' => 'nullable|exists:machines,id',
            'line_id' => 'nullable|exists:production_lines,id',
            'category' => 'nullable|in:mechanical,electrical,material,operator,changeover,other',
            'is_current' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = Downtime::with(['machine.productionLine']);

        if (isset($validated['machine_id'])) {
            $query->where('machine_id', $validated['machine_id']);
        }

        if (isset($validated['line_id'])) {
            $query->whereHas('machine', function ($q) use ($validated) {
                $q->where('production_line_id', $validated['line_id']);
            });
        }

        if (isset($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (isset($validated['is_current']) && $validated['is_current']) {
            $query->whereNull('ended_at');
        } else {
            $query->whereNotNull('ended_at');
        }

        if (isset($validated['start_date'])) {
            $query->where('started_at', '>=', Carbon::parse($validated['start_date']));
        }

        if (isset($validated['end_date'])) {
            $query->where('started_at', '<=', Carbon::parse($validated['end_date']));
        }

        $downtimes = $query->orderBy('started_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $downtimes,
        ]);
    }

    public function current(): JsonResponse
    {
        $currentDowntimes = $this->downtimeService->getCurrentDowntimes();

        return response()->json([
            'success' => true,
            'data' => $currentDowntimes,
            'count' => $currentDowntimes->count(),
        ]);
    }

    public function end(Downtime $downtime): JsonResponse
    {
        if ($downtime->ended_at) {
            return response()->json([
                'success' => false,
                'message' => 'Downtime already ended',
            ], 400);
        }

        $downtime->update([
            'ended_at' => now(),
            'duration' => now()->diffInSeconds($downtime->started_at),
        ]);

        // Update machine status to idle
        $downtime->machine->updateStatus('idle');

        return response()->json([
            'success' => true,
            'message' => 'Downtime ended successfully',
            'data' => $downtime->fresh(),
        ]);
    }

    public function analysis(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'period' => 'nullable|in:day,week,month,quarter,year',
        ]);

        $line = isset($validated['line_id']) ? \App\Models\ProductionLine::find($validated['line_id']) : null;
        $period = $validated['period'] ?? 'month';

        $categoryStats = $this->downtimeService->getDowntimeStatsByCategory($line, $period);

        return response()->json([
            'success' => true,
            'data' => [
                'category_stats' => $categoryStats,
                'period' => $period,
            ],
        ]);
    }
}
