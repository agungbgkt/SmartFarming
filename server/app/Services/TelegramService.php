<?php

namespace App\Services;

use App\Models\TelegramRecipient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService {
    public function sendAlert(string $message): bool{
        $token = config('services.telegram.bot_token');
        // $recipients = TelegramRecipient::where('is_active', true)->get(); #ambil semua penerima yang masih aktif, bukan cuma 1 orang.
        
        if (empty($token)){
            Log::error('TELEGRAM_BOT_TOKEN belum diisi.');
            return false;
        }
        $recipients = TelegramRecipient::where('is_active', true)->get();
        if ($recipients->isEmpty()){
            Log::warning('Tidak ada penerima Telegram aktif, pesan tidak dikirim.');
            return false;
        }

        $allSuccess = true;

        foreach ($recipients as $recipient){ #kirim pesan yang sama ke semua penerima aktif, satu-satu.
            try { // Http::timeout(10): bawaannya 30 detik. Selama itu listener tidak memproses pesan lain.
                $response =Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [ #dipakai buat "manggil" API pihak lain (dalam kasus ini, API resmi Telegram) dari dalam kode PHP kita sendiri.
                    'chat_id' => $recipient->telegram_chat_id,
                    'text' => $message,
                ]);

                if (! $response->successful()){ #cek apakah Telegram bales dengan status sukses (2xx).
                    $allSuccess = false; #Kalau ada 1 aja penerima yang gagal (misal chat_id-nya salah/udah nggak valid), $allSuccess jadi false.
                    Log::warning('Telegram gagal terkirim', [
                        'chat_id' => $recipient->telegram_chat_id,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    }
            } catch (\Throwable $e){
                Log::warning('Telegram gagal terkirim',[
                    'chat_id' => $recipient->telegram_chat_id,
                    'error' => str_replace($token, '***', $e->getMessage()), // str_replace($token, '***', ...): pesan error koneksi Laravel memuat URL lengkap, dan di URL itu ada token bot.
                ]);
                $allSuccess = false;
            }
        }

        return $allSuccess;
    }
}
?>