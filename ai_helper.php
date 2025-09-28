<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/central_sync.php';
require_once __DIR__ . '/config/openai.php';

try {
    $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldig forespørgsel.']);
    exit;
}

$mode = $input['mode'] ?? '';
$exercise = $input['exercise'] ?? null;

if (!is_array($exercise) || !in_array($mode, ['hint', 'tutorial'], true)) {
    http_response_code(422);
    echo json_encode(['error' => 'Manglende data til AI-forespørgslen.']);
    exit;
}

$question = $exercise['question'] ?? '';
$explanation = $exercise['explanation'] ?? '';
$responseType = $exercise['response_type'] ?? 'numeric';

$systemBase = [
    'role' => 'system',
    'content' => 'Du er en dansk matematik-tutor for elever i udskolingen. Du hjælper med procentregning og svarer pædagogisk.'
];

if ($mode === 'hint') {
    $userPrompt = 'Opgaven lyder: ' . $question . "\n" .
        'Lav et kort hint der støtter eleven uden at afsløre det endelige svar. Brug evt. en lille figur-beskrivelse. Maks 120 ord. Sørg for at stille et spørgsmål til sidst.';
    if ($responseType === 'explanation') {
        $userPrompt .= "\nOpgaven kræver en skriftlig forklaring. Guiden skal hjælpe eleven med at strukturere deres begrundelse.";
    }
    $messages = [
        $systemBase,
        ['role' => 'user', 'content' => $userPrompt],
    ];
} else {
    $userPrompt = 'Eleven arbejder med denne opgave: ' . $question . "\n" .
        'Lav en trinvis tutorial der forklarer teorien bag løsningen. Brug HTML med <ol> og <li> til trin. Indled med et kort overblik (<p>). Afslut med en "Tjek dig selv"-sektion i <ul> med 2 refleksionsspørgsmål. Giv ikke det endelige facit.';
    if ($explanation !== '') {
        $userPrompt .= "\nInkludér centrale begreber fra denne lærernote: " . $explanation . '.';
    }
    if ($responseType === 'explanation') {
        $userPrompt .= "\nEleven skal kunne skrive en forklaring selv til sidst, så læg vægt på argumentation og brug af fagord.";
    }
    $messages = [
        $systemBase,
        ['role' => 'user', 'content' => $userPrompt],
    ];
}

try {
    $content = callOpenAiChat($messages, ['max_tokens' => 700, 'temperature' => $mode === 'hint' ? 0.6 : 0.65]);
    echo json_encode(['content' => $content]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
