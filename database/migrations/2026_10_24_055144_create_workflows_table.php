<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();

            // Workflow identity
            $table->string('name', 150);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();

            // Document category this workflow handles
            $table->string('document_type', 100);

            // Draft workflows can be edited; published ones are ready to use
            $table->string('status', 20)->default('draft')->index();

            // Version number for workflow history
            $table->unsignedInteger('version')->default(1);

            // User who created the workflow
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['document_type', 'status']);
            $table->index(['code', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
};
