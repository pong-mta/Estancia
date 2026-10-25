<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('document_template_id')
                ->nullable()
                ->constrained('document_templates')
                ->restrictOnDelete();

            $table->json('template_data')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn([
                'document_template_id',
                'template_data',
            ]);
        });
    }
};
