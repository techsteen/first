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
$objective = $payload['objective'] ?? '';

if (!is_string($language) || !is_string($code) || ($objective !== '' && !is_string($objective))) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'language, code og objective skal være strenge.']);
    exit;
}

$objective = is_string($objective) ? trim($objective) : '';

require_once __DIR__ . '/../lib/OpenAIClient.php';

try {
    $client = OpenAIClient::fromDefaultLocations();

    $response = $client->chat([
        [
            'role' => 'system',
            'content' => 'Du er en compiler-assistent for en undervisningsplatform. Du vurderer elevkode til en robotsimulator og svarer kun med JSON.'
        ],
        [
            'role' => 'user',
            'content' => json_encode([
                'language' => $language,
                'code' => $code,
                'objective' => $objective,
                'environment' => [
                    'cEntryPoint' => 'static void main(void)',
                    'powershellEntryPoint' => 'Invoke-Program',
                    'commands' => [
                        'frem()',
                        'venstre()',
                        'højre()',
                        'blokering("retning")'
                    ],
                    'notes' => [
                        'Funktionerne ovenfor er defineret af simulatoren og må ikke markeres som udefinerede.',
                        'Eleverne skal ikke deklarere eller kalde int main(). Programmet startes via static void main() i C og Invoke-Program i PowerShell.',
                        'Det er korrekt at funktioner som frem() ikke returnerer værdier.'
                    ]
                ],
                'instructions' => 'Fokuser udelukkende på syntaks, parenteser, blokstruktur og andre forhold der ville få kildekoden til ikke at kompilere eller blive afvist af en formatter. Returnér ok=false kun ved egentlige compiler-/parserfejl og angiv shortMessage samt en detaljeret liste af fejl (med line og message). Hvis koden er syntaktisk korrekt, skal du returnere ok=true også selv om løsningen muligvis ikke opfylder opgaven. Giv i stedet vejledende logisk feedback i feltet feedback (maks. 2 sætninger) og relater det til objective når det findes. Lad shortMessage stå tom når ok=true. Inddrag målet i shortMessage når objective ikke er tom, f.eks. "Fejl i opgaven: [objective]".'
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
                        'feedback' => ['type' => 'string'],
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
