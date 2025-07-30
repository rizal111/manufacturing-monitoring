<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    DashboardController,
    ProductionLineController,
    MachineController,
    DowntimeController,
    ProductionScheduleController,
    ProductionOutputController,
    ReportController
};

// Dashboard
Route::get('/dashboard-api', [DashboardController::class, 'index']);

// Downtimes
Route::prefix('downtimes')->group(function () {
    Route::get('/', [DowntimeController::class, 'index']);
    Route::get('/current', [DowntimeController::class, 'current']);
    Route::put('/{downtime}/end', [DowntimeController::class, 'end']);
    Route::get('/analysis', [DowntimeController::class, 'analysis']);
});

// Production Schedules
Route::prefix('production-schedules')->group(function () {
    Route::get('/', [ProductionScheduleController::class, 'index']);
    Route::get('/overview', [ProductionScheduleController::class, 'overview']);
    Route::get('/performance', [ProductionScheduleController::class, 'performance']);
    Route::get('/shift-analysis', [ProductionScheduleController::class, 'shiftAnalysis']);
    Route::put('/{schedule}/start', [ProductionScheduleController::class, 'start']);
    Route::put('/{schedule}/complete', [ProductionScheduleController::class, 'complete']);
    Route::put('/{schedule}/progress', [ProductionScheduleController::class, 'updateProgress']);
});

// Production Outputs
Route::prefix('production-outputs')->group(function () {
    Route::post('/', [ProductionOutputController::class, 'store']);
    Route::get('/machine/{machine}', [ProductionOutputController::class, 'machineOutputs']);
    Route::get('/summary', [ProductionOutputController::class, 'summary']);
});

// Reports
Route::prefix('reports')->group(function () {
    Route::get('/oee', [ReportController::class, 'oeeReport']);
    Route::get('/production', [ReportController::class, 'productionReport']);
    Route::get('/downtime', [ReportController::class, 'downtimeReport']);
});
