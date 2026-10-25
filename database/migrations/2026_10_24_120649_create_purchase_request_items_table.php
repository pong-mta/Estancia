<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_id')
                ->constrained('documents')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unsignedInteger('item_number');

            $table->text('description');

            $table->decimal('quantity', 12, 2)
                ->default(1);

            $table->string('unit', 50)
                ->default('pcs');

            $table->decimal('unit_price', 15, 2)
                ->default(0);

            $table->decimal('amount', 15, 2)
                ->default(0);

            $table->timestamps();

            $table->unique(['document_id', 'item_number']);
            $table->index('document_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
    }
};
