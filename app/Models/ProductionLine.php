<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function machines(): HasMany
    {
        return $this->hasMany(Machine::class);
    }

    public function productionSchedules(): HasMany
    {
        return $this->hasMany(ProductionSchedule::class);
    }

    public function activeMachines(): HasMany
    {
        return $this->hasMany(Machine::class)->where('is_active', true);
    }

    public function updateStatus(): void
    {
        $machineStatuses = $this->machines()->pluck('status')->toArray();

        if (in_array('running', $machineStatuses)) {
            $this->status = 'running';
        } elseif (in_array('maintenance', $machineStatuses)) {
            $this->status = 'maintenance';
        } elseif (count($machineStatuses) > 0) {
            $this->status = 'idle';
        } else {
            $this->status = 'stopped';
        }

        $this->save();
    }
}
