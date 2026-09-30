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
        'monitoring_mode'
    ];

    protected $casts = [
        'monitoring_mode' => 'boolean'
    ];

    protected static function boot(){
        parent::bot();

        static::creating(function ($model){
            if (empty($model->id)){
                $model->id = (string) Str::uuid();
            }
        });
    }

}
