<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function decodePayload(string $raw): array
{
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(['error' => 'Ugyldigt JSON-format.'], 400);
    }

    return $data;
}

function resolveConfigDir(): string
{
    $candidates = [];

    $envDir = getenv('CONFIG_DIR');
    if (is_string($envDir) && $envDir !== '') {
        $candidates[] = rtrim($envDir, "\\/");
    }

    $candidates[] = __DIR__ . '/config';
    $candidates[] = dirname(__DIR__) . '/config';
    $candidates[] = dirname(__DIR__, 2) . '/Config';
    $candidates[] = dirname(__DIR__, 2) . '/config';

    foreach ($candidates as $dir) {
        if ($dir && is_dir($dir)) {
            return $dir;
        }
    }

    return $candidates[0];
}

function loadCredentials(string $configDir): array
{
    $apiKey = null;
    $caBundle = null;

    $configFiles = ['config.php', 'config.phg'];
    $configPath = null;

    foreach ($configFiles as $candidate) {
        $candidatePath = $configDir . '/' . $candidate;
        if (is_readable($candidatePath)) {
            $configPath = $candidatePath;
            break;
        }
    }

    if ($configPath) {
        $loaded = require $configPath;
        if (is_string($loaded)) {
            $apiKey = trim($loaded);
        } elseif (is_array($loaded)) {
            if (isset($loaded['OPENAI_API_KEY'])) {
                $apiKey = trim((string) $loaded['OPENAI_API_KEY']);
            }
            if (isset($loaded['CA_BUNDLE'])) {
                $candidate = trim((string) $loaded['CA_BUNDLE']);
                if ($candidate !== '') {
                    if (!is_readable($candidate)) {
                        $relative = $configDir . '/' . ltrim($candidate, '/\\');
                        if (is_readable($relative)) {
                            $candidate = $relative;
                        }
                    }
                    if (is_readable($candidate)) {
                        $caBundle = $candidate;
                    }
                }
            }
        }
    }

    if (!$caBundle) {
        $defaultCa = $configDir . '/cacert.pem';
        if (is_readable($defaultCa)) {
            $caBundle = $defaultCa;
        }
    }

    if (!$apiKey) {
        $apiKey = getenv('OPENAI_API_KEY') ?: '';
    }

    return [$apiKey, $caBundle];
}

function loadTasks(string $path): array
{
    if (!is_readable($path)) {
        respond(['error' => 'Kan ikke finde opgavefilen.'], 500);
    }

    $raw = file_get_contents($path);
    if ($raw === false) {
        respond(['error' => 'Kan ikke læse opgavefilen.'], 500);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        respond(['error' => 'Opgavefilen har et ugyldigt format.'], 500);
    }

    $map = [];
    foreach ($decoded as $task) {
        if (isset($task['id'])) {
            $map[(int) $task['id']] = $task;
        }
    }

    return $map;
}

$rawInput = file_get_contents('php://input');
if ($rawInput === false) {
    respond(['error' => 'Kunne ikke læse forespørgslen.'], 400);
}

$payload = decodePayload($rawInput);
$taskId = isset($payload['taskId']) ? (int) $payload['taskId'] : 0;
$answer = isset($payload['answer']) ? trim((string) $payload['answer']) : '';

if ($taskId <= 0) {
    respond(['error' => 'Mangler gyldigt taskId.'], 400);
}

if ($answer === '') {
    respond(['error' => 'Skriv et svar, før du sender.'], 400);
}

$tasks = loadTasks(dirname(__DIR__) . '/data/subnet_tasks.json');
if (!isset($tasks[$taskId])) {
    respond(['error' => 'Opgaven findes ikke.'], 404);
}

$task = $tasks[$taskId];
$expected = (string) ($task['expectedAnswer'] ?? '');
$explanation = (string) ($task['explanation'] ?? '');
$prompt = (string) ($task['prompt'] ?? '');

[$apiKey, $caBundle] = loadCredentials(resolveConfigDir());
if ($apiKey === '') {
    respond(['error' => 'Serveren mangler OpenAI API-nøglen.'], 500);
}

$requestBody = [
    'model' => 'gpt-4o-mini',
    'temperature' => 0.2,
    'max_tokens' => 280,
    'messages' => [
        [
            'role' => 'system',
            'content' => 'Du er en hjælpsom underviser i subnetting. Du skal svare med JSON på formen {"status":"correct|incorrect","feedback":"kort forklaring på dansk"}. Ros kort ved korrekte svar og forklar hvad der mangler ved forkerte.'
        ],
        [
            'role' => 'user',
            'content' => sprintf(
                "Opgave: %s\nForventet løsningsidé: %s\nFaglærerens forklaring: %s\nElevens svar: %s\n\nVurder om elevens svar matcher løsningen.",
                $prompt,
                $expected,
                $explanation,
                $answer
            )
        ]
    ]
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
$curlOptions = [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE),
];

if ($caBundle) {
    $curlOptions[CURLOPT_CAINFO] = $caBundle;
}

curl_setopt_array($ch, $curlOptions);
$response = curl_exec($ch);
if ($response === false) {
    $errorMessage = curl_error($ch) ?: 'Ukendt fejl ved kald til OpenAI.';
    curl_close($ch);
    respond(['error' => $errorMessage], 502);
}

$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$decoded = json_decode($response, true);
if ($statusCode >= 400) {
    $message = is_array($decoded) ? ($decoded['error']['message'] ?? 'OpenAI returnerede en fejl.') : 'OpenAI returnerede en fejl.';
    respond(['error' => $message], $statusCode);
}

if (!is_array($decoded)) {
    respond(['error' => 'Uventet svar fra OpenAI.'], 502);
}

$content = (string) ($decoded['choices'][0]['message']['content'] ?? '');
if ($content === '') {
    respond(['error' => 'OpenAI gav ikke noget indhold i svaret.'], 502);
}

$result = json_decode($content, true);
if (!is_array($result) || !isset($result['status'])) {
    // Forsøg at tolke tekstligt svar
    $status = stripos($content, 'korrekt') !== false ? 'correct' : 'incorrect';
    $result = [
        'status' => $status,
        'feedback' => trim($content)
    ];
}

$status = in_array($result['status'], ['correct', 'incorrect'], true) ? $result['status'] : 'incorrect';
$feedback = isset($result['feedback']) ? trim((string) $result['feedback']) : '';

respond([
    'status' => $status,
    'feedback' => $feedback !== '' ? $feedback : ($status === 'correct' ? 'Godt arbejde – svaret matcher løsningen.' : 'Svaret matcher ikke helt forventningen. Tjek dine beregninger igen.')
]);
