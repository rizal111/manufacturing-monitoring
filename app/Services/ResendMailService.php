<?php

namespace App\Services;

use Resend\Client;

class ResendService
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client(config('services.resend.key'));
    }

    public function sendEmail(array $data): mixed
    {
        return $this->client->emails->send($data);
    }
}
