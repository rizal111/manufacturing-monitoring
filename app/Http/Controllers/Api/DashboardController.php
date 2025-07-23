<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionLine;
use App\Services\DashboardMetricsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardMetricsService $dashboardService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'period' => 'nullable|in:hour,day,week,month,quarter,year',
        ]);

        $line = isset($validated['line_id'])
            ? ProductionLine::find($validated['line_id'])
            : null;

        $period = $validated['period'] ?? 'day';

        $dashboardData = $this->dashboardService->getDashboardData($line, $period);

        return response()->json([
            'success' => true,
            'data' => $dashboardData,
        ]);
    }
}
