<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Kun POST er tilladt.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Ugyldigt JSON-body.']);
    exit;
}

$language = $payload['language'] ?? '';
$code = $payload['code'] ?? '';

if (!is_string($language) || !is_string($code)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Både language og code skal være strenge.']);
    exit;
}

require_once __DIR__ . '/../lib/OpenAIClient.php';

$configPath = __DIR__ . '/../config/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Konfigurationsfilen mangler. Kopiér config/config.example.php til config/config.php og udfyld API-nøglen.'
    ]);
    exit;
}

try {
    $client = OpenAIClient::fromConfigFile($configPath);

    $response = $client->chat([
        [
            'role' => 'system',
            'content' => 'Du er en compiler-assistent. Du modtager kode og svarer med JSON. Hvis der er fejl, angiv dem med linjenumre.'
        ],
        [
            'role' => 'user',
            'content' => json_encode([
                'language' => $language,
                'code' => $code,
                'instructions' => 'Tjek syntaks og grundlæggende struktur. Returnér ok=true hvis alt er fint. Ved fejl returnér ok=false, shortMessage og en liste af fejl med line og message.'
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]
    ], [
        'temperature' => 0,
        'response_format' => [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'compile_check',
                'schema' => [
                    'type' => 'object',
                    'required' => ['ok'],
                    'properties' => [
                        'ok' => ['type' => 'boolean'],
                        'shortMessage' => ['type' => 'string'],
                        'errors' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'required' => ['line', 'message'],
                                'properties' => [
                                    'line' => ['type' => 'integer'],
                                    'message' => ['type' => 'string']
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    $content = $response['choices'][0]['message']['content'] ?? null;
    $data = is_string($content) ? json_decode($content, true) : null;
    if (!$data || !array_key_exists('ok', $data)) {
        throw new RuntimeException('Modellen returnerede ikke et gyldigt svar.');
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
