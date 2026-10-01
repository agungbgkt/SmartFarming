<?php

namespace App\Http\Controllers;

use App\Models\Monitoring;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function Show(){
        $settings = SystemSetting::first(); // ?? SystemSetting::create([]);

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
            'last_monitoring_at' => Monitoring::max('recorded_at'),
        ]);
    }

    public function update(Request $request){
        $validated = $request->validate([
            'timezone' => 'required|string',
            'report_interval_minutes' => 'required|integer|min:1',
            'monitoring_mode' => 'required|boolean',
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
