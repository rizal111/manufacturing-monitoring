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

// Route::middleware('auth:sanctum')->group(function () {

// Dashboard
Route::get('/dashboard-api', [DashboardController::class, 'index']);

// Production Lines
Route::prefix('production-lines')->group(function () {
    Route::get('/', [ProductionLineController::class, 'index']);
    Route::get('/{line}', [ProductionLineController::class, 'show']);
    Route::get('/{line}/status', [ProductionLineController::class, 'status']);
    Route::get('/{line}/oee', [ProductionLineController::class, 'oee']);
});

// Machines
Route::prefix('machines')->group(function () {
    Route::get('/', [MachineController::class, 'index']);
    Route::get('/{machine}', [MachineController::class, 'show']);
    Route::put('/{machine}/status', [MachineController::class, 'updateStatus']);
    Route::get('/{machine}/oee', [MachineController::class, 'oee']);
    Route::get('/{machine}/reliability', [MachineController::class, 'reliability']);
});

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
// });
