<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workflow_id')
                ->constrained('workflows')
                ->cascadeOnDelete();

            // Step identification and ordering
            $table->string('name', 150);
            $table->string('step_type', 30)->default('approval');
            $table->unsignedInteger('position');

            // Optional office and specific approver assignment
            $table->foreignId('office_id')
                ->nullable()
                ->constrained('offices')
                ->nullOnDelete();

            $table->foreignId('approver_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Configuration for routing and future visual designer features
            $table->json('settings')->nullable();

            $table->timestamps();

            $table->unique(['workflow_id', 'position']);
            $table->index(['workflow_id', 'step_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};
