# Step 3: Migration & Model

## Pola umum yang berlaku di SEMUA migration (kecuali `users`)

### [1] MASALAH
Perlu tabel dengan struktur pasti sebelum aplikasi bisa simpan data.

### [2] INPUT
Tidak ada input dinamis -- migration dijalankan sekali via `php artisan migrate`.

### [3] PROSES
Dieksekusi Laravel, diterjemahkan jadi perintah SQL `CREATE TABLE` ke PostgreSQL.

### [4] OUTPUT
Tabel baru siap dipakai di database.

### [5] Baris yang selalu muncul & artinya
| Baris | Untuk apa |
|---|---|
| `$table->uuid('id')->primary()` | Primary key pakai UUID (string acak), bukan angka urut -- lebih aman untuk sistem yang melibatkan device luar |
| `$table->foreign('..._id')->references('id')->on('tabel')->onDelete('cascade')` | Kolom ini WAJIB berisi id yang ada di tabel induk; kalau induk dihapus, baris ini ikut terhapus otomatis |
| `$table->timestamps()` | Bikin 2 kolom otomatis: `created_at`, `updated_at` |

### [6] KENAPA CARANYA BEGINI?
UUID dipilih karena project ini melibatkan device eksternal (ESP32/gateway) yang mengirim data ke sistem -- UUID lebih aman daripada id angka urut yang gampang ditebak. `cascade` dipilih karena data anak (device, monitoring, alert) tidak berguna tanpa induknya (kandang).

### [7] KALAU DIUBAH?
`onDelete('cascade')` diganti `restrict` -> menghapus kandang yang masih punya device/data akan DITOLAK database, bukan ikut terhapus.

---

## Tabel per migration (kolom spesifik saja)

| Tabel | Kolom khusus | Kenapa |
|---|---|---|
| `_chicken__coop` | `name`, `location` (nullable), `suhu_min/max`, `humidity_min/max` (float) | Threshold beda per kandang |
| `devices` | `kandang_id` (FK), `device_code` (unique), `last_seen_at` (nullable) | `unique` cegah 2 device kode sama; `last_seen_at` untuk deteksi offline |
| `monitorings` | `kandang_id` (FK), `temperature`, `humidity`, `recorded_at`, index `(kandang_id, recorded_at)` | Index wajib karena tabel ini paling cepat membesar (data per 15 menit x banyak kandang x terus-menerus) |
| `alerts` | `kandang_id` (FK), `type`, `message` (text), `is_sent` (boolean, default false), `sent_at` (nullable) | `is_sent`+`sent_at` terpisah: satu untuk status ya/tidak, satu untuk waktu persis |
| `telegram_recipients` | `telegram_chat_id` (unique), `name`, `is_active` (boolean, default true) | Tidak ada FK -- berdiri sendiri, global untuk semua kandang |
| `users` (tambahan) | `role` (string, default `'viewer'`) | Default wajib `viewer` -- admin cuma bisa dibuat lewat seeder, bukan self-assign |

**[7] KALAU DIUBAH?** kolom `unique` di `device_code`/`telegram_chat_id` dihapus -> sistem bisa punya 2 baris kembar tanpa error, tapi berpotensi bikin data ambigu (device mana yang dimaksud).

---

## Pola umum SEMUA Model (kecuali `User`)

### [1] MASALAH
Butuh cara akses/simpan data tabel pakai kode PHP, tanpa nulis SQL manual, dan UUID harus ter-generate otomatis (karena bukan auto-increment).

### [2] INPUT
Array data dari Controller/Command, contoh `Model::create([...])`.

### [3] PROSES
Class Model + event `boot()` yang otomatis mengisi `id` sebelum data disimpan.

### [4] OUTPUT
Baris baru di tabel, atau objek data untuk dibaca lewat relationship (`$kandang->devices`, dst).

### [5] Baris yang selalu ada
| Baris | Untuk apa |
|---|---|
| `protected $keyType = 'string'; public $incrementing = false;` | Beritahu Laravel: id ini string UUID, BUKAN angka auto-increment |
| `protected static function boot() { parent::boot(); static::creating(fn($m) => $m->id ??= (string) Str::uuid()); }` | Auto-generate UUID sebelum data disimpan, TANPA perlu ditulis manual tiap `create()` |
| `protected $fillable = [...]` | "Daftar putih" kolom yang boleh diisi lewat `create()`/`update()` -- kolom di luar daftar ini otomatis diabaikan (bug yang pernah ditemui: lupa masukkan `id`/kolom baru ke sini) |

### [6] KENAPA CARANYA BEGINI?
`boot()` dipakai daripada menulis `Str::uuid()` manual di tiap tempat yang bikin data baru -- kalau manual, gampang lupa (sudah pernah terjadi, error `null value in column "id"`) dan harus diulang di banyak file.

### [7] KALAU DIUBAH?
Baris `boot()` dihapus -> WAJIB tulis `'id' => (string) Str::uuid()` manual di SETIAP `create()`, kalau lupa -> error "not-null constraint" di kolom id.

---

## Model spesifik (relationship & fillable unik)

| Model | Tabel | Relationship | Catatan |
|---|---|---|---|
| `ChickenCoop` | `_chicken__coop` | `hasMany` ke Device, Monitoring, Alert | Butuh `protected $table = '_chicken__coop'` manual (nama tabel tidak ikut konvensi) |
| `Device` | `devices` | `belongsTo(ChickenCoop::class, '_chicken__coop_id')` | `last_seen_at` di-`cast` ke `datetime` |
| `Monitoring` | `monitorings` | `belongsTo` ChickenCoop | `recorded_at` di-`cast` ke `datetime` |
| `Alert` | `alerts` | `belongsTo` ChickenCoop | `is_sent` di-`cast` ke `boolean` (PostgreSQL kadang kembalikan boolean tidak konsisten tanpa ini) |
| `TelegramRecipient` | `telegram_recipients` | Tidak ada | Berdiri sendiri |
| `User` | `users` | Tidak pakai UUID sama sekali (auto-increment bawaan Laravel) | Trait `HasApiTokens` (dibahas Step 5) wajib ada di sini |

**[6] KENAPA `belongsTo` pakai nama kolom eksplisit (`'_chicken__coop_id'`)?**
Karena nama tabel (`_chicken__coop`) tidak ikut konvensi Laravel, Laravel juga tidak bisa menebak nama kolom foreign key-nya secara otomatis -- harus ditulis manual di setiap relationship.

**[7] KALAU DIUBAH?** relationship `belongsTo`/`hasMany` dihapus -> `$kandang->devices` atau `$device->chickenCoop` akan error "method tidak ditemukan", harus query manual (`Device::where('_chicken__coop_id', $id)->get()`).
