# Step 13: Dashboard - Grafik, Ringkasan, Notifikasi

## Urutan tahapan & alasannya

### 1. `MonitoringChart` (card grafik) dibuat lebih dulu dari 3 card sejajar
**Kenapa duluan ini:** grafik butuh pola paling dasar (fetch data
berdasarkan 1 kandang + 1 filter) yang nanti dipakai ulang, dengan
variasi, oleh komponen-komponen berikutnya. Lebih baik pola dasarnya
mapan dulu di 1 tempat sebelum digandakan.

### 2. `MonitoringSummary` (3 card sejajar, auto-rotate) menyusul, BUKAN dikerjakan bareng grafik
**Kenapa dipisah:** rotasi otomatis (`setInterval`) adalah logic BARU
yang belum pernah ada di komponen manapun sebelumnya (beda dari timer
`setTimeout` di Sidebar yang cuma jalan sekali). Mengerjakannya
terpisah dari grafik mencegah 2 bug baru muncul bersamaan dan susah
dipisahkan penyebabnya.

### 3. `AlertList` & `GreenhouseData` dikerjakan TERAKHIR
**Kenapa terakhir:** dua ini tidak bergantung pada apa pun yang dibuat
di langkah 1-2 (`AlertList` fetch endpoint berbeda, `GreenhouseData`
malah full dummy) -- urutannya bebas, diletakkan terakhir supaya
Dashboard "selesai satu bagian besar dulu" (grafik + summary) sebelum
pindah ke bagian yang lebih kecil.

### 4. State `monitoringData` yang sempat dibuat di `Dashboard.jsx` dihapus lagi setelah `MonitoringSummary` diubah
**Kenapa sempat dibuat lalu dihapus:** awalnya untuk mengirit request
(1 fetch di Dashboard, dipakai 2 komponen). Setelah `MonitoringSummary`
butuh rotasi PER KANDANG (bukan cuma 1 kandang tetap), data yang
dibutuhkan jadi berubah-ubah mengikuti kandang yang sedang aktif --
lebih masuk akal komponen itu fetch sendiri sesuai kandang yang
sedang ditampilkannya, daripada Dashboard menebak kandang mana yang
perlu di-fetch duluan.

---

## Alasan tiap keputusan kode

### `MonitoringChart.jsx`

**Kenapa terima `coopId`/`coopName` lewat props, bukan fetch data
kandang sendiri?**
Data kandang sudah di-fetch sekali di `Dashboard` (induk). Kalau
`MonitoringChart` fetch ulang, akan ada 2 request untuk data yang
sama persis.

**Kenapa `useEffect(..., [coopId, range])`, dua dependency, bukan
satu?**
Data grafik perlu di-fetch ulang kalau SALAH SATU dari keduanya
berubah -- ganti kandang (geser, nanti) atau ganti filter dropdown.
Kalau cuma `[coopId]`, ganti dropdown filter tidak akan memicu
fetch ulang.

**Kenapa data mentah di-`map()` menambah properti `jam` baru, bukan
memakai `recorded_at` langsung sebagai label sumbu-X?**
`recorded_at` formatnya timestamp panjang (`2026-09-14T10:00:00Z`),
tidak enak dibaca di sumbu grafik. Properti baru dibuat lewat spread
(`...item, jam: ...`) supaya data ASLI (`temperature`, `humidity`)
tetap utuh, cuma ditambah representasi yang lebih ringkas untuk
ditampilkan.

**Kenapa 2 `YAxis` (`yAxisId="left"` dan `"right"`)?**
Skala suhu (sekitar 20-40) dan kelembapan (sekitar 20-100) jauh
berbeda. Dipaksa 1 sumbu membuat salah satu garis terlihat nyaris
lurus/pipih, tidak informatif.

### `MonitoringSummary.jsx` (auto-rotate)

**Kenapa 2 `useEffect` terpisah (satu untuk rotasi, satu untuk fetch
data), bukan digabung jadi satu?**
Keduanya punya "pemicu" berbeda: rotasi cukup dipasang SEKALI di awal
(interval-nya tidak perlu dibuat ulang tiap kali kandang aktif
berganti), sedangkan fetch data harus jalan ULANG setiap kandang aktif
berubah. Digabung jadi satu `useEffect` akan membuat interval-nya
ikut ter-reset tiap fetch data selesai -- rotasinya jadi tidak stabil.

**Kenapa `setActiveIndex((prev) => (prev + 1) % coopList.length)`,
bukan `setActiveIndex(activeIndex + 1)`?**
Di dalam `setInterval`, variabel `activeIndex` yang "tertangkap" adalah
nilai SAAT interval itu pertama dibuat (stale closure) -- kalau dipakai
langsung, angkanya tidak akan pernah benar-benar bertambah dari sudut
pandang interval tersebut. Bentuk fungsi (`prev => ...`) selalu
mengambil nilai TERBARU setiap kali dipanggil, sehingga penambahannya
konsisten.

**Kenapa `% coopList.length` (modulo)?**
Supaya index otomatis "putar balik" ke 0 setelah mencapai kandang
terakhir, tanpa perlu logic `if index > panjang, reset ke 0` secara
manual.

**Kenapa ada pengecekan `if (coopList.length <= 1) return;`?**
Kalau cuma ada 1 kandang, merotasi tidak ada gunanya (hasilnya akan
sama terus) -- mencegah `setInterval` berjalan sia-sia di background.

### `AlertList.jsx`

**Kenapa `getAlerts(5)`, bukan ambil semua alert?**
Card ini ruangnya kecil, cuma perlu menampilkan beberapa alert
terbaru. Endpoint `AlertController` (Step 8) sudah mendukung parameter
`limit` untuk kebutuhan seperti ini.

**Kenapa `alert.sent_at ?? alert.created_at`?**
Kalau pengiriman Telegram gagal, `sent_at` tetap `null` (sesuai desain
Step 8) -- tanpa fallback ini, waktu kejadian tidak akan tampil sama
sekali untuk alert yang gagal terkirim.

## Hasil akhir
Dashboard sekarang menampilkan data ASLI dari backend: grafik suhu/
kelembapan dengan filter periode, 3 card ringkasan yang berganti
otomatis antar kandang tiap 12 detik, dan daftar notifikasi terbaru
lengkap dengan status kirim Telegram. Card Data Greenhouse masih dummy
(menunggu alat tersedia).
