<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

#Register,Login,Logout,cek role
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']); #middleware('auth:sanctum') untuk verifikasi apakah token valid.
Route::middleware(['auth:sanctum', 'admin'])->get('/test-admin', function(){
    return response()->json(['message' => 'Berhasil! Kamu adalah Admin.']);
});