# Step 14: Halaman Perangkat

## Urutan tahapan & alasannya

### 1. Backend duluan (`indexAll()` + route baru), sebelum sentuh frontend
**Kenapa duluan ini:** halaman ini butuh bentuk data yang BEDA dari
yang sudah ada -- gabungan device + nama kandang + status online/
offline + reading terakhir. Endpoint lama (`index($kandangId)`) tidak
bisa dipakai langsung (dia per-kandang, halaman ini butuh lintas
kandang), jadi harus disiapkan dulu sebelum React punya sesuatu untuk
di-fetch.

### 2. Method baru (`indexAll`) dipisah dari `index()` yang sudah ada, bukan menambah parameter opsional ke method lama
**Kenapa dipisah, bukan digabung:** `index($kandangId)` sudah dipakai
di tempat lain (rencana halaman detail kandang) dengan makna "device
DI kandang ini". Memaksanya jadi dua-guna (dengan/tanpa `$kandangId`)
akan membuat function itu penuh percabangan `if ada kandangId / kalau
tidak` -- lebih jelas dan lebih mudah dites kalau masing-masing punya
tanggung jawab sendiri.

### 3. Logic status online/offline & reading terakhir dikerjakan di BACKEND, bukan di React
**Kenapa di backend:** definisi "online" (dibanding `last_seen_at`
dengan waktu sekarang) dan "reading terakhir" (query `orderByDesc`)
adalah ATURAN BISNIS yang seharusnya sama di manapun data ini dipakai
nanti (halaman lain, notifikasi, dsb). Kalau dihitung di React,
aturan itu harus disalin ulang tiap kali ada halaman baru yang butuh
info serupa.

### 4. Halaman `Devices.jsx` menghitung ringkasan (total/online/offline) dari data yang SAMA yang dipakai tabel, bukan minta backend hitungan terpisah
**Kenapa begini:** data lengkap tiap device sudah ada di frontend
(hasil satu kali fetch). Menghitung ulang di backend lewat endpoint
terpisah berarti 2 request untuk data yang sebenarnya saling
tumpang tindih.

---

## Alasan tiap keputusan kode

**Kenapa status online ditentukan `last_seen_at->gt(now()->subMinutes(20))`,
bukan `=== hari ini` atau semacamnya?**
Device mengirim data tiap 15 menit (sesuai rencana firmware, Step 8).
20 menit dipilih sebagai ambang supaya ada toleransi keterlambatan
sedikit (jaringan lambat, dsb) sebelum device dianggap benar-benar mati
-- kalau ambangnya terlalu ketat (misal 15 menit persis), device yang
sebenarnya sehat tapi telat semenit akan salah dianggap offline.

**Kenapa reading suhu/kelembapan diambil dari tabel `monitorings`
berdasarkan `_chicken__coop_id`, bukan langsung dari tabel `devices`?**
Skema database (Step 3) sengaja memisahkan "device" (alat fisik) dari
"monitoring" (data pengukuran) -- pengukuran menempel ke KANDANG, bukan
ke device tertentu, karena satu kandang bisa punya beberapa device
yang datanya digabung jadi satu histori kandang.

**Kenapa `totalCount - onlineCount` untuk offline, bukan `filter()`
lagi?**
Sudah punya `totalCount` dan `onlineCount` dari perhitungan
sebelumnya -- pengurangan sederhana lebih murah daripada memindai
seluruh array device sekali lagi untuk hal yang bisa didapat dari
angka yang sudah ada.

**Kenapa `formatRelativeTime` ditulis manual, bukan pakai library
tanggal (dayjs/moment)?**
Kebutuhannya sederhana (baru saja / X menit lalu / X jam lalu) --
menambah dependency baru untuk logic sesingkat ini kurang sepadan.
Kalau nanti kebutuhan format tanggal makin kompleks di banyak tempat,
baru masuk akal mempertimbangkan library.

## Hasil akhir
Halaman Perangkat menampilkan 3 card ringkasan (total, online, offline)
yang dihitung dari data yang sama dengan tabel di bawahnya, dan tabel
daftar semua device lintas kandang lengkap dengan status real-time
(berdasarkan `last_seen_at`) dan reading suhu/kelembapan terakhir.
