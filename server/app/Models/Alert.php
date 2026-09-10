<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

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
    public function ChickenCoop():BelongsTo{
        return $this->belongsTo(ChickenCoop::class, '_chicken__coop_id');
    }
}
