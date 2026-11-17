<?php

namespace Database\Factories;

use App\Models\AmbulanceBooking;
use Illuminate\Database\Eloquent\Factories\Factory;

class AmbulanceBookingFactory extends Factory
{
    protected $model = AmbulanceBooking::class;

    public function definition(): array
    {
        return [
            'request_number' => 'REQ-' . fake()->unique()->numerify('######'),
            'requester_name' => fake()->name(),
            'requester_phone' => fake()->phoneNumber(),
            'requester_email' => fake()->safeEmail(),
            'purpose' => 'Medical Emergency',
            'purpose_details' => fake()->sentence(),
            'passenger_count' => 1,
            'patient_position' => AmbulanceBooking::POSITION_STANDARD,
            'pickup_address' => fake()->address(),
            'pickup_barangay' => fake()->city(),
            'destination_address' => fake()->address(),
            'destination_barangay' => fake()->city(),
            'requested_date' => now()->addDay()->toDateString(),
            'requested_time' => '09:00:00',
            'status' => AmbulanceBooking::STATUS_PENDING,
            'rejection_reason' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'internal_notes' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => AmbulanceBooking::STATUS_APPROVED,
            'reviewed_at' => now(),
        ]);
    }
}
