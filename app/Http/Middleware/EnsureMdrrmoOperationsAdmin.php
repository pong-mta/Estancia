<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMdrrmoOperationsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless(
            $user
                && $user->is_active
                && $user->system_role === 'mdrrmo_operations_admin'
                && $user->office()
                    ->where('code', 'MDRRMO')
                    ->where('is_active', true)
                    ->exists(),
            403,
            'Only authorized MDRRMO Operations Admin users can access this module.'
        );

        return $next($request);
    }
}
