<?php

namespace App\Services;

use App\Models\Downtime;
use App\Models\Machine;
use App\Models\ProductionLine;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DowntimeAnalysisService
{
    public function getCurrentDowntimes(?ProductionLine $line = null): Collection
    {
        $query = Downtime::with(['machine.productionLine'])
            ->whereNull('ended_at');

        if ($line) {
            $query->whereHas('machine', function ($q) use ($line) {
                $q->where('production_line_id', $line->id);
            });
        }

        return $query->get()->map(function ($downtime) {
            return [
                'id' => $downtime->id,
                'machine' => [
                    'id' => $downtime->machine->id,
                    'name' => $downtime->machine->name,
                    'line' => $downtime->machine->productionLine->name,
                ],
                'reason' => $downtime->reason,
                'category' => $downtime->category,
                'started_at' => $downtime->started_at,
                'duration' => Carbon::now()->diffInMinutes($downtime->started_at),
                'is_planned' => $downtime->is_planned,
            ];
        });
    }

    public function getDowntimeHistory(?ProductionLine $line = null, ?Carbon $startDate = null, ?Carbon $endDate = null): Collection
    {
        $startDate = $startDate ?? Carbon::now()->startOfMonth();
        $endDate = $endDate ?? Carbon::now();

        $query = Downtime::with(['machine.productionLine'])
            ->whereNotNull('ended_at')
            ->whereBetween('started_at', [$startDate, $endDate]);

        if ($line) {
            $query->whereHas('machine', function ($q) use ($line) {
                $q->where('production_line_id', $line->id);
            });
        }

        return $query->orderByDesc('started_at')
            ->get()
            ->map(function ($downtime) {
                return [
                    'id' => $downtime->id,
                    'machine' => [
                        'id' => $downtime->machine->id,
                        'name' => $downtime->machine->name,
                        'line' => $downtime->machine->productionLine->name,
                    ],
                    'reason' => $downtime->reason,
                    'category' => $downtime->category,
                    'started_at' => $downtime->started_at,
                    'ended_at' => $downtime->ended_at,
                    'duration' => $downtime->duration,
                    'is_planned' => $downtime->is_planned,
                ];
            });
    }

    public function getDowntimeStatsByCategory(?ProductionLine $line = null, string $period = 'month'): array
    {
        $startDate = $this->getStartDate($period);

        $query = DB::table('downtimes')
            ->join('machines', 'downtimes.machine_id', '=', 'machines.id')
            ->where('downtimes.started_at', '>=', $startDate)
            ->whereNotNull('downtimes.ended_at');

        if ($line) {
            $query->where('machines.production_line_id', $line->id);
        }

        $stats = $query->selectRaw('
                downtimes.category,
                COUNT(*) as count,
                SUM(downtimes.duration) as total_duration,
                AVG(downtimes.duration) as avg_duration,
                MIN(downtimes.duration) as min_duration,
                MAX(downtimes.duration) as max_duration
            ')
            ->groupBy('downtimes.category')
            ->get();

        $totalDowntime = $stats->sum('total_duration');

        return $stats->map(function ($stat) use ($totalDowntime) {
            return [
                'category' => $stat->category,
                'count' => $stat->count,
                'total_duration' => $stat->total_duration,
                'avg_duration' => round($stat->avg_duration),
                'min_duration' => $stat->min_duration,
                'max_duration' => $stat->max_duration,
                'percentage' => $totalDowntime > 0 ? round(($stat->total_duration / $totalDowntime) * 100, 2) : 0,
            ];
        })->toArray();
    }

    public function getMTBF(Machine $machine, Carbon $startDate, Carbon $endDate): float
    {
        // Mean Time Between Failures
        $failureCount = $machine->downtimes()
            ->unplanned()
            ->whereBetween('started_at', [$startDate, $endDate])
            ->count();

        if ($failureCount === 0) {
            return 0;
        }

        $totalUptime = $machine->statusLogs()
            ->where('status', 'running')
            ->whereBetween('started_at', [$startDate, $endDate])
            ->sum('duration');

        return round($totalUptime / $failureCount / 3600, 2); // Convert to hours
    }

    public function getMTTR(Machine $machine, Carbon $startDate, Carbon $endDate): float
    {
        // Mean Time To Repair
        $downtimes = $machine->downtimes()
            ->unplanned()
            ->whereBetween('started_at', [$startDate, $endDate])
            ->whereNotNull('ended_at')
            ->get();

        if ($downtimes->isEmpty()) {
            return 0;
        }

        $totalRepairTime = $downtimes->sum('duration');
        return round($totalRepairTime / $downtimes->count() / 60, 2); // Convert to minutes
    }

    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };
    }
}
