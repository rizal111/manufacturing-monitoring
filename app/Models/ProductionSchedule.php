<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class ProductionSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_line_id',
        'product_name',
        'product_code',
        'planned_quantity',
        'actual_quantity',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'status',
        'shift',
        'metadata'
    ];

    protected $casts = [
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'actual_start' => 'datetime',
        'actual_end' => 'datetime',
        'planned_quantity' => 'integer',
        'actual_quantity' => 'integer',
        'metadata' => 'array',
    ];

    public function productionLine(): BelongsTo
    {
        return $this->belongsTo(ProductionLine::class);
    }

    public function productionOutputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class);
    }

    public function getCompletionPercentageAttribute(): float
    {
        if ($this->planned_quantity === 0) {
            return 0;
        }
        return round(($this->actual_quantity / $this->planned_quantity) * 100, 2);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('status', 'pending')
            ->where('scheduled_start', '>', now());
    }

    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('status', 'in_progress');
    }
}
