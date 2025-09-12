<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('downtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
            $table->string('reason');
            $table->text('description')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration')->nullable(); // seconds
            $table->enum('category', ['mechanical', 'electrical', 'material', 'operator', 'changeover', 'other'])->default('other');
            $table->boolean('is_planned')->default(false);
            $table->timestamps();

            $table->index(['machine_id', 'started_at']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('downtimes');
    }
};
