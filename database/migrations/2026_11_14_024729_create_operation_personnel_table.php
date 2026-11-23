<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operation_personnel', function (Blueprint $table) {
            $table->id();

            $table->foreignId('operation_id')
                ->constrained('operations')
                ->cascadeOnDelete();

            $table->foreignId('personnel_id')
                ->constrained('mdrrmo_personnel')
                ->restrictOnDelete();

            // Example: driver, EMT, nurse, paramedic.
            $table->string('assignment_role', 50)->nullable();

            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('released_at')->nullable();

            $table->timestamps();

            // Prevent duplicate personnel entries in one operation.
            $table->unique(
                ['operation_id', 'personnel_id'],
                'operation_personnel_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_personnel');
    }
};
