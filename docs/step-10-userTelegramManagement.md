# Step 10: Endpoint Kelola User & Penerima Telegram

## `UserController.php` -- `index()`

### [1] MASALAH
Admin butuh melihat daftar semua user untuk menentukan siapa yang perlu dinaikkan/diturunkan role-nya.

### [2] INPUT
Tidak ada (tidak butuh parameter).

### [3] PROSES
`User::select('id','name','email','role')->get()`.

### [4] OUTPUT
JSON daftar user, TANPA kolom `password`.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `User::select('id','name','email','role')` | Ambil HANYA kolom ini, bukan `User::all()` yang ikut membawa `password` (walau ter-hash, tetap tidak perlu diekspos ke luar) |

### [6] KENAPA CARANYA BEGINI?
`select()` dipakai daripada `all()` sebagai kebiasaan keamanan -- jangan pernah kirim data lebih dari yang dibutuhkan frontend, meski data itu "aman" (sudah di-hash).

### [7] KALAU DIUBAH?
`select()` dihapus, pakai `User::all()` -> `password` (hash) ikut terkirim di response JSON; tidak fatal karena hash tidak bisa dibalik, tapi tetap kebiasaan buruk untuk dibiasakan.

---

## `UserController.php` -- `updateRole()`

### [1] MASALAH
Admin perlu cara menaikkan role viewer jadi admin (atau sebaliknya), TANPA bisa mengubah role akun sendiri (mencegah admin tunggal terkunci keluar dari fitur admin).

### [2] INPUT
`$id` dari URL, body `role` (`admin` atau `viewer`).

### [3] PROSES
Validasi nilai `role`, cek bukan akun sendiri, `update()`.

### [4] OUTPUT
Data user yang sudah diperbarui, atau error (404/422).

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `'role' => 'required\|in:admin,viewer'` | `in:...` membatasi nilai HANYA boleh salah satu dari daftar itu, menolak string sembarangan |
| `if (! $user) return 404;` | Tolak jika id tidak ditemukan |
| `if ($user->id === $request->user()->id) return 422;` | Bandingkan id target dengan id yang sedang login -- kalau sama, tolak |
| `$user->update(['role' => $validated['role']]);` | Simpan perubahan role |

### [6] KENAPA CARANYA BEGINI?
Pengecekan "bukan diri sendiri" ditambahkan sebagai pengaman ekstra di luar rencana awal -- kalau tidak ada, admin tunggal yang tidak sengaja menurunkan role sendiri jadi viewer akan terkunci total dari fitur admin, dan perbaikannya harus lewat Tinker manual lagi (mengulang situasi Step 4).

### [7] KALAU DIUBAH?
Baris pengecekan diri sendiri dihapus -> risiko admin (terutama kalau cuma ada 1) tidak sengaja mengunci dirinya sendiri dari akses admin, tanpa jalan keluar lewat UI.

---

## `TelegramRecipientController.php` -- `store()`, `update()`, `destroy()`

### [1] MASALAH
Admin perlu kelola siapa saja yang menerima notifikasi Telegram, termasuk menonaktifkan sementara tanpa kehilangan data histori penerima.

### [2] INPUT
`store`: `telegram_chat_id`, `name`. `update`: `name` dan/atau `is_active` (opsional). `destroy`: `$id` dari URL.

### [3] PROSES
Validasi standar, `create()`/`update()`/`delete()` langsung ke Model `TelegramRecipient`.

### [4] OUTPUT
Data penerima baru/terbarui, atau pesan sukses hapus.

### [5] URUTAN KODE
| Baris | Untuk apa |
|---|---|
| `'telegram_chat_id' => 'required\|string\|unique:telegram_recipients,telegram_chat_id'` | Cegah 1 chat_id didaftarkan dobel |
| `'is_active' => 'sometimes\|required\|boolean'` (di `update`) | Field ini opsional dikirim, tapi kalau dikirim harus `true`/`false` yang valid |
| Tidak ada validasi `exists` untuk foreign key | Tabel ini berdiri sendiri, tidak ada relasi ke tabel `_chicken__coop` |

### [6] KENAPA CARANYA BEGINI?
`is_active` dipakai untuk menonaktifkan (bukan `destroy()`/hapus permanen) saat admin ingin berhenti mengirim notifikasi ke seseorang sementara waktu -- `destroy()` tetap disediakan terpisah untuk penghapusan permanen kalau memang diperlukan.

### [7] KALAU DIUBAH?
Kolom `is_active` dihapus, satu-satunya cara "berhenti kirim ke orang ini" adalah `destroy()` (hapus permanen) -> kehilangan histori siapa saja yang pernah jadi penerima, dan kalau mau aktifkan lagi harus input ulang `telegram_chat_id` dari awal.

---

## Routes -- semuanya admin only

```php
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/users', ...);
    Route::put('/users/{id}/role', ...);

    Route::get('/telegram-recipients', ...);
    Route::post('/telegram-recipients', ...);
    Route::put('/telegram-recipients/{id}', ...);
    Route::delete('/telegram-recipients/{id}', ...);
});
```

**[6] KENAPA `index()` juga admin-only di sini, beda dari `kandang`/`monitoring`?**
Data user lain dan daftar penerima Telegram bukan informasi yang perlu diketahui viewer -- beda dengan data suhu/kelembapan kandang yang memang untuk dipantau semua role.

## Hasil akhir
Backend Laravel sekarang mencakup seluruh kebutuhan sesuai desain
Figma awal: auth, role middleware, CRUD kandang & device, ingestion
MQTT, alert + Telegram, WebSocket real-time, grafik histori, kelola
user, dan kelola penerima Telegram. Siap lanjut ke Step 11: Frontend React.
