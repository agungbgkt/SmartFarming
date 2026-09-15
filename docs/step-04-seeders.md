# Step 4: Seeder (data awal)

## `UserSeeder.php`

### [1] MASALAH
Aturan sistem: role `admin` tidak boleh dibuat lewat form signup biasa
(signup selalu `viewer`). Jadi admin pertama HARUS dibuat lewat jalur
lain, di luar alur normal.

### [2] INPUT
Nilai dari `.env`: `ADMIN_SEED_PASSWORD`.

### [3] PROSES
`User::create([...])` dijalankan sekali lewat `php artisan db:seed`.

### [4] OUTPUT
1 baris di tabel `users` dengan `role = 'admin'`.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `'password' => Hash::make(env('ADMIN_SEED_PASSWORD', 'ganti_password_ini'))` | Password diambil dari `.env`, BUKAN ditulis langsung di kode -- supaya password asli tidak ikut ter-commit ke GitHub |
| `'role' => 'admin'` | Satu-satunya tempat resmi role admin dibuat langsung (di luar ini, role selalu dipaksa `viewer`) |

### [6] KENAPA CARANYA BEGINI?
Fallback `env('KEY', 'default')` dipakai bukan agar password boleh kosong, tapi jaga-jaga kalau lupa isi `.env` -- TAPI perlu diingat: fallback ini hanya berlaku kalau key TIDAK ADA sama sekali di `.env`, bukan kalau ada tapi kosong (bug yang pernah ditemui, `env()` mengembalikan `""`).

### [7] KALAU DIUBAH?
`'role' => 'admin'` diganti mengambil dari variabel luar (misal `env('ADMIN_ROLE')`) -> membuka celah keamanan kalau variabel itu bisa disuntik dari luar; sengaja di-hardcode literal.

---

## `ChickenCoopSeeder.php`

### [1] MASALAH
Butuh data contoh (kandang + device) untuk testing tanpa insert manual satu-satu.

### [2] INPUT
Tidak ada input dinamis -- nilai ditulis langsung di kode (data dummy).

### [3] PROSES
`ChickenCoop::create([...])` lalu `Device::create([...])`, dijalankan `php artisan db:seed`.

### [4] OUTPUT
1 baris kandang + 1 baris device yang terhubung (`kandang_id` device = `id` kandang yang baru dibuat).

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `$kandang = ChickenCoop::create([...]);` | Simpan dulu, hasilnya (termasuk `id` yang auto-generate lewat `boot()`) ditampung ke variabel |
| `Device::create(['_chicken__coop_id' => $kandang->id, ...])` | Pakai `id` dari kandang yang BARU SAJA dibuat -- inilah yang menyambungkan device ke kandang yang benar |

### [6] KENAPA CARANYA BEGINI?
Device harus dibuat SETELAH kandang (bukan bareng/sebelum), karena butuh `id` kandang yang cuma ada setelah `create()` kandang selesai dijalankan.

### [7] KALAU DIUBAH?
Urutan dibalik (Device dibuat duluan) -> error, karena `$kandang->id` belum ada nilainya saat itu (variabel belum didefinisikan).

---

## `DatabaseSeeder.php`

### [1] MASALAH
Perlu satu titik pemanggilan agar `php artisan db:seed` menjalankan SEMUA seeder yang dibuat, bukan cuma satu-satu manual.

### [2] INPUT
Tidak ada.

### [3] PROSES
Function `run()` memanggil seeder lain lewat `$this->call([...])`.

### [4] OUTPUT
Semua seeder yang didaftarkan berjalan berurutan sesuai urutan dalam array.

### [5] URUTAN KODE
```php
$this->call([
    UserSeeder::class,
    ChickenCoopSeeder::class,
]);
```
→ Urutan dalam array = urutan eksekusi. Kode bawaan Laravel
(`User::factory()->create([...])`, bikin "Test User" dummy) dihapus
dari sini karena tidak relevan dengan data project.

### [6] KENAPA CARANYA BEGINI?
`$this->call([...])` dipakai daripada menjalankan tiap seeder manual
satu-satu lewat command terpisah -- supaya `php artisan db:seed` cukup
1 perintah untuk mengisi semua data awal sekaligus.

### [7] KALAU DIUBAH?
Salah satu seeder dihapus dari array ini -> seeder itu TIDAK akan
jalan walau file-nya masih ada, karena Laravel cuma menjalankan
seeder yang terdaftar di sini.

## Command yang dipakai
```bash
php artisan make:seeder UserSeeder
php artisan make:seeder ChickenCoopSeeder
php artisan db:seed
```

## Hasil akhir
Seeder berhasil dijalankan, data admin + contoh kandang & device ada
di database. Verifikasi lewat `php artisan tinker`: `User::all()`,
`ChickenCoop::with('devices')->get()`.