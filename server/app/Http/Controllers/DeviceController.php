<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceController extends Controller
{
    #GET api/device -- bisa diakses admin & viewer
    public function index(){
        return response()->json(
            Device::get()
        );
    }

    #GET api/device/{id}
    public function show(String $id){
        $device = Device::with('ChickenCoop:id,name,location')->find($id);

        if (! $device){
            return response()->json(['message' => 'Perangkat tidak ditemukan.'], 404);
        }

        return response()->json($device);
    }

    #POST api/device -- hanya admin
    public function store(Request $request){
        $validated = $request->validate([
            '_chicken_coop_id' => 'required|exists:__chicken_coop_id',
            'device_code' => 'required|string|max:255|unique:devices,device_code',
            'last_seen_at' => 'nullable:date',
        ]);

        $device = Device::create([
            'id' => (string) Str::uuid(),
            ...$validated,
        ]);

        return response()->json($device, 201);
    }

    #PUT api/device/{id} -- hanya admin
    public function update(Request $request, String $id){
        $device = Device::find($id);

        if (! $device){
            return response()->json(['message' => 'Perangkat tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            '_chicken_coop_id' => 'required|exists:__chicken_coop_id',
            'device_code' => 'required|string|max:255|unique:devices,device_code',
            'last_seen_at' => 'nullable:date',
        ]);

        $device->update($validated);

        return response()->json($device);
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
