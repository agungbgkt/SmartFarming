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
        Schema::create('devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('_chicken__coop_id');
            $table->string('device_code')->unique();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->foreign('_chicken__coop_id')->references('id')->on('_chicken__coop')->onDelete('cascade'); #kalau suatu saat kandang-nya dihapus dari tabel kandang, semua device yang terhubung ke kandang itu otomatis ikut terhapus.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
