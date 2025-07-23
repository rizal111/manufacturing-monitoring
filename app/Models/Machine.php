<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Machine extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_line_id',
        'name',
        'code',
        'status',
        'description',
        'ideal_cycle_time',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'ideal_cycle_time' => 'integer',
    ];

    public function productionLine(): BelongsTo
    {
        return $this->belongsTo(ProductionLine::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(MachineStatusLog::class);
    }

    public function downtimes(): HasMany
    {
        return $this->hasMany(Downtime::class);
    }

    public function productionOutputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class);
    }

    public function currentStatusLog()
    {
        return $this->statusLogs()->whereNull('ended_at')->latest()->first();
    }

    public function currentStatusDuration(): int
    {
        $currentLog = $this->currentStatusLog();
        if ($currentLog) {
            return Carbon::now()->diffInSeconds($currentLog->started_at);
        }
        return 0;
    }

    public function updateStatus(string $newStatus): void
    {
        // End current status log
        $currentLog = $this->currentStatusLog();
        if ($currentLog) {
            $currentLog->update([
                'ended_at' => now(),
                'duration' => Carbon::now()->diffInSeconds($currentLog->started_at)
            ]);
        }

        // Create new status log
        $this->statusLogs()->create([
            'status' => $newStatus,
            'started_at' => now()
        ]);

        // Update machine status
        $this->update(['status' => $newStatus]);

        // Update production line status
        $this->productionLine->updateStatus();
    }
}
