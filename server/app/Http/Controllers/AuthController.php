<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    #Register
   public function register(Request $request){ #Request tipe/jenis | $request itu variabel yang isinya semua data yang dikirim dari React ke endpoint ini.
    $validated = $request->validate([ #cek input dari React sebelum diproses.
        'name'     => 'required|string|max:255',
        'email'    => 'required|email|unique:users', #unique:users,email artinya Laravel cek ke tabel users, kolom email, pastikan belum ada yang pakai email itu. Mencegah orang daftar dobel pakai email yang sama.
        'password' => 'required|string|min:8',
    ]);

    $user = User::create([
        'name'     => $validated['name'],
        'email'    => $validated['email'],
        'password' => Hash::make($validated['password']), #nyimpan password dalam bentuk hash (teracak), bukan teks asli.
        'role'     => 'viewer',
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user'  => $user,
        'token' => $token,
    ], 201);
   }
   
   #Login
   public function login(Request $request){
    $validated = $request->validate([
        'email'    => 'required|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $validated['email'])->first(); #Ini nyari user berdasarkan email yang dikirim.
    if(! $user || ! Hash::check($validated['password'], $user->password)){ #di login — bandingin password yang dikirim user dengan hash yang tersimpan, tanpa perlu "membalikkan" hash-nya.
        throw ValidationException::withMessages([
            'email' => ['Email atau password salah.'],
        ]);
    }

    $token = $user->createToken('auth_token')->plainTextToken; #dari Sanctum, generate token unik buat user ini, yang nanti disimpan React dan dipakai di setiap request berikutnya.

    return response()->json([
        'user'  => $user,
        'token' => $token,
    ]);
   }

   #LogOut
   public function logout(Request $request){
    $request->user()->currentAccessToken()->delete(); #$request->user() ambil data user yang lagi login sekarang, berdasarkan token yang dia kirim. currentAccessToken() ini spesifik ngambil token yang sedang dipakai untuk request ini aja (bukan semua token milik user itu).

    return response()->json(['message' => 'Berhasil logout.']);
   }
}
