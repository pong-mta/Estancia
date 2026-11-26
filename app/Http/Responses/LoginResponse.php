<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Determine where the user should go after successful login.
     */
    public function toResponse($request)
    {
        $user = $request->user();

        // Redirect MDRRMO Operations Admin to the Operations Dashboard.
        if (
            $user &&
            $user->hasSystemRole('mdrrmo_operations_admin') &&
            $user->office?->code === 'MDRRMO'
        ) {
            return redirect()->route('mdrrmo.operations.dashboard');
        }

        // Other municipal office users go to the general dashboard.
        return redirect()->route('dashboard');
    }
}
