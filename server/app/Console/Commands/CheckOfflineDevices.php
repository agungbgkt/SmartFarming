<?php

namespace App\Console\Commands;

use App\Events\AlertCreated;
use App\Models\Alert;
use App\Models\Device;
use App\Models\SystemSetting;
use App\Services\TelegramService;
use Illuminate\Console\Command;

class CheckOfflineDevices extends Command
{
    protected $signature = 'app:check-offline-devices';
    protected $description = 'Command description';

    public function handle()
    {
        $settings = SystemSetting::first() ?? SystemSetting::create([])->fresh();

        if (!$settings->monitoring_mode || ! $settings->notify_offline){
            return self::SUCCESS;
        }

        $devices = Device::with('chickenCoop')
            ->whereNotNull('last_seen_at')
            ->where('last_seen_at', '<', now()->subMinutes(Device::OFFLINE_AFTER_MINUTES))
            ->whereNull('offline_notified_at')
            ->get();

        foreach($devices as $device){
            $coopName = $device->chickenCoop?->name ?? '-';
            $message = "Perangkat {$device->device_code} ({$coopName}) tidak mengirim data sejak "
                . $device->last_seen_at->timezone(config('app.timezone'))->format('d M Y H:i') . '.';
            $alert = Alert::create([
                '_chicken__coop_id' => $device->_chicken__coop_id,
                'type' => 'device_offline',
                'message' => $message,
            ]);

            $sent = (new TelegramService())->sendAlert($message);

            $alert->update(['is_sent' => $sent, 'send_at' => $sent ? now() : null]);
            $device->update(['offline_notified_at' => now()]);

            event(new AlertCreated($alert));
            $this->info("Offline: {$device->device_code}");
        }

        return self::SUCCESS;
    }
}
