<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Monitoring;

class MonitoringController extends Controller
{
    #GET api/coop/{coopId}/monitorings?range=today|7days|30days
    public function index(Request $request, string $coopId){
        $range = $request->query('range', 'today'); #buat baca query parameter dari URL, contoh ?range=7days. Default-nya 'today'.

        $startDate = match($range){ #(mirip switch, tapi lebih ringkas), nentuin $startDate beda-beda tergantung pilihan range.
            '7days' => now()->subDays(7), #helper dari Carbon, artinya "waktu sekarang, dikurangi 7 hari" — jadi nanti query-nya ambil semua data sejak 7 hari lalu sampai sekarang.
            '15days' => now()->subDays(15),
            '30days' => now()->subDays(30),
            default => now()->startOfDay(),
        };

        $data = Monitoring::where('_chicken__coop_id', $coopId) #ambil semua monitoring yang ada di kandang.
            ->where('recorded_at', '>=', $startDate)
            ->orderBy('recorded_at') #data diurutkan dari yang paling lama ke paling baru.
            ->get(['temperature', 'humidity', 'recorded_at']); #cuma ambil 3 kolom ini aja.

        return response()->json($data);
    }                   
}
