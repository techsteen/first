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
            'content' => 'Du er en compiler- og runtime-vagt for en undervisningsplatform. Du vurderer elevkode til en robotsimulator og svarer kun med JSON.'
        ],
        [
            'role' => 'user',
            'content' => json_encode([
                'language' => $language,
                'code' => $code,
                'objective' => $objective,
                'environment' => [
                    'csharpEntryPoint' => 'static void Main(string[] args)',
                    'powershellEntryPoint' => 'Invoke-Program',
                    'commands' => [
                        'frem()',
                        'venstre()',
                        'højre()',
                        'blokering("retning")'
                    ],
                    'notes' => [
                        'Funktionerne ovenfor er defineret af simulatoren og må ikke markeres som udefinerede.',
                        'C#-opgaverne bruger class Program og static void Main(string[] args) uden returværdi. Int Main() skal ikke efterspørges.',
                        'Console.WriteLine(...) er understøttet og må ikke rapporteres som fejl.',
                        'PowerShell-programmer starter via Invoke-Program, som allerede kaldes i skabelonen.'
                    ]
                ],
                'instructions' => 'Undersøg koden for (1) egentlige compiler-/parserfejl og (2) kritiske runtime-risici som uendelige løkker uden exit-betingelse, uendelig rekursion, division med nul, eller andre fejl der med stor sandsynlighed vil crashe eller fryse programmet. language er "csharp" eller "powershell". Returnér ok=false og stopReason="compile" ved syntaksfejl. Returnér ok=false og stopReason="runtime" når du identificerer sandsynlige runtime-fejl eller -loops som bør blokere kørslen. Angiv detaljer i errors-listen (linje når muligt). Hvis koden er sikker, returneres ok=true. Giv logisk feedback i feltet feedback (maks. 2 sætninger) og relater det til objective når det findes. shortMessage skal være tom når ok=true; ellers skal den forklare hvorfor programmet stoppes, f.eks. "Mulig uendelig løkke". Inkludér målet i shortMessage når objective ikke er tom, f.eks. "Fejl i opgaven: [objective]".'
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
                        'stopReason' => [
                            'type' => 'string',
                            'enum' => ['compile', 'runtime', '']
                        ],
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
                        ],
                        'warning' => ['type' => 'string']
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

    $ok = (bool) $data['ok'];
    $shortMessage = isset($data['shortMessage']) && is_string($data['shortMessage']) ? $data['shortMessage'] : '';
    $feedbackMessage = isset($data['feedback']) && is_string($data['feedback']) ? $data['feedback'] : '';
    $warningMessage = isset($data['warning']) && is_string($data['warning']) ? $data['warning'] : '';

    $stopReason = '';
    if (!$ok) {
        $candidate = isset($data['stopReason']) && is_string($data['stopReason']) ? strtolower($data['stopReason']) : '';
        if ($candidate === 'runtime' || $candidate === 'compile') {
            $stopReason = $candidate;
        } else {
            $stopReason = 'compile';
        }
    }

    $errors = [];
    if (isset($data['errors']) && is_array($data['errors'])) {
        foreach ($data['errors'] as $error) {
            if (!is_array($error)) {
                continue;
            }
            $line = null;
            if (isset($error['line']) && is_numeric($error['line'])) {
                $line = (int) $error['line'];
            }
            $message = isset($error['message']) && is_string($error['message']) ? $error['message'] : '';
            if ($line === null && $message === '') {
                continue;
            }
            $errors[] = ['line' => $line, 'message' => $message];
        }
    }

    $payload = [
        'ok' => $ok,
        'shortMessage' => $shortMessage,
        'feedback' => $feedbackMessage,
        'errors' => $errors,
    ];

    if ($stopReason !== '') {
        $payload['stopReason'] = $stopReason;
    }
    if ($warningMessage !== '') {
        $payload['warning'] = $warningMessage;
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
