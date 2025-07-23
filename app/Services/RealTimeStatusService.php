<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\ProductionLine;
use App\Models\MachineStatusLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RealTimeStatusService
{
    public function getLineStatus(ProductionLine $line): array
    {
        $machines = $line->machines()->with(['statusLogs' => function ($query) {
            $query->whereNull('ended_at')->latest();
        }])->get();

        $statusCounts = [
            'running' => 0,
            'idle' => 0,
            'maintenance' => 0,
            'breakdown' => 0,
        ];

        $machineStatuses = $machines->map(function ($machine) use (&$statusCounts) {
            $currentStatus = $machine->status;
            $statusCounts[$currentStatus]++;

            $currentLog = $machine->statusLogs->first();
            $duration = $currentLog ? Carbon::now()->diffInSeconds($currentLog->started_at) : 0;

            return [
                'id' => $machine->id,
                'name' => $machine->name,
                'code' => $machine->code,
                'status' => $currentStatus,
                'status_duration' => $this->formatDuration($duration),
                'status_since' => $currentLog?->started_at,
            ];
        });

        return [
            'line' => [
                'id' => $line->id,
                'name' => $line->name,
                'status' => $line->status,
                'total_machines' => $machines->count(),
                'status_counts' => $statusCounts,
                'efficiency' => $machines->count() > 0
                    ? round(($statusCounts['running'] / $machines->count()) * 100, 2)
                    : 0,
            ],
            'machines' => $machineStatuses,
            'last_updated' => now(),
        ];
    }

    public function getAllLinesStatus(): Collection
    {
        return ProductionLine::where('is_active', true)
            ->get()
            ->map(function ($line) {
                return $this->getLineStatus($line);
            });
    }

    public function getMachineStatusHistory(Machine $machine, int $hours = 24): Collection
    {
        $startDate = Carbon::now()->subHours($hours);

        return $machine->statusLogs()
            ->where('started_at', '>=', $startDate)
            ->orderBy('started_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'status' => $log->status,
                    'started_at' => $log->started_at,
                    'ended_at' => $log->ended_at,
                    'duration' => $log->duration ? $this->formatDuration($log->duration) : null,
                ];
            });
    }

    public function getStatusTransitionMetrics(ProductionLine $line, string $period = 'day'): array
    {
        $startDate = $this->getStartDate($period);

        $transitions = MachineStatusLog::join('machines', 'machine_status_logs.machine_id', '=', 'machines.id')
            ->where('machines.production_line_id', $line->id)
            ->where('machine_status_logs.started_at', '>=', $startDate)
            ->selectRaw('
                machine_status_logs.status,
                COUNT(*) as count,
                SUM(machine_status_logs.duration) as total_duration,
                AVG(machine_status_logs.duration) as avg_duration
            ')
            ->groupBy('machine_status_logs.status')
            ->get();

        $totalTime = $transitions->sum('total_duration') ?: 1;

        return [
            'period' => $period,
            'start_date' => $startDate,
            'transitions' => $transitions->map(function ($item) use ($totalTime) {
                return [
                    'status' => $item->status,
                    'count' => $item->count,
                    'total_duration' => $this->formatDuration($item->total_duration),
                    'avg_duration' => $this->formatDuration(round($item->avg_duration)),
                    'percentage' => round(($item->total_duration / $totalTime) * 100, 2),
                ];
            })->toArray(),
        ];
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        } elseif ($seconds < 3600) {
            $minutes = floor($seconds / 60);
            $remainingSeconds = $seconds % 60;
            return "{$minutes}m {$remainingSeconds}s";
        } else {
            $hours = floor($seconds / 3600);
            $minutes = floor(($seconds % 3600) / 60);
            return "{$hours}h {$minutes}m";
        }
    }

    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'hour' => Carbon::now()->subHour(),
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            default => Carbon::now()->startOfDay(),
        };
    }
}
