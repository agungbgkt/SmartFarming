<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChickenCoop extends Model
{
    protected $table = "_chicken__coop"; #inisiasi dari table _chicken__coop.
    protected $keyType = 'string'; #karena id pakai UUID (string acak). Tanpa 2 baris ini, Laravel defaultnya ngira id angka yang auto-increment
    public $incrementing = false; #karena id pakai UUID (string acak) dan id nggak otomatis nambah sendiri.

    protected $fillable = [ #daftar putih kolom yang boleh diisi lewat ChickenCoop::create([...]).
        'id',
        'name',
        'location',
        'temperature_min',
        'temperature_max',
        'humidity_min',
        'humidity_max',
    ];

    public function devices(){
        return $this->hasMany(Device::class, '_chicken__coop_id'); #relationship. Fungsi ini bikin bisa nulis $coop->devices artinya semacam . hasMany artinya "1 kandang punya banyak..."
    }

    public function monitorings(){
        return $this->hasMany(Monitoring::class, '_chicken__coop_id');
    }

    public function alerts(){
        return $this->hasMany(Alert::class, '_chicken__coop_id');
    }
}
