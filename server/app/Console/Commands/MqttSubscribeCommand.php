<?php

namespace App\Console\Commands;

use App\Models\ChickenCoop;
use Illuminate\Console\Command;
use App\Models\Monitoring;
use App\Models\Device;
use Illuminate\Support\Str;
use PhpMqtt\Client\Facades\MQTT;
use App\Models\Alert;
use App\Services\TelegramService;

class MqttSubscribeCommand extends Command
{
    protected $signature = 'mqtt:subscribe'; #yang nentuin nama perintah yang diketik terminal | cara manggilnya jadi php artisan mqtt:subscribe.
    protected $description = 'Dengarkan Data Suhu & Kelembapan dari semua kandang lewat MQTT'; #teks penjelas, muncul kalau kamu jalanin php artisan list.
    public function handle()
    {
        $mqtt = MQTT::connection(); #buka koneksi ke broker Mosquitto, pakai pengaturan yang ada di config/mqtt-client.php.
        $this->info('Mendengarkan topic kandang/+/data ...'); #buat kasih tau "sistem lagi jalan".
        
        $mqtt->subscribe('kandang/+/data', function(string $topic, string $message){ #dengerin semua topic yang polanya kandang/APAPUN/data, dan setiap kali ada pesan masuk, jalankan function di dalam kurung ini.
            $this->info("MQTT MASUK!");
            $this->info("Topic: {$topic}");
            $this->info("Message: {$message}");
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

        if (! $deviceCode ||! $data || ! isset($data['temperature'], $data['humidity'])){ #"gerbang keamanan" | cek 3 hal sekaligus: device code ketemu, data berhasil di-decode, dan ada field temperature dan humidity di dalamnya.
            $this->warn("Payload tidak valid dari topic: {$topic}");
            return;
        }

        $device = Device::where('device_code', $deviceCode)->first(); #Cari device di database berdasarkan device_code yang didapat dari topic tadi.

        if (! $device){
            $this->warn("Device tidak dikenal: {$deviceCode}");
            return;
        }

        Monitoring::create([ #nyimpen 1 baris data baru ke tabel monitorings.
            'id' => (string) Str::uuid(),
            '_chicken__coop_id' => $device->_chicken__coop_id, #"nyambungin" lewat data $device yang ambil dari database barusan (device tau dia dipasang di kandang mana lewat relationship.
            'temperature' => $data['temperature'],
            'humidity' => $data['humidity'],
            'recorded_at' => now(), #dicatat sebagai "sekarang", yaitu waktu data ini beneran diterima server.
        ]);

        $device->update(['last_seen_at' => now()]); #update "kapan terakhir device ini ngirim data",nanti dipakai buat deteksi device offline.

        $this->info("Data tersimpan: {$deviceCode} -> {$data['temperature']}°C, {$data['humidity']}%"); #lihat langsung di terminal tiap ada data masuk.

        $this->checkTreshold($device->_chicken__coop_id, $data['temperature'], $data['humidity']);
    }

    protected function checkTreshold(string $coopId, float $temperature, float $humidity): void{
        $coop = ChickenCoop::find($coopId);

        if (! $coop){
            return;
        }

        $alerts = [];

        if ($temperature > $coop->temperature_max){
            $alerts[] = ['type' => 'high_temperature', 'message' => "Suhu {$coop->name} mencapai {$temperature}°C, melebihi batas {$coop->temperature_max}°C."];
        } elseif ($temperature < $coop->temperature_min){
            $alerts[] = ['type' => 'low_temperature', 'message' => "Suhu {$coop->name} turun ke {$temperature}°C, dibawah batas {$coop->temperature_min}°C."];
        }

        if ($humidity > $coop->humidity_max){
            $alerts[] = ['type' => 'high_humidity', 'message' => "Kelembapan  {$coop->name} mencapai {$humidity}%, melebihi batas {$coop->humidity_max}%."];
        } elseif ($humidity < $coop->humidity_min){
            $alerts[] = ['type' => 'low_humidity', 'message' => "Kelembapan  {$coop->name} turun ke {$humidity}%, dibawah batas {$coop->humidity_min}%."];
        }

        foreach ($alerts as $alertData){
            $alert = Alert::create([
                '_chicken__coop_id' => $coopId,
                'type' => $alertData['type'],
                'message' => $alertData['message'],
            ]);

            $sent = (new TelegramService())->sendAlert($alertData['message']);

            $alert->update([
                'is_sent' => $sent,
                'sent_at' => $sent ? now() : null,
            ]);

            $this->info($sent ? "Alert terkirim: {$alertData['type']}" : "Alert gagal kirim: {$alertData['type']}");
        }
    }
}
