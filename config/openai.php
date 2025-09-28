<?php

declare(strict_types=1);

/**
 * @return array{api_key:string, ca_bundle:?string}
 */
function getOpenAiCredentials(): array
{
    static $cache = null;

    if ($cache !== null) {
        return $cache;
    }

    $configDir = resolveSharedConfigDirectory();
    [$apiKey, $caBundle] = loadSharedCredentials($configDir);

    if ($apiKey === '') {
        $apiKey = readKeyFromFile($configDir . '/openai.key');
    }

    if ($apiKey === '') {
        $fromEnv = getenv('OPENAI_API_KEY');
        if ($fromEnv !== false && trim($fromEnv) !== '') {
            $apiKey = trim($fromEnv);
        }
    }

    if ($caBundle === null) {
        $fallbacks = [
            $configDir . '/cacert-2025-08-12.pem',
            $configDir . '/cacert.pem',
        ];
        foreach ($fallbacks as $candidate) {
            if (is_readable($candidate)) {
                $caBundle = $candidate;
                break;
            }
        }
    }

    return $cache = [
        'api_key' => $apiKey,
        'ca_bundle' => $caBundle,
    ];
}

function getOpenAiApiKey(): string
{
    return getOpenAiCredentials()['api_key'];
}

function getOpenAiCaBundle(): ?string
{
    return getOpenAiCredentials()['ca_bundle'];
}

function callOpenAiChat(array $messages, array $options = []): string
{
    $credentials = getOpenAiCredentials();

    if ($credentials['api_key'] === '') {
        throw new RuntimeException('OpenAI API-nøglen er ikke tilgængelig i den centrale config.');
    }

    $payload = array_merge([
        'model' => 'gpt-4o-mini',
        'messages' => $messages,
        'temperature' => 0.7,
        'max_tokens' => 600,
    ], $options);

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    $curlOptions = [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: ' . 'Bearer ' . $credentials['api_key'],
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 15,
    ];

    if ($credentials['ca_bundle']) {
        $curlOptions[CURLOPT_CAINFO] = $credentials['ca_bundle'];
    }

    curl_setopt_array($ch, $curlOptions);

    $response = curl_exec($ch);

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('Kunne ikke kontakte OpenAI: ' . $error);
    }

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        throw new RuntimeException('OpenAI svarede med status ' . $statusCode . ': ' . $response);
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Ugyldigt svar fra OpenAI.');
    }

    $content = $decoded['choices'][0]['message']['content'] ?? '';
    if (!is_string($content) || trim($content) === '') {
        throw new RuntimeException('OpenAI returnerede ikke noget indhold.');
    }

    return trim($content);
}

function resolveSharedConfigDirectory(): string
{
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }

    $candidates = [];
    $envDir = getenv('CONFIG_DIR');
    if (is_string($envDir) && $envDir !== '') {
        $candidates[] = rtrim($envDir, '\\/');
    }

    $candidates[] = __DIR__;
    $candidates[] = dirname(__DIR__) . '/config';
    $candidates[] = dirname(__DIR__, 2) . '/config';
    $candidates[] = dirname(__DIR__, 2) . '/Config';

    foreach ($candidates as $dir) {
        if ($dir !== '' && is_dir($dir)) {
            return $cached = $dir;
        }
    }

    return $cached = __DIR__;
}

/**
 * @return array{0:string,1:?string}
 */
function loadSharedCredentials(string $configDir): array
{
    $apiKey = '';
    $caBundle = null;

    $configFiles = ['config.php', 'config.phg'];

    foreach ($configFiles as $candidate) {
        $candidatePath = $configDir . '/' . $candidate;
        if (!is_readable($candidatePath)) {
            continue;
        }

        $loaded = require $candidatePath;

        if (is_string($loaded)) {
            $candidateKey = trim($loaded);
            if ($candidateKey !== '') {
                $apiKey = $candidateKey;
            }
        } elseif (is_array($loaded)) {
            if (isset($loaded['OPENAI_API_KEY'])) {
                $candidateKey = trim((string) $loaded['OPENAI_API_KEY']);
                if ($candidateKey !== '') {
                    $apiKey = $candidateKey;
                }
            }

            if (isset($loaded['CA_BUNDLE'])) {
                $bundle = resolveReadablePath($loaded['CA_BUNDLE'], $configDir);
                if ($bundle !== null) {
                    $caBundle = $bundle;
                }
            }
        }

        if ($apiKey !== '' && $caBundle !== null) {
            break;
        }
    }

    return [$apiKey, $caBundle];
}

function readKeyFromFile(string $path): string
{
    if (!is_readable($path)) {
        return '';
    }

    $raw = (string) file_get_contents($path);
    $lines = preg_split('/\r?\n/', $raw);
    foreach ($lines as $line) {
        $candidate = trim($line);
        if ($candidate === '' || str_starts_with($candidate, '#')) {
            continue;
        }
        if (str_contains($candidate, '=')) {
            [, $candidate] = array_pad(explode('=', $candidate, 2), 2, '');
            $candidate = trim($candidate);
        }
        if ($candidate !== '') {
            return $candidate;
        }
    }

    return '';
}

/**
 * @param mixed $path
 */
function resolveReadablePath($path, string $baseDir): ?string
{
    if (!is_string($path)) {
        return null;
    }

    $candidate = trim($path);
    if ($candidate === '') {
        return null;
    }

    if (is_readable($candidate)) {
        return $candidate;
    }

    $relative = $baseDir . '/' . ltrim($candidate, '/\\');
    if (is_readable($relative)) {
        return $relative;
    }

    return null;
}
