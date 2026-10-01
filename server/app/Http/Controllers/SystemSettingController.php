<?php

namespace App\Http\Controllers;

use App\Models\Monitoring;
use App\Models\SystemSetting;
use App\Models\TelegramRecipient;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function Show(){
        $settings = SystemSetting::first(); // ?? SystemSetting::create([]);
        $recipient = TelegramRecipient::where('is_active', true)->first();

        if (!$settings){
            $settings = SystemSetting::create([
                'timezone' => 'Asia/Jakarta',
                'report_interval_minutes' => 60,
                'monitoring_mode' => true,
            ]);
        }
        return response()->json([
            'timezone' => $settings->timezone,
            'report_interval_minutes' => $settings->report_interval_minutes,
            'monitoring_mode' => $settings->monitoring_mode,
            'notify_report' => $settings->notify_report,
            'notify_temperature' => $settings->notify_temperature,
            'notify_humidity' => $settings->notify_humidity,
            'notify_offline' => $settings->notify_offline,
            'last_monitoring_at' => Monitoring::max('recorded_at'),
            'telegram_chat_id' => $recipient?->telegram_chat_id,
            'telegram_recipient_id' => $recipient->id,
        ]);
    }

    public function update(Request $request){
        $validated = $request->validate([
            'timezone' => 'required|string',
            'report_interval_minutes' => 'required|integer|min:1',
            'monitoring_mode' => 'required|boolean',
            'notify_report' => 'required|boolean',
            'notify_temperature' => 'required|boolean',
            'notify_humidity' => 'required|boolean',
            'notify_offline' => 'required|boolean',
        ]);

        $settings = SystemSetting::first(); // ?? SystemSetting::create([]);
        
        if (!$settings){
            $settings = SystemSetting::create($validated);
        } else {
            $settings->update($validated);
        }

        return response()->json($settings);
    }
}
