<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_workflows', function (Blueprint $table) {
            $table->id();

            // The document being processed
            $table->string('document_type', 100);
            $table->unsignedBigInteger('document_id');

            // The exact workflow version selected when processing begins
            $table->foreignId('workflow_version_id')
                ->constrained('workflow_versions')
                ->restrictOnDelete();

            // Current approval progress
            $table->foreignId('current_step_id')
                ->nullable()
                ->constrained('workflow_steps')
                ->nullOnDelete();

            $table->string('status', 30)->default('in_progress')->index();

            // Processing timestamps
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            // Supports finding workflow assignments for a particular document
            $table->index(
                ['document_type', 'document_id'],
                'document_workflows_document_lookup'
            );

            $table->index(['workflow_version_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_workflows');
    }
};
