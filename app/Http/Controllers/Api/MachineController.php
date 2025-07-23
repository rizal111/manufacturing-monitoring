<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\ProductionLine;
use App\Models\MachineStatusLog;
use App\Http\Requests\StoreMachineRequest;
use App\Http\Requests\UpdateMachineRequest;
use App\Services\OEECalculatorService;
use App\Services\DowntimeAnalysisService;
use App\Events\MachineStatusUpdated;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MachineController extends Controller
{
    public function __construct(
        private OEECalculatorService $oeeService,
        private DowntimeAnalysisService $downtimeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Machine::with('productionLine');

        // Apply filters
        if ($request->has('line_id')) {
            $query->where('production_line_id', $request->line_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $machines = $request->has('per_page')
            ? $query->paginate($request->per_page)
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $machines,
        ]);
    }

    public function store(StoreMachineRequest $request): JsonResponse
    {
        DB::beginTransaction();

        try {
            $machine = Machine::create($request->validated());

            // Create initial status log
            MachineStatusLog::create([
                'machine_id' => $machine->id,
                'status' => $machine->status ?? 'idle',
                'started_at' => now(),
            ]);

            // Update production line status
            $machine->productionLine->updateStatus();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Machine created successfully',
                'data' => $machine->load('productionLine'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create machine',
                'error' => $e->getMessage(),
            ], 500);
        }
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

        // Add statistics
        $machine->statistics = [
            'total_production_today' => $machine->productionOutputs()
                ->whereDate('recorded_at', today())
                ->sum('quantity_produced'),
            'total_rejects_today' => $machine->productionOutputs()
                ->whereDate('recorded_at', today())
                ->sum('quantity_rejected'),
            'downtime_hours_week' => round($machine->downtimes()
                ->where('started_at', '>=', now()->startOfWeek())
                ->sum('duration') / 3600, 2),
            'status_duration' => $machine->currentStatusDuration(),
        ];

        return response()->json([
            'success' => true,
            'data' => $machine,
        ]);
    }

    public function update(UpdateMachineRequest $request, Machine $machine): JsonResponse
    {
        DB::beginTransaction();

        try {
            $oldLineId = $machine->production_line_id;
            $machine->update($request->validated());

            // If machine moved to different line, update both line statuses
            if ($request->has('production_line_id') && $oldLineId != $machine->production_line_id) {
                // Update old line status
                if ($oldLine = ProductionLine::find($oldLineId)) {
                    $oldLine->updateStatus();
                }
                // Update new line status
                $machine->productionLine->updateStatus();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Machine updated successfully',
                'data' => $machine->fresh(['productionLine']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update machine',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Machine $machine): JsonResponse
    {
        try {
            // Check if machine has active production
            $activeProduction = $machine->productionOutputs()
                ->where('recorded_at', '>=', now()->subHour())
                ->exists();

            if ($activeProduction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete machine with recent production activity',
                ], 400);
            }

            // Soft delete by setting is_active to false
            $machine->update(['is_active' => false]);

            // Update production line status
            $machine->productionLine->updateStatus();

            return response()->json([
                'success' => true,
                'message' => 'Machine deactivated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete machine',
                'error' => $e->getMessage(),
            ], 500);
        }
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

        DB::beginTransaction();

        try {
            $previousStatus = $machine->status;

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
                in_array($previousStatus, ['maintenance', 'breakdown']) &&
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

            DB::commit();

            // Broadcast status change
            broadcast(new MachineStatusUpdated($machine, $previousStatus));

            return response()->json([
                'success' => true,
                'message' => 'Machine status updated successfully',
                'data' => $machine->fresh(['currentStatusLog']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update machine status',
                'error' => $e->getMessage(),
            ], 500);
        }
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
