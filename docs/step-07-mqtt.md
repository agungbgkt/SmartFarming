# Step 7: MQTT Listener

## Tujuan
Membuat Laravel "mendengarkan" data suhu & kelembapan yang dikirim alat
sensor (ESP32) lewat MQTT broker (Mosquitto), lalu menyimpannya ke
tabel `monitorings`.

## Konsep: request-response vs publish-subscribe
Endpoint API yang dibuat di step sebelumnya (Step 5, 6) itu model
request-response: React minta, Laravel jawab, selesai. MQTT beda --
model publish-subscribe: alat sensor PUBLISH (kirim) data ke sebuah
"topic" di broker, Laravel SUBSCRIBE (mendengarkan) topic itu terus-
menerus, menunggu data masuk kapan saja tanpa diminta duluan.

## File yang dibuat/diubah
- `config/mqtt-client.php` -- konfigurasi koneksi ke broker
- `.env` -- tambah `MQTT_HOST`, `MQTT_PORT`
- `app/Console/Commands/MqttSubscribeCommand.php` -- listener utama

## Install package
```bash
composer require php-mqtt/laravel-client
php artisan vendor:publish --tag=mqtt-client.config
```

## Desain topic & payload (kesepakatan format data)

**Topic:** `kandang/{device_code}/data`, contoh `kandang/ESP32-001/data`
-- device code ditaruh di topic-nya sendiri, jadi Laravel tahu data
ini dari device mana tanpa perlu baca isi pesan dulu.

**Payload (JSON):**
```json
{ "temperature": 32.5, "humidity": 79 }
```

## Penjelasan kode yang ditanyakan (`MqttSubscribeCommand.php`)

**`$signature = 'mqtt:subscribe'`**
Menentukan nama perintah yang diketik di terminal --
`php artisan mqtt:subscribe`, sama konsepnya seperti `migrate` yang
signature-nya `'migrate'`.

**`handle()` -- titik masuk utama**
Laravel otomatis memanggil function ini tiap kali command dijalankan
(sama konsepnya seperti `handle()` di middleware, Step 5).
- `MQTT::connection()` -- buka koneksi ke broker sesuai pengaturan di
  `config/mqtt-client.php` (host `127.0.0.1`, port `1883`)
- `$mqtt->subscribe('kandang/+/data', function(...) {...}, 0)` --
  tanda `+` adalah WILDCARD MQTT (mewakili "apa saja"), jadi command
  ini otomatis dengar SEMUA kandang sekaligus tanpa perlu daftar
  device satu-satu. Function yang dititipkan di situ (*callback*)
  dijalankan setiap ada pesan masuk
- Angka `0` di akhir -- QoS (Quality of Service) level 0: "kirim
  sekali, tanpa jaminan sampai", paling ringan, cukup untuk data
  rutin per jam (kalau sesekali ada yang hilang, tidak fatal)
- `$mqtt->loop(true)` -- membuat command TIDAK PERNAH BERHENTI sendiri,
  terus "berputar" menunggu pesan baru sampai dihentikan manual
  (`Ctrl+C`). Tanpa ini, program langsung selesai begitu dijalankan

**`processMessage()` -- logic olah data masuk**
- `explode('/', $topic)` -- memotong teks topic berdasarkan tanda `/`.
  `"kandang/ESP32-001/data"` jadi `["kandang", "ESP32-001", "data"]`,
  index `[1]` adalah `device_code`-nya
- `json_decode($message, true)` -- payload yang dikirim device berupa
  TEKS mentah, function ini menerjemahkan jadi array PHP asli supaya
  bisa diakses (`$data['temperature']`)
- Baris validasi (`if (! $deviceCode || ! $data || ! isset(...))`) --
  "gerbang keamanan": cek device code ketemu, data berhasil di-decode,
  dan field yang dibutuhkan ada. Kalau gagal salah satu, langsung
  `return` (berhenti), tidak menyimpan data yang tidak jelas
- `Device::where('device_code', $deviceCode)->first()` -- cari device
  di database. Kalau tidak ketemu (device belum terdaftar), tolak dan
  beri peringatan saja, tidak menyimpan data "yatim"
- `Monitoring::create([...])` -- `kandang_id` TIDAK didapat langsung
  dari topic MQTT, tapi disambungkan lewat `$device->kandang_id` (dari
  data device yang sudah diambil dari database) -- device tahu dia
  terpasang di kandang mana lewat relationship dari Step 3
- `'recorded_at' => now()` -- dicatat sebagai waktu SERVER menerima
  data (bukan waktu alat generate data -- bisa disempurnakan nanti
  kalau alat mengirim timestamp sendiri di payload)
- `$device->update(['last_seen_at' => now()])` -- update "kapan
  terakhir device ini mengirim data", dipakai nanti untuk deteksi
  device offline

## Masalah yang pernah ditemui & solusinya

| Masalah | Penyebab | Solusi |
|---|---|---|
| `array_merge(): Argument #2 must be of type array, int given` saat `make:command` | File `config/mqtt-client.php` hasil publish KOSONG (tidak ada `return [...]`). PHP mengembalikan `1` (integer) untuk file kosong yang di-`require`, bukan `null`/array, sehingga `array_merge` milik package gagal | Isi manual `config/mqtt-client.php` dengan array konfigurasi koneksi (host, port, protocol, dst) sesuai kebutuhan package |
| Variabel `.env` baru tidak terbaca | Cache config lama masih dipakai Laravel | `php artisan config:clear` (atau `optimize:clear` untuk membersihkan semua jenis cache sekaligus) setiap habis ubah `.env` |

## Catatan command cache yang berguna
```bash
php artisan config:clear    # hapus cache config
php artisan cache:clear     # hapus cache aplikasi
php artisan route:clear     # hapus cache routing
php artisan optimize:clear  # hapus SEMUA jenis cache sekaligus (paling praktis)
```

## Catatan penting: mendukung WiFi maupun LoRa tanpa ubah kode

Alat sensor yang dipakai SAAT INI berkomunikasi lewat LoRa, bukan WiFi
langsung. Ini TIDAK mengubah apa pun di sisi Laravel -- `mqtt:subscribe`
cuma peduli ada pesan masuk ke topic `kandang/+/data` di broker
Mosquitto, tidak peduli asal datanya dari mana.

Yang beda cuma di sisi hardware: alat LoRa butuh perantara **LoRa
Gateway** (biasanya ESP32/Raspberry Pi yang punya 2 kemampuan: menerima
sinyal LoRa DAN connect WiFi/internet), yang tugasnya menerima sinyal
LoRa lalu mem-publish ulang datanya ke MQTT broker memakai format topic
& payload yang SAMA (`kandang/{device_code}/data`, JSON
`{temperature, humidity}`). Alur lengkapnya:

```
Alat sensor (LoRa) --sinyal radio--> LoRa Gateway --publish MQTT--> Mosquitto --> Laravel (kode tidak berubah)
```

Pembuatan gateway ini masuk ranah firmware/hardware, di luar scope
tutorial web ini -- dikerjakan terpisah, kapan saja siap. Setup MQTT
di Laravel (step ini) TIDAK dihapus atau dinonaktifkan; kalau nanti
lokasi sudah fix pakai WiFi langsung (tanpa LoRa), device tinggal
publish langsung ke broker yang sama, tanpa perlu gateway.

## Klarifikasi topologi LoRa di lokasi nyata

Setup lokasi: 2 unit LoRa -- satu di kandang (pemancar, TANPA WiFi/
internet sama sekali, sesuai keunggulan LoRa jarak jauh hemat daya),
satu lagi di kantor (penerima) yang berperan sebagai LoRa Gateway
karena lokasi kantor ADA WiFi yang tersambung internet. Gateway inilah
yang publish data ke MQTT broker lewat WiFi kantor. Karena kantor
punya akses internet, notifikasi Telegram (Step 8) tetap bisa berjalan
normal -- tidak perlu fallback SMS/sistem offline lokal. Arsitektur
dari Step 1 tetap berlaku sepenuhnya, tidak ada perubahan di sisi
Laravel/React.

## Status
Command `mqtt:subscribe` berhasil dibuat dan berjalan (listener aktif,
menunggu pesan). Testing kirim data dummy dari HP (app MQTT client)
sempat terkendala firewall Windows memblokir port 1883 dari device
lain di jaringan -- solusi: tambah Inbound Rule TCP port 1883 di
Windows Defender Firewall. Verifikasi akhir (data dummy berhasil masuk
ke tabel `monitorings`) -- MENYUSUL, tidak menghalangi lanjut ke step
berikutnya karena logic ingestion sudah benar secara arsitektur.
