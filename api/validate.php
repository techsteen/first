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

$mode = isset($payload['mode']) ? strtolower(trim((string) $payload['mode'])) : 'preflight';
$language = $payload['language'] ?? '';
$code = $payload['code'] ?? '';
$objective = $payload['objective'] ?? '';

if (!in_array($mode, ['preflight', 'feedback'], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'mode skal være preflight eller feedback.']);
    exit;
}

$progress = [];
if ($mode === 'feedback') {
    $progress = isset($payload['progress']) && is_array($payload['progress']) ? $payload['progress'] : [];
}

if (!is_string($language) || !is_string($code) || ($objective !== '' && !is_string($objective))) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'language, code og objective skal være strenge.']);
    exit;
}

$objective = is_string($objective) ? trim($objective) : '';

require_once __DIR__ . '/../lib/OpenAIClient.php';

try {
    $client = OpenAIClient::fromDefaultLocations();

    if ($mode === 'feedback') {
        $result = runFeedbackAnalysis($client, $language, $code, $objective, $progress);
    } else {
        $result = runPreflightCheck($client, $language, $code, $objective);
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function runPreflightCheck(OpenAIClient $client, string $language, string $code, string $objective): array
{
    $systemPrompt = 'Du er en compiler- og runtime-vagt for en undervisningsplatform. Du vurderer elevkode til en robotsimulator og svarer kun med JSON.';

    $promptPayload = [
        'language' => $language,
        'code' => format_code_for_prompt($code),
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
                'I C# skal du antage at frem, venstre, højre og blokering er tilgængelige som importerede statiske metoder (f.eks. via using static). De kaldes direkte fra Main uden yderligere deklaration.',
                'C#-opgaverne bruger class Program og static void Main(string[] args) uden returværdi. Int Main() skal ikke efterspørges.',
                'Et eksempel på gyldig struktur er: using System; class Program { static void Main(string[] args) { frem(); } }.',
                'Console.WriteLine(...) er understøttet og må ikke rapporteres som fejl.',
                'PowerShell-programmer starter via Invoke-Program, som allerede kaldes i skabelonen. Cmdlets som Write-Host er gyldige.'
            ]
        ],
        'instructions' => 'Undersøg koden for (1) egentlige compiler-/parserfejl og (2) kritiske runtime-risici som uendelige løkker uden exit-betingelse, uendelig rekursion, division med nul, eller andre fejl der med stor sandsynlighed vil crashe eller fryse programmet. language er "csharp" eller "powershell". Frem(), venstre(), højre() og blokering(...) er allerede defineret af simulatoren og må ALDRIG markeres som udefinerede – accepter deres brug uden yderligere kode. Returnér ok=false og stopReason="compile" ved syntaksfejl. Returnér ok=false og stopReason="runtime" når du identificerer sandsynlige runtime-fejl eller -loops som bør blokere kørslen. Angiv detaljer i errors-listen (linje når muligt). Hvis koden er sikker, returneres ok=true. shortMessage skal være tom når ok=true; ellers skal den forklare hvorfor programmet stoppes, f.eks. "Mulig uendelig løkke". Inkludér målet i shortMessage når objective ikke er tom, f.eks. "Fejl i opgaven: [objective]".'
    ];

    $response = $client->chat([
        [
            'role' => 'system',
            'content' => $systemPrompt
        ],
        [
            'role' => 'user',
            'content' => json_encode($promptPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
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

    $payload['prompt'] = [
        'mode' => 'preflight',
        'system' => $systemPrompt,
        'user' => $promptPayload,
    ];

    $payload['modelResponse'] = [
        'mode' => 'preflight',
        'id' => $response['id'] ?? null,
        'usage' => $response['usage'] ?? null,
        'content' => $content,
        'raw' => $response,
    ];

    return $payload;
}

function runFeedbackAnalysis(OpenAIClient $client, string $language, string $code, string $objective, array $progress): array
{
    $normalisedProgress = normaliseProgress($progress);

    $systemPrompt = 'Du er en hjælpsom undervisningsassistent. Giv kort, konkret feedback til en elev, der programmerer en robotsimulator.';

    $environment = [
        'csharpEntryPoint' => 'static void Main(string[] args)',
        'powershellEntryPoint' => 'Invoke-Program',
        'commands' => [
            'frem()',
            'venstre()',
            'højre()',
            'blokering("retning")'
        ],
        'notes' => [
            'Simulatoren leverer ovenstående kommandoer – de må aldrig markeres som udefinerede, selv hvis koden ikke deklarerer dem.',
            'I C# er frem, venstre, højre og blokering tilgængelige som importerede statiske metoder og kan kaldes direkte fra Main.',
            'Console.WriteLine(...) er understøttet og skal accepteres.',
            'PowerShell-programmer starter via Invoke-Program, og Write-Host m.fl. er gyldige.'
        ]
    ];

    $promptPayload = [
        'language' => $language,
        'objective' => $objective,
        'code' => format_code_for_prompt($code),
        'progress' => $normalisedProgress,
        'environment' => $environment,
        'instructions' => 'Giv 2-3 sætninger med konstruktiv feedback baseret på koden og den nuværende status. Kommentér kort på hvad der allerede virker, og foreslå næste skridt mod målet. Brug venligt tonefald og henvis til objective hvis det findes. Hvis loggen rapporterer at de indbyggede kommandoer mangler, så korrigér misforståelsen og forklar at de er tilgængelige.'
    ];

    $response = $client->chat([
        [
            'role' => 'system',
            'content' => $systemPrompt
        ],
        [
            'role' => 'user',
            'content' => json_encode($promptPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]
    ], [
        'temperature' => 0.4,
        'response_format' => [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'ai_feedback',
                'schema' => [
                    'type' => 'object',
                    'required' => ['feedback'],
                    'properties' => [
                        'feedback' => ['type' => 'string'],
                        'message' => ['type' => 'string']
                    ]
                ]
            ]
        ]
    ]);

    $content = $response['choices'][0]['message']['content'] ?? null;
    $data = is_string($content) ? json_decode($content, true) : null;
    if (!$data || !isset($data['feedback'])) {
        throw new RuntimeException('Modellen returnerede ikke AI-feedback.');
    }

    $feedback = is_string($data['feedback']) ? trim($data['feedback']) : '';
    $message = isset($data['message']) && is_string($data['message']) ? trim($data['message']) : '';

    $payload = ['feedback' => $feedback];
    if ($message !== '') {
        $payload['message'] = $message;
    }

    $payload['prompt'] = [
        'mode' => 'feedback',
        'system' => $systemPrompt,
        'user' => $promptPayload,
    ];

    $payload['modelResponse'] = [
        'mode' => 'feedback',
        'id' => $response['id'] ?? null,
        'usage' => $response['usage'] ?? null,
        'content' => $content,
        'raw' => $response,
    ];

    return $payload;
}

function format_code_for_prompt(string $code): string
{
    $flattened = str_replace(["\r\n", "\n", "\r"], ' ', $code);
    $flattened = str_replace(['(', ')'], '', $flattened);

    // Normalise generic spacing first so braces and semicolons can be formatted consistently.
    $flattened = preg_replace('/\s+/', ' ', $flattened);

    // Ensure braces are separated and semicolons retain a trailing gap for readability.
    $flattened = preg_replace('/\s*{\s*/', '{ ', $flattened);
    $flattened = preg_replace('/\s*}\s*/', ' }', $flattened);
    $flattened = preg_replace('/;\s*/', ';  ', $flattened);

    // Collapse any excessive spaces introduced around braces while preserving the intentional
    // double-space after semicolons.
    $flattened = preg_replace('/\s+/', ' ', $flattened);
    $flattened = str_replace('; ', ';  ', $flattened);

    return trim($flattened);
}

function normaliseProgress(array $progress): array
{
    $log = [];
    if (isset($progress['log']) && is_array($progress['log'])) {
        foreach ($progress['log'] as $entry) {
            if (!is_string($entry)) {
                continue;
            }
            $trimmed = trim($entry);
            if ($trimmed === '') {
                continue;
            }
            $log[] = $trimmed;
            if (count($log) >= 40) {
                break;
            }
        }
    }

    $stepIndex = isset($progress['stepIndex']) && is_numeric($progress['stepIndex'])
        ? max(0, (int) $progress['stepIndex'])
        : null;
    $totalSteps = isset($progress['totalSteps']) && is_numeric($progress['totalSteps'])
        ? max(0, (int) $progress['totalSteps'])
        : null;
    $success = isset($progress['success']) ? (bool) $progress['success'] : null;

    $board = isset($progress['board']) && is_array($progress['board'])
        ? normaliseBoardSnapshot($progress['board'])
        : null;

    return [
        'log' => $log,
        'stepIndex' => $stepIndex,
        'totalSteps' => $totalSteps,
        'success' => $success,
        'board' => $board
    ];
}

function normaliseBoardSnapshot(array $snapshot): array
{
    $result = [];

    if (isset($snapshot['agent']) && is_array($snapshot['agent'])) {
        $result['agent'] = [
            'x' => isset($snapshot['agent']['x']) && is_numeric($snapshot['agent']['x']) ? (int) $snapshot['agent']['x'] : 0,
            'y' => isset($snapshot['agent']['y']) && is_numeric($snapshot['agent']['y']) ? (int) $snapshot['agent']['y'] : 0,
            'direction' => isset($snapshot['agent']['direction']) && is_string($snapshot['agent']['direction'])
                ? $snapshot['agent']['direction']
                : ''
        ];
    }

    $result['obstacles'] = [];
    if (isset($snapshot['obstacles']) && is_array($snapshot['obstacles'])) {
        foreach ($snapshot['obstacles'] as $obstacle) {
            if (!is_array($obstacle)) {
                continue;
            }
            if (!isset($obstacle['x'], $obstacle['y'])) {
                continue;
            }
            if (!is_numeric($obstacle['x']) || !is_numeric($obstacle['y'])) {
                continue;
            }
            $result['obstacles'][] = [
                'x' => (int) $obstacle['x'],
                'y' => (int) $obstacle['y']
            ];
            if (count($result['obstacles']) >= 20) {
                break;
            }
        }
    }

    if (isset($snapshot['obstaclesVisible'])) {
        $result['obstaclesVisible'] = (bool) $snapshot['obstaclesVisible'];
    }

    return $result;
}
