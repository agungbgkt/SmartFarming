# Step 5: Autentikasi & Role Middleware

## Tujuan
Bikin sistem login berbasis token (Laravel Sanctum) supaya React bisa
login dan pakai token itu untuk akses endpoint API lain, plus mekanisme
buat membatasi endpoint tertentu hanya untuk admin.

## Konsep dasar token
1. User login (email+password) ke Laravel
2. Laravel cek, kalau benar -> balikin sebuah token (string acak)
3. React simpan token itu
4. Tiap request lain, React sertakan token itu di header
5. Laravel cek token valid -> baru kasih data

## File yang dibuat/diubah
- `app/Models/User.php` -- tambah trait `HasApiTokens`
- `app/Http/Controllers/AuthController.php` -- `register()`, `login()`, `logout()`
- `app/Http/Middleware/EnsureUserIsAdmin.php` -- cek role admin
- `routes/api.php` -- route register/login/logout + route percobaan admin
- `bootstrap/app.php` -- daftarkan alias middleware `admin`

---

# BAGIAN 1 -- Register, Login, Logout

## Install Sanctum
```bash
php artisan install:api
php artisan migrate
```
Menambahkan tabel `personal_access_tokens` (tempat nyimpen token aktif).

## Penjelasan kode yang ditanyakan

**`Request $request` itu apa?**
`Request` = tipe data (class bawaan Laravel). `$request` = variabel
isinya semua data yang dikirim client (body, header). Laravel otomatis
"nyuntikkan" objek ini ke parameter function tiap ada request masuk
(dependency injection) -- tidak perlu dibuat manual, dan tidak pernah
dipanggil sendiri oleh kita.

**Kenapa role di `register()` di-hardcode `'viewer'`, bukan diambil
dari input user?**
Supaya tidak ada celah orang self-assign jadi admin lewat request yang
dimanipulasi (misal kirim `"role": "admin"` lewat body). Berapa pun
yang dikirim di field itu, diabaikan total -- semua akun baru dipaksa
`viewer`.

**Kenapa `! $user || ! Hash::check(...)` digabung jadi satu kondisi,
bukan 2 `if` terpisah?**
```php
if (! $user || ! Hash::check($validated['password'], $user->password)) {
```
Kalau dipisah (satu untuk cek email ketemu, satu untuk cek password
benar), orang luar bisa "nebak-nebak" email mana yang terdaftar di
sistem berdasarkan pesan error yang beda-beda -- ini disebut celah
*user enumeration*. Digabung jadi satu pesan generik ("Email atau
password salah") supaya tidak ketahuan mana yang sebenarnya salah.

Urutan `! $user` di depan juga penting: PHP mengecek dari kiri ke
kanan dan berhenti begitu ketemu kondisi yang `true` (*short-circuit
evaluation*). Kalau `$user` sudah `null`, PHP tidak akan lanjut cek
`$user->password` -- yang kalau dipaksa jalan akan error, karena
`null` tidak punya properti `password`.

**Kenapa POST, bukan GET, untuk login/register?**
Dipilih manual sesuai konvensi REST: GET untuk ambil data (dan data
GET biasanya nyangkut di URL -- bahaya untuk password), POST untuk
kirim data baru/sensitif. Laravel & React harus sepakat pakai method
yang sama.

**Kenapa `/logout` pakai middleware `auth:sanctum`, sedangkan
`/login`&`/register` tidak?**
Logout butuh tahu dulu "siapa yang mau logout" -- artinya harus sudah
login (punya token valid) duluan. Middleware jadi "penjaga pintu": cek
token dulu sebelum kode controller dijalankan. Tanpa middleware ini,
`$request->user()` di dalam `logout()` bisa `null`, dan kode akan error.

**`$request->user()->currentAccessToken()->delete()` artinya apa?**
Dibaca berantai dari kiri:
1. `$request->user()` -- ambil user yang sedang login (dari token yang
   sudah diverifikasi middleware)
2. `->currentAccessToken()` -- dari user itu, ambil token yang SEDANG
   DIPAKAI untuk request ini saja (bukan semua token milik user itu,
   karena 1 user bisa login dari beberapa device sekaligus)
3. `->delete()` -- hapus baris token itu dari database

Itulah "logout" di sistem berbasis token: hapus 1 token, bukan
mengunci akun.

**Kenapa setelah logout, user masih muncul di `User::all()`, dan masih
bisa login lagi?**
Ini bukan bug. Logout cuma menghapus TOKEN, bukan akun user. `users`
table adalah data permanen yang memang harus tetap ada supaya user
bisa login lagi kapan saja; `personal_access_tokens` adalah "kunci
sementara" yang dihapus saat logout. Cara cek logout yang benar:
lihat `$user->tokens` (harus berkurang), bukan `User::all()`.

## Trait `HasApiTokens` -- harus di Model, bukan Controller
Trait ini menambah KEMAMPUAN (`createToken()`) ke objek `User`.
Controller cuma MEMANGGIL kemampuan itu, tidak menyediakannya. Sempat
salah taruh trait ini di `AuthController`, hasilnya error `Call to
undefined method createToken()` -- karena objek `User`-nya sendiri
belum punya kemampuan itu, meski `AuthController` sudah `use` trait-nya.

## Testing (Postman) -- wajib diperhatikan
Header wajib di SETIAP request API:
```
Accept: application/json
```
Tanpa ini, Laravel menganggap request dari browser biasa dan membalas
HTML/redirect (bukan JSON) -- penyebab error 500 dengan body HTML yang
sempat muncul di request logout.

Header tambahan untuk endpoint yang butuh login:
```
Authorization: Bearer <token_dari_hasil_login>
```

---

# BAGIAN 2 -- Role Middleware (batasi endpoint khusus admin)

## Konsep
Middleware = "penjaga pintu" yang jalan SEBELUM kode controller
dieksekusi. `auth:sanctum` cek "sudah login belum"; middleware custom
ini cek lebih lanjut "role-nya admin apa bukan".

## Penjelasan kode yang ditanyakan

**Kenapa `$request->user()->role !== 'admin'` baru bisa jalan setelah
`auth:sanctum`?**
Middleware role ini butuh `$request->user()` sudah terisi -- itu cuma
terjadi kalau `auth:sanctum` sudah lebih dulu memverifikasi token.
Makanya kedua middleware harus dipasang BARENG dalam satu array
(`['auth:sanctum', 'admin']`), dengan `auth:sanctum` di posisi
pertama. Kalau dibalik urutannya, `admin` middleware akan error karena
`$request->user()` belum tentu terisi.

**Kenapa status `403`, bukan `401`, kalau ditolak?**
`401 Unauthorized` = "belum login sama sekali". `403 Forbidden` =
"sudah login, tapi tidak punya izin untuk aksi ini". Bedanya penting
supaya frontend nanti bisa kasih pesan yang tepat ke user (misal 401
suruh login ulang, 403 kasih tahu "kamu tidak punya akses").

**`return $next($request)` itu apa?**
Kalau semua pengecekan lolos (role-nya memang admin), baris ini yang
"melanjutkan" request ke controller tujuan seperti biasa. Tanpa baris
ini, request akan berhenti di middleware dan tidak pernah sampai ke
controller walau lolos pengecekan.

## Alias middleware
Didaftarkan di `bootstrap/app.php` supaya bisa dipanggil dengan nama
pendek `'admin'` di route, bukan menulis nama class panjangnya
berulang kali.

## Testing di Postman
1. Login pakai akun viewer, copy token
2. Akses route percobaan pakai token viewer -> harus **403**
3. Login pakai akun admin, copy token
4. Akses route yang sama pakai token admin -> harus **200**

---

## Masalah yang pernah ditemui & solusinya

| Masalah | Penyebab | Solusi |
|---|---|---|
| `Call to undefined method createToken()` | `HasApiTokens` tertulis di `AuthController`, seharusnya di Model `User` | Pindahkan trait ke `User.php` |
| Login gagal padahal password benar | Email tersimpan `admin@supermamaFarm.com` (F besar), yang diketik huruf kecil semua. PostgreSQL case-sensitive untuk teks | Ketik email persis sesuai yang tersimpan (lihat catatan perbaikan di bawah) |
| Password seeder tidak cocok | `env('ADMIN_SEED_PASSWORD')` terbaca `""` (string kosong) karena `.env` belum diisi saat seeder pertama dijalankan. Fallback `env('KEY','fallback')` HANYA berlaku kalau key tidak ada sama sekali, bukan kalau ada tapi kosong | Isi `.env`, `config:clear`, lalu `migrate:fresh --seed` |
| Token invalid setelah `migrate:fresh` | Tabel `personal_access_tokens` ikut ter-reset | Login ulang untuk dapat token baru |
| Response HTML, bukan JSON | Header `Accept: application/json` belum ditambahkan di Postman | Tambahkan header itu di semua request |
| Kirain logout gagal karena user masih ada di `User::all()` | Salah paham -- logout memang tidak menghapus akun, hanya token | Cek `$user->tokens`, bukan `User::all()`, untuk verifikasi logout |

## Catatan perbaikan ke depan (belum diimplementasi)
Pertimbangkan menyimpan email selalu huruf kecil (lowercase) saat
register/login, supaya user tidak perlu ingat kapitalisasi persis --
kebanyakan sistem login melakukan ini secara default.

## Hasil akhir
Register, login, logout berhasil ditest lewat Postman dengan response
JSON yang sesuai. Role admin tidak bisa di-self-assign lewat register.
Role middleware berhasil membedakan akses admin vs viewer (403 untuk
viewer, 200 untuk admin) pada route percobaan.
