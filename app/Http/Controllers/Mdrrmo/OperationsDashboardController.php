<?php

namespace App\Http\Controllers\Mdrrmo;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\AmbulanceBooking;
use App\Models\Operation;
use Inertia\Inertia;
use Inertia\Response;

class OperationsDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stats = [
            // Total registered ambulances
            'totalAmbulances' => Ambulance::count(),

            // Ambulances ready for assignment
            'availableAmbulances' => Ambulance::where(
                'status',
                Ambulance::STATUS_AVAILABLE
            )->count(),

            // Bookings awaiting approval
            'pendingBookings' => AmbulanceBooking::where(
                'status',
                AmbulanceBooking::STATUS_PENDING
            )->count(),

            // Operations already dispatched or currently in progress
            'activeDispatches' => Operation::whereIn('status', [
                Operation::STATUS_DISPATCHED,
                Operation::STATUS_IN_PROGRESS,
            ])->count(),

            // Operations completed today
            'completedMissionsToday' => Operation::where(
                'status',
                Operation::STATUS_COMPLETED
            )
                ->whereDate('completed_at', today())
                ->count(),
        ];

        return Inertia::render('mdrrmo/operations/dashboard', [
            'stats' => $stats,
        ]);
    }
}
