<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = env('ADMIN_SEED_PASSWORD');
        if (empty($password)){
            throw new \RuntimeException('ADMIN_SEED_PASSWORD belum diisi di .env');
        }

        User::create([
            'name' => 'SupermamaFarm',
            'email' => 'admin@supermamaFarm.com',
            'password' => Hash::make($password),
            'role' => 'admin',   
        ]);
    }
}
