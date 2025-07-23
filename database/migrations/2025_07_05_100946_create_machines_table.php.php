<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_line_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('status', ['running', 'idle', 'maintenance', 'breakdown'])->default('idle');
            $table->text('description')->nullable();
            $table->integer('ideal_cycle_time')->default(60); // seconds
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('production_line_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machines');
    }
};
