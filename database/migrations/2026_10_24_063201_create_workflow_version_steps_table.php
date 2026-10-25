<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_version_steps', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workflow_version_id')
                ->constrained('workflow_versions')
                ->cascadeOnDelete();

            // Preserve the original step ID for traceability only.
            $table->unsignedBigInteger('original_step_id')->nullable();

            $table->string('name', 150);
            $table->string('step_type', 30)->default('approval');
            $table->unsignedInteger('position');

            $table->foreignId('office_id')
                ->nullable()
                ->constrained('offices')
                ->nullOnDelete();

            $table->foreignId('approver_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->json('settings')->nullable();

            $table->timestamps();

            $table->unique(
                ['workflow_version_id', 'position'],
                'workflow_version_steps_version_position_unique'
            );

            $table->index(
                ['workflow_version_id', 'step_type'],
                'workflow_version_steps_version_type_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_version_steps');
    }
};
