<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionLine;
use App\Http\Requests\StoreProductionLineRequest;
use App\Http\Requests\UpdateProductionLineRequest;
use App\Services\RealTimeStatusService;
use App\Services\OEECalculatorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductionLineController extends Controller
{
    public function __construct(
        private RealTimeStatusService $statusService,
        private OEECalculatorService $oeeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ProductionLine::with(['machines' => function ($query) {
            $query->withCount(['downtimes' => function ($q) {
                $q->whereNull('ended_at');
            }]);
        }]);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name or code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $lines = $request->has('per_page')
            ? $query->paginate($request->per_page)
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $lines,
        ]);
    }

    public function store(StoreProductionLineRequest $request): JsonResponse
    {
        DB::beginTransaction();

        try {
            $line = ProductionLine::create($request->validated());

            // If machines are provided, create them too
            if ($request->has('machines')) {
                foreach ($request->machines as $machineData) {
                    $line->machines()->create($machineData);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Production line created successfully',
                'data' => $line->load('machines'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create production line',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(ProductionLine $line): JsonResponse
    {
        $line->load([
            'machines' => function ($query) {
                $query->withCount(['downtimes', 'productionOutputs'])
                    ->with('currentStatusLog');
            },
            'productionSchedules' => function ($query) {
                $query->whereIn('status', ['pending', 'in_progress'])
                    ->orderBy('scheduled_start');
            }
        ]);

        // Add summary statistics
        $line->statistics = [
            'total_machines' => $line->machines->count(),
            'active_machines' => $line->machines->where('is_active', true)->count(),
            'running_machines' => $line->machines->where('status', 'running')->count(),
            'current_downtimes' => $line->machines->sum('downtimes_count'),
            'upcoming_schedules' => $line->productionSchedules->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $line,
        ]);
    }

    public function update(UpdateProductionLineRequest $request, ProductionLine $line): JsonResponse
    {
        try {
            $line->update($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Production line updated successfully',
                'data' => $line->fresh('machines'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update production line',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(ProductionLine $line): JsonResponse
    {
        try {
            // Check if line has active schedules
            $activeSchedules = $line->productionSchedules()
                ->whereIn('status', ['pending', 'in_progress'])
                ->count();

            if ($activeSchedules > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete production line with active schedules',
                ], 400);
            }

            // Soft delete by setting is_active to false
            $line->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Production line deactivated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete production line',
                'error' => $e->getMessage(),
            ], 500);
        }
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
