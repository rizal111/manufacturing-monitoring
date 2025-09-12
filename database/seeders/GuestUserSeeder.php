<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class GuestUserSeeder extends Seeder
{
    public function run()
    {
        User::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Guest User',
                'email' => 'guest@example.com',
                'password' => Hash::make('guest_password_' . env('APP_KEY')),
                'email_verified_at' => now(),
            ]
        );
    }
}
