<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TelegramRecipient extends Model
{
    protected $table = "telegram_recipients";
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'telegram_chat_id',
        'name',
        'is_active',
    ];
    protected $casts = [
        'is_active' => 'boolean',
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
}
