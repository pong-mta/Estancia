<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGsoOffice
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->office()->where('code', 'GSO')->exists()) {
            abort(403, 'Only GSO office users can access procurement.');
        }

        return $next($request);
    }
}
