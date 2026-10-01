<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SystemSetting extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'timezone',
        'report_interval_minutes',
        'monitoring_mode',
        'notify_report',
        'notify_temperature',
        'notify_humidity',
        'notify_offline',
    ];

    protected $casts = [
        'monitoring_mode' => 'boolean',
        'notify_report' => 'boolean',
        'notify_temperature' => 'boolean',
        'notify_humidity' => 'boolean',
        'notify_offline' => 'boolean',
    ];

    protected static function boot(){
        parent::boot();

        static::creating(function ($model){
            if (empty($model->id)){
                $model->id = (string) Str::uuid();
            }
        });
    }

}
