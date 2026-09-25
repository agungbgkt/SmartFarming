<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PhpParser\Node\Scalar\String_;
use App\Models\Monitoring;

class DeviceController extends Controller
{
    #GET api/coop/{coopId}/devices -- bisa diakses admin & viewer
    public function index(String $coopId){ // didesain buat "device di 1 kandang tertentu" (dipanggil dari halaman detail kandang).
        return response()->json(
            Device::where('_chicken__coop_id', $coopId)->get() #ambil semua devices yang ada di kandang($coopId)
        );
    }

    #POST api/devices -- hanya admin
    public function store(Request $request){
        $validated = $request->validate([
            '_chicken__coop_id' => 'required|uuid|exists:_chicken__coop,id', #uuid mastiin formatnya emang UUID valid (bukan asal teks) | exists:_chicken__coop,id mastiin id itu beneran ada di tabel _chicken__coop.
            'device_code' => 'required|string|max:255|unique:devices,device_code',
        ]);

        $device = Device::create([
            'id' => (string) Str::uuid(),
            ...$validated,
        ]);

        return response()->json($device, 201);
    }

    #DELETE api/device/{id}
    public function destroy(String $id){
        $device = Device::find($id);

        if (! $device){
            return response()->json(['message' => 'Perangkat tidak ditemukan.'], 404);
        }

        $device->delete();

        return response()->json(['message' => 'Perangkat berhasil dihapus.']);
    }

    #GET api/devices
    public function indexAll(){ // semua device, lintas kandang.
        $devices = Device::with('chickenCoop')->get()->map(function ($device){ // mengubah tiap objek Device mentah jadi array baru yang formatnya udah "siap pakai" buat frontend (gabungan data device + nama kandang + status + reading terbaru).
            $latest = Monitoring::where('_chicken__coop_id', $device->_chicken_coop_id)
                ->orderByDesc('recorded_at') // ngambil suhu/kelembapan terbaru.
                ->first();

            return [
                'id' => $device->id,
                'device_code' => $device->device_code,
                'coop_name' => $device->ChickenCoop->name,
                'is_online' => $device->last_seen_at && $device->last_seen_at->gt(now(20)), // logic status online/offline,Device dianggap online kalau last_seen_at-nya kurang dari 20 menit yang lalu, Kalau last_seen_at masih null otomatis dianggap offline.
                'last_seen_at' => $device->last_seen_at,
                'temperature' => $latest->temperature ?? null,
                'humidity' => $latest->humidity ?? null,
                'recorded_at' => $latest->recorded_at ?? null,
            ];
        });

        return response()->json($devices);
    }
}
