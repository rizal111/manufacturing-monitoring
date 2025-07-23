<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Services\OEECalculatorService;
use App\Services\DowntimeAnalysisService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MachineController extends Controller
{
    public function __construct(
        private OEECalculatorService $oeeService,
        private DowntimeAnalysisService $downtimeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'line_id' => 'nullable|exists:production_lines,id',
            'status' => 'nullable|in:running,idle,maintenance,breakdown',
        ]);

        $machines = Machine::with('productionLine')
            ->when(isset($validated['line_id']), function ($query) use ($validated) {
                return $query->where('production_line_id', $validated['line_id']);
            })
            ->when(isset($validated['status']), function ($query) use ($validated) {
                return $query->where('status', $validated['status']);
            })
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $machines,
        ]);
    }

    public function show(Machine $machine): JsonResponse
    {
        $machine->load([
            'productionLine',
            'currentStatusLog',
            'statusLogs' => function ($query) {
                $query->latest()->limit(10);
            },
            'downtimes' => function ($query) {
                $query->latest()->limit(5);
            },
            'productionOutputs' => function ($query) {
                $query->latest()->limit(10);
            }
        ]);

        return response()->json([
            'success' => true,
            'data' => $machine,
        ]);
    }

    public function updateStatus(Request $request, Machine $machine): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:running,idle,maintenance,breakdown',
            'reason' => 'required_if:status,maintenance,breakdown|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required_if:status,maintenance,breakdown|in:mechanical,electrical,material,operator,changeover,other',
            'is_planned' => 'nullable|boolean',
        ]);

        // Update machine status
        $machine->updateStatus($validated['status']);

        // If changing to maintenance or breakdown, create downtime record
        if (in_array($validated['status'], ['maintenance', 'breakdown'])) {
            $machine->downtimes()->create([
                'reason' => $validated['reason'],
                'description' => $validated['description'] ?? null,
                'started_at' => now(),
                'category' => $validated['category'],
                'is_planned' => $validated['is_planned'] ?? false,
            ]);
        }

        // If changing from maintenance/breakdown to running/idle, end downtime
        if (
            in_array($machine->status, ['maintenance', 'breakdown']) &&
            in_array($validated['status'], ['running', 'idle'])
        ) {
            $currentDowntime = $machine->downtimes()->whereNull('ended_at')->latest()->first();
            if ($currentDowntime) {
                $currentDowntime->update([
                    'ended_at' => now(),
                    'duration' => now()->diffInSeconds($currentDowntime->started_at),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Machine status updated successfully',
            'data' => $machine->fresh(['currentStatusLog']),
        ]);
    }

    public function oee(Machine $machine, Request $request): JsonResponse
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

        $oeeData = $this->oeeService->calculateMachineOEE($machine, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => $oeeData,
            'period' => [
                'start' => $startDate->toIso8601String(),
                'end' => $endDate->toIso8601String(),
            ],
        ]);
    }

    public function reliability(Machine $machine, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])
            : Carbon::now()->startOfMonth();

        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])
            : Carbon::now();

        $mtbf = $this->downtimeService->getMTBF($machine, $startDate, $endDate);
        $mttr = $this->downtimeService->getMTTR($machine, $startDate, $endDate);

        return response()->json([
            'success' => true,
            'data' => [
                'mtbf' => $mtbf,
                'mttr' => $mttr,
                'availability' => $mtbf > 0 ? round(($mtbf / ($mtbf + $mttr)) * 100, 2) : 0,
            ],
            'period' => [
                'start' => $startDate->toIso8601String(),
                'end' => $endDate->toIso8601String(),
            ],
        ]);
    }
}
