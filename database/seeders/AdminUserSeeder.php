<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('EDTS_ADMIN_EMAIL', 'admin@edts.local');
        $password = env('EDTS_ADMIN_PASSWORD');

        if (empty($password)) {
            throw new \RuntimeException(
                'Set EDTS_ADMIN_PASSWORD in your .env before running AdminUserSeeder.'
            );
        }

        $user = User::firstOrNew(['email' => $email]);

        if (!$user->exists) {
            $user->name = 'System Administrator';
            $user->password = Hash::make($password);
        }

        // Explicit assignments: never accept roles from public registration.
        $user->system_role = 'admin';
        $user->is_active = true;
        $user->save();
    }
}
