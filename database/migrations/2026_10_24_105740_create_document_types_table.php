<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 100)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('allows_upload')->default(true);
            $table->boolean('allows_template')->default(true);
            $table->timestamps();
        });

        // Keep the existing Purchase Request workflow compatible.
        DB::table('document_types')->insert([
            'name' => 'Purchase Request',
            'code' => 'purchase_request',
            'description' => 'Purchase Request document type',
            'is_active' => true,
            'allows_upload' => true,
            'allows_template' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
