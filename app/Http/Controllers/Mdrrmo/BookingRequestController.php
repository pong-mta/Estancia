<?php

namespace App\Http\Controllers\Mdrrmo;

use App\Http\Controllers\Controller;
use App\Models\AmbulanceBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;


class BookingRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AmbulanceBooking::query()
            ->with(['reviewer:id,name'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('request_number', 'like', "%{$search}%")
                        ->orWhere('requester_name', 'like', "%{$search}%")
                        ->orWhere('requester_phone', 'like', "%{$search}%")
                        ->orWhere('pickup_address', 'like', "%{$search}%")
                        ->orWhere('destination_address', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->filled('status') && array_key_exists($request->string('status')->toString(), AmbulanceBooking::statuses()),
                fn ($query) => $query->where('status', $request->string('status')->toString())
            )
            ->when($request->filled('date'), fn ($query) => $query->whereDate('requested_date', $request->date('date')));

        $bookings = $query
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $statsQuery = AmbulanceBooking::query();

        return Inertia::render('mdrrmo/bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'date' => $request->string('date')->toString(),
            ],
            'statuses' => AmbulanceBooking::statuses(),
            'stats' => [
                'total' => (clone $statsQuery)->count(),
                'pending' => (clone $statsQuery)->where('status', AmbulanceBooking::STATUS_PENDING)->count(),
                'approved' => (clone $statsQuery)->where('status', AmbulanceBooking::STATUS_APPROVED)->count(),
                'rejected' => (clone $statsQuery)->where('status', AmbulanceBooking::STATUS_REJECTED)->count(),
                'completed' => (clone $statsQuery)->where('status', AmbulanceBooking::STATUS_COMPLETED)->count(),
            ],
        ]);
    }

    
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Requester information
            'requester_name' => [
                'required',
                'string',
                'max:150',
            ],
            'requester_phone' => [
                'required',
                'string',
                'max:30',
            ],
            'requester_email' => [
                'nullable',
                'email',
                'max:150',
            ],

            // Booking purpose
            'purpose' => [
                'required',
                'string',
                Rule::in([
                    'medical',
                    'emergency',
                    'hospital_transfer',
                    'inter_facility_transfer',
                    'other',
                ]),
            ],
            'purpose_details' => [
                'nullable',
                'string',
                'max:1000',
            ],

            // Patient and passenger information
            'passenger_count' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],
            'patient_position' => [
                'required',
                'string',
                Rule::in([
                    AmbulanceBooking::POSITION_STANDARD,
                    AmbulanceBooking::POSITION_LYING,
                ]),
            ],

            // Pickup location
            'pickup_address' => [
                'required',
                'string',
                'max:2000',
            ],
            'pickup_barangay' => [
                'nullable',
                'string',
                'max:100',
            ],

            // Destination
            'destination_address' => [
                'required',
                'string',
                'max:2000',
            ],
            'destination_barangay' => [
                'nullable',
                'string',
                'max:100',
            ],

            // Requested schedule
            'requested_date' => [
                'required',
                'date_format:Y-m-d',
            ],
            'requested_time' => [
                'required',
                'date_format:H:i',
            ],

            // Internal MDRRMO notes
            'internal_notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $booking = DB::transaction(function () use ($validated) {

            // Generate unique ambulance request number
            do {
                $requestNumber = 'AMB-' .
                    now()->format('Ymd') .
                    '-' .
                    Str::upper(Str::random(6));

            } while (
                AmbulanceBooking::where(
                    'request_number',
                    $requestNumber
                )->exists()
            );

            return AmbulanceBooking::create([
                'request_number' => $requestNumber,

                // Requester
                'requester_name' => trim($validated['requester_name']),
                'requester_phone' => trim($validated['requester_phone']),
                'requester_email' => isset($validated['requester_email'])
                    ? trim($validated['requester_email'])
                    : null,

                // Booking purpose
                'purpose' => $validated['purpose'],
                'purpose_details' => $validated['purpose_details'] ?? null,

                // Patient information
                'passenger_count' => $validated['passenger_count'],
                'patient_position' => $validated['patient_position'],

                // Pickup location
                'pickup_address' => trim($validated['pickup_address']),
                'pickup_barangay' => $validated['pickup_barangay'] ?? null,

                // Destination
                'destination_address' => trim($validated['destination_address']),
                'destination_barangay' => $validated['destination_barangay'] ?? null,

                // Schedule
                'requested_date' => $validated['requested_date'],
                'requested_time' => $validated['requested_time'] . ':00',

                // Workflow
                'status' => AmbulanceBooking::STATUS_PENDING,

                // Internal notes
                'internal_notes' => $validated['internal_notes'] ?? null,
            ]);
        });

        return redirect()
            ->route('mdrrmo.bookings.index')
            ->with(
                'success',
                "Booking {$booking->request_number} created and placed in Pending Review."
            );
    }


    public function show(AmbulanceBooking $booking): Response
    {
        $booking->load(['reviewer:id,name']);

        return Inertia::render('mdrrmo/bookings/show', [
            'booking' => $booking,
            'statuses' => AmbulanceBooking::statuses(),
        ]);
    }

    public function approve(Request $request, AmbulanceBooking $booking): RedirectResponse
    {
        $validated = $request->validate([
            'internal_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($booking, $validated, $request) {
            $lockedBooking = AmbulanceBooking::query()->lockForUpdate()->findOrFail($booking->id);

            if (! $lockedBooking->isPending()) {
                abort(422, 'Only pending booking requests can be approved.');
            }

            $lockedBooking->status = AmbulanceBooking::STATUS_APPROVED;
            $lockedBooking->rejection_reason = null;
            if (array_key_exists('internal_notes', $validated)) {
                $lockedBooking->internal_notes = $validated['internal_notes'];
            }
            $lockedBooking->reviewed_by = $request->user()->id;
            $lockedBooking->reviewed_at = now();
            $lockedBooking->save();
        });

        return redirect()->route('mdrrmo.bookings.index')
            ->with('success', 'Booking request approved. Ambulance assignment and dispatch are separate operations.');
    }

    public function reject(Request $request, AmbulanceBooking $booking): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:3', 'max:5000'],
            'internal_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($booking, $validated, $request) {
            $lockedBooking = AmbulanceBooking::query()->lockForUpdate()->findOrFail($booking->id);

            if (! $lockedBooking->isPending()) {
                abort(422, 'Only pending booking requests can be rejected.');
            }

            $lockedBooking->status = AmbulanceBooking::STATUS_REJECTED;
            $lockedBooking->rejection_reason = trim($validated['rejection_reason']);
            $lockedBooking->internal_notes = $validated['internal_notes'] ?? $lockedBooking->internal_notes;
            $lockedBooking->reviewed_by = $request->user()->id;
            $lockedBooking->reviewed_at = now();
            $lockedBooking->save();
        });

        return redirect()->route('mdrrmo.bookings.index')
            ->with('success', 'Booking request rejected.');
    }
}
