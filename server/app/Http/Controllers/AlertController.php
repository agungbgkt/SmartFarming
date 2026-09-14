<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Alert;

class AlertController extends Controller
{
    #GET /api/alerts/_chicken_coop_id=...&limit=...
    public function index(Request $request){
        $query = Alert::with('ChickenCoop')->latest('sent_at'); #sekalian ambil data kandang terkait tiap alert (nama kandangnya) | urutkan dari yang paling baru dikirim duluan.

        if ($request->has('_chicken__coop_id')){ #has() cuma ngecek apakah parameter itu dikirim apa nggak (true/false), dipakai di sini biar filter kandang_id ini opsional.
            $query->where('_chicken_coop_id', $request->query('coopId'));
        }

        $limit = $request->query('limit', 20); #efault ambil 20 data terbaru aja.

        return response()->json($query->take($limit)->get());
    }
}
