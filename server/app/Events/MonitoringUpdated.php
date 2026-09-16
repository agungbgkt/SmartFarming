<?php

namespace App\Events;

use App\Models\Monitoring;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MonitoringUpdated implements ShouldBroadcast #ini "penanda" yang bikin Laravel tau Event ini harus dikirim keluar lewat WebSocket (Reverb).
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Monitoring $monitoring; #data yang mau "dibawa" sama Event ini, biar React bisa langsung dapat data monitoring yang baru masuk, nggak perlu request ulang buat ambil detailnya.
    public function __construct(Monitoring $monitoring)
    {
      $this->monitoring = $monitoring;  
    }


    public function broadcastOn(): array
    {
        return [
            new Channel("kandang.{$this->monitoring->_chicken__coop_id}"), #nentuin "saluran radio" mana yang dipakai buat siaran ini.
        ];
    }

    public function broadcastAs(): string{
        return 'monitoring.updated'; #nama event yang dikirim ke frontend ('monitoring.updated').
    }
}
