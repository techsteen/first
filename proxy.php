<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Kun POST-forespørgsler er tilladt.']);
    exit;
}

$referer = $_SERVER['HTTP_REFERER'] ?? '';
$refererAllowed = false;
foreach ($ALLOWED_REFERERS as $allowed) {
    if ($referer && str_starts_with($referer, $allowed)) {
        $refererAllowed = true;
        break;
    }
}

if (!$refererAllowed) {
    http_response_code(403);
    echo json_encode(['error' => 'Adgang nægtet: ugyldig referer.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldigt inputformat.']);
    exit;
}

$type = $input['type'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'ukendt';

if (!rateLimit($ip)) {
    http_response_code(429);
    echo json_encode(['error' => 'For mange forespørgsler. Vent lidt og prøv igen.']);
    exit;
}

try {
    switch ($type) {
        case 'chat':
            $message = trim((string)($input['message'] ?? ''));
            if ($message === '' || mb_strlen($message) > 300) {
                throw new RuntimeException('Spørgsmålet skal være udfyldt og under 300 tegn.');
            }

            if (!isTopicAllowed($message, $ALLOWED_TOPICS)) {
                echo json_encode(['error' => 'Spørgsmålet ligger uden for sidens fokus. Prøv med et emne om AI, subnetting, programmering eller differentiering.']);
                exit;
            }

            $prompt = buildChatPrompt($message);
            $answer = callOpenAI($prompt, $OPENAI_API_KEY);
            echo json_encode(['answer' => $answer]);
            exit;

        case 'glossary':
            $term = trim((string)($input['term'] ?? ''));
            if ($term === '' || mb_strlen($term) > 60) {
                throw new RuntimeException('Fagordet mangler eller er for langt.');
            }

            $prompt = buildGlossaryPrompt($term);
            $answer = callOpenAI($prompt, $OPENAI_API_KEY);
            echo json_encode(['answer' => $answer]);
            exit;

        default:
            throw new RuntimeException('Ukendt forespørgselstype.');
    }
} catch (RuntimeException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Der opstod en uventet fejl.']);
    exit;
}

function rateLimit(string $ip): bool
{
    $windowSeconds = 60;
    $maxRequests = 20;
    $file = sys_get_temp_dir() . '/ai_teaching_rate_limit.json';
    $now = time();

    $handle = fopen($file, 'c+');
    if ($handle === false) {
        return false;
    }

    try {
        flock($handle, LOCK_EX);
        $contents = stream_get_contents($handle);
        $data = $contents ? json_decode($contents, true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $requests = $data[$ip] ?? [];
        $requests = array_filter($requests, static fn($timestamp) => ($now - (int)$timestamp) < $windowSeconds);

        if (count($requests) >= $maxRequests) {
            return false;
        }

        $requests[] = $now;
        $data[$ip] = array_values($requests);

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($data));
        fflush($handle);
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }

    return true;
}

function isTopicAllowed(string $message, array $allowedTopics): bool
{
    $normalized = mb_strtolower($message);
    foreach ($allowedTopics as $topic) {
        if (str_contains($normalized, mb_strtolower($topic))) {
            return true;
        }
    }
    return false;
}

function buildChatPrompt(string $message): array
{
    $system = 'Du er en dansk undervisningsassistent for GF2 Data-elever. Svar kort, venligt og opmuntrende, og hjælp eleven til selv at tænke videre. Brug maks. 80 ord og fokuser på AI i undervisning, differentiering, subnetting, programmering, netværk og prompting. Afvis andre emner høfligt.';
    return [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $message]
        ],
        'max_tokens' => 220,
        'temperature' => 0.6
    ];
}

function buildGlossaryPrompt(string $term): array
{
    $system = 'Du er en dansk teknisk glossemaskine til GF2 Data. Giv en kort og pædagogisk forklaring på maks. 40 ord. Inkludér ét konkret eksempel eller hverdagssammenligning. Undgå kodeblokke.';
    $user = "Forklar begrebet '{$term}' i sammenhæng med AI-støttet undervisning, netværk eller programmering.";
    return [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $user]
        ],
        'max_tokens' => 160,
        'temperature' => 0.5
    ];
}

function callOpenAI(array $payload, string $apiKey): string
{
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        throw new RuntimeException('Kunne ikke kontakte OpenAI: ' . curl_error($ch));
    }

    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status >= 400) {
        throw new RuntimeException('OpenAI returnerede en fejl.');
    }

    $decoded = json_decode($response, true);
    if (!isset($decoded['choices'][0]['message']['content'])) {
        throw new RuntimeException('Ugyldigt svar fra OpenAI.');
    }

    return trim($decoded['choices'][0]['message']['content']);
}
