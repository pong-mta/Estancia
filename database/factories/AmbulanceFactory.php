<?php

namespace Database\Factories;

use App\Models\Ambulance;
use Illuminate\Database\Eloquent\Factories\Factory;

class AmbulanceFactory extends Factory
{
    protected $model = Ambulance::class;

    public function definition(): array
    {
        return [
            'vehicle_code' => 'AMB-' . fake()->unique()->numerify('####'),
            'plate_number' => fake()->unique()->bothify('???-####'),
            'make' => 'Toyota',
            'model' => 'HiAce',
            'year' => fake()->numberBetween(2018, 2026),
            'ambulance_type' => Ambulance::TYPE_BASIC,
            'status' => Ambulance::STATUS_AVAILABLE,
            'registration_number' => fake()->bothify('REG-#####'),
            'registration_expiry' => now()->addYear(),
            'insurance_expiry' => now()->addYear(),
            'notes' => null,
        ];
    }
}
