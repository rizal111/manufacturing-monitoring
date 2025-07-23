<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOutput extends Model
{
    use HasFactory;

    protected $fillable = [
        'machine_id',
        'production_schedule_id',
        'quantity_produced',
        'quantity_rejected',
        'cycle_time',
        'recorded_at'
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'quantity_produced' => 'integer',
        'quantity_rejected' => 'integer',
        'cycle_time' => 'decimal:2',
    ];

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function productionSchedule(): BelongsTo
    {
        return $this->belongsTo(ProductionSchedule::class);
    }

    public function getQualityRateAttribute(): float
    {
        if ($this->quantity_produced === 0) {
            return 0;
        }
        return round((($this->quantity_produced - $this->quantity_rejected) / $this->quantity_produced) * 100, 2);
    }
}
