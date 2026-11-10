<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicBookingController;

// Existing authenticated API route
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public ambulance booking API
Route::post(
    '/public/bookings',
    [PublicBookingController::class, 'store']
)->middleware('throttle:10,1');
