# Step 9: WebSocket (Laravel Reverb)

## Tujuan
Dashboard React bisa menerima update data secara REAL-TIME (data
monitoring baru, alert baru) tanpa perlu refresh manual atau polling
berulang ke API.

## Konsep: kenapa HTTP biasa tidak cukup
Endpoint API (`GET /api/kandang`, dst) sifatnya React yang minta duluan,
baru Laravel jawab. Kalau ada data baru masuk lewat MQTT, React tidak
akan tahu sampai dia bertanya lagi. WebSocket membuka jalur dua arah
yang tetap terbuka, sehingga Laravel bisa "mendorong" (push) data
kapan saja tanpa diminta. **Laravel Reverb** adalah server WebSocket
bawaan Laravel (gratis, tidak perlu layanan pihak ketiga).

## Install
```bash
php artisan install:broadcasting
```
Pilih Reverb sebagai driver, otomatis menambah variabel `REVERB_*` ke `.env`.

---

## `Event` (`MonitoringUpdated.php` & `AlertCreated.php`)

### [1] MASALAH
Perlu cara "mengumumkan" bahwa data baru terjadi, yang otomatis
diteruskan ke semua browser yang sedang mendengarkan channel terkait.

### [2] INPUT
Objek `Monitoring` / `Alert` yang baru saja dibuat.

### [3] PROSES
Class Event yang `implements ShouldBroadcast`, dipicu lewat helper `event()`.

### [4] OUTPUT
Pesan JSON terkirim ke semua browser yang subscribe channel yang sesuai.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `implements ShouldBroadcast` | Penanda: Event ini harus dikirim keluar lewat WebSocket, bukan cuma dipakai internal |
| `public Monitoring $monitoring;` + constructor | Data yang "dibawa" Event, supaya browser dapat detail lengkap tanpa request ulang |
| `broadcastOn(): array { return [new Channel("kandang.{$this->monitoring->_chicken__coop_id}")]; }` | Tentukan "saluran radio" -- per kandang, supaya browser yang buka Kandang 1 tidak ikut menerima update Kandang 2 |
| `broadcastAs(): string { return 'monitoring.updated'; }` | Nama event yang dikenali frontend; tanpa ini, Laravel pakai nama class panjang yang tidak praktis |
| `AlertCreated` broadcast ke 2 channel sekaligus (`kandang.{id}` DAN `alerts.global`) | Satu untuk detail kandang tertentu, satu untuk halaman "Log alert global" yang mendengar semua kandang |

### [6] KENAPA CARANYA BEGINI?
Channel dipisah per kandang (bukan 1 channel besar untuk semua) supaya lebih hemat -- browser hanya menerima data yang relevan dengan yang sedang dilihat.

### [7] KALAU DIUBAH?
`broadcastAs()` dihapus -> frontend harus mendengarkan nama event yang panjang dan berubah-ubah (namespace class), lebih rapuh kalau struktur folder berubah.

## Cara memicu (di `MqttSubscribeCommand.php`)
```php
event(new MonitoringUpdated($monitoring));   // setelah Monitoring::create()
event(new AlertCreated($alert));             // di dalam foreach, setelah $alert->update()
```

## Queue: `sync` vs `database`
Event `ShouldBroadcast` diproses lewat queue. `QUEUE_CONNECTION=database`
(dipakai project ini) berarti event masuk antrian (tabel `jobs`) dan
BARU diproses kalau ada `php artisan queue:work` yang berjalan. Tanpa
worker ini aktif, event tidak pernah sampai ke Reverb -- job diam di
tabel `jobs` selamanya.

## Terminal yang harus berjalan bersamaan (4 total)
| Terminal | Command | Fungsi |
|---|---|---|
| 1 | `php artisan serve` | Server API |
| 2 | `php artisan reverb:start` | Server WebSocket |
| 3 | `php artisan mqtt:subscribe` | Dengar data sensor |
| 4 | `php artisan queue:work` | Proses antrian, termasuk broadcast event |

## Cara testing (tanpa frontend React)
File HTML sederhana (`test-websocket.html`) memakai `pusher-js` (Reverb
kompatibel protokol Pusher) untuk connect langsung ke Reverb dan
subscribe channel `kandang.{id}`, lalu log ke console tiap event
`monitoring.updated`/`alert.created` masuk.

## Masalah yang pernah ditemui & solusinya
| Masalah | Penyebab | Solusi |
|---|---|---|
| Tidak ada respons apa pun dari `queue:work` | Salah paham -- itu normal, command diam sampai ada job masuk | Trigger event dulu lewat Tinker untuk memastikan |
| Event `DONE` di `queue:work`, tapi browser tidak menerima apa pun | Proses `queue:work`/`reverb:start` yang sudah berjalan lama masih memakai kode LAMA di memori (sama seperti kasus `mqtt:subscribe` sebelumnya) | Restart proses setelah mengubah kode terkait |
| `broadcastOn()` menghasilkan channel `"kandang."` (id kosong) | Salah ketik nama properti: `_chicken_coop_id` (1 underscore) padahal seharusnya `_chicken__coop_id` (2 underscore, sesuai nama kolom asli). PHP tidak error untuk properti tidak ada, hanya mengembalikan `null` diam-diam | Samakan persis nama kolom di setiap referensi antar file |
| Broadcast manual (`broadcast(['channel'], 'event', [...])`) berhasil sampai ke browser, tapi lewat Event tidak | Bukti bahwa infrastruktur (Reverb, config, koneksi) sehat -- masalah spesifik ada di kode `broadcastOn()` Event, bukan di sistem broadcasting itu sendiri | Debug isi `broadcastOn()` dengan cara memanggilnya langsung: `(new Event(...))->broadcastOn()` |

## Cara debug yang efektif (dari pengalaman di atas)
1. `php artisan reverb:start --debug` -- lihat apakah broadcast BENERAN terkirim dari Laravel dan ke channel apa
2. Tab Network -> filter WS -> klik koneksi -> tab Messages di browser -- lihat frame mentah yang masuk/keluar, tidak bergantung pada apakah kode JS berhasil membaca formatnya
3. Panggil `broadcastOn()` langsung di Tinker untuk melihat channel apa yang SEBENARNYA dihasilkan, tanpa perlu broadcast sungguhan

## Hasil akhir
Event `monitoring.updated` berhasil di-broadcast dari Laravel, diterima
Reverb, dan diteruskan sampai ke browser test -- terverifikasi lewat
log `reverb:start --debug` dan tab Network Messages, dengan data
lengkap dan channel yang sesuai kandang.
