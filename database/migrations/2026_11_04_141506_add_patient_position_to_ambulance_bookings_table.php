<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ambulance_bookings', function (Blueprint $table) {
            $table->enum('patient_position', ['standard', 'lying'])
                ->default('standard')
                ->after('passenger_count');
        });
    }

    public function down(): void
    {
        Schema::table('ambulance_bookings', function (Blueprint $table) {
            $table->dropColumn('patient_position');
        });
    }
};