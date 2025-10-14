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

function findConfigFile(): array
{
    $candidates = [];
    $checked = [];

    $envPath = getenv('CONFIG_PATH');
    if (is_string($envPath) && $envPath !== '') {
        $candidates[] = $envPath;
        $candidates[] = __DIR__ . '/' . ltrim($envPath, '/\\');
        $candidates[] = dirname(__DIR__) . '/' . ltrim($envPath, '/\\');
    }

    $envFile = getenv('CONFIG_FILE');
    if (is_string($envFile) && $envFile !== '') {
        $candidates[] = $envFile;
        $candidates[] = __DIR__ . '/' . ltrim($envFile, '/\\');
        $candidates[] = dirname(__DIR__) . '/' . ltrim($envFile, '/\\');
    }

    $envDir = getenv('CONFIG_DIR');
    if (is_string($envDir) && $envDir !== '') {
        $dir = rtrim($envDir, "\\/");
        $candidates[] = $dir . '/config.php';
        $candidates[] = $dir . '/config.phg';
    }

    $bases = [__DIR__, dirname(__DIR__), dirname(__DIR__, 2), dirname(__DIR__, 3)];

    $docRoots = [];
    $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if (is_string($docRoot) && $docRoot !== '') {
        $docRoots[] = $docRoot;
    }
    $contextRoot = $_SERVER['CONTEXT_DOCUMENT_ROOT'] ?? '';
    if (is_string($contextRoot) && $contextRoot !== '' && $contextRoot !== $docRoot) {
        $docRoots[] = $contextRoot;
    }
    $scriptFilename = $_SERVER['SCRIPT_FILENAME'] ?? '';
    if (is_string($scriptFilename) && $scriptFilename !== '') {
        $docRoots[] = dirname($scriptFilename);
    }
    $scriptDirName = $_SERVER['SCRIPT_NAME'] ?? '';
    if (is_string($scriptDirName) && $scriptDirName !== '' && is_string($docRoot) && $docRoot !== '') {
        $joined = rtrim($docRoot, "\\/") . '/' . ltrim(dirname($scriptDirName), '/\\');
        $docRoots[] = $joined;
    }

    foreach ($docRoots as $root) {
        if (!is_string($root) || $root === '') {
            continue;
        }
        $root = rtrim($root, "\\/");
        if ($root === '') {
            continue;
        }
        $bases[] = $root;
    }

    foreach ($bases as $base) {
        if (!is_string($base) || $base === '') {
            continue;
        }
        $base = rtrim($base, "\\/");
        if ($base === '') {
            continue;
        }
        $candidates[] = $base . '/config.php';
        $candidates[] = $base . '/Config.php';
        $candidates[] = $base . '/config/config.php';
        $candidates[] = $base . '/config/config.phg';
        $candidates[] = $base . '/Config/config.php';
        $candidates[] = $base . '/Config/config.phg';
    }

    $seen = [];
    foreach ($candidates as $candidate) {
        if (!$candidate) {
            continue;
        }
        $normalized = preg_replace('#[\\/]+#', '/', $candidate);
        if (isset($seen[$normalized])) {
            continue;
        }
        $seen[$normalized] = true;
        $checked[] = $normalized;
        if (is_readable($candidate) && !is_dir($candidate)) {
            return [$candidate, dirname($candidate), $checked];
        }
    }

    return [null, null, $checked];
}

function loadCredentials(): array
{
    $apiKey = null;
    $caBundle = null;
    $baseUrl = 'https://api.openai.com/v1';
    $model = 'gpt-4o-mini';
    $timeout = 30;

    [$configPath, $configDir, $checkedPaths] = findConfigFile();

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
                    if (!is_readable($candidate) && $configDir) {
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
            if (isset($loaded['OPENAI_BASE'])) {
                $trimmedBase = trim((string) $loaded['OPENAI_BASE']);
                if ($trimmedBase !== '') {
                    $baseUrl = $trimmedBase;
                }
            }
            if (isset($loaded['OPENAI_MODEL'])) {
                $trimmedModel = trim((string) $loaded['OPENAI_MODEL']);
                if ($trimmedModel !== '') {
                    $model = $trimmedModel;
                }
            }
            if (isset($loaded['TIMEOUT'])) {
                $timeout = max(0, (int) $loaded['TIMEOUT']);
            } elseif (isset($loaded['OPENAI_TIMEOUT'])) {
                $timeout = max(0, (int) $loaded['OPENAI_TIMEOUT']);
            }
        }
    }

    if (!$caBundle && $configDir) {
        $defaultCa = $configDir . '/cacert.pem';
        if (is_readable($defaultCa)) {
            $caBundle = $defaultCa;
        }
    }

    if (!$apiKey) {
        $apiKey = getenv('OPENAI_API_KEY') ?: '';
    }

    $envBase = getenv('OPENAI_BASE');
    if (is_string($envBase) && trim($envBase) !== '') {
        $baseUrl = trim($envBase);
    }

    $envModel = getenv('OPENAI_MODEL');
    if (is_string($envModel) && trim($envModel) !== '') {
        $model = trim($envModel);
    }

    $envTimeout = getenv('OPENAI_TIMEOUT');
    if (is_string($envTimeout) && trim($envTimeout) !== '') {
        $timeout = max(0, (int) $envTimeout);
    }

    $envCa = getenv('OPENAI_CA_BUNDLE');
    if (!$caBundle && is_string($envCa) && trim($envCa) !== '') {
        $candidate = trim($envCa);
        if (!is_readable($candidate) && $configDir) {
            $relative = $configDir . '/' . ltrim($candidate, '/\\');
            if (is_readable($relative)) {
                $candidate = $relative;
            }
        }
        if (is_readable($candidate)) {
            $caBundle = $candidate;
        }
    }

    return [
        'apiKey' => $apiKey ?: '',
        'caBundle' => $caBundle,
        'baseUrl' => $baseUrl,
        'model' => $model,
        'timeout' => $timeout,
        'configPath' => $configPath,
        'checkedPaths' => $checkedPaths,
    ];
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

$credentials = loadCredentials();
if ($credentials['apiKey'] === '') {
    $searched = $credentials['checkedPaths'] ?? [];
    $hint = '';
    if (!empty($credentials['configPath'])) {
        $hint = ' Forsøgte at bruge: ' . $credentials['configPath'] . '.';
    } elseif (!empty($searched)) {
        $preview = array_slice($searched, 0, 5);
        if (count($searched) > 5) {
            $preview[] = '…';
        }
        $hint = ' Søgte i: ' . implode(', ', $preview) . '.';
    }

    respond([
        'error' => 'Serveren mangler OpenAI API-nøglen. Tjek config/config.php (feltet OPENAI_API_KEY) eller miljøvariablen OPENAI_API_KEY.' . $hint
    ], 500);
}

$endpoint = rtrim($credentials['baseUrl'], '/') . '/chat/completions';

$requestBody = [
    'model' => $credentials['model'] !== '' ? $credentials['model'] : 'gpt-4o-mini',
    'temperature' => 0.2,
    'max_tokens' => 280,
    'messages' => [
        [
            'role' => 'system',
            'content' => 'Du er en hjælpsom underviser i subnetting. Svar altid med JSON på formen {"status":"correct|incorrect","feedback":"tekst"}. "feedback" skal være 2-3 korte sætninger på dansk. Hvis svaret er korrekt: ros kort og forklar hvorfor løsningen er rigtig. Hvis svaret er forkert: giv konkrete hints til, hvordan eleven kan finde svaret, fx hvilke formler eller intervaller der skal bruges, men afslør aldrig den præcise adresse eller det nøjagtige tal. Nævn aldrig direkte den forventede løsning.'
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

$ch = curl_init($endpoint);
$curlOptions = [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $credentials['apiKey'],
    ],
    CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE),
];

if ($credentials['caBundle']) {
    $curlOptions[CURLOPT_CAINFO] = $credentials['caBundle'];
}

if ($credentials['timeout'] > 0) {
    $curlOptions[CURLOPT_TIMEOUT] = $credentials['timeout'];
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

if ($status === 'incorrect' && $expected !== '') {
    $pattern = '/' . preg_quote($expected, '/') . '/iu';
    $feedback = preg_replace($pattern, '[skjult]', $feedback);
}

$feedback = trim($feedback);

if ($status === 'correct') {
    if ($feedback === '') {
        $feedback = 'Godt arbejde – svaret matcher løsningen.';
    }
    if (stripos($feedback, 'godt arbejde') !== 0 && stripos($feedback, 'flot arbejde') !== 0) {
        $feedback = 'Godt arbejde! ' . $feedback;
    }
} else {
    if ($feedback === '') {
        $feedback = 'Gennemgå trin for trin, hvordan subnettet beregnes, og dobbelttjek dine mellemregninger.';
    }
    if (stripos($feedback, 'elevens svar') !== 0) {
        $feedback = 'Elevens svar er ikke korrekt endnu. ' . $feedback;
    }
}

respond([
    'status' => $status,
    'feedback' => $feedback !== '' ? $feedback : ($status === 'correct' ? 'Godt arbejde – svaret matcher løsningen.' : 'Svaret matcher ikke helt forventningen. Tjek dine beregninger igen.')
]);
