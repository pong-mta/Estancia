<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_quotation_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('supplier_quotation_id')
                ->constrained('supplier_quotations')
                ->cascadeOnDelete();

            // Keep the PR item link for comparison, while retaining a snapshot of the offer line.
            $table->foreignId('purchase_request_item_id')
                ->nullable()
                ->constrained('purchase_request_items')
                ->nullOnDelete();

            $table->string('description');
            $table->decimal('quantity', 15, 3);
            $table->string('unit', 50);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('amount', 15, 2);
            $table->timestamps();

            $table->index(['supplier_quotation_id', 'purchase_request_item_id'], 'sq_items_quote_pr_item_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_quotation_items');
    }
};
