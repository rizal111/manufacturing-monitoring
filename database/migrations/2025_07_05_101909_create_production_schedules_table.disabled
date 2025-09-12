<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_line_id')->constrained()->cascadeOnDelete();
            $table->string('product_name');
            $table->string('product_code');
            $table->integer('planned_quantity');
            $table->integer('actual_quantity')->default(0);
            $table->timestamp('scheduled_start');
            $table->timestamp('scheduled_end');
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('shift', ['morning', 'afternoon', 'night'])->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['production_line_id', 'scheduled_start']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_schedules');
    }
};
