<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operation_ambulances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('operation_id')
                ->constrained('operations')
                ->cascadeOnDelete();

            $table->foreignId('ambulance_id')
                ->constrained('ambulances')
                ->restrictOnDelete();

            // Example: primary, support, transport.
            $table->string('assignment_role', 50)->nullable();

            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('released_at')->nullable();

            $table->timestamps();

            // Prevent duplicate ambulance entries in one operation.
            $table->unique(
                ['operation_id', 'ambulance_id'],
                'operation_ambulance_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_ambulances');
    }
};
