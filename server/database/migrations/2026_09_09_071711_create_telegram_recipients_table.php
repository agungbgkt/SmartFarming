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
        Schema::create('telegram_recipients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('telegram_chat_id')->unique(); #ID unik yang Telegram kasih ke tiap chat/user
            $table->string('name'); #nama penerima
            $table->boolean('is_active')->default(true); #untuk nonaktifkan penerima
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telegram_recipients');
    }
};
