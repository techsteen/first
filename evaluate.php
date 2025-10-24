<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/**
 * Send a JSON response and terminate the script.
 */
function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Decode a JSON string into an associative array.
 */
function decodeJsonPayload(string $raw): array
{
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        respond(['error' => 'Ugyldigt JSON-format.'], 400);
    }

    return $payload;
}

/**
 * Locate the API key and optional CA bundle within the config directory.
 */
function loadCredentials(string $configDir): array
{
    $apiKey = null;
    $caBundle = null;

    $configPath = $configDir . '/config.php';
    if (is_readable($configPath)) {
        $loaded = require $configPath;
        if (is_string($loaded)) {
            $apiKey = trim($loaded);
        } elseif (is_array($loaded)) {
            if (isset($loaded['OPENAI_API_KEY'])) {
                $apiKey = trim((string) $loaded['OPENAI_API_KEY']);
            }
            if (isset($loaded['CA_BUNDLE'])) {
                $caCandidate = trim((string) $loaded['CA_BUNDLE']);
                if ($caCandidate !== '') {
                    if (!is_readable($caCandidate)) {
                        $relativeCandidate = $configDir . '/' . ltrim($caCandidate, '/\\');
                        if (is_readable($relativeCandidate)) {
                            $caCandidate = $relativeCandidate;
                        }
                    }
                    if (is_readable($caCandidate)) {
                        $caBundle = $caCandidate;
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

$rawInput = file_get_contents('php://input');
if ($rawInput === false) {
    respond(['error' => 'Kunne ikke læse forespørgslen.'], 400);
}

$payload = decodeJsonPayload($rawInput);

$solution = trim((string)($payload['solution'] ?? ''));
if ($solution === '') {
    respond(['error' => 'Der mangler kode at vurdere.'], 400);
}

$taskTitle = trim((string)($payload['taskTitle'] ?? ''));
$taskDescription = trim((string)($payload['taskDescription'] ?? ''));
$pseudocode = trim((string)($payload['pseudocode'] ?? ''));
$language = trim((string)($payload['language'] ?? ''));

[$apiKey, $caBundle] = loadCredentials(__DIR__ . '/config');

if ($apiKey === '') {
    respond(['error' => 'Serveren mangler OpenAI API-nøglen.'], 500);
}

$requestBody = [
    'model' => 'gpt-4o-mini',
    'temperature' => 0.2,
    'max_tokens' => 400,
    'messages' => [
        [
            'role' => 'system',
            'content' => 'Du er en hjælpsom underviser. Evaluer studerendes kode og forklar om den følger opgavens pseudokode. Giv aldrig konkrete kodeforslag eller færdige kodeuddrag. Brug beskrivelser, observationer og overordnede anbefalinger.'
        ],
        [
            'role' => 'user',
            'content' => sprintf(
                "Opgave: %s\nBeskrivelse: %s\nPseudokode:\n%s\nSprog valgt: %s\nElevens kode:\n%s",
                $taskTitle,
                $taskDescription,
                $pseudocode,
                $language,
                $solution
            ),
        ],
    ],
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

$feedback = trim((string)($decoded['choices'][0]['message']['content'] ?? ''));
if ($feedback === '') {
    respond(['error' => 'OpenAI gav ikke noget indhold i svaret.'], 502);
}

respond(['feedback' => $feedback]);
