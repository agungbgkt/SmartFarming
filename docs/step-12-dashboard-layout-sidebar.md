# Step 12: Layout Dashboard & Sidebar Auto-hide

## Urutan tahapan & alasannya

### 1. `Dashboard.jsx` (struktur + placeholder) dibuat lebih dulu
**Kenapa duluan ini:** sidebar dan komponen lain nantinya "dipasang" DI
DALAM Dashboard -- perlu ada kerangka halaman dulu sebagai tempat
memasang komponen-komponen berikutnya. Isi card sengaja masih
placeholder teks biasa, supaya layout besar (posisi tiap bagian) bisa
dites dulu sebelum sibuk dengan detail tiap card.

### 2. `getCoopList()` di-fetch di level Dashboard, bukan di komponen anak
**Kenapa di sini:** data kandang dibutuhkan oleh BANYAK bagian
Dashboard (judul grafik, 3 card sejajar, dst nanti). Mengambilnya
sekali di komponen paling atas (Dashboard), lalu diturunkan ke komponen
anak lewat props, mencegah tiap komponen anak fetch data yang sama
berulang-ulang secara terpisah.

### 3. `Sidebar` dibuat sebagai komponen TERPISAH, bukan langsung ditulis di dalam `Dashboard.jsx`
**Kenapa dipisah:** sidebar punya logic sendiri yang cukup rumit (timer,
animasi, menu aktif) dan sifatnya bisa dipakai lagi di halaman lain
nanti (Kelola Kandang, Kelola User, dst) -- kalau ditulis langsung di
`Dashboard.jsx`, harus disalin ulang di setiap halaman baru.

### 4. Auto-hide dikerjakan sebelum menu aktif (warna hijau)
**Kenapa urutannya begini:** auto-hide adalah PERILAKU DASAR sidebar
(muncul/hilang) yang harus benar dulu, baru ditambah detail visual
(state aktif). Mengerjakan detail visual di atas fondasi yang belum
stabil biasanya berujung harus dirombak ulang.

---

## Alasan tiap keputusan kode

**Kenapa `useEffect(() => { getCoopList().then(setCoopList); }, [])`,
bukan dipanggil langsung di badan function komponen?**
Kalau `getCoopList()` dipanggil langsung (tanpa `useEffect`), dia akan
terpanggil ULANG setiap kali komponen re-render (misal karena state
lain berubah) -- bisa memicu request API tanpa henti. `useEffect` dengan
`[]` memastikan pemanggilan API hanya terjadi SEKALI, saat komponen
pertama kali muncul.

**Kenapa `coopList[0]?.name ?? "Memuat..."`, bukan langsung
`coopList[0].name`?**
Saat komponen pertama kali render, request API belum tentu selesai --
`coopList` masih array kosong. Mengakses `coopList[0].name` langsung
akan error ("Cannot read property of undefined") pada render pertama
itu. `?.` dan `??` membuat kode "sabar" menunggu data datang, tampilkan
teks sementara dulu.

**Kenapa `useRef` untuk timer, bukan `useState`?**
Nilai timer (`timerRef.current`) hanya perlu DIBACA dan DIUBAH untuk
keperluan `clearTimeout`/`setTimeout` -- tidak perlu ditampilkan di
layar. Kalau pakai `useState`, tiap kali timer di-set ulang akan
memicu re-render yang tidak perlu, padahal tidak ada tampilan yang
berubah dari perubahan itu.

**Kenapa `clearTimeout(timerRef.current)` dipanggil SEBELUM
`setTimeout` baru?**
Mencegah 2 timer aktif bersamaan. Tanpa ini, tiap kali sidebar dibuka
ulang sebelum timer sebelumnya habis, timer lama tetap berjalan di
belakang layar dan bisa memicu `setVisible(false)` di waktu yang tidak
terduga.

**Kenapa `return () => clearTimeout(timerRef.current)` di dalam
`useEffect`?**
Ini *cleanup function* -- dijalankan otomatis kalau komponen dibongkar
(misal pindah halaman). Tanpa ini, timer tetap "hidup" di background
walau komponennya sudah tidak ada, berisiko memicu error saat mencoba
mengubah state komponen yang sudah tidak exist.

**Kenapa sidebar digeser (`translate-x`), bukan disembunyikan pakai
`display: none`?**
`display: none` membuat elemen langsung hilang tanpa animasi.
`translate-x` dikombinasikan `transition-transform` menghasilkan efek
geser yang mulus, sesuai desain Figma.

**Kenapa daftar menu diubah jadi array (`menuItems`) lalu di-`.map()`,
bukan 5 blok JSX ditulis manual?**
Kelima menu itu strukturnya identik, cuma beda ikon dan key. Menulis
manual berarti aturan warna aktif/tidak-aktif harus diulang 5 kali dan
diubah 5 tempat kalau ada penyesuaian. Dengan array + `.map()`,
aturannya cukup ditulis SEKALI, otomatis berlaku ke semua menu.

## Hasil akhir
Dashboard menampilkan layout sesuai Figma (masih placeholder untuk
grafik dan isi card). Sidebar auto-hide setelah 8 detik, muncul lagi
lewat tombol hamburger, dan menampilkan warna hijau pada menu yang
sedang aktif (dipilih lewat klik).
