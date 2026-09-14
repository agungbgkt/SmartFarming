<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChickenCoop;
use App\Models\Monitoring;

class SendHourlySensorReport extends Command
{
    protected $signature = 'telegram:sendHourly';
    protected $description = 'Command description';
    public function handle()
    {
        $coops = ChickenCoop::all();

        if ($coops->isEmpty()){
            $this->warn('Tidak ada data kandang.');
            return Command::SUCCESS;
        }

        $message = "Laporan Sensor SMART FARMING\n";
        $message = now()->format('d/m/Y H:i') . "\n\n";

        foreach($coops as $coop){
            #Ambil data monitoring tiap awal jam
            $monitoring = Monitoring::where('_chicken__coop_id', $coop->id)
                ->whereMinute('recorded_at', 0)
                ->whereBetween('recorded_at',[
                    now()->startOfHour(),
                    now()->endOfHour()
                ])
                ->first();
        }
    }
}
