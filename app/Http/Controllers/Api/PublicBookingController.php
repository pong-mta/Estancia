<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AmbulanceBooking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PublicBookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Verify API secret
        $providedKey = (string) $request->header('X-Booking-Key');
        $expectedKey = (string) config('services.public_booking.key');

        if (
            $expectedKey === '' ||
            !hash_equals($expectedKey, $providedKey)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized request.',
            ], 401);
        }

        // Validate booking information
        $validated = $request->validate([

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

            'requested_date' => [
                'required',
                'date_format:Y-m-d',
            ],

            'requested_time' => [
                'required',
                'date_format:H:i',
            ],
        ]);

        // Save booking
        $booking = DB::transaction(function () use ($validated) {

            do {
                $requestNumber = 'AMB-' .
                    now()->format('Ymd') .
                    '-' .
                    Str::upper(Str::random(6));

            } while (
                AmbulanceBooking::withTrashed()
                    ->where('request_number', $requestNumber)
                    ->exists()
            );

            return AmbulanceBooking::create([

                'request_number' => $requestNumber,

                'requester_name' => trim(
                    $validated['requester_name']
                ),

                'requester_phone' => trim(
                    $validated['requester_phone']
                ),

                'requester_email' => $validated['requester_email'] ?? null,

                'purpose' => $validated['purpose'],

                'purpose_details' => $validated['purpose_details'] ?? null,

                'passenger_count' => $validated['passenger_count'],

                'patient_position' => $validated['patient_position'],

                'pickup_address' => trim(
                    $validated['pickup_address']
                ),

                'pickup_barangay' => $validated['pickup_barangay'] ?? null,

                'destination_address' => trim(
                    $validated['destination_address']
                ),

                'destination_barangay' => $validated['destination_barangay'] ?? null,

                'requested_date' => $validated['requested_date'],

                'requested_time' => $validated['requested_time'] . ':00',

                'status' => AmbulanceBooking::STATUS_PENDING,

                'internal_notes' => null,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Booking submitted successfully.',
            'data' => [
                'request_number' => $booking->request_number,
                'status' => $booking->status,
            ],
        ], 201);
    }
}
