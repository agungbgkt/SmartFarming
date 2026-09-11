<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChickenCoopController;
use App\Http\Controllers\DeviceController;

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

#CRUD ADMIN & USER VIEW ChickenCoop
Route::middleware('auth:sanctum')->group(function(){
    Route::get('/coop', [ChickenCoopController::class, 'index']);
    Route::get('/coop/{id}', [ChickenCoopController::class, 'show']);

    Route::middleware('admin')->group(function(){
        Route::post('/coop', [ChickenCoopController::class, 'store']);
        Route::put('/coop/{id}', [ChickenCoopController::class, 'update']);
        Route::delete('/coop/{id}', [ChickenCoopController::class, 'destroy']);
    });
});

#CRUD ADMIN & USER VIEW Device
Route::middleware('auth:sanctum')->group(function(){
    Route::get('/device', [DeviceController::class, 'index']);
    Route::get('/device/{id}', [DeviceController::class, 'show']);

    Route::middleware('admin')->group(function(){
        Route::post('/device', [DeviceController::class, 'store']);
        Route::put('/device/{id}', [DeviceController::class, 'update']);
        Route::delete('/device/{id}', [DeviceController::class, 'destroy']);
    });
});