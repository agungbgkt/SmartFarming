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
        Schema::table('system_settings', function (Blueprint $table) {
            $table->boolean('notify_report')->default(true);
            $table->boolean('notify_temperature')->default(true);
            $table->boolean('notify_humidity')->default(true);
            $table->boolean('notify_offline')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn(['notify_report', 'notify_temperature', 'notify_humidity', 'nofity_offline']);
        });
    }
};
