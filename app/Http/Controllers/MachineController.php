<?php

namespace App\Http\Controllers;

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
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MachineController extends Controller
{
    public function __construct(
        private OEECalculatorService $oeeService,
        private DowntimeAnalysisService $downtimeService
    ) {}

    public function index(Request $request)
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

        $machines = $query->paginate($request->get('per_page', 10));

        $productionLines = ProductionLine::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('machines/index', [
            'machines' => $machines,
            'productionLines' => $productionLines,
            'filters' => $request->only(['line_id', 'status', 'is_active', 'search']),
        ]);
    }

    public function create()
    {
        $productionLines = ProductionLine::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Machines/Create', [
            'productionLines' => $productionLines,
        ]);
    }

    public function store(StoreMachineRequest $request)
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

            return redirect()->route('machines.index')
                ->with('success', 'Machine created successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => 'Failed to create machine: ' . $e->getMessage()
            ])->withInput();
        }
    }

    public function show(Machine $machine)
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
        $statistics = [
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

        // Get OEE data
        $oeeData = $this->oeeService->calculateMachineOEE(
            $machine,
            Carbon::now()->startOfDay(),
            Carbon::now()
        );

        // Get reliability data
        $mtbf = $this->downtimeService->getMTBF($machine, now()->startOfMonth(), now());
        $mttr = $this->downtimeService->getMTTR($machine, now()->startOfMonth(), now());

        $reliabilityData = [
            'mtbf' => $mtbf,
            'mttr' => $mttr,
            'availability' => $mtbf > 0 ? round(($mtbf / ($mtbf + $mttr)) * 100, 2) : 0,
        ];

        return Inertia::render('Machines/Show', [
            'machine' => $machine,
            'statistics' => $statistics,
            'oeeData' => $oeeData,
            'reliabilityData' => $reliabilityData,
        ]);
    }

    public function edit(Machine $machine)
    {
        $productionLines = ProductionLine::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Machines/Edit', [
            'machine' => $machine->load('productionLine'),
            'productionLines' => $productionLines,
        ]);
    }

    public function update(UpdateMachineRequest $request, Machine $machine)
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

            return redirect()->route('machines.index')
                ->with('success', 'Machine updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => 'Failed to update machine: ' . $e->getMessage()
            ])->withInput();
        }
    }

    public function destroy(Machine $machine)
    {
        try {
            // Check if machine has active production
            $activeProduction = $machine->productionOutputs()
                ->where('recorded_at', '>=', now()->subHour())
                ->exists();

            if ($activeProduction) {
                return back()->withErrors([
                    'error' => 'Cannot delete machine with recent production activity'
                ]);
            }

            // Soft delete by setting is_active to false
            $machine->update(['is_active' => false]);

            // Update production line status
            $machine->productionLine->updateStatus();

            return redirect()->route('machines.index')
                ->with('success', 'Machine deactivated successfully');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to delete machine: ' . $e->getMessage()
            ]);
        }
    }

    public function updateStatus(Request $request, Machine $machine)
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

            return back()->with('success', 'Machine status updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => 'Failed to update machine status: ' . $e->getMessage()
            ]);
        }
    }
}
