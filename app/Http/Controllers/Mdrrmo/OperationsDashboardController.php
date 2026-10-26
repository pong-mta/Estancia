<?php
namespace App\Http\Controllers\Mdrrmo;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class OperationsDashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('mdrrmo/operations/index', [
            'stats' => [
                'totalAmbulances' => 0,
                'availableAmbulances' => 0,
                'pendingBookings' => 0,
                'activeDispatches' => 0,
                'completedMissionsToday' => 0,
            ],
        ]);
    }
}
