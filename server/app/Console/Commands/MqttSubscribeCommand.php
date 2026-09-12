<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Monitoring;
use App\Models\Device;
use Illuminate\Support\Str;
use PhpMqtt\Client\Facades\MQTT;

class MqttSubscribeCommand extends Command
{
    protected $signature = 'mqtt:subscribe'; #yang nentuin nama perintah yang diketik terminal | cara manggilnya jadi php artisan mqtt:subscribe.
    protected $description = 'Dengarkan Data Suhu & Kelembapan dari semua kandang lewat MQTT'; #teks penjelas, muncul kalau kamu jalanin php artisan list.
    public function handle()
    {
        $mqtt = MQTT::connection(); #buka koneksi ke broker Mosquitto, pakai pengaturan yang ada di config/mqtt-client.php.
        $this->info('Mendengarkan topic kandang/+/data ...'); #buat kasih tau "sistem lagi jalan".
        
        $mqtt->subscribe('kandang/+/data', function(string $topic, string $message){ #dengerin semua topic yang polanya kandang/APAPUN/data, dan setiap kali ada pesan masuk, jalankan function di dalam kurung ini.
            $this->processMessage($topic, $message);
        }, 0); #Angka 0 ini QoS (Quality of Service), artinya "kirim sekali, nggak ada jaminan sampai" (paling ringan/cepat).

        $mqtt->loop(true);
    }

    #Olah data yang masuk
    protected function processMessage(string $topic, string $message):void {
        //example topic: "Kandang/ESP32-001/data"
        $parts = explode('/', $topic); #motong teks topic jadi potongan-potongan berdasarkan tanda /. Kalau topic-nya "kandang/ESP32-001/data", hasilnya array ["kandang", "ESP32-001", "data"].
        $deviceCode = $parts[1] ?? null; #ambil potongan index ke-1 | Tanda ?? kalau index itu nggak ada, pakai null

        $data = json_decode($message, true); #nerjemahin jadi array PHP asli.

        if (! $deviceCode || $data || ! isset($data['temperature'], $data['humidity'])){ #"gerbang keamanan" | cek 3 hal sekaligus: device code ketemu, data berhasil di-decode, dan ada field temperature dan humidity di dalamnya.
            $this->warn("Payload tidak valid dari topic: {$topic}");
            return;
        }

        $device = Device::where('device_code', $deviceCode)->first();

        if (! $device){
            $this->warm("Device tidak dikenal: {$deviceCode}");
            return;
        }

        Monitoring::create([
            'id' => (string) Str::uuid(),
            '_chicken__coop_id' => $device->_chicken__coop_id,
            'temperature' => $data['temperature'],
            'humidity' => $data['humidity'],
            'recorded_at' => now(),
        ]);

        $device->update(['last_seen_at' => now()]);

        $this->info("Data tersimpan: {$deviceCode} -> {$data['temperature']}°C, {$data['humidity']}%");
    }
}
