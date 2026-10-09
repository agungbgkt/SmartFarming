# Step 15: Halaman Riwayat Data

## Urutan tahapan & alasannya

### 1. Backend duluan: `index()` diperluas + `stats()` baru, sebelum sentuh frontend
**Kenapa duluan ini:** halaman Riwayat butuh 2 hal yang belum ada di
backend: (a) data untuk TANGGAL SPESIFIK (endpoint lama cuma mengenal
`today`/`7days`/`30days`), dan (b) angka statistik (rata-rata, tertinggi,
jumlah data). Frontend tidak bisa dites sebelum backend punya
sesuatu untuk di-fetch.

### 2. `index()` DIPERLUAS dengan percabangan `if ($date)`, bukan dipecah jadi function baru
**Kenapa tidak dipecah:** dua kebutuhan itu (rentang untuk Dashboard,
tanggal spesifik untuk Riwayat) sama-sama menjawab "beri data
monitoring 1 kandang dengan filter waktu" -- yang beda cuma cara
menentukan filternya. Beda dengan `index()` vs `indexAll()` di
`DeviceController` (Step 14) yang konteksnya memang berbeda total
(per kandang vs lintas kandang).

### 3. `stats()` dibuat sebagai function TERPISAH dari `index()`
**Kenapa dipisah:** outputnya beda bentuk (1 objek ringkasan vs array
data mentah) dan dihitung langsung di database pakai `avg()`/`max()`/
`count()`. Menghitung dari array data mentah di React berarti seluruh
data 1 hari harus ditarik dulu hanya untuk mendapat 5 angka.

### 4. `indexAll()` (Step 14) ditambah field `_chicken__coop_id` sebelum halaman Riwayat dibuat
**Kenapa perlu:** dropdown Perangkat memilih DEVICE, tapi endpoint
monitoring butuh id KANDANG. Response `indexAll()` versi awal tidak
membawa id kandang sama sekali, sehingga halaman Riwayat tidak punya
cara menerjemahkan device yang dipilih menjadi kandang yang dimaksud.

### 5. `services/monitoring.js` ditambah 2 function, baru kemudian `History.jsx`
**Kenapa urutannya begini:** pola yang sama seperti Step 11 --
komponen halaman cukup memanggil `getMonitoringStats(...)` tanpa
tahu detail URL/query string, jadi detail itu cukup diurus di satu
tempat.

---

## Keputusan desain (berbeda dari Figma)

- **Filter atas cuma 2: Perangkat dan Tanggal.** Filter "Waktu" dan
  "Status" di Figma dihilangkan sesuai kebutuhan.
- **Dropdown "Hari ini" di dalam card grafik dihilangkan.** Tanggal
  sudah ditentukan filter di atas; dropdown kedua akan menjadi sumber
  kebenaran ganda soal "periode mana yang sedang dilihat".
- **Jalur `date` TIDAK memakai filter menit 0-2** (beda dari jalur
  `range` Dashboard). Riwayat untuk analisis detail, jadi menampilkan
  semua pembacaan mentah 1 hari, bukan hanya snapshot per jam.

---

## Alasan tiap keputusan kode

**Kenapa `whereDate('recorded_at', $date)`, bukan `where('recorded_at', ...)`?**
`whereDate` hanya mencocokkan bagian TANGGAL dan mengabaikan jam,
sehingga otomatis mengambil semua data dari 00:00 sampai 23:59 di
tanggal itu tanpa menghitung batas awal/akhir hari secara manual.

**Kenapa `$query->avg()`, `->max()`, `->count()` dipanggil berurutan
dari satu `$query`?**
`$query` hanya menyimpan kondisi `where`. Tiap pemanggilan aggregate
adalah query terpisah ke database, jadi aman dipakai berulang tanpa
saling mengganggu hasil.

**Kenapa `?? 0` di `round($query->avg(...) ?? 0, 1)`?**
Kalau tanggal itu tidak punya data, `avg()` mengembalikan `null`, dan
`round(null)` akan memicu peringatan. Fallback `0` mencegahnya.

**Kenapa `selectedDevice?._chicken__coop_id` (optional chaining)?**
Saat halaman pertama render, daftar device belum kembali dari API
sehingga `selectedDevice` masih `undefined`. `?.` mencegah error
"Cannot read property of undefined" pada render pertama itu.

**Kenapa `useEffect` kedua bergantung pada `[selectedDevice?._chicken__coop_id, date]`?**
Stat dan grafik harus di-fetch ulang kalau SALAH SATU berubah: ganti
perangkat atau ganti tanggal.

**Kenapa `hasData = stats && stats.count > 0` untuk 4 card angka?**
Untuk tanggal tanpa data, backend mengembalikan `max: null` dan rata-
rata `0`. Tanpa pengecekan ini, kartu menampilkan "null°C" atau "0°C"
yang menyesatkan. Card "Catatan Data" sengaja tetap menampilkan
"0 Data" karena itu informasi yang berguna.

**Kenapa `StatCard` dibuat komponen kecil, bukan `.map()` dari array?**
Kelimanya berulang tapi isinya berbeda-beda (label dan nilai
dihitung dari properti `stats` yang berlainan). Komponen kecil yang
menerima `label`/`value` lebih sederhana daripada menyusun array
objek khusus hanya untuk di-`.map()`.

---

## Penjelasan detail: `useEffect` kedua di `History.jsx`

Ini bagian paling rumit di halaman Riwayat. Kodenya:

```jsx
useEffect(() => {
    if(!selectedDevice?._chicken__coop_id) return;

    getMonitoringStats(selectedDevice._chicken__coop_id, date).then(setStats);
    getMonitoringByDate(selectedDevice._chicken__coop_id, date).then((result) => {
        setChartData(result.map((item) => ({
            ...item,
            jam: new Date(item.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        })));
    });
}, [selectedDevice?._chicken__coop_id, date]);
```

### A. Bagaimana baris `getMonitoringStats(...).then(setStats)` bisa ada?

Baris ini adalah UJUNG dari sebuah rantai. Cara paling mudah memahaminya
adalah membaca rantainya dari kebutuhan awal ke bawah:

```
1. Figma butuh 5 kartu statistik
        |
2. Angkanya harus dihitung dari data monitoring
        |
3. Backend: function stats() di MonitoringController
   (menghitung avg / max / count langsung di database)
        |
4. Backend: route GET /coop/{coopId}/monitorings/stats
   (pintu masuk supaya stats() bisa dipanggil lewat URL)
        |
5. Frontend: getMonitoringStats() di services/monitoring.js
   (membungkus URL itu jadi function JavaScript biasa)
        |
6. Frontend: History.jsx memanggil getMonitoringStats(...)
   (baris yang kamu tanyakan)
```

Tiap lapis ada karena lapis di atasnya butuh sesuatu yang bisa dipanggil.
Kalau salah satu putus, baris 6 tidak akan menghasilkan apa-apa. Itu persis
yang terjadi pada bug URL `/monitorings/date?=` (lapis 5 salah ketik).

### B. `getMonitoringStats(selectedDevice._chicken__coop_id, date)` itu apa?

Ini pemanggilan function biasa dengan 2 argumen. Function-nya ada di
`services/monitoring.js`:

```js
export async function getMonitoringStats(coopId, date) {
  const response = await api.get(`/coop/${coopId}/monitorings/stats?date=${date}`);
  return response.data;
}
```

Argumen dan parameter dicocokkan berdasarkan URUTAN, bukan nama:

| Yang dikirim dari `History.jsx` | Diterima function sebagai | Dipakai di URL |
|---|---|---|
| `selectedDevice._chicken__coop_id` (id kandang) | `coopId` | `/coop/${coopId}/...` |
| `date` (state, misal `"2026-09-16"`) | `date` | `...stats?date=${date}` |

Jadi nama variabel di pemanggil (`selectedDevice._chicken__coop_id`) dan di
function (`coopId`) boleh beda. Yang penting urutannya sama. Function ini
mengirim request ke backend dan mengembalikan objek statistik
`{avg_temperature, avg_humidity, max_temperature, max_humidity, count}`.

### C. Kenapa ada `.then(...)`, dan kenapa `setStats` ditaruh di dalamnya?

Function yang diberi kata `async` TIDAK mengembalikan hasilnya langsung,
tapi mengembalikan sebuah **Promise**, yaitu "janji bahwa hasilnya akan
datang nanti". Request ke server butuh waktu, sedangkan JavaScript tidak
mau menunggu dan berhenti. Baris berikutnya langsung dijalankan.

`.then(fungsi)` artinya: "kalau janji ini sudah terpenuhi (data sudah
datang), jalankan fungsi ini dan berikan datanya sebagai argumen".

Jadi dua penulisan ini SAMA PERSIS:

```jsx
getMonitoringStats(id, date).then(setStats);
getMonitoringStats(id, date).then((hasil) => setStats(hasil));
```

Bentuk pertama lebih singkat karena `setStats` sudah berupa function yang
menerima 1 argumen, jadi tidak perlu dibungkus lagi. Perhatikan `setStats`
ditulis TANPA tanda kurung. Kalau ditulis `.then(setStats())`, function itu
langsung dijalankan saat itu juga dengan argumen kosong, bukan menunggu data.

### D. Kenapa hasilnya harus masuk ke `setStats`, bukan variabel biasa?

Kalau hasil disimpan ke variabel biasa (`let stats = hasil`), React tidak
tahu ada yang berubah, sehingga layar tidak diperbarui. `setStats(hasil)`
melakukan dua hal sekaligus: menyimpan nilai baru ke state `stats`, dan
memberi tahu React "render ulang komponen ini". Saat render ulang itulah
5 `StatCard` membaca `stats` yang baru dan menampilkan angkanya.

Urutan kejadian dari awal sampai angka tampil di layar:

```
1. Halaman pertama render     -> stats masih null    -> kartu menampilkan "-"
2. useEffect jalan            -> request dikirim ke backend
3. (menunggu beberapa ratus milidetik, kartu masih "-")
4. Data datang                -> .then(setStats) dijalankan
5. setStats(data)             -> React render ulang
6. Render kedua               -> stats berisi angka -> kartu menampilkan angka
```

Itulah kenapa nilai awal `useState(null)` dan kenapa kartu ditulis
`stats ? ... : '-'`. Ada jeda waktu di mana datanya belum ada.

### E. Bagaimana baris kedua (`getMonitoringByDate`) berbeda dari yang pertama?

Polanya sama (function async, lalu `.then`), tapi hasil untuk grafik perlu
diolah dulu sebelum disimpan, jadi `.then` berisi function lengkap:

```jsx
.then((result) => {
    setChartData(result.map((item) => ({
        ...item,
        jam: new Date(item.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    })));
});
```

Dibaca dari dalam ke luar:

- `new Date(item.recorded_at)` mengubah teks timestamp jadi objek tanggal
- `.toLocaleTimeString('id-ID', {...})` mengambil jam:menit saja, format Indonesia (`"08:00"`)
- `{ ...item, jam: ... }` menyalin semua properti asli (`temperature`, `humidity`, `recorded_at`) lalu menambah properti baru `jam`. Data aslinya tidak diubah
- `result.map(...)` menerapkan itu ke SETIAP baris data, hasilnya array baru
- `setChartData(...)` menyimpan array baru itu, sehingga grafik dirender ulang

Properti `jam` dibuat karena sumbu-X grafik (`<XAxis dataKey="jam" />`)
butuh label pendek. Timestamp mentah terlalu panjang untuk ditampilkan.

### F. Kenapa dua request dipanggil berdampingan, bukan satu per satu?

Keduanya TIDAK saling membutuhkan hasil satu sama lain (stat tidak butuh
data grafik, dan sebaliknya). Karena tidak menunggu satu sama lain, dua
request berjalan bersamaan sehingga halaman selesai dimuat lebih cepat
daripada kalau dijalankan berurutan.

### G. Baris pengaman: `if(!selectedDevice?._chicken__coop_id) return;`

- `selectedDevice?.` : tanda `?.` artinya "kalau `selectedDevice` masih `undefined`, jangan error, anggap hasilnya `undefined`"
- `!` : mengubah menjadi kebalikannya. `undefined` menjadi `true`
- `return;` : keluar dari function `useEffect` saat itu juga, sehingga baris request di bawahnya tidak dijalankan

Kenapa perlu? Saat halaman PERTAMA render, `devices` masih array kosong
(API belum kembali), jadi `selectedDevice` belum ada. Tanpa pengaman ini,
request akan dikirim ke `/coop/undefined/monitorings/...`.

Pengaman ini juga alasan bug typo `_chicken_coop_id` (1 underscore) sulit
ditemukan: hasilnya `undefined`, pengaman menganggapnya "belum siap", lalu
diam-diam berhenti. Tidak ada error yang muncul, hanya request yang tidak
pernah dikirim.

### H. Kenapa array dependency `[selectedDevice?._chicken__coop_id, date]`?

Array ini menjawab pertanyaan: "kapan `useEffect` ini dijalankan ulang?".
Jawabannya: setiap kali salah satu isinya berubah.

| Yang berubah | Akibatnya |
|---|---|
| User memilih perangkat lain (id kandang berubah) | Stat dan grafik di-fetch ulang untuk kandang baru |
| User memilih tanggal lain | Stat dan grafik di-fetch ulang untuk tanggal baru |
| Hal lain (misal `stats` atau `chartData` berubah) | TIDAK dijalankan ulang |

Yang dimasukkan ke array adalah **id-nya** (`selectedDevice?._chicken__coop_id`),
bukan objek `selectedDevice` utuh. Objek dibandingkan berdasarkan alamat
memori, dan `devices.find(...)` menghasilkan objek yang sama selama
`devices` tidak berubah, jadi sebenarnya aman juga. Tapi id berupa teks
sederhana yang dibandingkan berdasarkan isinya, sehingga lebih jelas dan
lebih tahan salah. Kalau array ini kosong (`[]`), `useEffect` hanya jalan
sekali di awal dan mengganti dropdown atau tanggal tidak memicu apa pun.

### I. Kenapa ada DUA `useEffect`, dan kenapa tidak digabung?

```
useEffect #1  (dependency: [])
   -> ambil daftar device, isi dropdown, pilih device pertama sebagai default
          |
          | menghasilkan selectedDeviceId
          v
useEffect #2  (dependency: [id kandang, date])
   -> ambil stat dan grafik
```

Yang kedua BERGANTUNG pada hasil yang pertama: id kandang baru diketahui
setelah daftar device kembali dari API. Keduanya tidak bisa digabung karena
punya pemicu berbeda. #1 cukup dijalankan sekali saat halaman dibuka,
sedangkan #2 harus dijalankan ulang setiap perangkat atau tanggal berganti.
Kalau digabung, daftar device ikut ter-fetch ulang setiap tanggal diganti,
padahal daftar itu tidak berubah.

### J. `selectedDevice` itu state atau bukan?

Bukan. `const selectedDevice = devices.find(...)` adalah **nilai turunan**:
dihitung ulang setiap render dari 2 state yang sudah ada (`devices` dan
`selectedDeviceId`). Kalau dijadikan state sendiri (`useState`), ada 2
tempat yang harus dijaga tetap sinkron, dan lupa memperbarui salah satunya
akan menimbulkan bug data tidak cocok. Aturan praktis: kalau sebuah nilai
bisa dihitung dari state lain, jangan dijadikan state baru.

### K. Batasan yang perlu diketahui: balapan antar request

Kalau user mengganti tanggal berkali-kali dengan cepat, beberapa request
terkirim hampir bersamaan. Tidak ada jaminan urutan jawabannya sama dengan
urutan pengirimannya. Request lama yang lambat bisa datang TERAKHIR dan
menimpa hasil request yang lebih baru, sehingga layar menampilkan data
tanggal sebelumnya. Untuk pemakaian sehari-hari di dashboard ini jarang
terjadi, jadi belum ditangani. Kalau kelak mengganggu, solusinya membatalkan
request lama lewat cleanup function di `useEffect`.

---

## Masalah yang pernah ditemui & solusinya

| Masalah | Penyebab | Solusi |
|---|---|---|
| Request `stats`/`monitorings` tidak pernah muncul di Network | Response `indexAll()` tidak punya field `_chicken__coop_id`, sehingga `useEffect` berhenti di baris `if (!...) return;` | Tambah `'_chicken__coop_id' => $device->_chicken__coop_id` di `indexAll()` |
| Request tetap tidak muncul walau field sudah ada | Typo `_chicken_coop_id` (1 underscore) di `History.jsx`; JavaScript tidak error untuk properti yang tidak ada, hanya `undefined` (kasus yang sama dengan Event WebSocket, Step 9) | Samakan persis dengan nama kolom asli: `_chicken__coop_id` (2 underscore) di semua referensi |
| Halaman crash setelah data pertama datang | `<LineChart data={data}>` padahal state-nya bernama `chartData` | Ganti jadi `data={chartData}`. Bug ini tersembunyi selama data masih kosong karena chart hanya dirender saat `chartData` tidak kosong |
| `monitorings?date=...` status 404 | URL di `getMonitoringByDate` salah ketik: terbentuk `/monitorings/date?=...` (ada segmen `/date`, dan query tanpa nama parameter) | Perbaiki template string jadi `/coop/${coopId}/monitorings?date=${date}` |
| Stat tampil tapi grafik kosong | Bug 404 di atas hanya mengenai request grafik, request `stats` memakai URL yang benar | Sama dengan solusi baris di atas |
| Request `devices` muncul 2x di Network | React StrictMode sengaja menjalankan `useEffect` dua kali di mode development | Normal, tidak terjadi di production |
| Dua baris `Preflight` (204) di Network | Browser mengirim request `OPTIONS` sebelum request asli karena beda origin (port 5173 vs 8000) | Normal, tanda CORS (Step 11) bekerja |

## Catatan
- Jalur `range` di `MonitoringController` sekarang **tanpa filter menit**
  (`whereRaw ... IN (...)` di-comment) dan mendukung `15days` tambahan.
  Dashboard jadi menampilkan semua pembacaan mentah, bukan snapshot per
  jam seperti requirement awal (Step 8). Kalau filter itu diaktifkan lagi,
  data testing harus punya `recorded_at` di menit yang lolos filter.
- `recorded_at` tersimpan dalam UTC (selisih 7 jam dari WIB). Data yang
  direkam dini hari WIB bisa tercatat sebagai tanggal sebelumnya di
  database, sehingga `whereDate` bisa "meleset" satu hari di sekitar
  tengah malam. Solusi kalau terjadi: set `'timezone' => 'Asia/Jakarta'`
  di `config/app.php`.

## Hasil akhir
Halaman Riwayat memiliki 2 filter (Perangkat dan Tanggal), 5 kartu
statistik (rata-rata suhu, rata-rata kelembapan, suhu tertinggi,
kelembapan tertinggi, jumlah data) yang dihitung di database, dan grafik
suhu/kelembapan berisi semua pembacaan mentah pada tanggal yang dipilih.
