<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $table = "devices";
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        '_chicken__coop_id',
        'device_kode',
        'last_seen_at',
    ];
}
