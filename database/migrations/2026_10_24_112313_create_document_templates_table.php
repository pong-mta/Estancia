<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_type_id')
                ->constrained('document_types')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('name', 150);
            $table->string('code', 100)->unique();
            $table->text('description')->nullable();

            // Reusable template layout and content.
            $table->longText('content')->nullable();

            // Defines the fields users must fill in.
            $table->json('fields')->nullable();

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['document_type_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
