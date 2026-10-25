<?php

namespace Database\Seeders;

use App\Models\Office;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $offices = [
            // Keep these first five codes unchanged for existing workflows.
            [
                'code' => 'MAYOR',
                'name' => 'Mayor Office',
                'description' => 'Office of the Municipal Mayor',
            ],
            [
                'code' => 'HRMO',
                'name' => 'Human Resource Management Office',
                'description' => 'Human resources and personnel management',
            ],
            [
                'code' => 'GSO',
                'name' => 'General Services Office',
                'description' => 'General services, supplies, and property management',
            ],
            [
                'code' => 'BUDGET',
                'name' => 'Budget Office',
                'description' => 'Municipal budgeting and appropriations',
            ],
            [
                'code' => 'ACCOUNTING',
                'name' => 'Accounting Office',
                'description' => 'Municipal accounting and financial records',
            ],

            // Executive and legislative offices
            [
                'code' => 'VICE_MAYOR',
                'name' => 'Vice Mayor Office',
                'description' => 'Office of the Municipal Vice Mayor',
            ],
            [
                'code' => 'SB',
                'name' => 'Sangguniang Bayan',
                'description' => 'Municipal legislative council',
            ],
            [
                'code' => 'SB_SECRETARY',
                'name' => 'Sangguniang Bayan Secretary Office',
                'description' => 'Legislative records, resolutions, and ordinances',
            ],
            [
                'code' => 'ADMIN',
                'name' => 'Municipal Administrator Office',
                'description' => 'Municipal administration and coordination',
            ],
            [
                'code' => 'LEGAL',
                'name' => 'Legal Office',
                'description' => 'Legal services and review',
            ],
            [
                'code' => 'PIO',
                'name' => 'Public Information Office',
                'description' => 'Public information and communications',
            ],

            // Finance, procurement, and property
            [
                'code' => 'TREASURER',
                'name' => 'Treasurers Office',
                'description' => 'Municipal treasury, collections, and disbursements',
            ],
            [
                'code' => 'ASSESSOR',
                'name' => 'Assessors Office',
                'description' => 'Property assessment and valuation',
            ],
            [
                'code' => 'BAC',
                'name' => 'Bids and Awards Committee',
                'description' => 'Government procurement and bidding',
            ],
            [
                'code' => 'PROCUREMENT',
                'name' => 'Procurement Office',
                'description' => 'Procurement planning and purchasing coordination',
            ],
            [
                'code' => 'PROPERTY',
                'name' => 'Property and Supply Management',
                'description' => 'Inventory, supplies, and government property',
            ],
            [
                'code' => 'INTERNAL_AUDIT',
                'name' => 'Internal Audit Unit',
                'description' => 'Internal controls and audit services',
            ],

            // Planning, engineering, and regulatory offices
            [
                'code' => 'MPDO',
                'name' => 'Municipal Planning and Development Office',
                'description' => 'Municipal planning, development programs, and investment plans',
            ],
            [
                'code' => 'ENGINEERING',
                'name' => 'Municipal Engineering Office',
                'description' => 'Infrastructure, public works, and engineering',
            ],
            [
                'code' => 'CIVIL_REGISTRY',
                'name' => 'Local Civil Registry Office',
                'description' => 'Civil registration and vital records',
            ],
            [
                'code' => 'BPLO',
                'name' => 'Business Permits and Licensing Office',
                'description' => 'Business permits, licensing, and regulatory services',
            ],
            [
                'code' => 'MENRO',
                'name' => 'Municipal Environment and Natural Resources Office',
                'description' => 'Environmental protection and natural resource management',
            ],
            [
                'code' => 'TOURISM',
                'name' => 'Municipal Tourism Office',
                'description' => 'Tourism development and promotion',
            ],
            [
                'code' => 'PESO',
                'name' => 'Public Employment Service Office',
                'description' => 'Employment facilitation and livelihood support',
            ],
            [
                'code' => 'ECONOMIC_ENTERPRISE',
                'name' => 'Economic Enterprise Office',
                'description' => 'Management of municipal economic enterprises',
            ],

            // Social services and community development
            [
                'code' => 'HEALTH',
                'name' => 'Municipal Health Office',
                'description' => 'Public health programs and health services',
            ],
            [
                'code' => 'MSWDO',
                'name' => 'Municipal Social Welfare and Development Office',
                'description' => 'Social welfare and community assistance programs',
            ],
            [
                'code' => 'AGRICULTURE',
                'name' => 'Municipal Agriculture Office',
                'description' => 'Agriculture, fisheries, and farmer assistance',
            ],
            [
                'code' => 'MDRRMO',
                'name' => 'Municipal Disaster Risk Reduction and Management Office',
                'description' => 'Disaster preparedness, response, and recovery',
            ],
            [
                'code' => 'CIVIL_SECURITY',
                'name' => 'Public Safety and Security Office',
                'description' => 'Public safety and local security coordination',
            ],
            [
                'code' => 'OSCA',
                'name' => 'Office for Senior Citizens Affairs',
                'description' => 'Programs and assistance for senior citizens',
            ],
            [
                'code' => 'PDAO',
                'name' => 'Persons with Disability Affairs Office',
                'description' => 'Programs and accessibility support for persons with disabilities',
            ],
            [
                'code' => 'GAD',
                'name' => 'Gender and Development Office',
                'description' => 'Gender-responsive programs and coordination',
            ],
            [
                'code' => 'YOUTH',
                'name' => 'Youth Development Office',
                'description' => 'Youth programs and development initiatives',
            ],
        ];

        // Create offices without duplicating existing records.
        // Existing office IDs and records are not deliberately overwritten.
        foreach ($offices as $office) {
            Office::firstOrCreate(
                ['code' => $office['code']],
                [
                    'name' => $office['name'],
                    'description' => $office['description'],
                    'is_active' => true,
                ]
            );
        }

        // Seed users only after the offices exist.
        $this->call([
            AdminUserSeeder::class,
            DepartmentTestUsersSeeder::class,
        ]);
    }
}
