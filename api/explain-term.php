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

$rawInput = file_get_contents('php://input');
if ($rawInput === false) {
    respond(['error' => 'Kunne ikke læse forespørgslen.'], 400);
}

$payload = decodePayload($rawInput);
$term = isset($payload['term']) ? trim((string) $payload['term']) : '';
$context = isset($payload['context']) ? trim((string) $payload['context']) : '';

if ($term === '') {
    respond(['error' => 'Angiv et begreb, der skal forklares.'], 400);
}

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
    'temperature' => 0.35,
    'max_tokens' => 320,
    'messages' => [
        [
            'role' => 'system',
            'content' => 'Du er en engageret IT-underviser på et Grundforløb på Techcollege. Forklar danske elever et fagligt begreb om netværk med venlig tone, korte afsnit og konkrete eksempler. Brug gerne punktopstilling eller små øvelser. Afslut med en opfordring til, hvad eleven kan gøre nu. Giv aldrig eksamenssvar eller fulde facits.'
        ],
        [
            'role' => 'user',
            'content' => sprintf(
                "Begreb: %s\nKontekst: %s\nSkriv på dansk, maks 140 ord.",
                $term,
                $context !== '' ? $context : 'Ingen ekstra kontekst angivet.'
            )
        ]
    ],
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

$explanation = trim((string) ($decoded['choices'][0]['message']['content'] ?? ''));
if ($explanation === '') {
    respond(['error' => 'OpenAI gav ikke noget indhold i svaret.'], 502);
}

respond([
    'explanation' => $explanation,
]);
