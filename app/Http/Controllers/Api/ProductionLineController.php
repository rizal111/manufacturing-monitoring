<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionLine;
use App\Services\RealTimeStatusService;
use App\Services\OEECalculatorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductionLineController extends Controller
{
    public function __construct(
        private RealTimeStatusService $statusService,
        private OEECalculatorService $oeeService
    ) {}

    public function index(): JsonResponse
    {
        $lines = ProductionLine::with(['machines' => function ($query) {
            $query->withCount(['downtimes' => function ($q) {
                $q->whereNull('ended_at');
            }]);
        }])->where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $lines,
        ]);
    }

    public function show(ProductionLine $line): JsonResponse
    {
        $line->load(['machines.currentStatusLog', 'productionSchedules' => function ($query) {
            $query->whereIn('status', ['pending', 'in_progress'])
                ->orderBy('scheduled_start');
        }]);

        return response()->json([
            'success' => true,
            'data' => $line,
        ]);
    }

    public function status(ProductionLine $line): JsonResponse
    {
        $status = $this->statusService->getLineStatus($line);

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    public function oee(ProductionLine $line, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])
            : Carbon::now()->startOfDay();

        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])
            : Carbon::now();

        $oeeData = $this->oeeService->calculateLineOEE($line, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $oeeData,
            'period' => [
                'start' => $startDate->toIso8601String(),
                'end' => $endDate->toIso8601String(),
            ],
        ]);
    }
}
