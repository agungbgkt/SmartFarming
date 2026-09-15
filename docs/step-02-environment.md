# Step 2: Setup Environment

## File 1: `docker-compose.yml`

### Fungsi file & hubungan dengan file lain
File ini adalah "instruksi" untuk Docker: mesin virtual apa saja yang
harus dinyalakan, dan bagaimana mereka saling terhubung. File ini
DIBACA oleh perintah `docker compose up`, dan MEMBACA isi file `.env`
(untuk mengisi `${DB_DATABASE}` dkk) serta file
`docker/mosquitto/config/mosquitto.conf` (dipasang ke dalam container
mosquitto lewat `volumes`). Tanpa file ini berjalan duluan, semua step
sesudahnya (Laravel connect ke database, MQTT listener) tidak bisa
jalan sama sekali -- ini fondasi paling dasar seluruh project.

---

### [1] MASALAH
Menjalankan PostgreSQL dan Mosquitto (MQTT broker) tanpa install
manual di laptop, dan memastikan environment ini bisa direplikasi
persis sama di laptop lain atau di server nanti.

### [2] INPUT
- Variabel dari file `.env` di root: `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- File config: `docker/mosquitto/config/mosquitto.conf`

### [3] PROSES
Dibaca dan dieksekusi oleh Docker Engine saat perintah
`docker compose up -d` dijalankan.

### [4] OUTPUT
Dua container aktif: `smartfarm_postgres` (database siap dipakai di
port 5432) dan `smartfarm_mosquitto` (broker MQTT siap dipakai di
port 1883 dan 9001).

### [5] URUTAN KODE

```yaml
services:
```
→ Baris 1: kata kunci wajib, menandakan "di bawah ini adalah daftar
mesin/container yang mau dijalankan".

```yaml
  postgres:
```
→ Nama service (bebas ditentukan sendiri). Nama ini dipakai untuk
memanggil service ini dari service lain dalam jaringan Docker yang
sama (misal nanti Laravel container memanggil `postgres` sebagai host).

```yaml
    image: postgres:16-alpine
```
→ Docker mengunduh "cetakan" resmi PostgreSQL versi 16, varian
`alpine` (versi Linux paling ringan ukurannya) dari internet, lalu
membuat container dari cetakan itu.

```yaml
    container_name: smartfarm_postgres
```
→ Nama yang tampil saat menjalankan `docker ps`, supaya mudah
dikenali dibanding nama acak default Docker.

```yaml
    restart: unless-stopped
```
→ Instruksi ke Docker: kalau laptop restart atau Docker Desktop
crash, nyalakan ulang container ini secara otomatis, KECUALI kalau
memang sengaja dimatikan manual oleh user.

```yaml
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```
→ Variabel yang dibaca image PostgreSQL SAAT PERTAMA KALI nyala,
untuk otomatis membuat database, user, dan password awal.
`${DB_DATABASE}` dkk artinya "ambil nilainya dari file .env".

```yaml
    ports:
      - "5432:5432"
```
→ Format `port_laptop:port_container`. Angka kiri (5432) adalah port
di laptop kamu, angka kanan (5432) adalah port di dalam container.
Baris ini "menyambungkan" keduanya, supaya aplikasi di laptop (Laravel)
bisa mengakses database yang sebenarnya berjalan terisolasi di dalam
container.

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
```
→ Menyimpan data database di lokasi PERMANEN di luar container
(bernama `postgres_data`, didaftarkan di bagian bawah file). Tanpa
baris ini, semua data akan HILANG setiap container dihapus/dibuat ulang.

```yaml
    networks:
      - smartfarm_network
```
→ Memasukkan service ini ke dalam "jaringan" bernama `smartfarm_network`,
supaya bisa saling berkomunikasi dengan service lain (mosquitto, nanti
Laravel) yang ada di jaringan yang sama.

```yaml
  mosquitto:
    image: eclipse-mosquitto:2
```
→ Service kedua, pola penulisannya sama seperti `postgres`, tapi
memakai image resmi Mosquitto versi 2.

```yaml
    ports:
      - "1883:1883"
      - "9001:9001"
```
→ Dua port dibuka: `1883` adalah port standar protokol MQTT (yang
nanti dituju alat sensor), `9001` adalah port websocket (opsional,
untuk keperluan testing dari browser).

```yaml
    volumes:
      - ./docker/mosquitto/config:/mosquitto/config
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log
```
→ Baris pertama BEDA dari volume `postgres`: ini "menghubungkan"
folder config LOKAL di laptop (`./docker/mosquitto/config`) ke dalam
container -- jadi kalau file `mosquitto.conf` diedit di laptop,
perubahannya langsung terpakai container tanpa perlu build ulang. Dua
baris lainnya sama seperti postgres: penyimpanan permanen untuk data
runtime dan log.

```yaml
volumes:
  postgres_data:
  mosquitto_data:
  mosquitto_log:
```
→ "Pendaftaran resmi" nama-nama volume yang dipakai di atas. Wajib
ada -- kalau nama volume dipakai di `services` tapi tidak didaftarkan
di sini, Docker akan error.

```yaml
networks:
  smartfarm_network:
    driver: bridge
```
→ Pendaftaran resmi nama jaringan. `driver: bridge` adalah jenis
jaringan paling umum dipakai Docker untuk komunikasi antar container
di satu laptop/server yang sama.

### [6] KENAPA CARANYA BEGINI?
- **`services`, bukan cara lain** -- ini format baku Docker Compose,
  tidak ada alternatif lain untuk mendefinisikan banyak container
  sekaligus dalam satu file
- **`volumes` dipakai, bukan dibiarkan default** -- tanpa ini, setiap
  `docker compose down` lalu `up` lagi, semua data akan kembali kosong
  total. Untuk database, ini fatal
- **`networks` custom (`smartfarm_network`), bukan default Docker** --
  supaya nama service (`postgres`, `mosquitto`) bisa dipanggil sebagai
  hostname oleh container lain nanti (misal Laravel container di step
  deployment), bukan cuma bisa diakses lewat IP yang berubah-ubah

### [7] KALAU DIUBAH?
- **Kalau `volumes` untuk `postgres_data` dihapus** -- semua data
  kandang, user, monitoring akan hilang setiap container di-restart
  ulang dari awal (`docker compose down` lalu `up`)
- **Kalau `ports` `5432:5432` diubah jadi misal `5555:5432`** -- Laravel
  harus ikut diubah `.env`-nya (`DB_PORT=5555`), kalau tidak, koneksi
  akan gagal karena Laravel masih mencoba port 5432
- **Kalau `restart: unless-stopped` dihapus** -- container tidak akan
  otomatis menyala lagi setelah laptop restart, harus `docker compose
  up -d` manual setiap kali mau kerja
- **Kalau baris `networks` dihapus dari salah satu service** -- service
  itu tidak akan bisa "melihat" service lain lewat nama (misal
  Mosquitto tidak akan bisa dipanggil `mosquitto` dari container lain)

---

## File 2: `docker/mosquitto/config/mosquitto.conf`

### Fungsi file & hubungan dengan file lain
File ini adalah pengaturan perilaku broker Mosquitto -- port berapa
yang dibuka, apakah butuh login atau tidak, di mana data disimpan.
File ini DIBACA oleh container `mosquitto` (dihubungkan lewat baris
`volumes` di `docker-compose.yml` di atas). Tanpa file ini ada dan
terisi benar, Mosquitto akan pakai pengaturan default bawaan yang
belum tentu sesuai kebutuhan project (misal port websocket tidak aktif).

---

### [1] MASALAH
Mosquitto perlu tahu port mana yang dibuka, mode koneksi apa yang
diizinkan (dengan/tanpa password), dan di mana data/log disimpan.

### [2] INPUT
Tidak ada input dinamis -- ini file konfigurasi statis yang dibaca
sekali saat container Mosquitto menyala.

### [3] PROSES
Dibaca oleh proses Mosquitto broker di dalam container, saat container
pertama kali start.

### [4] OUTPUT
Broker MQTT yang aktif dan bisa menerima koneksi di port 1883 (MQTT)
dan 9001 (websocket), tanpa memerlukan username/password.

### [5] URUTAN KODE

```
listener 1883
```
→ Baris 1: buka "pintu masuk" (listener) di port 1883, protokol MQTT
standar.

```
allow_anonymous true
```
→ Izinkan siapa saja connect TANPA username/password. Ini HANYA aman
untuk development di laptop sendiri.

```
listener 9001
protocol websockets
```
→ Buka listener kedua di port 9001, khusus untuk protokol websocket
(berguna untuk testing MQTT langsung dari browser, tidak dipakai
device ESP32 yang memakai listener 1883 biasa).

```
persistence true
persistence_location /mosquitto/data/
```
→ Aktifkan penyimpanan data (misal riwayat pesan) ke disk, di lokasi
`/mosquitto/data/` di dalam container (yang lewat `volumes` di
`docker-compose.yml`, sebenarnya tersimpan permanen di luar container).

```
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
```
→ Catatan aktivitas broker disimpan ke file DAN ditampilkan ke layar
terminal (stdout) -- dua tujuan sekaligus, berguna untuk debugging.

### [6] KENAPA CARANYA BEGINI?
- **`allow_anonymous true`** -- dipilih untuk mempercepat development;
  tidak perlu setup username/password dulu sebelum bisa testing kirim
  data. Ini SENGAJA ditandai sebagai risiko yang harus diperbaiki
  sebelum production (lihat Step Deployment nanti)
- **Dua `listener` terpisah (1883 dan 9001)** -- device sensor (ESP32,
  atau gateway LoRa) pakai protokol MQTT biasa di 1883, sedangkan
  9001+websocket cuma untuk kebutuhan testing/debugging dari browser,
  keduanya sengaja dipisah supaya device utama tidak terganggu

### [7] KALAU DIUBAH?
- **Kalau `allow_anonymous true` diubah jadi `false`** -- SEMUA koneksi
  (termasuk `mqtt:subscribe` dari Laravel dan alat sensor) akan DITOLAK
  broker sampai username/password ditambahkan di config ini DAN di sisi
  Laravel (`config/mqtt-client.php`) serta di sisi alat/gateway. Wajib
  dilakukan bersamaan, tidak bisa cuma di satu sisi
- **Kalau baris `listener 9001` dan `protocol websockets` dihapus** --
  testing MQTT lewat browser/tools berbasis web tidak akan bisa
  connect, tapi device sensor via port 1883 tetap normal (tidak
  terpengaruh)
- **Kalau `persistence true` diubah jadi `false`** -- data yang
  "transit" di broker (bukan yang sudah masuk tabel `monitorings`,
  tapi state internal broker) tidak disimpan ke disk, hilang setiap
  container di-restart. Untuk kasus project ini dampaknya kecil karena
  data yang penting sudah disimpan Laravel ke PostgreSQL, bukan
  mengandalkan penyimpanan di broker
