<?php

namespace Database\Seeders;

use App\Models\Office;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DepartmentTestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('EDTS_TEST_USERS_PASSWORD');

        if (empty($password)) {
            throw new RuntimeException(
                'Set EDTS_TEST_USERS_PASSWORD in your .env before running DepartmentTestUsersSeeder.'
            );
        }

        $departments = [
            ['code' => 'MAYOR', 'email' => 'mayor@edts.local', 'name' => 'Mayor Office'],
            ['code' => 'HRMO', 'email' => 'hrmo@edts.local', 'name' => 'HRMO Staff'],
            ['code' => 'GSO', 'email' => 'gso@edts.local', 'name' => 'GSO'],
            ['code' => 'BUDGET', 'email' => 'budget@edts.local', 'name' => 'Budget'],
            ['code' => 'ACCOUNTING', 'email' => 'accounting@edts.local', 'name' => 'Accounting'],
            ['code' => 'VICE_MAYOR', 'email' => 'vice.mayor@edts.local', 'name' => 'Vice Mayor Office'],
            ['code' => 'SB', 'email' => 'sb@edts.local', 'name' => 'Sangguniang Bayan'],
            ['code' => 'SB_SECRETARY', 'email' => 'sb.secretary@edts.local', 'name' => 'SB Secretary'],
            ['code' => 'ADMIN', 'email' => 'municipal.admin@edts.local', 'name' => 'Municipal Administrator'],
            ['code' => 'LEGAL', 'email' => 'legal@edts.local', 'name' => 'Legal Office'],
            ['code' => 'PIO', 'email' => 'pio@edts.local', 'name' => 'Public Information Office'],
            ['code' => 'TREASURER', 'email' => 'treasurer@edts.local', 'name' => 'Treasurers Office'],
            ['code' => 'ASSESSOR', 'email' => 'assessor@edts.local', 'name' => 'Assessors Office'],
            ['code' => 'BAC', 'email' => 'bac@edts.local', 'name' => 'Bids and Awards Committee'],
            ['code' => 'PROCUREMENT', 'email' => 'procurement@edts.local', 'name' => 'Procurement Office'],
            ['code' => 'PROPERTY', 'email' => 'property@edts.local', 'name' => 'Property and Supply Management'],
            ['code' => 'INTERNAL_AUDIT', 'email' => 'internal.audit@edts.local', 'name' => 'Internal Audit Unit'],
            ['code' => 'MPDO', 'email' => 'mpdo@edts.local', 'name' => 'MPDO'],
            ['code' => 'ENGINEERING', 'email' => 'engineering@edts.local', 'name' => 'Municipal Engineering Office'],
            ['code' => 'CIVIL_REGISTRY', 'email' => 'civil.registry@edts.local', 'name' => 'Local Civil Registry Office'],
            ['code' => 'BPLO', 'email' => 'bplo@edts.local', 'name' => 'Business Permits and Licensing Office'],
            ['code' => 'MENRO', 'email' => 'menro@edts.local', 'name' => 'MENRO'],
            ['code' => 'TOURISM', 'email' => 'tourism@edts.local', 'name' => 'Municipal Tourism Office'],
            ['code' => 'PESO', 'email' => 'peso@edts.local', 'name' => 'PESO'],
            ['code' => 'ECONOMIC_ENTERPRISE', 'email' => 'economic.enterprise@edts.local', 'name' => 'Economic Enterprise Office'],
            ['code' => 'HEALTH', 'email' => 'health@edts.local', 'name' => 'Municipal Health Office'],
            ['code' => 'MSWDO', 'email' => 'mswdo@edts.local', 'name' => 'MSWDO'],
            ['code' => 'AGRICULTURE', 'email' => 'agriculture@edts.local', 'name' => 'Municipal Agriculture Office'],
            ['code' => 'MDRRMO', 'email' => 'mdrrmo@edts.local', 'name' => 'MDRRMO'],
            ['code' => 'CIVIL_SECURITY', 'email' => 'civil.security@edts.local', 'name' => 'Public Safety and Security Office'],
            ['code' => 'OSCA', 'email' => 'osca@edts.local', 'name' => 'OSCA'],
            ['code' => 'PDAO', 'email' => 'pdao@edts.local', 'name' => 'PDAO'],
            ['code' => 'GAD', 'email' => 'gad@edts.local', 'name' => 'Gender and Development Office'],
            ['code' => 'YOUTH', 'email' => 'youth@edts.local', 'name' => 'Youth Development Office'],
        ];

        foreach ($departments as $department) {
            $office = Office::query()
                ->where('code', $department['code'])
                ->first();

            if (!$office) {
                throw new RuntimeException(
                    "Office code {$department['code']} does not exist. Run DatabaseSeeder first."
                );
            }

            $adminEmail = env('EDTS_ADMIN_EMAIL', 'admin@edts.local');

            if (strcasecmp($department['email'], $adminEmail) === 0) {
                throw new RuntimeException(
                    "The email {$department['email']} conflicts with the System Administrator."
                );
            }

            $user = User::query()->firstOrNew([
                'email' => $department['email'],
            ]);

            $isNewUser = !$user->exists;

            $user->name = $department['name'];
            $user->office_id = $office->id;
            $user->system_role = 'approver';
            $user->is_active = true;

            if ($isNewUser) {
                $user->password = Hash::make($password);
            }

            $user->save();

            $this->command?->info(
                "Prepared: {$department['email']} — {$department['name']}"
            );
        }

        $this->command?->info('All 34 municipal office test accounts processed.');
    }
}
