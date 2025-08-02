<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\GuestController;
use App\Http\Controllers\ProductionLineController;
use App\Http\Controllers\MachineController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');



    // Route::get('production-lines', function () {
    //     return Inertia::render('production-lines');
    // })->name('dashboard');
    // Production Lines
    Route::resource('production-lines', ProductionLineController::class)->names('production-lines');;

    // Machines
    Route::resource('machines', MachineController::class);
    Route::patch('/machines/{machine}/status', [MachineController::class, 'updateStatus'])
        ->name('machines.update-status');
});

Route::post('/guest-login', [GuestController::class, 'login'])->name('guest.login');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/api.php';
