<?php

declare(strict_types=1);

const APP_NAME = 'Fælles Konfiguration';
const APP_VERSION = '1.0.0';

$config = [
    'supportEmail' => 'support@example.com',
    'timezone' => 'Europe/Copenhagen',
];

date_default_timezone_set($config['timezone']);

function config_value(string $key, mixed $default = null): mixed
{
    global $config;

    return $config[$key] ?? $default;
}

function config_greeting(string $audience): string
{
    return sprintf('Hej %s, velkommen til %s v%s!', $audience, APP_NAME, APP_VERSION);
}
