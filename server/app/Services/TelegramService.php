<?php

namespace App\Services;

use App\Models\TelegramRecipient;
use Illuminate\Support\Facades\Http;

class TelegramService {
    public function sendAlert(string $message): bool{
        $token = env('TELEGRAM_BOT_TOKEN');
        $recipients = TelegramRecipient::where('is_active', true)->get(); #ambil semua penerima yang masih aktif, bukan cuma 1 orang.
        $allSuccess = true;

        foreach ($recipients as $recipient){ #kirim pesan yang sama ke semua penerima aktif, satu-satu.
            $response =Http::post("https://api.telegram.org/bot{$token}/sendMessage", [ #dipakai buat "manggil" API pihak lain (dalam kasus ini, API resmi Telegram) dari dalam kode PHP kita sendiri.
                'chat_id' => $recipient->telegram_chat_id,
                'text' => $message,
            ]);

            if (! $response->successful()){ #cek apakah Telegram bales dengan status sukses (2xx).
                $allSuccess = false; #Kalau ada 1 aja penerima yang gagal (misal chat_id-nya salah/udah nggak valid), $allSuccess jadi false.
            }
        }

        return $allSuccess;
    }
}
?>