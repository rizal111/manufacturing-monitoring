<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Downtime extends Model
{
    use HasFactory;

    protected $fillable = [
        'machine_id',
        'reason',
        'description',
        'started_at',
        'ended_at',
        'duration',
        'category',
        'is_planned'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration' => 'integer',
        'is_planned' => 'boolean',
    ];

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function scopeUnplanned(Builder $query): Builder
    {
        return $query->where('is_planned', false);
    }

    public function scopePlanned(Builder $query): Builder
    {
        return $query->where('is_planned', true);
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }
}
