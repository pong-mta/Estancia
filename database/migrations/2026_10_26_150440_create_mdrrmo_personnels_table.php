<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mdrrmo_personnel', function (Blueprint $table) {
            $table->id();

            // Personnel identification
            $table->string('employee_id', 50)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();

            // Contact information
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();

            // Personnel role
            $table->string('role', 50)->default('driver')->index();

            // Driver license information
            $table->string('license_number', 100)->nullable()->unique();
            $table->string('license_class', 100)->nullable();
            $table->date('license_expiry')->nullable();

            // Employment and operational status
            $table->string('employment_status', 30)
                ->default('active')
                ->index();

            $table->string('availability_status', 30)
                ->default('off_duty')
                ->index();

            // Additional details
            $table->text('address')->nullable();
            $table->text('notes')->nullable();

            // Audit fields
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mdrrmo_personnel');
    }
};
