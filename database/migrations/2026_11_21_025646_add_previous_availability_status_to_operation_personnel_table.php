<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operation_personnel', function (Blueprint $table) {
            $table->string('previous_availability_status', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('operation_personnel', function (Blueprint $table) {
            $table->dropColumn('previous_availability_status');
        });
    }
};
