<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('office_id')
                ->nullable()
                ->constrained('offices')
                ->nullOnDelete();

            $table->string('system_role', 40)
                ->default('staff')
                ->index();

            $table->boolean('is_active')
                ->default(true)
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('office_id');
            $table->dropIndex(['system_role']);
            $table->dropIndex(['is_active']);
            $table->dropColumn([
                'system_role',
                'is_active',
            ]);
        });
    }
};