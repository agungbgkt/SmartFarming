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
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('_chicken__coop_id');
            $table->string('type'); #nanti diisi string kayak suhu_tinggi, suhu_rendah, kelembapan_tinggi, kelembapan_rendah, atau device_offline
            $table->text('message'); #pakai text karena tidak ada batasnya di postgre.
            $table->boolean('is_sent')->default(false); #status kirim ke Telegram. Defaultnya false (belum terkirim), nanti diubah jadi true oleh sistem. statusnya (ya/tidak).
            $table->timestamp('send_at')->nullable(); #jam berapa pesan dikirim.
            $table->timestamps();

            $table->foreign('_chicken__coop_id')->references('id')->on('_chicken__coop')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
