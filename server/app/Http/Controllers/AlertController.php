<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Alert;

class AlertController extends Controller
{
    #GET /api/alerts?coopId=&status=&condition=&range=&limit= // perubahan
    public function index(Request $request){
        $query = Alert::with('ChickenCoop')->latest('created_at'); #latest('created_at') menggantikan latest('sent_at'). Di PostgreSQL, urutan DESC menaruh nilai null paling atas. Alert yang gagal terkirim punya sent_at = null, jadi selalu nyangkut di posisi teratas.

        if ($request->filled('coopId')){ #filled() menggantikan has(). Dropdown "Semua" nanti mengirim string kosong (coopId=).
            $query->where('_chicken_coop_id', $request->query('coopId'));
        }

        if ($request->query('status') === 'success'){
            $query->where('is_sent', true);
        } elseif ($request->query('status') === 'failed'){
            $query->where('is_sent', false);
        }

        $condition = $request->query('condition');
        if ($request->query('condition') === 'normal'){
            $query->where('type', 'normal');
        } elseif ($condition === 'temperature'){
            $query->whereIn('type', ['high_temperature', 'low_temperature']); //whereIn('type', [...]) artinya "type-nya salah satu dari daftar ini".
        } elseif ($condition === 'humidity'){
            $query->whereIn('type', ['high_humidity', 'low_humidity']);
        }

        if($request->filled('range')){
            $startDate = match ($request->query('range')){
                '7days' => now()->subDays(7),
                '30days' => now()->subDays(30),
                default => now()->startOfDay(),
            };
            $query->where('created_at', '>=', $startDate);
        }

        $limit = min((int) $request->query('limit', 20), 100); #min((int) ..., 100) membatasi limit maksimal 100.

        return response()->json($query->take($limit)->get());
    }

    #GET /api/alerts/stats
    public function stats(){
        $total = Alert::count();
        $sent = Alert::where('is_sent', true)->count();
        $normal = Alert::where('type', 'normal')->count();

        return response()->json([
            'total' => $total,
            'sent' => $sent,
            'sent_percentage' => $total > 0 ? floor($sent / $total * 100) : 0, // floor untuk persentase, bukan round. Dengan round, 199 terkirim dari 200 tampil "100%" padahal ada yang gagal. floor tidak pernah melebih-lebihkan.
            'normal' => $normal,
            'warning' => $total - $normal,
        ]);
    } 
}
