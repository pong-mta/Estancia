<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            // Unique document tracking number.
            $table->string('tracking_number', 50)->unique();

            // Classification and document details.
            $table->string('document_type', 100)->index();
            $table->string('subject', 255);
            $table->text('description')->nullable();

            // Office and user responsible for submission.
            $table->foreignId('originating_office_id')
                ->nullable()
                ->constrained('offices')
                ->nullOnDelete();

            $table->foreignId('submitted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Document tracking status.
            $table->string('status', 30)->default('draft')->index();

            // Submission and completion timestamps.
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(
                ['document_type', 'status'],
                'documents_type_status_index'
            );

            $table->index(
                ['originating_office_id', 'created_at'],
                'documents_office_created_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
