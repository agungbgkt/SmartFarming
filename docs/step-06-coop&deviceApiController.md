# Step 6: API Kelola Kandang & Device (CRUD)

## Tujuan
Bikin endpoint API untuk kelola data kandang (`ChickenCoop`) dan alat
(`Device`) -- yang boleh lihat data (admin & viewer), yang boleh
tambah/ubah/hapus (admin only, pakai middleware dari Step 5).

## File yang dibuat/diubah
- `app/Http/Controllers/ChickenCoopController.php` -- `index`, `show`, `store`, `update`, `destroy`
- `app/Http/Controllers/DeviceController.php` -- `index`, `store`, `destroy`
- `routes/api.php` -- route kandang & device, sebagian di dalam grup middleware `admin`

---

# BAGIAN 1 -- ChickenCoopController

## Penjelasan kode yang ditanyakan

**`ChickenCoop::with('devices')->get()`**
Sekalian ambil semua device tiap kandang dalam 1 query (memakai
function relationship `devices()` yang didefinisikan di Model, lihat
Step 3), jadi React tidak perlu request terpisah untuk tahu device apa
saja yang ada di tiap kandang.

**`'suhu_max' => 'required|numeric|gt:suhu_min'`**
`gt` singkatan "greater than" -- memastikan `suhu_max` harus lebih
besar dari `suhu_min` yang dikirim di request yang sama. Mencegah input
ngasal seperti `suhu_min: 40, suhu_max: 20`.

**`'id' => (string) Str::uuid(), ...$validated`**
Karena id tidak auto-generate (pakai UUID manual), id di-generate dulu.
`...$validated` (*spread operator*) menyebar semua isi array
`$validated` ke dalam array baru ini, tanpa menulis satu-satu
(`'name' => $validated['name']`, dst).

**`'sometimes|required|...'` di `update()`, beda dari `store()`**
`sometimes` = field ini boleh tidak dikirim sama sekali. TAPI kalau
dikirim, baru berlaku `required` (tidak boleh kosong). Cocok untuk
update -- user mungkin cuma mau ubah `name` saja, tanpa perlu kirim
ulang semua field lain.

---

# BAGIAN 2 -- DeviceController

## Penjelasan kode yang ditanyakan

**`Device::where('kandang_id', $kandangId)->get()`**
Beda dari `ChickenCoop::with('devices')` (yang ambil kandang BESERTA
device-nya sekaligus, dari sisi kandang). Ini kebalikannya: langsung
tanya ke tabel `devices`, "kasih semua device yang `kandang_id`-nya
cocok". Pakai `with()` kalau React butuh info kandang+device bareng;
pakai endpoint ini kalau cuma butuh daftar device saja.

**`'kandang_id' => 'required|uuid|exists:_chicken__coop,id'`**
Dua validasi: `uuid` memastikan formatnya valid (bukan sembarang
teks), `exists:_chicken__coop,id` memastikan id itu benar-benar ada di
tabel kandang. Mencegah daftarkan device ke kandang yang tidak exist.

**`unique:devices,device_code`**
Mencegah 2 device pakai kode yang sama, sesuai rencana migration di
Step 3.

---

# BAGIAN 3 -- Routes: struktur bertingkat

```
Route::middleware('auth:sanctum')->group(...)     <- wajib login
    Route::get(...)                                <- admin & viewer boleh
    Route::middleware('admin')->group(...)          <- lapis tambahan
        Route::post/put/delete(...)                 <- admin only
```

Semua route di dalam grup `auth:sanctum` butuh login (admin maupun
viewer boleh akses). Di DALAM grup itu ada grup lagi `admin` -- cuma
`store`/`update`/`destroy` yang masuk situ, jadi kena DUA lapis
sekaligus (harus login DAN harus admin). Sedangkan `index`/`show` cuma
kena lapis pertama (login saja cukup).

---

# BAGIAN 4 -- Soal `{id}` di URL (yang sempat ditanyakan)

`{id}` di route itu PLACEHOLDER, bukan teks literal yang diketik apa
adanya. Melibatkan 2 tempat yang saling terhubung:

1. **Di route** (`/kandang/{id}`) -- memberi tahu Laravel "di sini nanti
   ada bagian URL yang berubah-ubah"
2. **Di controller** (`function show(string $id)`) -- nama parameter
   HARUS SAMA PERSIS dengan nama di dalam kurung kurawal route. Laravel
   otomatis menangkap apa pun yang menggantikan `{id}` di URL request,
   lalu menyuntikkannya ke variabel `$id` ini -- konsepnya sama seperti
   `Request $request` (dependency injection), khusus untuk bagian
   dinamis URL

**Alur:** User request `GET /api/kandang/a1b2c3d4-...` -> Laravel
cocokkan pola `{id}` -> ambil `a1b2c3d4-...` -> suntik ke `$id` di
`show(string $id)` -> `ChickenCoop::find($id)` mencari data itu.

**UUID vs Token -- dua hal yang beda total:**
- Token -- untuk AUTENTIKASI ("siapa yang request ini"), di header
  `Authorization: Bearer ...`, dipakai di SEMUA request
- UUID (`id`) -- untuk IDENTIFIKASI DATA ("data yang mana yang
  dimaksud"), di URL, hanya dibutuhkan endpoint yang menunjuk ke 1 data
  spesifik (`show`, `update`, `destroy`)

Cara lihat UUID: panggil dulu endpoint `index` (ambil semua data),
copy nilai `"id"` dari response-nya. Atau lewat Tinker:
`\App\Models\ChickenCoop::all(['id', 'name']);`

---

## Masalah yang pernah ditemui & solusinya

| Masalah | Penyebab | Solusi |
|---|---|---|
| `Target class [auth-sanctum] does not exist` | Typo tanda baca: `auth-sanctum` (strip) ditulis, seharusnya `auth:sanctum` (titik dua) | Perbaiki jadi `auth:sanctum` -- titik dua berarti "middleware `auth` dengan parameter `sanctum`" |
| `invalid input syntax for type uuid: "{id}"` | Request literal ke URL `/kandang/{id}`, `{id}` tidak diganti UUID asli | Ganti `{id}` dengan UUID asli dari hasil `GET /api/kandang` |
| POST sukses (201) tapi `GET` tidak menemukan data baru | Sempat menjalankan `migrate:fresh` di antara pembuatan data manual -- menghapus semua data kecuali dari seeder | Jangan `migrate:fresh` setelah ada data yang ingin dipertahankan |
| Response aneh `"pendingAttributes": []` | Nama field body request tidak sesuai validasi (`temperature_min` dikirim, padahal yang divalidasi `suhu_min`) | Samakan nama field body persis dengan aturan validasi di controller |

---

## Hasil akhir
CRUD kandang dan device berhasil ditest lewat Postman: viewer bisa
lihat data tapi ditolak (403) saat coba create/update/delete; admin
bisa melakukan semuanya. Validasi `gt:suhu_min` dan `unique` bekerja
sesuai rencana.
