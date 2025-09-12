<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machine_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['running', 'idle', 'maintenance', 'breakdown']);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration')->nullable(); // seconds
            $table->timestamps();

            $table->index(['machine_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_status_logs');
    }
};
