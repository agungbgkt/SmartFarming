# Step 8: Alert Logic + Telegram + Endpoint Grafik/Log

## `TelegramService.php` -- `sendAlert()`

### [1] MASALAH
Perlu cara kirim pesan ke Telegram yang bisa dipanggil dari banyak tempat, ke banyak penerima sekaligus.

### [2] INPUT
`string $message`.

### [3] PROSES
`Http::post()` ke API resmi Telegram, diulang untuk tiap penerima aktif.

### [4] OUTPUT
`true`/`false` (semua penerima berhasil menerima atau tidak).

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `$recipients = TelegramRecipient::where('is_active', true)->get();` | Ambil SEMUA penerima yang masih aktif, bukan cuma satu |
| `foreach ($recipients as $recipient) { Http::post(...) }` | Kirim pesan yang SAMA ke tiap penerima, satu-satu |
| `Http::post("https://api.telegram.org/bot{$token}/sendMessage", ['chat_id' => ..., 'text' => ...])` | `Http::post` = HTTP Client Laravel untuk MEMANGGIL API pihak lain (kebalikan dari peran Laravel sebagai penyedia API ke React) |
| `if (! $response->successful()) $allSuccess = false;` | Kalau SATU SAJA penerima gagal, status akhir jadi gagal |

### [6] KENAPA CARANYA BEGINI?
Dipisah jadi Service class (bukan ditulis langsung di Command) supaya logic pengiriman Telegram bisa dipanggil ulang dari tempat lain tanpa duplikasi kode.

### [7] KALAU DIUBAH?
`foreach` diganti kirim ke 1 penerima saja (yang pertama) -> penerima lain yang terdaftar tidak akan pernah dapat notifikasi apa pun.

---

## `MqttSubscribeCommand.php` -- `checkTreshold()`

### [1] MASALAH
Kondisi abnormal harus dikirim notifikasi KAPAN SAJA terjadi; kondisi normal cukup dilaporkan 1x per jam sebagai tanda sistem hidup, dengan toleransi waktu karena alat tidak pernah kirim persis di detik 0.

### [2] INPUT
`$kandangId`, `$temperature`, `$humidity`, `$recordedAt` (Carbon).

### [3] PROSES
Kumpulkan semua kondisi bermasalah ke array, tambahkan status "normal" jika syarat terpenuhi, lalu proses satu-satu: simpan ke `alerts` + kirim Telegram.

### [4] OUTPUT
0 atau lebih baris baru di tabel `alerts`, dan pesan Telegram terkirim untuk masing-masing.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `$coop = ChickenCoop::find($coopId); if (! $coop) return;` | Berhenti kalau kandang tidak ketemu (data tidak valid) |
| `$alerts = [];` | Wadah kosong, menampung SEMUA masalah yang terjadi di data ini |
| `if ($temperature > $coop->temperature_max) {...} elseif ($temperature < $coop->temperature_min) {...}` | `elseif` (bukan 2 `if` terpisah) karena suhu tidak mungkin sekaligus "terlalu tinggi" dan "terlalu rendah" |
| (blok sama untuk `humidity`) | Sama persis, untuk kelembapan |
| `if (empty($alerts) && in_array($recordedAt->minute, [0,1,2])) { $alerts[] = [...'normal'...]; }` | Kirim laporan "normal" HANYA kalau tidak ada masalah SEKALIGUS data ini direkam di menit 0-2 (toleransi keterlambatan jaringan) |
| `foreach ($alerts as $alertData) { Alert::create(...); $sent = (new TelegramService())->sendAlert(...); $alert->update(['is_sent'=>$sent,...]); }` | `Alert::create()` dipanggil DULU (sebelum kirim), supaya ada jejak di database walau Telegram gagal kirim |

### [6] KENAPA CARANYA BEGINI?
`in_array($recordedAt->minute, [0,1,2])` dipakai daripada `=== 0` karena alat tidak pernah kirim data persis di detik nol -- perbandingan kaku (`=== 0`) akan melewatkan laporan jam-an kalau data terlambat 1-2 menit karena jaringan.

### [7] KALAU DIUBAH?
- Baris kondisi "normal" dihapus -> tidak ada laporan rutin jam-an, sistem cuma "bicara" saat darurat
- `in_array(...)` diganti `=== 0` -> laporan jam-an bisa hilang di jam-jam tertentu kalau data nyampe telat sedikit dari jadwal

---

## `MonitoringController.php` -- `index()`

### [1] MASALAH
Grafik dashboard butuh data historis dengan filter periode (hari ini/7 hari/30 hari), dan HARUS berupa data ASLI per jam (bukan hasil olah/rata-rata).

### [2] INPUT
Query parameter `?range=today|7days|30days` (opsional, default `today`), `$kandangId` dari URL.

### [3] PROSES
`match()` menentukan tanggal mulai, filter tambahan `whereRaw` untuk ambil data per jam saja.

### [4] OUTPUT
JSON array data (`temperature`, `humidity`, `recorded_at`), diurutkan dari lama ke baru.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `$range = $request->query('range', 'today');` | Baca parameter URL (BUKAN body) |
| `match ($range) { '7days' => now()->subDays(7), ... default => now()->startOfDay() }` | Tentukan titik awal data sesuai pilihan filter |
| `->whereRaw('EXTRACT(MINUTE FROM recorded_at) IN (0, 1, 2)')` | Ambil HANYA data yang direkam di menit 0-2 tiap jam -- data asli, bukan rata-rata |
| `->orderBy('recorded_at')` | Urut dari lama ke baru, penting untuk sumbu waktu grafik |

### [6] KENAPA CARANYA BEGINI?
`whereRaw` dipakai (bukan `where` biasa) karena Eloquent tidak punya cara pendek bawaan untuk mengekstrak bagian menit dari sebuah timestamp -- perlu fungsi SQL native PostgreSQL (`EXTRACT`). Filter menit dipilih daripada mengambil semua data lalu dirata-rata di PHP, supaya angka yang tampil di grafik adalah pembacaan ASLI sensor di jam itu, bukan hasil manipulasi.

### [7] KALAU DIUBAH?
`IN (0,1,2)` dihapus (ambil semua data tanpa filter menit) -> grafik "per jam" akan menampilkan 4 titik per jam (tiap 15 menit), bukan 1 titik seperti yang direncanakan -- perlu diagregasi ulang di frontend kalau memang mau tampilan per jam.

---

## `AlertController.php` -- `index()`

### [1] MASALAH
Dashboard butuh daftar notifikasi (card "Notifikasi saat ini" dan halaman "Log alert global"), dengan atau tanpa filter kandang tertentu.

### [2] INPUT
Query parameter opsional: `kandang_id`, `limit`.

### [3] PROSES
`Alert::with('chickenCoop')`, filter kondisional, `->latest('sent_at')`.

### [4] OUTPUT
JSON array alert (termasuk nama kandang), maksimal sejumlah `limit`.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `Alert::with('chickenCoop')` | Sekalian ambil nama kandang, tanpa request terpisah dari React |
| `->latest('sent_at')` | Urutkan dari yang paling baru dikirim di atas |
| `if ($request->has('kandang_id')) { $query->where(...); }` | `has()` cuma cek APAKAH parameter dikirim (beda dari `query()` yang mengambil nilainya) -- membuat filter ini opsional |
| `$limit = $request->query('limit', 20);` | Default 20 data terbaru, mencegah response membengkak |

### [6] KENAPA CARANYA BEGINI?
Filter `kandang_id` dibuat opsional (bukan wajib) supaya SATU endpoint yang sama bisa dipakai untuk dua kebutuhan berbeda: halaman detail kandang (dengan filter) dan halaman log global (tanpa filter).

### [7] KALAU DIUBAH?
`$request->has()` diganti `$request->query('kandang_id')` langsung tanpa pengecekan -> kalau parameter tidak dikirim, nilainya `null`, dan `where('_chicken__coop_id', null)` akan mencari kandang dengan id `null` (tidak akan pernah ada), hasilnya SELALU kosong walau seharusnya menampilkan semua data.

## Setup Bot Telegram (di luar kode)
1. Chat `@BotFather` di Telegram, `/newbot`, ikuti instruksi
2. Simpan token ke `.env` (`TELEGRAM_BOT_TOKEN`)
3. Ambil `chat_id` sendiri lewat `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Daftarkan `chat_id` itu ke tabel `telegram_recipients`

## Hasil akhir
Alert logic + Telegram berhasil ditest end-to-end (data abnormal terkirim
notifikasi darurat; data normal di menit 0-2 terkirim notifikasi rutin;
data normal di luar menit itu diam). Endpoint grafik dan log alert siap
dipakai frontend.
