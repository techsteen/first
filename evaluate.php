<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$rawInput = file_get_contents('php://input');
if ($rawInput === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Kunne ikke læse forespørgslen.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($rawInput, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldigt JSON-format.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$solution = trim((string)($payload['solution'] ?? ''));
if ($solution === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Der mangler kode at vurdere.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$taskTitle = trim((string)($payload['taskTitle'] ?? ''));
$taskDescription = trim((string)($payload['taskDescription'] ?? ''));
$pseudocode = trim((string)($payload['pseudocode'] ?? ''));
$language = trim((string)($payload['language'] ?? ''));

$apiKey = null;
$caBundle = null;
$configDir = __DIR__ . '/config';
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

if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Serveren mangler OpenAI API-nøglen.'], JSON_UNESCAPED_UNICODE);
    exit;
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
    http_response_code(502);
    echo json_encode(['error' => $errorMessage], JSON_UNESCAPED_UNICODE);
    exit;
}

$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$decoded = json_decode($response, true);
if ($statusCode >= 400) {
    $message = is_array($decoded) ? ($decoded['error']['message'] ?? 'OpenAI returnerede en fejl.') : 'OpenAI returnerede en fejl.';
    http_response_code($statusCode);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode(['error' => 'Uventet svar fra OpenAI.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$feedback = trim((string)($decoded['choices'][0]['message']['content'] ?? ''));
if ($feedback === '') {
    http_response_code(502);
    echo json_encode(['error' => 'OpenAI gav ikke noget indhold i svaret.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['feedback' => $feedback], JSON_UNESCAPED_UNICODE);
