<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\ProductionLine;
use Carbon\Carbon;

class OEECalculatorService
{
    // Working hours per day (configurable)
    private const WORKING_HOURS_PER_DAY = 16; // 2 shifts of 8 hours

    public function calculateMachineOEE(Machine $machine, Carbon $startDate, Carbon $endDate): array
    {
        $availability = $this->calculateAvailability($machine, $startDate, $endDate);
        $performance = $this->calculatePerformance($machine, $startDate, $endDate);
        $quality = $this->calculateQuality($machine, $startDate, $endDate);
        $oee = $availability * $performance * $quality;

        return [
            'oee' => round($oee * 100, 2),
            'availability' => round($availability * 100, 2),
            'performance' => round($performance * 100, 2),
            'quality' => round($quality * 100, 2),
            'details' => [
                'planned_production_time' => $this->getPlannedProductionTime($startDate, $endDate),
                'run_time' => $this->getRunTime($machine, $startDate, $endDate),
                'downtime' => $this->getTotalDowntime($machine, $startDate, $endDate),
                'total_produced' => $this->getTotalProduced($machine, $startDate, $endDate),
                'good_parts' => $this->getGoodParts($machine, $startDate, $endDate),
                'rejected_parts' => $this->getRejectedParts($machine, $startDate, $endDate),
            ]
        ];
    }

    public function calculateLineOEE(ProductionLine $line, Carbon $startDate, Carbon $endDate): array
    {
        $machines = $line->activeMachines;
        if ($machines->isEmpty()) {
            return $this->emptyOEEResult();
        }

        $totalOEE = 0;
        $totalAvailability = 0;
        $totalPerformance = 0;
        $totalQuality = 0;
        $machineResults = [];

        foreach ($machines as $machine) {
            $machineOEE = $this->calculateMachineOEE($machine, $startDate, $endDate);
            $totalOEE += $machineOEE['oee'];
            $totalAvailability += $machineOEE['availability'];
            $totalPerformance += $machineOEE['performance'];
            $totalQuality += $machineOEE['quality'];

            $machineResults[] = [
                'machine_id' => $machine->id,
                'machine_name' => $machine->name,
                'oee' => $machineOEE['oee']
            ];
        }

        $machineCount = $machines->count();

        return [
            'oee' => round($totalOEE / $machineCount, 2),
            'availability' => round($totalAvailability / $machineCount, 2),
            'performance' => round($totalPerformance / $machineCount, 2),
            'quality' => round($totalQuality / $machineCount, 2),
            'machine_count' => $machineCount,
            'machines' => $machineResults
        ];
    }

    private function calculateAvailability(Machine $machine, Carbon $startDate, Carbon $endDate): float
    {
        $plannedTime = $this->getPlannedProductionTime($startDate, $endDate);
        if ($plannedTime === 0) {
            return 0;
        }

        $unplannedDowntime = $machine->downtimes()
            ->unplanned()
            ->whereBetween('started_at', [$startDate, $endDate])
            ->sum('duration');

        $runTime = $plannedTime - $unplannedDowntime;
        return max(0, min(1, $runTime / $plannedTime));
    }

    private function calculatePerformance(Machine $machine, Carbon $startDate, Carbon $endDate): float
    {
        $runTime = $this->getRunTime($machine, $startDate, $endDate);
        if ($runTime === 0) {
            return 0;
        }

        $totalProduced = $this->getTotalProduced($machine, $startDate, $endDate);
        $idealCycleTime = $machine->ideal_cycle_time;

        $theoreticalOutput = $runTime / $idealCycleTime;
        if ($theoreticalOutput === 0) {
            return 0;
        }

        return max(0, min(1, $totalProduced / $theoreticalOutput));
    }

    private function calculateQuality(Machine $machine, Carbon $startDate, Carbon $endDate): float
    {
        $totalProduced = $this->getTotalProduced($machine, $startDate, $endDate);
        if ($totalProduced === 0) {
            return 0;
        }

        $goodParts = $this->getGoodParts($machine, $startDate, $endDate);
        return max(0, min(1, $goodParts / $totalProduced));
    }

    private function getPlannedProductionTime(Carbon $startDate, Carbon $endDate): int
    {
        $days = $startDate->diffInDays($endDate);
        return $days * self::WORKING_HOURS_PER_DAY * 3600; // Convert to seconds
    }

    private function getRunTime(Machine $machine, Carbon $startDate, Carbon $endDate): int
    {
        return $machine->statusLogs()
            ->where('status', 'running')
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('started_at', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('started_at', '<', $startDate)
                            ->where(function ($q2) use ($endDate) {
                                $q2->whereNull('ended_at')
                                    ->orWhere('ended_at', '>', $endDate);
                            });
                    });
            })
            ->sum('duration') ?: 0;
    }

    private function getTotalDowntime(Machine $machine, Carbon $startDate, Carbon $endDate): int
    {
        return $machine->downtimes()
            ->whereBetween('started_at', [$startDate, $endDate])
            ->sum('duration') ?: 0;
    }

    private function getTotalProduced(Machine $machine, Carbon $startDate, Carbon $endDate): int
    {
        return $machine->productionOutputs()
            ->whereBetween('recorded_at', [$startDate, $endDate])
            ->sum('quantity_produced') ?: 0;
    }

    private function getGoodParts(Machine $machine, Carbon $startDate, Carbon $endDate): int
    {
        $outputs = $machine->productionOutputs()
            ->whereBetween('recorded_at', [$startDate, $endDate])
            ->selectRaw('SUM(quantity_produced) as total_produced, SUM(quantity_rejected) as total_rejected')
            ->first();

        return ($outputs->total_produced ?? 0) - ($outputs->total_rejected ?? 0);
    }

    private function getRejectedParts(Machine $machine, Carbon $startDate, Carbon $endDate): int
    {
        return $machine->productionOutputs()
            ->whereBetween('recorded_at', [$startDate, $endDate])
            ->sum('quantity_rejected') ?: 0;
    }

    private function emptyOEEResult(): array
    {
        return [
            'oee' => 0,
            'availability' => 0,
            'performance' => 0,
            'quality' => 0,
            'machine_count' => 0,
            'machines' => []
        ];
    }
}
