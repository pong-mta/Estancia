<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_workflow_id')
                ->constrained('document_workflows')
                ->restrictOnDelete();

            $table->foreignId('workflow_step_id')
                ->nullable()
                ->constrained('workflow_steps')
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // approved, rejected, returned, reassigned, or other configured actions
            $table->string('action', 30);

            $table->text('comments')->nullable();

            // Optional record of routing or reassignment details
            $table->json('metadata')->nullable();

            $table->timestamp('acted_at')->useCurrent();
            $table->timestamps();

            $table->index(
                ['document_workflow_id', 'acted_at'],
                'workflow_actions_history_lookup'
            );

            $table->index(['user_id', 'acted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_actions');
    }
};
