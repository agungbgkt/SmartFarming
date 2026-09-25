<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChickenCoopController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\TelegramRecipientController;
use App\Http\Controllers\UserController;

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
    Route::get('/coop/{coopId}/devices', [DeviceController::class, 'index']);
    Route::get('/devices', [DeviceController::class, 'indexAll']);

    Route::middleware('admin')->group(function(){
        Route::post('/devices', [DeviceController::class, 'store']);
        Route::put('/device/{id}', [DeviceController::class, 'update']);
        Route::delete('/device/{id}', [DeviceController::class, 'destroy']);
    });
});

#MONITORING DATA
Route::get('/coop/{coopId}/monitorings', [MonitoringController::class, 'index']);

#ALERT
Route::get('/alerts', [AlertController::class, 'index']);

#CRUD USER & PENERIMA TELEGRAM OLEH ADMIN
Route::middleware(['auth:sanctum', 'admin'])->group(function(){
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);

    Route::get('/telegram-recipients', [TelegramRecipientController::class, 'index']);
    Route::post('/telegram-recipients', [TelegramRecipientController::class, 'store']);
    Route::put('/telegram-recipients/{id}', [TelegramRecipientController::class, 'update']);
    Route::delete('/telegram-recipients/{id}', [TelegramRecipientController::class, 'destroy']);
});