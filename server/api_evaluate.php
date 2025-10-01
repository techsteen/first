<?php
header('Content-Type: application/json; charset=utf-8');

require_once realpath(__DIR__ . '/../Config/config.php');

$response = function ($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
};

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response([
        'error' => 'Kun POST er tilladt.'
    ], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $response(['error' => 'Ugyldigt inputformat.'], 400);
}

$allowedKeys = ['task', 'userAnswer', 'attempts'];
foreach ($input as $key => $value) {
    if (!in_array($key, $allowedKeys, true)) {
        $response(['error' => 'Ugyldige felter i forespørgslen.'], 400);
    }
}

if (!isset($input['task'], $input['userAnswer'], $input['attempts'])) {
    $response(['error' => 'Manglende felter: task, userAnswer, attempts.'], 400);
}

$task = $input['task'];
$userAnswer = $input['userAnswer'];
$attempts = (int) $input['attempts'];

if (!is_array($task)) {
    $response(['error' => 'Opgaven skal være et objekt.'], 400);
}

if ($attempts < 1) {
    $attempts = 1;
}

$maxAttempts = isset($task['max_attempts_before_solution']) ? (int) $task['max_attempts_before_solution'] : 3;

if (!checkRateLimit('evaluate', 10, 30)) {
    $response(['error' => 'For mange forespørgsler. Vent lidt og prøv igen.'], 429);
}

$apiKey = readApiKey();
if (!$apiKey) {
    $response(['error' => 'API-nøglen kunne ikke indlæses. Kontakt administratoren.'], 500);
}

$systemPrompt = 'Du er en dansk subnetting-underviser. Evaluer elevsvar strengt efter rubric, svar kun med JSON. '
    . 'Vis feedback før løsning. Respekter maxforsøg før løsning.';

$evaluationPrompt = buildEvaluationPrompt($task, $userAnswer, $attempts);

$payload = [
    'model' => 'gpt-4o-mini',
    'temperature' => 0.1,
    'response_format' => ['type' => 'json_object'],
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $evaluationPrompt]
    ]
];

$result = callOpenAi($payload, $apiKey);
if (isset($result['error'])) {
    $response(['error' => $result['error']], $result['status'] ?? 500);
}

$content = $result['content'] ?? '';
$parsed = json_decode($content, true);
if (!is_array($parsed)) {
    $parsed = defaultEvaluation();
}

$parsed['show_solution'] = enforceSolutionVisibility($parsed['show_solution'] ?? false, $attempts, $maxAttempts);

$logData = [
    'timestamp' => date('c'),
    'route' => 'evaluate',
    'taskId' => $task['id'] ?? 'ukendt',
    'correct' => (bool) ($parsed['is_correct'] ?? false)
];
logEvent($logData);

$response($parsed);

function readApiKey(): ?string
{
    if (defined('OPENAI_API_KEY') && OPENAI_API_KEY) {
        return trim(OPENAI_API_KEY);
    }
    if (defined('OPENAI_KEY_FILE') && OPENAI_KEY_FILE) {
        $path = OPENAI_KEY_FILE;
        if (is_readable($path)) {
            $content = trim((string) file_get_contents($path));
            return $content ?: null;
        }
    }
    return null;
}

function callOpenAi(array $payload, string $apiKey): array
{
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    if (!$ch) {
        return ['error' => 'Kunne ikke initialisere forespørgsel.', 'status' => 500];
    }

    $caBundle = findCaBundle();
    if (!$caBundle) {
        return ['error' => 'CA-bundle blev ikke fundet. Upload cacert-filen til Config-mappen.', 'status' => 500];
    }

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ];

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_CAINFO => $caBundle,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSLVERSION => CURL_SSLVERSION_TLSv1_2
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        curl_close($ch);
        return ['error' => 'Forbindelsen til AI-tjenesten mislykkedes. Prøv igen senere.', 'status' => 502];
    }

    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status >= 400) {
        return ['error' => 'AI-tjenesten returnerede en fejl. Prøv igen.', 'status' => $status];
    }

    $decoded = json_decode($response, true);
    if (!isset($decoded['choices'][0]['message']['content'])) {
        return ['error' => 'Ugyldigt svar fra AI-tjenesten.', 'status' => 502];
    }

    return ['content' => $decoded['choices'][0]['message']['content']];
}

function buildEvaluationPrompt(array $task, $userAnswer, int $attempts): string
{
    $rubric = isset($task['rubric']) ? json_encode($task['rubric'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '{}';
    $taskJson = json_encode($task, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $payload = [
        'task' => $taskJson,
        'rubric' => $rubric,
        'userAnswer' => $userAnswer,
        'attempts' => $attempts
    ];

    return 'Evaluer følgende opgave i JSON-format. Struktur: '
        . '{"is_correct":bool,"score":0|1,"feedback_brief":"tekst","feedback_next_step":"tekst",'
        . '"show_solution":bool,"solution":null|string,"diagnostics":{"error_type":"regnefejl|begreb|format|andet","confidence":0-1}}.'
        . ' Returnér kun JSON. Opgave og data:' . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function defaultEvaluation(): array
{
    return [
        'is_correct' => false,
        'score' => 0,
        'feedback_brief' => 'Vi kunne ikke evaluere svaret denne gang.',
        'feedback_next_step' => 'Prøv igen senere og dobbelttjek din beregning.',
        'show_solution' => false,
        'solution' => null,
        'diagnostics' => [
            'error_type' => 'andet',
            'confidence' => 0.0
        ]
    ];
}

function enforceSolutionVisibility($value, int $attempts, int $maxAttempts): bool
{
    if ($attempts >= $maxAttempts) {
        return true;
    }
    return (bool) $value && $attempts >= $maxAttempts;
}

function checkRateLimit(string $route, int $limit, int $windowSeconds): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'cli';
    $path = __DIR__ . '/../data/ratelimit_' . $route . '.json';
    $now = time();
    $records = [];

    if (is_file($path)) {
        $raw = file_get_contents($path);
        $records = $raw ? json_decode($raw, true) : [];
    }

    if (!isset($records[$ip])) {
        $records[$ip] = [];
    }

    $records[$ip] = array_values(array_filter($records[$ip], function ($timestamp) use ($now, $windowSeconds) {
        return ($now - (int) $timestamp) <= $windowSeconds;
    }));

    if (count($records[$ip]) >= $limit) {
        file_put_contents($path, json_encode($records), LOCK_EX);
        return false;
    }

    $records[$ip][] = $now;
    file_put_contents($path, json_encode($records), LOCK_EX);
    return true;
}

function logEvent(array $entry): void
{
    $path = __DIR__ . '/../data/usage.log';
    $line = json_encode($entry) . PHP_EOL;
    @file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
}

function findCaBundle(): ?string
{
    $configDir = realpath(__DIR__ . '/../Config');
    if (!$configDir) {
        return null;
    }
    $files = glob($configDir . '/cacert-*.pem');
    return $files ? $files[0] : null;
}
