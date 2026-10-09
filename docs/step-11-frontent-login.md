# Step 11: Frontend Setup + Halaman Login & Sign Up

## Urutan tahapan & alasannya

### 1. Setup project (Vite + Tailwind) dulu, sebelum nulis komponen apa pun
**Kenapa duluan ini:** semua komponen React butuh "wadah" yang sudah bisa
menjalankan JSX dan styling. Tanpa ini beres dulu, tidak ada yang bisa
dites sama sekali.
```bash
npm create vite@latest client -- --template react
npm install tailwindcss @tailwindcss/vite
npm install axios react-router-dom
```
`axios` dan `react-router-dom` diinstall di tahap ini juga (bukan nanti
pas dibutuhkan) karena keduanya dipakai di HAMPIR semua halaman --
lebih efisien sekali install di awal daripada berulang kali install
sambil jalan.

### 2. Struktur folder, sebelum bikin halaman
**Kenapa duluan ini:** supaya file pertama yang dibuat (Login) langsung
masuk ke folder yang benar (`pages/`), bukan numpuk di `src/` lalu
dipindah-pindah belakangan.
```
services/  -> fungsi pemanggil API
pages/     -> 1 file = 1 halaman penuh
components/, context/, hooks/  -> disiapkan wadahnya, diisi belakangan sesuai kebutuhan
```

### 3. `services/api.js` (koneksi dasar ke Laravel), sebelum halaman Login
**Kenapa duluan ini:** halaman Login butuh CARA untuk bicara ke backend.
Kalau ditulis langsung di dalam komponen Login, kode pemanggilan API
akan terduplikasi di setiap halaman lain yang butuh API (Dashboard,
Kelola Kandang, dst). Dibuat sebagai fondasi bersama dulu.

**Kenapa pakai *interceptor* untuk token, bukan ditambahkan manual di
tiap pemanggilan API:** supaya SETIAP request otomatis membawa token
begitu user login sekali -- tidak perlu mengetik ulang logic
"tambahkan header Authorization" di puluhan file yang akan dibuat
setelah ini (Dashboard, Kelola Kandang, dst).

### 4. CORS di Laravel, sebelum testing koneksi pertama kali
**Kenapa di titik ini:** baru ketahuan dibutuhkan SAAT React pertama
kali mencoba manggil API dan browser menolak (`blocked by CORS
policy`). Tidak perlu diatur lebih awal karena tidak berpengaruh
sampai ada request sungguhan yang dicoba.

### 5. `services/auth.js`, sebelum komponen Login ditulis
**Kenapa dipisah dari `api.js`:** `api.js` isinya pengaturan koneksi
UMUM (dipakai semua endpoint). `auth.js` isinya fungsi SPESIFIK untuk
auth (`login`, `register`, `logout`) yang membungkus pemanggilan
`api.post('/login', ...)` -- supaya komponen Login cukup memanggil
`login(email, password)`, tanpa perlu tahu detail endpoint dan
struktur body request.

### 6. Routing (`App.jsx`), sebelum halaman Login bisa dibuka di browser
**Kenapa di titik ini:** halaman Login sudah punya isi (JSX, logic),
tapi TANPA routing, browser tidak tahu URL mana yang harus
menampilkannya. Routing adalah "penghubung" terakhir antara kode yang
sudah ditulis dengan URL yang bisa diakses.

### 7. Komponen Login & Sign Up ditulis terakhir
**Kenapa terakhir:** komponen ini BERGANTUNG pada semua yang dibuat di
langkah 1-6 (butuh Tailwind untuk styling, `auth.js` untuk logic
submit, routing untuk pindah halaman setelah sukses). Menulisnya lebih
awal akan menabrak dependency yang belum ada.

---

## Alasan tiap function/keputusan penting di kode

**Kenapa `login()`/`register()` dibuat `async function`, bukan function biasa?**
Memanggil API itu perlu WAKTU (menunggu respons server). `async`/`await`
adalah cara JavaScript menunggu hasil itu selesai dulu sebelum
melanjutkan baris berikutnya, tanpa mengunci/nge-freeze halaman selama
menunggu.

**Kenapa `try/catch/finally` di `handleSubmit`, bukan `if/else` biasa?**
Fungsi `login()` bisa GAGAL dengan cara melempar error (kalau Laravel
membalas 422/500), bukan sekadar mengembalikan nilai `false`. `catch`
adalah satu-satunya cara menangkap kegagalan semacam itu. `finally`
dipakai supaya `setLoading(false)` PASTI dijalankan baik sukses maupun
gagal -- kalau ditulis manual di dalam `try` saja, baris itu akan
terlewat kalau terjadi error.

**Kenapa state Sign Up (`signUpName`, dst) dibuat TERPISAH dari state
Login (`email`, `password`), padahal keduanya form yang mirip?**
Form Login dan Sign Up sama-sama ada di HTML secara bersamaan (cuma
disembunyikan pakai opacity untuk animasi geser) -- kalau state-nya
digabung jadi satu, mengetik di form yang satu akan ikut mengubah
isi form yang lain karena keduanya membaca variabel yang sama.

**Kenapa `localStorage`, bukan cuma disimpan di `useState`?**
`useState` hilang begitu halaman di-refresh atau tab ditutup.
`localStorage` bertahan lebih lama -- ini yang membuat user tidak
perlu login ulang setiap kali membuka halaman baru selama sesi masih
berlaku.

## Hasil akhir
Halaman Login & Sign Up berfungsi penuh -- submit berhasil membuat
akun baru (role otomatis `viewer`, sesuai aturan Step 5) tersimpan ke
database, token & data user tersimpan ke `localStorage`, dan berhasil
diarahkan ke `/dashboard`.
