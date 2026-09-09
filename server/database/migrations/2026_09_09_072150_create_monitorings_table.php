<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('monitorings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('_chicken__coop_id');
            $table->float('temperature');
            $table->float('humidity');
            $table->timestamp('recorded_at'); #kapan data sensornya diambil
            $table->timestamps();

            $table->foreign('_chicken__coop_id')->references('id')->on('_chicken__coop')->onDelete('cascade');
            $table->index(['_chicken__coop_id', 'recorded_at']); #Index itu bikin database lebih cepat nyari data, tanpa harus scan semua baris satu-satu |ambil semua monitorings punya chicken_coop_id = X, yang recorded_at-nya antara tanggal sekian sampai sekian" (buat isi grafik).
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitorings');
    }
};
