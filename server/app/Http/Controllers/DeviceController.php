<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PhpParser\Node\Scalar\String_;

class DeviceController extends Controller
{
    #GET api/coop/{coopId}/devices -- bisa diakses admin & viewer
    public function index(String $coopId){
        return response()->json(
            Device::where('_chicken__coop_id', $coopId)->get() #ambil semua devices yang ada di kandang($coopId)
        );
    }

    #POST api/devices -- hanya admin
    public function store(Request $request){
        $validated = $request->validate([
            '_chicken_coop_id' => 'required|uuid|exists:__chicken_coop_id', #uuid mastiin formatnya emang UUID valid (bukan asal teks) | exists:_chicken__coop,id mastiin id itu beneran ada di tabel _chicken__coop.
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
}
