<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ProductionLine;
use App\Http\Requests\StoreProductionLineRequest;
use App\Http\Requests\UpdateProductionLineRequest;
use App\Services\RealTimeStatusService;
use App\Services\OEECalculatorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductionLineController extends Controller
{
    public function __construct(
        private RealTimeStatusService $statusService,
        private OEECalculatorService $oeeService
    ) {}

    public function index(Request $request)
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

        $lines = $query->paginate($request->get('per_page', 10));

        return Inertia::render('production-lines', [
            'productionLines' => $lines,
            'filters' => $request->only(['status', 'is_active', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('ProductionLines/Create');
    }

    public function store(StoreProductionLineRequest $request)
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

            return redirect()->route('production-lines.index')
                ->with('success', 'Production line created successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => 'Failed to create production line: ' . $e->getMessage()
            ]);
        }
    }

    public function show(ProductionLine $productionLine)
    {
        $productionLine->load([
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
        $statistics = [
            'total_machines' => $productionLine->machines->count(),
            'active_machines' => $productionLine->machines->where('is_active', true)->count(),
            'running_machines' => $productionLine->machines->where('status', 'running')->count(),
            'current_downtimes' => $productionLine->machines->sum('downtimes_count'),
            'upcoming_schedules' => $productionLine->productionSchedules->count(),
        ];

        // Get OEE data for today
        $oeeData = $this->oeeService->calculateLineOEE(
            $productionLine,
            Carbon::now()->startOfDay(),
            Carbon::now()
        );

        return Inertia::render('ProductionLines/Show', [
            'productionLine' => $productionLine,
            'statistics' => $statistics,
            'oeeData' => $oeeData,
        ]);
    }

    public function edit(ProductionLine $productionLine)
    {
        return Inertia::render('ProductionLines/Edit', [
            'productionLine' => $productionLine->load('machines'),
        ]);
    }

    public function update(UpdateProductionLineRequest $request, ProductionLine $productionLine)
    {
        try {
            $productionLine->update($request->validated());

            return redirect()->route('production-lines.index')
                ->with('success', 'Production line updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to update production line: ' . $e->getMessage()
            ]);
        }
    }

    public function destroy(ProductionLine $productionLine)
    {
        try {
            // Check if line has active schedules
            $activeSchedules = $productionLine->productionSchedules()
                ->whereIn('status', ['pending', 'in_progress'])
                ->count();

            if ($activeSchedules > 0) {
                return back()->withErrors([
                    'error' => 'Cannot delete production line with active schedules'
                ]);
            }

            // Soft delete by setting is_active to false
            $productionLine->update(['is_active' => false]);

            return redirect()->route('production-lines.index')
                ->with('success', 'Production line deactivated successfully');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to delete production line: ' . $e->getMessage()
            ]);
        }
    }
}
