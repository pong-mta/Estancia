<?php

namespace Database\Factories;

use App\Models\MdrrmoPersonnel;
use Illuminate\Database\Eloquent\Factories\Factory;

class MdrrmoPersonnelFactory extends Factory
{
    protected $model = MdrrmoPersonnel::class;

    public function definition(): array
    {
        return [
            'employee_id' => 'EMP-' . fake()->unique()->numerify('####'),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional()->lastName(),
            'last_name' => fake()->lastName(),
            'suffix' => null,
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'role' => MdrrmoPersonnel::ROLE_DRIVER,
            'license_number' => null,
            'license_class' => null,
            'license_expiry' => null,
            'employment_status' => MdrrmoPersonnel::EMPLOYMENT_ACTIVE,
            'availability_status' => MdrrmoPersonnel::AVAILABILITY_AVAILABLE,
            'address' => fake()->address(),
            'notes' => null,
        ];
    }
}
