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
use Illuminate\Support\Carbon;
use App\Events\AlertCreated;
use App\Events\MonitoringUpdated;
use App\Models\SystemSetting;

class MqttSubscribeCommand extends Command
{
    protected $signature = 'mqtt:subscribe'; #yang nentuin nama perintah yang diketik terminal | cara manggilnya jadi php artisan mqtt:subscribe.
    protected $description = 'Dengarkan Data Suhu & Kelembapan dari semua kandang lewat MQTT'; #teks penjelas, muncul kalau kamu jalanin php artisan list.
    public function handle()
    {
        // $mqtt = MQTT::connection(); #buka koneksi ke broker Mosquitto, pakai pengaturan yang ada di config/mqtt-client.php.
        // $this->info('Mendengarkan topic kandang/+/data ...'); #buat kasih tau "sistem lagi jalan".
        
        // $mqtt->subscribe('kandang/+/data', function(string $topic, string $message){ #dengerin semua topic yang polanya kandang/APAPUN/data, dan setiap kali ada pesan masuk, jalankan function di dalam kurung ini.
        //     $this->info("MQTT MASUK!");
        //     $this->info("Topic: {$topic}");
        //     $this->info("Message: {$message}");
        //     $this->processMessage($topic, $message);
        // }, 0); #Angka 0 ini QoS (Quality of Service), artinya "kirim sekali, nggak ada jaminan sampai" (paling ringan/cepat).

        // $mqtt->loop(true);
        try { // try/catch di dalam callback. Sekarang satu payload yang bikin database menolak (misal "temperature": "abc") atau satu masalah jaringan saat kirim Telegram menjatuhkan seluruh listener.
            $mqtt = MQTT::connection();

            if (function_exists('pcntl_signal')){ // pcntl_signal: membuat systemctl restart atau supervisorctl restart menutup koneksi dengan rapi. Ekstensi pcntl tidak ada di Windows (makanya dibungkus function_exists).
                pcntl_async_signals(true);
                $stop = function () use ($mqtt){
                    $this->info('Sinyal berhenti diterima, menutup koneksi MQTT...');
                    $mqtt->interrupt();
                };
                pcntl_signal(SIGTERM, $stop);
                pcntl_signal(SIGINT, $stop);
            }

            $this->info('Mendengarkan topic kandang/+/data ...');

            $mqtt->subscribe('kandang/+/data', function (string $topic, string $message){
                try {
                    $this->processMessage($topic, $message);
                } catch (\Throwable $e){
                    $this->error("Gagal memproses pesan dari {$topic}: " . $e->getMessage());
                    report($e);
                }
            }, 0);

            $mqtt->loop(true);
            $mqtt->disconnect();

            return self::SUCCESS;
        } catch (\Throwable $e){ // catch di luar: kalau koneksi ke broker benar-benar putus atau gagal dibuat, command berhenti dengan kode gagal, sehingga penjaga proses bisa menyalakannya lagi.
            $this->error('MQTT berhenti: ' . $e->getMessage());
            report($e);
            sleep(5); // sleep(5) sebelum keluar: jeda antar percobaan.

            return self::FAILURE;
        }
    }

    public function settings(): SystemSetting { // SystemSetting::create([])->fresh(): nilai bawaan database tidak terbawa di objek hasil create(), jadi tanpa fresh() semua toggle terbaca null (mati).
        return SystemSetting::first() ?? SystemSetting::create([])->fresh();
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

        // Pengecekan is_numeric baru. Payload seperti "temperature": "abc" sekarang cukup memberi peringatan, tidak lagi memicu error di callback.
        if (! is_numeric($data['temperature']) || ! is_numeric($data['humidity'])){
            $this->warn("Nilai suhu/kelembapan bukan angka dari topic: {$topic}");
            return;
        }

        $device = Device::where('device_code', $deviceCode)->first(); #Cari device di database berdasarkan device_code yang didapat dari topic tadi.

        if (! $device){
            $this->warn("Device tidak dikenal: {$deviceCode}");
            return;
        }

        $device->update(['last_seen_at' => now(), 'offline_notified_at' => null]);  #update "kapan terakhir device ini ngirim data",nanti dipakai buat deteksi device offline.
        $settings = $this->settings();

        if (! $settings->monitoring_mode){
            $this->warn("Mode monitoring nonaktif, data dari {$deviceCode} tidak disimpan.");
            return;
        }

        $temperature = (float) $data['temperature'];
        $humidity = (float) $data['humidity'];
        $recordedAt = now();
        
        $monitoring = Monitoring::create([ #nyimpen 1 baris data baru ke tabel monitorings.
                        'id' => (string) Str::uuid(),
                        '_chicken__coop_id' => $device->_chicken__coop_id, #"nyambungin" lewat data $device yang ambil dari database barusan (device tau dia dipasang di kandang mana lewat relationship.
                        'temperature' => $temperature,
                        'humidity' => $humidity,
                        'recorded_at' => $recordedAt, #dicatat sebagai "sekarang", yaitu waktu data ini beneran diterima server.
        ]);

        event(new MonitoringUpdated($monitoring)); #cara "menyalakan" Event di Laravel: bungkus data yang relevan ($monitoring) ke dalam Event, lalu panggil helper event().

        $this->info("Data tersimpan: {$deviceCode} -> {$data['temperature']}°C, {$data['humidity']}%"); #lihat langsung di terminal tiap ada data masuk.

        $this->checkTreshold($device->_chicken__coop_id, $data['temperature'], $data['humidity'], $recordedAt, $settings);
    }

    #Urutan di checkTreshold: laporan “Normal” ditentukan sebelum disaring toggle. Kalau disaring dulu, mematikan “Peringatan Suhu” membuat suhu yang melewati batas terlihat “tidak ada alert”, lalu sistem keliru mengirim “kondisi normal”.
    protected function checkTreshold(string $coopId, float $temperature, float $humidity, Carbon $recordedAt, SystemSetting $settings): void{
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

        if (empty($alerts) && $this->reportIsDue($coopId, $recordedAt, $settings)){
            $alerts[] = [
                'type' => 'normal',
                'message' => "Suhu & Kelembapan {$coop->name} Normal. Suhu {$temperature}°C, Kelembapan {$humidity}%.",
            ];
        }

        $alerts = array_filter($alerts, fn ($alert) => $this->NotificationsEnabled($alert['type'], $settings));

        foreach ($alerts as $alertData){
            $alert = Alert::create([
                '_chicken__coop_id' => $coopId,
                'type' => $alertData['type'],
                'message' => $alertData['message'],
                'temperature' => $temperature,
                'humidity' => $humidity,
            ]);

            $sent = (new TelegramService())->sendAlert($alertData['message']);

            $alert->update([
                'is_sent' => $sent,
                'send_at' => $sent ? now() : null,
            ]);

            event(new AlertCreated($alert));

            $this->info($sent ? "Alert terkirim: {$alertData['type']}" : "Alert gagal kirim: {$alertData['type']}");
        }
    }

    protected function reportIsDue(string $coopId, Carbon $recordedAt, SystemSetting $settings): bool {
        $interval = max(1, (int) $settings->report_interval_minutes);
        if (!in_array($recordedAt->minute % $interval, [0, 1, 2])){ // $recordedAt->minute % $interval: untuk interval 60 sama dengan minute. Untuk 15, menit 0, 15, 30, 45 plus toleransi 2 menit.
            return false;
        }

        return ! Alert::where('_chicken__coop_id', $coopId)
            ->where('type', 'normal')
            ->where('created_at', '>=', now()->subMinutes(max($interval - 5, 1)))
            ->exists(); // Cek exists() mencegah dua pembacaan di jendela yang sama (misalnya kiriman terjadwal dan kiriman darurat berdekatan) menghasilkan dua laporan.
    }

    protected function NotificationsEnabled(string $type, SystemSetting $settings): bool {
        return match(true){
            $type === 'normal' => (bool) $settings->notify_report,
            str_contains($type, 'temperature') => (bool) $settings->notify_temperature,
            str_contains($type, 'humidity') => (bool) $settings->notify_humidity,
            default => true,
        };
    }
}
