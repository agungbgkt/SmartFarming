# Step 3: Struktur database

## Tujuan
Membuat tabel-tabel yang dibutuhkan lewat migration Laravel, sesuai skema
yang sudah direncanakan.

## Tabel & alasan desainnya

- `users` — autentikasi & role (admin/viewer), berdiri sendiri karena baik
  admin maupun viewer bisa akses semua kandang, bukan di-assign per kandang
- `chicken__coop` — master data, jadi acuan       (foreign key) untuk devices, readings,
  alerts. Kolom `suhu_min`/`suhu_max` di sini karena tiap kandang bisa punya
  ambang batas darurat berbeda
- `devices` — dipisah dari `chicken__coop` supaya bisa lacak status device
  (`last_seen_at`, deteksi offline) terpisah dari status suhu, dan
  mendukung lebih dari 1 device per kandang di masa depan
- `monitorings` — tabel time-series (terus bertambah), 1 baris per data
  masuk. Dipisah dari `chicken__coop` supaya histori tidak tertimpa data baru,
  dibutuhkan untuk grafik hari ini/7 hari/1 bulan
- `alerts` — log kejadian darurat, terpisah dari `monitorings` karena tujuan
  beda: bahan untuk card notifikasi dashboard & evaluasi kandang bermasalah
- `telegram_recipients` — daftar penerima notifikasi, global (belum
  per-kandang) karena requirement saat ini belum butuh itu

## Command yang dipakai
```bash
php artisan make:migration add_role_to_users_table --table=users
php artisan make:migration create_chicken__coop_table
php artisan make:migration create_devices_table
php artisan make:migration create_monitorings_table
php artisan make:migration create_alerts_table
php artisan make:migration create_telegram_recipients_table

php artisan migrate
```

Catatan: _chicken__coop tidak mengikuti konvensi penamaan Laravel (harusnya huruf kecil, snake_case, bentuk jamak). Tetap berfungsi normal, tapi Model Eloquent-nya butuh 1 baris tambahan (protected $table = ...) untuk memberi tahu Laravel nama tabel aslinya, karena Laravel tidak bisa menebaknya otomatis dari nama Model.

Tabel & alasan desainnya
users — autentikasi & role (admin/viewer), berdiri sendiri karena baik admin maupun viewer bisa akses semua kandang, bukan di-assign per kandang
_chicken__coop — master data, jadi acuan (foreign key) untuk devices, monitorings, alerts. Kolom suhu_min/suhu_max/humidity_min/ humidity_max di sini karena tiap kandang bisa punya ambang batas darurat berbeda
devices — dipisah dari kandang supaya bisa lacak status device (last_seen_at, deteksi offline) terpisah dari status suhu, dan mendukung lebih dari 1 device per kandang di masa depan
monitorings — tabel time-series (terus bertambah), 1 baris per data masuk. Dipisah dari kandang supaya histori tidak tertimpa data baru, dibutuhkan untuk grafik hari ini/7 hari/1 bulan. Ada index gabungan (kandang_id, recorded_at) supaya query grafik tetap cepat walau data sudah menumpuk banyak
alerts — log kejadian darurat, ada is_sent (status boolean) dan sent_at (waktu persis) untuk keperluan card notifikasi status kirim Telegram
telegram_recipients — daftar penerima notifikasi, global (belum per-kandang) karena requirement saat ini belum butuh itu, punya is_active supaya penerima bisa dinonaktifkan tanpa kehilangan histori

## Cara ubah/hapus tabel di tengah jalan

Kalau migration BELUM pernah dijalankan: edit/hapus langsung file migration-nya.

Kalau migration SUDAH pernah dijalankan:
```bash
# ganti nama tabel di tengah
php artisan migrate:rollback --path=database/migrations/nama_file.php
# edit isi file (Schema::create('nama_baru', ...))
php artisan migrate

# reset total (development saja, akan hapus SEMUA data)
php artisan migrate:fresh
```

## Hasil akhir
