<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->role !== 'admin'){ #ini baru bisa jalan setelah auth:sanctum lebih dulu memverifikasi token (jadi middleware ini harus dipasang bareng auth:sanctum.
            return response()->json([
                'message' => 'Akses ditolak. Halaman ini khusus admin.',
            ], 403);
        }
        return $next($request); #kalau lolos (role-nya emang admin), lanjutkan request ke controller tujuan.
    }
}
