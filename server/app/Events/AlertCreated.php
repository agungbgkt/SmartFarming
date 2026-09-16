<?php

namespace App\Events;

use App\Models\Alert;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlertCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Alert $alert;
    public function __construct(Alert $alert)
    {
        $this->alert = $alert;
    }
    public function broadcastOn(): array
    {
        return [ #satu buat yang lagi liat detail kandang tertentu, satu lagi (alerts.global) buat halaman "Log alert global" yang mau denger semua alert dari kandang mana pun.
            new Channel("kandang.{$this->alert->_chicken__coop_id}"),
            new Channel('alerts.global'),
        ];
    }
    public function broadcastAs(): string{
        return 'alert.created';
    }
}
