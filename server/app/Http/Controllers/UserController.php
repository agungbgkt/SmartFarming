<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    #GET /api/users --hanya admin
    public function index(){
        return response()->json(
            User::select('id', 'name', 'email', 'role')->get() #nggak ambil semua kolom.
        );
    }

    #PUT /api/users/{id}/role --hanya admin
    public function updateRole(Request $request, string $id){
        $validated = $request->validate([
            'role' => 'required|in:admin,viewer', #mastiin nilainya cuma boleh salah satu dari 2 pilihan itu.
        ]);

        $user = User::find($id);

        if (! $user){
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        if ($user->id === $request->user()->id){ #cegah admin nurunin role dirinya sendiri.
            return response()->json(['message' => 'Tidak bisa mengubah role akun sendiri.'], 422);
        }

        $user->update(['role' => $validated['role']]);

        return response()->json($user);
    }

    #Lupa Password
    public function resetPassword(Request $request, string $id){
        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user = User::find($id);

        if (!$user){
            return response()->json(['message' => 'Akun tidak ditemukan'], 404);
        }

        $user->forceFill(['password' => Hash::make($validated['password'])])->save();
        $user->tokens()->delete(); // orang yang lupa password mungkin saja sedang dibobol, dan sesi lama harus ikut mati.

        return response()->json(['message' => 'Password diperbarui dan semua sesi login akun ini diakhiri.']);
    }
}
