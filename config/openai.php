<?php

declare(strict_types=1);

/**
 * @return array{config: array<string, mixed>, dir: string}
 */
function getSharedConfigContext(): array
{
    static $context = null;

    if ($context !== null) {
        return $context;
    }

    $path = __DIR__ . '/../../Config/config.php';
    if (!is_file($path)) {
        throw new RuntimeException('Den centrale config-fil blev ikke fundet: ' . $path);
    }

    $loaded = require $path;
    if (!is_array($loaded)) {
        throw new RuntimeException('Config-filen skal returnere et array.');
    }

    return $context = [
        'config' => $loaded,
        'dir' => dirname($path),
    ];
}

function callOpenAiChat(array $messages, array $options = []): string
{
    $context = getSharedConfigContext();
    $config = $context['config'];
    $configDir = $context['dir'];

    $apiKey = trim((string)($config['OPENAI_API_KEY'] ?? ''));
    if ($apiKey === '') {
        throw new RuntimeException('API-nøglen mangler – opdater Config/config.php med en gyldig nøgle.');
    }

    $apiBase = trim((string)($config['OPENAI_BASE'] ?? 'https://api.openai.com/v1'));
    if ($apiBase === '') {
        $apiBase = 'https://api.openai.com/v1';
    }
    $apiBase = rtrim($apiBase, '/');

    $model = $options['model'] ?? ($config['OPENAI_MODEL'] ?? 'gpt-4o-mini');
    unset($options['model']);

    $basePayload = [
        'model' => $model,
        'messages' => $messages,
    ];

    if (!array_key_exists('temperature', $options)) {
        $basePayload['temperature'] = isset($config['OPENAI_TEMPERATURE'])
            ? (float) $config['OPENAI_TEMPERATURE']
            : 0.7;
    }

    $payload = array_merge($basePayload, $options);

    $timeout = (int)($config['TIMEOUT'] ?? 30);
    if ($timeout <= 0) {
        $timeout = 30;
    }

    $endpoint = $apiBase . '/chat/completions';
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: ' . 'Bearer ' . $apiKey,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
    ]);

    $caBundle = $config['CA_BUNDLE'] ?? '';
    if (is_string($caBundle) && $caBundle !== '') {
        $bundlePath = $caBundle;
        if (!is_file($bundlePath)) {
            $candidate = $configDir . '/' . ltrim($caBundle, '/\\');
            if (is_file($candidate)) {
                $bundlePath = $candidate;
            }
        }
        if (is_file($bundlePath)) {
            curl_setopt($ch, CURLOPT_CAINFO, $bundlePath);
        }
    }

    $rawResponse = curl_exec($ch);
    $curlErrNo = curl_errno($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = $curlErrNo ? curl_error($ch) : null;
    curl_close($ch);

    if ($curlErrNo) {
        throw new RuntimeException('Forbindelsen til OpenAI fejlede: ' . $curlError);
    }

    if ($httpStatus < 200 || $httpStatus >= 300) {
        throw new RuntimeException('OpenAI svarede med HTTP-status ' . $httpStatus . '. Svar: ' . $rawResponse);
    }

    $decoded = json_decode($rawResponse, true);
    if (!is_array($decoded) || empty($decoded['choices'][0]['message']['content'])) {
        throw new RuntimeException('OpenAI returnerede et uventet svar.');
    }

    return trim((string) $decoded['choices'][0]['message']['content']);
}
