<?php

namespace App\Services;

use App\Models\ProductionLine;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardMetricsService
{
    private OEECalculatorService $oeeService;
    private ProductionMetricsService $metricsService;
    private DowntimeAnalysisService $downtimeService;
    private RealTimeStatusService $statusService;
    private ProductionScheduleService $scheduleService;

    public function __construct(
        OEECalculatorService $oeeService,
        ProductionMetricsService $metricsService,
        DowntimeAnalysisService $downtimeService,
        RealTimeStatusService $statusService,
        ProductionScheduleService $scheduleService
    ) {
        $this->oeeService = $oeeService;
        $this->metricsService = $metricsService;
        $this->downtimeService = $downtimeService;
        $this->statusService = $statusService;
        $this->scheduleService = $scheduleService;
    }

    public function getDashboardData(?ProductionLine $line = null, string $period = 'day'): array
    {
        $cacheKey = 'dashboard_' . ($line?->id ?? 'all') . '_' . $period;
        $cacheDuration = $this->getCacheDuration($period);

        return Cache::remember($cacheKey, $cacheDuration, function () use ($line, $period) {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();

            $data = [
                'overview' => $this->getOverviewMetrics($line, $startDate, $endDate),
                'oee' => $this->getOEEMetrics($line, $startDate, $endDate),
                'production' => $this->getProductionMetrics($line, $period),
                'downtime' => $this->getDowntimeMetrics($line, $period),
                'schedule' => $this->getScheduleMetrics($line),
                'real_time' => $this->getRealTimeMetrics($line),
                'period' => $period,
                'timestamp' => now(),
            ];

            if (!$line) {
                $data['lines'] = $this->getAllLinesMetrics($startDate, $endDate);
            }

            return $data;
        });
    }

    /** 
     * This is a detailed explanation
     * of something that should require
     * several paragraphs of information.
     */
    private function getOverviewMetrics(?ProductionLine $line = null, Carbon $startDate, Carbon $endDate): array
    {
        if ($line) {
            $machines = $line->machines;
            $totalMachines = $machines->count();
            $runningMachines = $machines->where('status', 'running')->count();
            $idleMachines = $machines->where('status', 'idle')->count();
            $maintenanceMachines = $machines->where('status', 'maintenance')->count();
            $breakdownMachines = $machines->where('status', 'breakdown')->count();
        } else {
            $totalMachines = \App\Models\Machine::count();
            $runningMachines = \App\Models\Machine::where('status', 'running')->count();
            $idleMachines = \App\Models\Machine::where('status', 'idle')->count();
            $maintenanceMachines = \App\Models\Machine::where('status', 'maintenance')->count();
            $breakdownMachines = \App\Models\Machine::where('status', 'breakdown')->count();
        }

        return [
            'total_machines' => $totalMachines,
            'running_machines' => $runningMachines,
            'idle_machines' => $idleMachines,
            'maintenance_machines' => $maintenanceMachines,
            'breakdown_machines' => $breakdownMachines,
            'utilization_rate' => $totalMachines > 0 ? round(($runningMachines / $totalMachines) * 100, 2) : 0,
        ];
    }

    private function getOEEMetrics(?ProductionLine $line = null, Carbon $startDate, Carbon $endDate): array
    {
        if ($line) {
            $oeeData = $this->oeeService->calculateLineOEE($line, $startDate, $endDate);
        } else {
            // Calculate average OEE across all lines
            $lines = ProductionLine::where('is_active', true)->get();
            $totalOEE = 0;
            $totalAvailability = 0;
            $totalPerformance = 0;
            $totalQuality = 0;
            $count = 0;

            foreach ($lines as $productionLine) {
                $lineOEE = $this->oeeService->calculateLineOEE($productionLine, $startDate, $endDate);
                if ($lineOEE['machine_count'] > 0) {
                    $totalOEE += $lineOEE['oee'];
                    $totalAvailability += $lineOEE['availability'];
                    $totalPerformance += $lineOEE['performance'];
                    $totalQuality += $lineOEE['quality'];
                    $count++;
                }
            }

            $oeeData = [
                'oee' => $count > 0 ? round($totalOEE / $count, 2) : 0,
                'availability' => $count > 0 ? round($totalAvailability / $count, 2) : 0,
                'performance' => $count > 0 ? round($totalPerformance / $count, 2) : 0,
                'quality' => $count > 0 ? round($totalQuality / $count, 2) : 0,
            ];
        }

        return $oeeData;
    }

    private function getProductionMetrics(?ProductionLine $line = null, string $period): array
    {
        if ($line) {
            $trends = $this->metricsService->getProductionTrends($line, $period);
            $machineComparison = $this->metricsService->getMachinePerformanceComparison($line, $period);
        } else {
            // Aggregate data for all lines
            $trends = collect();
            $machineComparison = collect();

            $lines = ProductionLine::where('is_active', true)->get();
            foreach ($lines as $productionLine) {
                $lineTrends = $this->metricsService->getProductionTrends($productionLine, $period);
                $trends = $trends->merge($lineTrends);
            }
        }

        return [
            'trends' => $trends,
            'machine_comparison' => $machineComparison,
            'total_production' => $trends->sum('total_produced'),
            'total_rejected' => $trends->sum('total_rejected'),
            'average_efficiency' => $trends->avg('efficiency') ?: 0,
        ];
    }

    private function getDowntimeMetrics(?ProductionLine $line = null, string $period): array
    {
        $paretoData = $this->metricsService->getDowntimePareto($line, $period);
        $currentDowntimes = $this->downtimeService->getCurrentDowntimes($line);
        $categoryStats = $this->downtimeService->getDowntimeStatsByCategory($line, $period);

        return [
            'pareto' => $paretoData,
            'current_downtimes' => $currentDowntimes,
            'category_stats' => $categoryStats,
            'total_downtime_hours' => round($paretoData['total_downtime'] / 3600, 2),
        ];
    }

    private function getScheduleMetrics(?ProductionLine $line = null): array
    {
        $scheduleStatus = $this->metricsService->getProductionScheduleStatus($line);
        $plannedVsActual = $this->scheduleService->getPlannedVsActual($line, 'week');
        $delayedSchedules = $this->scheduleService->getDelayedSchedules($line);

        return [
            'current_schedule' => $scheduleStatus['current'],
            'upcoming_schedules' => $scheduleStatus['upcoming'],
            'planned_vs_actual' => $plannedVsActual,
            'delayed_schedules' => $delayedSchedules,
            'delayed_count' => $delayedSchedules->count(),
        ];
    }

    private function getRealTimeMetrics(?ProductionLine $line = null): array
    {
        if ($line) {
            $realTimeMetrics = $this->metricsService->getRealTimeMetrics($line);
            $statusData = $this->statusService->getLineStatus($line);
        } else {
            $realTimeMetrics = [
                'lines_running' => ProductionLine::where('status', 'running')->count(),
                'total_lines' => ProductionLine::where('is_active', true)->count(),
            ];
            $statusData = $this->statusService->getAllLinesStatus();
        }

        return [
            'metrics' => $realTimeMetrics,
            'status' => $statusData,
        ];
    }

    private function getAllLinesMetrics(Carbon $startDate, Carbon $endDate): array
    {
        $lines = ProductionLine::where('is_active', true)->get();

        return $lines->map(function ($line) use ($startDate, $endDate) {
            $oee = $this->oeeService->calculateLineOEE($line, $startDate, $endDate);
            $realTime = $this->metricsService->getRealTimeMetrics($line);

            return [
                'id' => $line->id,
                'name' => $line->name,
                'status' => $line->status,
                'oee' => $oee['oee'],
                'machines_running' => $realTime['machines_running'],
                'machines_total' => $realTime['machines_total'],
                'current_shift_production' => $realTime['current_shift']['produced'],
            ];
        })->toArray();
    }

    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'hour' => Carbon::now()->subHour(),
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfDay(),
        };
    }

    private function getCacheDuration(string $period): int
    {
        return match ($period) {
            'hour' => 60, // 1 minute
            'day' => 300, // 5 minutes
            'week' => 900, // 15 minutes
            'month' => 1800, // 30 minutes
            default => 300, // 5 minutes
        };
    }
}
