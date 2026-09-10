<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
