<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Override;

class Alert extends Model
{
    protected $table = "alerts";
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        '_chicken__coop_id',
        'type',
        'message',
        'is_sent',
        'send_at',
    ];
    protected $casts = [
        'is_sent' => 'boolean', #supaya nanti pas bikin kondisi if ($alert->is_sent) di kode, hasilnya selalu bisa diprediksi.
        'send_at' => 'datetime',
    ];

    #[Override]
    protected static function boot() #dipakai buat "pasang" event listener.
    {
        parent::boot();

        static::creating(function ($model){ #daftarin sebuah aksi yang otomatis jalan tepat sebelum data baru disimpan ke database (event creating).
            if (empty($model->id)){ #cuma generate UUID baru kalau id-nya belum diisi.
                $model->id = (string) Str::uuid();
            }
        });
    }
    public function ChickenCoop():BelongsTo{
        return $this->belongsTo(ChickenCoop::class, '_chicken__coop_id');
    }
}
