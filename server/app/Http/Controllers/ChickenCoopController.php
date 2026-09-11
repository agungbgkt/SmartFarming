<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChickenCoop;
use Illuminate\Support\Str;

class ChickenCoopController extends Controller
{
    #GET /api/coop -- bisa diakses admin & viewer.
    public function index(){
        return response()->json(
            ChickenCoop::with('devices')->get() #sekalian ambil semua device tiap kandang dalam 1 query.
        );
    }

    #GET /api/coop/{id} -- bisa diakses admin & viewer.
    public function show(string $id){
        $coop = ChickenCoop::with('devices')->find($id);

        if (! $coop){
            return response()->json(['message' => 'Kandang tidak ditemukan.'], 404);
        }

        return response()->json($coop);
    }

    #POST /api/coop -- hanya admin
    public function store(Request $request){
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'temperature_min' => 'required|numeric',
            'temperature_max' => 'required|numeric|gt:temperature_min', #gt singkatan dari "greater than", validasi ini mastiin suhu_max harus lebih besar dari suhu_min yang dikirim di request yang sama.
            'humidity_min' => 'required|numeric',
            'humidity_max' => 'required|numeric|gt:humidity_min',
        ]);

        $coop = ChickenCoop::create([
            'id' => (string) Str::uuid(), #karena id nggak auto-generate (UUID manual), kita generate dulu.
            ...$validated, #(disebut spread operator) itu cara ringkas buat "sebar semua isi array $validated" ke dalam array baru ini, tanpa nulis satu-satu.
        ]);

        return response()->json($coop, 201);
    }

    #PUT /api/coop/{id} -- hanya admin
    public function update(Request $request, string $id){
        $coop = ChickenCoop::find($id);

        if (! $coop){
            return response()->json(['message' => 'Kandang tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'temperature_min' => 'required|numeric',
            'temperature_max' => 'required|numeric|gt:temperature_min',
            'humidity_min' => 'required|numeric',
            'humidity_max' => 'required|numeric|gt:humidity_min',
        ]);

        $coop->update($validated);

        return response()->json($coop);
    }

    #DELETE /api/coop/{id} -- hanya admin
    public function destroy(String $id){
        $coop = ChickenCoop::find($id);

        if (! $coop){
            return response()->json(['message' => 'Kandang tidak ditemukan.'], 404);
        }

        $coop->delete();

        return response()->json(['message' => 'Kandang berhasil dihapus.']);
    }
}
