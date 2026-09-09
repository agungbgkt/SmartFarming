# Step 2: Setup environment

## Tujuan
Menyalakan database (PostgreSQL) dan MQTT broker (Mosquitto) lewat Docker,
lalu membuat project Laravel dan menghubungkannya ke database tersebut.

## Yang dikerjakan

### 1. Docker Compose
File `docker-compose.yml` di root project, isi 2 service:
- `postgres` (image `postgres:16-alpine`), port `5432`
- `mosquitto` (image `eclipse-mosquitto:2`), port `1883` (MQTT) & `9001` (websocket)

Config Mosquitto ada di `docker/mosquitto/config/mosquitto.conf`
(`allow_anonymous true` — hanya untuk development, akan diamankan di step
deployment).

Variabel database (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) disimpan di
`.env` **di root**, bukan di dalam `server/`, karena `docker-compose.yml`
cuma baca `.env` yang sejajar dengannya.

Jalankan dengan:
```bash
docker compose up -d
docker compose ps   # pastikan status "running"
```

### 2. Project Laravel
```bash
composer create-project laravel/laravel server
```

### 3. Koneksi Laravel ke PostgreSQL
Edit `server/.env`:
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=smartfarm
DB_USERNAME=smartfarm_user
DB_PASSWORD=(sama dengan .env root)
```

Catatan penting: `DB_HOST=127.0.0.1`, BUKAN `postgres`, karena Laravel
dijalankan langsung di laptop (`php artisan serve`), bukan di dalam
container Docker. Nama service (`postgres`) sebagai hostname baru berlaku
kalau yang connect adalah container lain di network Docker yang sama —
ini dipakai lagi nanti di step deployment.

Test koneksi:
```bash
cd server
php artisan migrate
```
Berhasil kalau muncul output "Migrated" untuk migration bawaan Laravel
(users, cache, jobs, sessions).