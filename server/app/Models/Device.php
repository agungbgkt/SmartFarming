<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

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
    protected static function boot() #dipakai buat "pasang" event listener.
    {
        parent::boot();

        static::creating(function ($model){ #daftarin sebuah aksi yang otomatis jalan tepat sebelum data baru disimpan ke database (event creating).
            if (empty($model->id)){ #cuma generate UUID baru kalau id-nya belum diisi.
                $model->id = (string) Str::uuid();
            }
        });
    }
    public function ChickenCoop(): BelongsTo{
        return $this->belongsTo(ChickenCoop::class, '_chicken__coop_id'); #belongsTo dipakai di sisi yang "menjadi milik satu" | Device cuma menjadi milik satu ChickenCoop.
    }
}
