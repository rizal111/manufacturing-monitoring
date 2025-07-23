<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use tidy;

class GuestController extends Controller
{
    public function login()
    {
        // Find the guest user
        $guestUser = User::where('email', 'guest@example.com')->first();

        if ($guestUser) {
            // Login as guest
            Auth::login($guestUser);
            return to_route('dashboard');
        }

        return to_route('dashboard');
    }
}
