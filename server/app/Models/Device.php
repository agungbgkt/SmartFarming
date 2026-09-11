<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Device extends Model
{
    protected $table = 'devices';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        '_chicken__coop_id',
        'device_code',
        'last_seen_at',
    ];

    #bikin Laravel otomatis "ubah bentuk" data kolom itu jadi objek tanggal yang gampang di format.
    protected $casts = [
        'last_seen_at'=> 'datetime',
    ];

    public function ChickenCoop(): BelongsTo{
        return $this->belongsTo(ChickenCoop::class, '_chicken__coop_id'); #belongsTo dipakai di sisi yang "menjadi milik satu" | Device cuma menjadi milik satu ChickenCoop.
    }
}
