<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'Kun POST er tilladt.',
        'next_step' => 'Send din forespørgsel som POST med JSON.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'pass'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) === 0) {
    http_response_code(400);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'Ingen data modtaget.',
        'next_step' => 'Send JSON med elevsvar og forventet løsning.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'pass'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($raw) > 4000) {
    http_response_code(413);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'Forespørgslen er for stor.',
        'next_step' => 'Reducer længden af din tekst.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'pass'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'Ugyldigt JSON-format.',
        'next_step' => 'Send gyldig JSON.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'pass'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

usleep(200000);

include '/stha/_www2/Config/config.php';

if (!isset($OPENAI_API_KEY)) {
    http_response_code(500);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'API-nøgle mangler.',
        'next_step' => 'Kontakt administrator for at konfigurere nøglen.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'pass'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$schema = [
    'name' => 'feedback_schema',
    'schema' => [
        'type' => 'object',
        'properties' => [
            'correct' => ['type' => 'boolean'],
            'score' => ['type' => 'number'],
            'reason' => ['type' => 'string'],
            'next_step' => ['type' => 'string'],
            'detected_skills' => ['type' => 'array', 'items' => ['type' => 'string']],
            'format_ok' => ['type' => 'boolean'],
            'hallucination' => ['type' => 'string', 'enum' => ['pass', 'warn', 'fail']]
        ],
        'required' => ['correct', 'score', 'reason', 'next_step', 'detected_skills', 'format_ok', 'hallucination'],
        'additionalProperties' => false
    ]
];

$messages = [
    [
        'role' => 'system',
        'content' => 'Du er en dansk matematikvejleder. Sammenlign elevens svar med facit og format. Giv kort begrundet feedback og foreslå næste skridt uden at afsløre hele løsningen, hvis der stadig findes ubrugte hints. Returnér kun JSON i det aftalte skema.'
    ],
    [
        'role' => 'user',
        'content' => json_encode([
            'question' => $data['question'] ?? '',
            'studentAnswer' => $data['studentAnswer'] ?? '',
            'expected' => $data['expected'] ?? '',
            'schema' => $data['schema'] ?? new stdClass(),
            'skills' => $data['skills'] ?? [],
            'difficulty' => $data['difficulty'] ?? '',
            'hintsUsed' => $data['hintsUsed'] ?? 0
        ], JSON_UNESCAPED_UNICODE)
    ]
];

$payload = [
    'model' => 'gpt-4o-mini',
    'temperature' => 0.2,
    'response_format' => [
        'type' => 'json_schema',
        'json_schema' => $schema
    ],
    'messages' => $messages,
    'max_output_tokens' => 400
];

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $OPENAI_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_CAINFO => '/stha/_www2/Config/cacert-2025-08-12.pem'
]);

$response = curl_exec($ch);
$error = curl_error($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $status >= 400) {
    http_response_code(502);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'LLM-svaret kunne ikke hentes.' . ($error ? ' Fejl: ' . $error : ''),
        'next_step' => 'Brug den lokale evaluering eller prøv igen senere.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'warn'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$decoded = json_decode($response, true);
$toolOutput = $decoded['output'][0]['content'][0]['text'] ?? null;
$result = json_decode((string) $toolOutput, true);

if (!is_array($result)) {
    http_response_code(502);
    echo json_encode([
        'correct' => false,
        'score' => 0.0,
        'reason' => 'LLM returnerede ikke gyldigt JSON.',
        'next_step' => 'Brug lokale hints og prøv igen.',
        'detected_skills' => [],
        'format_ok' => false,
        'hallucination' => 'warn'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);
