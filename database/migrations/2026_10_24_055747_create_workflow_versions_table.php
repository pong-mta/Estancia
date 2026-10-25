<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_versions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('workflow_id')
                ->constrained('workflows')
                ->cascadeOnDelete();

            // Version number within the workflow
            $table->unsignedInteger('version');

            // Immutable snapshot of the workflow definition and its steps
            $table->json('definition');

            // Publication information
            $table->string('status', 20)->default('draft')->index();
            $table->foreignId('published_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['workflow_id', 'version']);
            $table->index(['workflow_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_versions');
    }
};
