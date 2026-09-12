# Step 4: Seeder (data awal)

## Tujuan
Mengisi data awal (akun admin pertama + contoh kandang & device) supaya ada
data untuk testing, tanpa insert manual satu-satu lewat database tool.

## Kenapa akun admin lewat seeder, bukan lewat form signup?
Aturan role: akun baru dari signup selalu default `viewer`, hanya admin
yang bisa menaikkan role user lain. Karena itu, admin pertama TIDAK bisa
lahir dari alur signup normal — harus dibuat lewat jalur lain (seeder).

## Yang dikerjakan

`database/seeders/UserSeeder.php` — bikin 1 akun admin. Password diambil
dari `env('ADMIN_SEED_PASSWORD', ...)`, bukan ditulis langsung di kode,
supaya password asli tidak ikut ter-commit ke GitHub. Tambahkan
`ADMIN_SEED_PASSWORD=...` di `server/.env`.

`database/seeders/ChickenCoopSeeder.php` — bikin 1 contoh kandang +
1 device. Karena id pakai UUID (bukan auto-increment), id harus di-generate
manual pakai `Str::uuid()` saat insert.

`database/seeders/DatabaseSeeder.php` — hapus kode default bawaan Laravel
(`User::factory()->create([...])`, bikin "Test User" dummy yang tidak
relevan), ganti dengan pemanggilan kedua seeder di atas lewat `$this->call([...])`.

## Command
```bash
php artisan make:seeder UserSeeder
php artisan make:seeder ChickenCoopSeeder
php artisan db:seed
```

## Verifikasi
```bash
php artisan tinker
>>> User::all();
>>> ChickenCoop::with('devices')->get();
```

## Hasil akhir
Seeder berhasil dijalankan, data admin + contoh kandang & device sudah
ada di database.