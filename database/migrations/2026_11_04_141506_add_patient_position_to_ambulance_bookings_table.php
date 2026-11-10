<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('ambulance_bookings', 'patient_position')) {
            Schema::table('ambulance_bookings', function (Blueprint $table) {
                $table->string('patient_position')
                    ->nullable()
                    ->after('purpose_details');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('ambulance_bookings', 'patient_position')) {
            Schema::table('ambulance_bookings', function (Blueprint $table) {
                $table->dropColumn('patient_position');
            });
        }
    }
};
