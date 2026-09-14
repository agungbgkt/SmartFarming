<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Override;

class Monitoring extends Model
{
    protected $table = "monitorings";
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        '_chicken__coop_id',
        'temperature',
        'humidity',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
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
        return $this->belongsTo(ChickenCoop::class, '_chicken__coop_id');
    }
}
