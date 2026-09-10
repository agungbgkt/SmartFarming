<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ChickenCoop;
use App\Models\Device;
use Illuminate\Support\Str;

class ChickenCoopSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coop = ChickenCoop::create([
            'id' => (string) Str::uuid(), #helper bawaan Laravel yang bikin UUID acak.
            'name' => 'Kandang Ayam 1',
            'location' => 'Area A',
            'temperature_min' => 25,
            'temperature_max' => 36,
            'humidity_min' => 65,
            'humidity_max' => 85,
        ]);

        Device::create([
            'id' => (string) Str::uuid(),
            '_chicken__coop_id' => $coop->id,
            'device_code' => 'ESP32-001',
        ]);
    }
}
