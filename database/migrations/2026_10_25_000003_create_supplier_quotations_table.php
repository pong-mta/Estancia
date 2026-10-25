<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_quotations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('procurement_id')
                ->constrained('procurements')
                ->cascadeOnDelete();
            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->restrictOnDelete();

            $table->string('quotation_number')->nullable();
            $table->date('quotation_date')->nullable();
            $table->date('valid_until')->nullable();
            $table->unsignedInteger('delivery_days')->nullable();
            $table->string('payment_terms')->nullable();
            $table->text('notes')->nullable();
            $table->string('attachment_path')->nullable();

            // Draft quotations can be edited; submitted quotations are preserved as offers.
            $table->string('status', 30)->default('draft')->index();
            $table->foreignId('submitted_by')->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);

            $table->timestamps();
            $table->index(['procurement_id', 'supplier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_quotations');
    }
};
