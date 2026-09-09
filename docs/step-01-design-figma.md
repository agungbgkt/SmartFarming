# Step 1: Desain Figma

## Tujuan
Bikin wireframe & mockup dulu sebelum ngoding, supaya struktur halaman dan
kebutuhan data jelas lebih dulu.

## Yang dikerjakan
- Halaman: Login, Sign up, pilih role, Dashboard admin
- Warna status: normal = hijau #639922, waspada = amber #BA7517,
  darurat = merah #A32D2D, offline = abu #5F5E5A
- Warna brand/aksen: biru #185FA5 (dipisah dari warna status biar tidak ambigu)
- Dashboard: card grafik suhu & kelembapan (filter hari ini/7 hari/1 bulan),
  3 card sejajar (perangkat terhubung, suhu, kelembapan), card notifikasi
  status kirim Telegram

## Catatan penting
Role (admin/viewer) di flow signup TIDAK boleh dipilih bebas oleh user —
ini cuma tampilan, validasi akhir role tetap harus dari backend. Akun baru
default `viewer`, admin yang menaikkan role user lain.

## Link desain
(isi link Figma kamu di sini)