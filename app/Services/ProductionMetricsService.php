<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\ProductionLine;
use App\Models\ProductionSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class ProductionMetricsService
{
    public function getProductionTrends(ProductionLine $line, string $period = 'week'): Collection
    {
        $startDate = $this->getStartDate($period);
        $groupBy = $this->getGroupByFormat($period);

        return DB::table('production_outputs')
            ->join('machines', 'production_outputs.machine_id', '=', 'machines.id')
            ->where('machines.production_line_id', $line->id)
            ->where('production_outputs.recorded_at', '>=', $startDate)
            ->selectRaw("
                DATE_FORMAT(recorded_at, '{$groupBy}') as period,
                SUM(quantity_produced) as total_produced,
                SUM(quantity_rejected) as total_rejected,
                COUNT(DISTINCT machine_id) as machines_used,
                AVG(cycle_time) as avg_cycle_time
            ")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) {
                $item->efficiency = $item->total_produced > 0
                    ? round((($item->total_produced - $item->total_rejected) / $item->total_produced) * 100, 2)
                    : 0;
                return $item;
            });
    }

    public function getMachinePerformanceComparison(ProductionLine $line, string $period = 'week'): Collection
    {
        $startDate = $this->getStartDate($period);

        $performances = DB::table('production_outputs')
            ->join('machines', 'production_outputs.machine_id', '=', 'machines.id')
            ->where('machines.production_line_id', $line->id)
            ->where('production_outputs.recorded_at', '>=', $startDate)
            ->selectRaw('
                machines.id,
                machines.name,
                machines.code,
                SUM(quantity_produced) as total_produced,
                SUM(quantity_rejected) as total_rejected,
                AVG(cycle_time) as avg_cycle_time,
                COUNT(*) as production_runs
            ')
            ->groupBy('machines.id', 'machines.name', 'machines.code')
            ->orderByDesc('total_produced')
            ->get();

        // Calculate efficiency for each machine
        return $performances->map(function ($machine) use ($startDate) {
            $machine->efficiency = $machine->total_produced > 0
                ? round((($machine->total_produced - $machine->total_rejected) / $machine->total_produced) * 100, 2)
                : 0;

            // Get current status
            $currentMachine = Machine::find($machine->id);
            $machine->current_status = $currentMachine->status;
            $machine->status_duration = $currentMachine->currentStatusDuration();

            return $machine;
        });
    }

    public function getDowntimePareto(?ProductionLine $line = null, string $period = 'month'): array
    {
        $startDate = $this->getStartDate($period);

        if ($line) {
            $downtimes = DB::table('downtimes')
                ->join('machines', 'downtimes.machine_id', '=', 'machines.id')->where('machines.production_line_id', $line->id);
        } else {
            $downtimes = DB::table('downtimes')
                ->join('machines', 'downtimes.machine_id', '=', 'machines.id');
        }

        $downtimes = $downtimes
            ->where('downtimes.started_at', '>=', $startDate)
            ->selectRaw('
                downtimes.reason,
                downtimes.category,
                COUNT(*) as frequency,
                SUM(downtimes.duration) as total_duration,
                AVG(downtimes.duration) as avg_duration
            ')
            ->groupBy('downtimes.reason', 'downtimes.category')
            ->orderByDesc('total_duration')
            ->limit(10)
            ->get();;

        // $downtimes->where('downtimes.started_at', '>=', $startDate)
        //     ->selectRaw('
        //         downtimes.reason,
        //         downtimes.category,
        //         COUNT(*) as frequency,
        //         SUM(downtimes.duration) as total_duration,
        //         AVG(downtimes.duration) as avg_duration
        //     ')
        //     ->groupBy('downtimes.reason', 'downtimes.category')
        //     ->orderByDesc('total_duration')
        //     ->limit(10)
        //     ->get();

        $totalDowntime = $downtimes->sum('total_duration');

        $cumulativePercentage = 0;
        $paretoData = $downtimes->map(function ($item) use ($totalDowntime, &$cumulativePercentage) {
            $percentage = $totalDowntime > 0 ? ($item->total_duration / $totalDowntime) * 100 : 0;
            $cumulativePercentage += $percentage;

            return [
                'reason' => $item->reason,
                'category' => $item->category,
                'frequency' => $item->frequency,
                'total_duration' => $item->total_duration,
                'avg_duration' => round($item->avg_duration),
                'percentage' => round($percentage, 2),
                'cumulative_percentage' => round($cumulativePercentage, 2)
            ];
        });

        return [
            'data' => $paretoData,
            'total_downtime' => $totalDowntime,
            'period' => $period,
            'start_date' => $startDate->format('Y-m-d')
        ];
    }

    public function getProductionScheduleStatus(?ProductionLine $line = null): array
    {

        $current = ProductionSchedule::when($line, fn($q) => $q->where('production_line_id', $line->id))
            ->current()
            ->with('productionOutputs')
            ->first();

        $upcoming = ProductionSchedule::when($line, fn($q) => $q->where('production_line_id', $line->id))
            ->upcoming()
            ->orderBy('scheduled_start')
            ->limit(5)
            ->get();

        $recentCompleted = ProductionSchedule::when($line, fn($q) => $q->where('production_line_id', $line->id))
            ->where('status', 'completed')
            ->orderByDesc('actual_end')
            ->limit(5)
            ->get();

        return [
            'current' => $current ? [
                'id' => $current->id,
                'product_name' => $current->product_name,
                'product_code' => $current->product_code,
                'planned_quantity' => $current->planned_quantity,
                'actual_quantity' => $current->actual_quantity,
                'completion_percentage' => $current->completion_percentage,
                'scheduled_start' => $current->scheduled_start,
                'scheduled_end' => $current->scheduled_end,
                'actual_start' => $current->actual_start,
                'time_elapsed' => $current->actual_start ? now()->diffInMinutes($current->actual_start) : 0,
                'time_remaining' => $current->scheduled_end ? now()->diffInMinutes($current->scheduled_end, false) : 0,
            ] : null,
            'upcoming' => $upcoming->map(fn($schedule) => [
                'id' => $schedule->id,
                'product_name' => $schedule->product_name,
                'planned_quantity' => $schedule->planned_quantity,
                'scheduled_start' => $schedule->scheduled_start,
                'scheduled_end' => $schedule->scheduled_end,
                'shift' => $schedule->shift,
            ]),
            'recent_completed' => $recentCompleted->map(fn($schedule) => [
                'id' => $schedule->id,
                'product_name' => $schedule->product_name,
                'planned_quantity' => $schedule->planned_quantity,
                'actual_quantity' => $schedule->actual_quantity,
                'completion_percentage' => $schedule->completion_percentage,
                'actual_end' => $schedule->actual_end,
            ])
        ];
    }

    public function getRealTimeMetrics(ProductionLine $line): array
    {
        $machines = $line->machines;
        $runningMachines = $machines->where('status', 'running')->count();
        $totalMachines = $machines->count();

        // Get last hour production
        $lastHourProduction = DB::table('production_outputs')
            ->join('machines', 'production_outputs.machine_id', '=', 'machines.id')
            ->where('machines.production_line_id', $line->id)
            ->where('production_outputs.recorded_at', '>=', now()->subHour())
            ->sum('quantity_produced');

        // Get current shift production
        $currentShiftStart = $this->getCurrentShiftStart();
        $currentShiftProduction = DB::table('production_outputs')
            ->join('machines', 'production_outputs.machine_id', '=', 'machines.id')
            ->where('machines.production_line_id', $line->id)
            ->where('production_outputs.recorded_at', '>=', $currentShiftStart)
            ->selectRaw('SUM(quantity_produced) as produced, SUM(quantity_rejected) as rejected')
            ->first();

        return [
            'line_status' => $line->status,
            'machines_running' => $runningMachines,
            'machines_total' => $totalMachines,
            'utilization_rate' => $totalMachines > 0 ? round(($runningMachines / $totalMachines) * 100, 2) : 0,
            'last_hour_production' => $lastHourProduction ?: 0,
            'current_shift' => [
                'produced' => $currentShiftProduction->produced ?? 0,
                'rejected' => $currentShiftProduction->rejected ?? 0,
                'quality_rate' => $currentShiftProduction->produced > 0
                    ? round((($currentShiftProduction->produced - $currentShiftProduction->rejected) / $currentShiftProduction->produced) * 100, 2)
                    : 0,
                'start_time' => $currentShiftStart,
            ]
        ];
    }

    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfWeek(),
        };
    }

    private function getGroupByFormat(string $period): string
    {
        return match ($period) {
            'day' => '%Y-%m-%d %H:00:00',
            'week' => '%Y-%m-%d',
            'month' => '%Y-%m-%d',
            'quarter' => '%Y-%m',
            'year' => '%Y-%m',
            default => '%Y-%m-%d',
        };
    }

    private function getCurrentShiftStart(): Carbon
    {
        $hour = now()->hour;

        if ($hour >= 6 && $hour < 14) {
            return today()->setTime(6, 0);
        } elseif ($hour >= 14 && $hour < 22) {
            return today()->setTime(14, 0);
        } else {
            return $hour >= 22 ? today()->setTime(22, 0) : Carbon::yesterday()->setTime(22, 0);
        }
    }
}
