<?php

namespace App\Services;

use App\Models\ProductionLine;
use App\Models\ProductionSchedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProductionScheduleService
{
    public function getScheduleOverview(?ProductionLine $line): array
    {
        $query = ProductionSchedule::with('productionLine');

        if ($line) {
            $query->where('production_line_id', $line->id);
        }

        $schedules = $query->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('scheduled_start')
            ->get();

        $grouped = $schedules->groupBy(function ($schedule) {
            return $schedule->scheduled_start->format('Y-m-d');
        });

        return [
            'today' => $this->formatSchedules($grouped->get(today()->format('Y-m-d'), collect())),
            'tomorrow' => $this->formatSchedules($grouped->get(today()->addDay()->format('Y-m-d'), collect())),
            'this_week' => $this->formatSchedules(
                $schedules->filter(function ($schedule) {
                    return $schedule->scheduled_start->isCurrentWeek();
                })
            ),
            'next_week' => $this->formatSchedules(
                $schedules->filter(function ($schedule) {
                    return $schedule->scheduled_start->isNextWeek();
                })
            ),
        ];
    }

    public function getPlannedVsActual(?ProductionLine $line, string $period = 'week'): array
    {
        $startDate = $this->getStartDate($period);

        $query = ProductionSchedule::where('scheduled_start', '>=', $startDate);

        if ($line) {
            $query->where('production_line_id', $line->id);
        }

        $schedules = $query->get();

        $summary = [
            'total_schedules' => $schedules->count(),
            'completed' => $schedules->where('status', 'completed')->count(),
            'in_progress' => $schedules->where('status', 'in_progress')->count(),
            'pending' => $schedules->where('status', 'pending')->count(),
            'cancelled' => $schedules->where('status', 'cancelled')->count(),
            'total_planned_quantity' => $schedules->sum('planned_quantity'),
            'total_actual_quantity' => $schedules->sum('actual_quantity'),
            'achievement_rate' => $schedules->sum('planned_quantity') > 0
                ? round(($schedules->sum('actual_quantity') / $schedules->sum('planned_quantity')) * 100, 2)
                : 0,
        ];

        $daily = DB::table('production_schedules')
            ->selectRaw('
                DATE(scheduled_start) as date,
                SUM(planned_quantity) as planned,
                SUM(actual_quantity) as actual,
                COUNT(*) as schedule_count
            ')
            ->when($line, function ($query, $line) {
                return $query->where('production_line_id', $line->id);
            })
            ->where('scheduled_start', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'summary' => $summary,
            'daily' => $daily,
            'period' => $period,
            'start_date' => $startDate,
        ];
    }

    public function getShiftAnalysis(?ProductionLine $line, int $days = 7): array
    {
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        $query = ProductionSchedule::where('scheduled_start', '>=', $startDate)
            ->whereNotNull('shift');

        if ($line) {
            $query->where('production_line_id', $line->id);
        }

        $shiftData = $query->selectRaw('
                shift,
                COUNT(*) as schedule_count,
                SUM(planned_quantity) as total_planned,
                SUM(actual_quantity) as total_actual,
                AVG(CASE WHEN planned_quantity > 0 THEN (actual_quantity / planned_quantity) * 100 ELSE 0 END) as avg_achievement
            ')
            ->groupBy('shift')
            ->get();

        $shiftPerformance = [];
        foreach (['morning', 'afternoon', 'night'] as $shift) {
            $data = $shiftData->firstWhere('shift', $shift);
            $shiftPerformance[$shift] = [
                'schedule_count' => $data?->schedule_count ?? 0,
                'total_planned' => $data?->total_planned ?? 0,
                'total_actual' => $data?->total_actual ?? 0,
                'avg_achievement' => round($data?->avg_achievement ?? 0, 2),
            ];
        }

        return [
            'shift_performance' => $shiftPerformance,
            'best_shift' => collect($shiftPerformance)->sortByDesc('avg_achievement')->keys()->first(),
            'period_days' => $days,
            'start_date' => $startDate,
        ];
    }

    public function getDelayedSchedules(?ProductionLine $line): Collection
    {
        $query = ProductionSchedule::with('productionLine')
            ->where('status', 'in_progress')
            ->where('scheduled_end', '<', now());

        if ($line) {
            $query->where('production_line_id', $line->id);
        }

        return $query->get()->map(function ($schedule) {
            $delayHours = now()->diffInHours($schedule->scheduled_end);
            return [
                'id' => $schedule->id,
                'product_name' => $schedule->product_name,
                'product_code' => $schedule->product_code,
                'line' => $schedule->productionLine->name,
                'scheduled_end' => $schedule->scheduled_end,
                'delay_hours' => $delayHours,
                'completion_percentage' => $schedule->completion_percentage,
                'remaining_quantity' => $schedule->planned_quantity - $schedule->actual_quantity,
            ];
        });
    }

    private function formatSchedules(Collection $schedules): array
    {
        return $schedules->map(function ($schedule) {
            return [
                'id' => $schedule->id,
                'product_name' => $schedule->product_name,
                'product_code' => $schedule->product_code,
                'line' => $schedule->productionLine->name,
                'planned_quantity' => $schedule->planned_quantity,
                'actual_quantity' => $schedule->actual_quantity,
                'status' => $schedule->status,
                'shift' => $schedule->shift,
                'scheduled_start' => $schedule->scheduled_start,
                'scheduled_end' => $schedule->scheduled_end,
                'completion_percentage' => $schedule->completion_percentage,
            ];
        })->toArray();
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
}
