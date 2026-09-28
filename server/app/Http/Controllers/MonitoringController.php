<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Monitoring;

class MonitoringController extends Controller
{
    #GET api/coop/{coopId}/monitorings?range=today|7days|30days
    public function index(Request $request, string $coopId){
        $date = $request->query('date');

        if($date){
            // data mentah 1 hari penuh
            $data = Monitoring::where('_chicken__coop_id', $coopId)
                ->whereDate('recorded_at', $date) // cocokin cuma bagian tanggalnya (abaikan jam), jadi otomatis ambil semua data dari jam 00:00 sampai 23:59 di tanggal itu.
                ->orderBy('recorded_at')
                ->get(['temperature', 'humidity', 'recorded_at']);

            return response()->json($data);
        }

        // range + filter per jam
        $range = $request->query('range', 'today'); #buat baca query parameter dari URL, contoh ?range=7days. Default-nya 'today'.

        $startDate = match($range){ #(mirip switch, tapi lebih ringkas), nentuin $startDate beda-beda tergantung pilihan range.
            '7days' => now()->subDays(7), #helper dari Carbon, artinya "waktu sekarang, dikurangi 7 hari" — jadi nanti query-nya ambil semua data sejak 7 hari lalu sampai sekarang.
            '15days' => now()->subDays(15),
            '30days' => now()->subDays(30),
            default => now()->startOfDay(),
        };

        $data = Monitoring::where('_chicken__coop_id', $coopId) #ambil semua monitoring yang ada di kandang.
            ->where('recorded_at', '>=', $startDate)
            // ->whereRaw('EXTRACT(MINUTE FROM recorded_at) IN (0, 2)') #Dibaca dari dalam ke luar: fungsi bawaan PostgreSQL, artinya "dari kolom recorded_at, ambil cuma bagian menitnya doang.
            ->orderBy('recorded_at') #data diurutkan dari yang paling lama ke paling baru.
            ->get(['temperature', 'humidity', 'recorded_at']); #cuma ambil 3 kolom ini aja.

        return response()->json($data);
    } 
    
    #GET /coop/{coopId}/monitorings/stats?date=2026-09-06
    public function stats(Request $request, string $coopId){
        $date = $request->query('date', now()->toDateString());

        $query = Monitoring::where('_chicken__coop_id', $coopId)
            ->whereDate('recorded_at', $date);

        return response()->json([ // dipanggil 3x dari $query yang sama, $query (query builder) menyimpan kondisi where yang udah diset, dan tiap pemanggilan aggregate (avg/max/count) itu query terpisah ke database.
            'avg_temperature' => round($query->avg('temperature') ?? 0, 1),
            'avg_humidity' => round($query->avg('humidity') ?? 0, 1),
            'max_temperature' => $query->max('temperature'),
            'max_humidity' => $query->max('humidity'),
            'count' => $query->count(),
        ]);
    }
}
