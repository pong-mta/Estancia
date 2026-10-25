<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('procurements', function (Blueprint $table): void {
            $table->id();

            // A Purchase Request can enter the procurement process only once.
            $table->foreignId('document_id')
                ->unique()
                ->constrained('documents')
                ->restrictOnDelete();

            $table->string('status', 30)->default('canvassing')->index();
            $table->foreignId('opened_by')->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('opened_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procurements');
    }
};
