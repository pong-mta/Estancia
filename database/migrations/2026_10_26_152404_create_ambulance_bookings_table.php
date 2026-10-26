<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ambulance_bookings', function (Blueprint $table) {
            $table->id();

            // Public tracking and request identification
            $table->string('request_number', 40)->unique();

            // Person requesting the ambulance
            $table->string('requester_name', 150);
            $table->string('requester_phone', 30);
            $table->string('requester_email', 150)->nullable();

            // Booking details
            $table->string('purpose', 100);
            $table->text('purpose_details')->nullable();
            $table->unsignedSmallInteger('passenger_count')->default(1);

            // Pickup and destination
            $table->text('pickup_address');
            $table->string('pickup_barangay', 100)->nullable();
            $table->text('destination_address');
            $table->string('destination_barangay', 100)->nullable();

            // Requested schedule
            $table->date('requested_date')->index();
            $table->time('requested_time');

            // Review workflow
            $table->string('status', 30)->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            // Internal notes; do not expose in public tracking responses
            $table->text('internal_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ambulance_bookings');
    }
};