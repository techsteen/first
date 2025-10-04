<?php
header('Content-Type: application/json; charset=utf-8');

try {
    $configContext = loadConfigContext(__DIR__);
} catch (\RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Konfigurationen kunne ikke indlæses. Kontakt administratoren.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$configValues = $configContext['config'];
$configDir = $configContext['dir'];

if (!defined('CONFIG_DIR_PATH')) {
    define('CONFIG_DIR_PATH', $configDir);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Kun POST er tilladt.'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    sendResponse(['error' => 'Ugyldigt inputformat.'], 400);
}

$action = $input['action'] ?? 'generate';

switch ($action) {
    case 'generate':
        handleGenerate($input);
        break;
    case 'save':
        handleSave($input);
        break;
    case 'load':
        handleLoad();
        break;
    default:
        sendResponse(['error' => 'Ukendt handling.'], 400);
}

function handleGenerate(array $input): void
{
    $allowed = ['topic', 'difficulty', 'count'];
    foreach ($input as $key => $value) {
        if (!in_array($key, $allowed, true)) {
            sendResponse(['error' => 'Ugyldige felter i forespørgslen.'], 400);
        }
    }

    if (!isset($input['topic'], $input['difficulty'], $input['count'])) {
        sendResponse(['error' => 'Felterne topic, difficulty og count er påkrævet.'], 400);
    }

    $topic = $input['topic'];
    $difficulty = (int) $input['difficulty'];
    $count = (int) $input['count'];

    if (!is_string($topic) || $topic === '') {
        sendResponse(['error' => 'Ugyldigt emne.'], 400);
    }

    if ($difficulty < 1 || $difficulty > 5) {
        sendResponse(['error' => 'Sværhedsgrad skal være mellem 1 og 5.'], 400);
    }

    if ($count < 1 || $count > 10) {
        sendResponse(['error' => 'Antal opgaver skal være mellem 1 og 10.'], 400);
    }

    if (!checkRateLimit('generate', 6, 30)) {
        sendResponse(['error' => 'For mange forespørgsler. Vent lidt før du prøver igen.'], 429);
    }

    $templates = loadTemplates();
    if (!$templates) {
        sendResponse(['error' => 'Kunne ikke indlæse templates.json.'], 500);
    }

    $selected = selectTemplates($templates, $topic, (string) $difficulty, $count);
    if (!$selected) {
        sendResponse(['error' => 'Ingen passende skabeloner fundet til valget.'], 400);
    }

    $context = loadConfigContext(__DIR__);
    $apiKey = readApiKey($context['config'], $context['dir']);
    if (!$apiKey) {
        sendResponse(['error' => 'API-nøglen kunne ikke indlæses. Kontakt administratoren.'], 500);
    }

    $systemPrompt = 'Du er en dansk subnetting-underviser der genererer opgaver. Brug kun de givne skabeloner. '
        . 'Returnér JSON med feltet "tasks" som en liste af opgaver.';

    $userPrompt = buildGeneratorPrompt($selected, $topic, $difficulty, $count);

    $payload = [
        'model' => 'gpt-4o-mini',
        'temperature' => 0.2,
        'response_format' => ['type' => 'json_object'],
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt]
        ]
    ];

    $result = callOpenAi($payload, $apiKey, $context['dir']);
    if (isset($result['error'])) {
        sendResponse(['error' => $result['error']], $result['status'] ?? 500);
    }

    $content = $result['content'] ?? '';
    $decoded = json_decode($content, true);
    if (!isset($decoded['tasks']) || !is_array($decoded['tasks'])) {
        sendResponse(['error' => 'AI-svaret havde ikke gyldigt task-format.'], 502);
    }

    $validated = validateGeneratedTasks($decoded['tasks'], $topic, $difficulty);

    logEvent([
        'timestamp' => date('c'),
        'route' => 'generate',
        'task_count' => count($validated)
    ]);

    sendResponse(['tasks' => $validated]);
}

function handleSave(array $input): void
{
    $allowed = ['action', 'tasks'];
    foreach ($input as $key => $value) {
        if (!in_array($key, $allowed, true)) {
            sendResponse(['status' => 'fallback', 'message' => 'Ugyldige felter. Brug lokal gemning.']);
        }
    }
    if (!isset($input['tasks']) || !is_array($input['tasks'])) {
        sendResponse(['status' => 'fallback', 'message' => 'Ingen gyldige opgaver at gemme. Brug lokal gemning.']);
    }

    $path = __DIR__ . '/../data/ai_tasks.json';
    $payload = json_encode(['tasks' => $input['tasks']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = @file_put_contents($path, $payload, LOCK_EX);

    if ($result === false) {
        sendResponse([
            'status' => 'fallback',
            'message' => 'Serveren kunne ikke gemme filen. Sættet skal gemmes lokalt.',
            'storage_mode' => 'localStorage'
        ]);
    }

    logEvent([
        'timestamp' => date('c'),
        'route' => 'save',
        'task_count' => count($input['tasks'])
    ]);

    sendResponse([
        'status' => 'saved',
        'message' => 'Opgavesættet er gemt på serveren.',
        'storage_mode' => 'fil'
    ]);
}

function handleLoad(): void
{
    if (!checkRateLimit('load', 10, 30)) {
        sendResponse(['status' => 'fallback', 'message' => 'For mange forespørgsler. Prøv senere.']);
    }
    $path = __DIR__ . '/../data/ai_tasks.json';
    if (!is_readable($path)) {
        sendResponse([
            'status' => 'fallback',
            'message' => 'Ingen fil fundet på serveren. Forsøg at indlæse lokale sæt.'
        ]);
    }

    $raw = file_get_contents($path);
    if (!$raw) {
        sendResponse([
            'status' => 'fallback',
            'message' => 'Ingen indhold i serverfilen. Brug lokale sæt.'
        ]);
    }

    $decoded = json_decode($raw, true);
    if (!isset($decoded['tasks']) || !is_array($decoded['tasks'])) {
        sendResponse([
            'status' => 'fallback',
            'message' => 'Filens indhold var ikke gyldigt. Brug lokale sæt.'
        ]);
    }

    sendResponse([
        'tasks' => $decoded['tasks'],
        'storage_mode' => 'fil',
        'message' => 'Opgavesæt er hentet fra serveren.'
    ]);

    logEvent([
        'timestamp' => date('c'),
        'route' => 'load',
        'task_count' => count($decoded['tasks'])
    ]);
}

function loadTemplates(): ?array
{
    $path = __DIR__ . '/../assets/templates.json';
    if (!is_readable($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if (!$raw) {
        return null;
    }
    $decoded = json_decode($raw, true);
    return $decoded ?: null;
}

function selectTemplates(array $templates, string $topic, string $difficulty, int $count): array
{
    $pool = $templates['topics'][$topic][$difficulty] ?? [];
    if (!$pool) {
        return [];
    }

    $selected = [];
    $index = 0;
    while (count($selected) < $count) {
        $selected[] = $pool[$index % count($pool)];
        $index++;
        if ($index > 100) {
            break;
        }
    }

    return $selected;
}

function buildGeneratorPrompt(array $selected, string $topic, int $difficulty, int $count): string
{
    $instruction = [
        'topic' => $topic,
        'difficulty' => $difficulty,
        'count' => $count,
        'templates' => $selected,
        'schema' => 'Hver opgave skal have felterne id (valgfri), title, type, difficulty, topic, question, hints (maks 2), answer_schema, rubric, max_attempts_before_solution. '
            . 'Rubric skal indeholde max_score, criteria (liste) og solution. Returnér kun subnettingrelateret indhold.'
    ];

    return 'Brug nedenstående templates til at generere præcis ' . $count . ' opgaver. '
        . 'Hold dig strengt til subnetting. ID må kun starte med AI-. '
        . json_encode($instruction, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function validateGeneratedTasks(array $tasks, string $topic, int $difficulty): array
{
    $validated = [];
    $timestamp = time();
    $usedIds = [];

    foreach ($tasks as $index => $task) {
        if (!is_array($task)) {
            continue;
        }
        $task['topic'] = $topic;
        $task['difficulty'] = $task['difficulty'] ?? $difficulty;
        $task['hints'] = array_slice(array_values($task['hints'] ?? []), 0, 2);
        $task['max_attempts_before_solution'] = $task['max_attempts_before_solution'] ?? 3;
        $task['type'] = $task['type'] ?? 'short_answer';
        $task['title'] = $task['title'] ?? 'AI-opgave';

        $id = $task['id'] ?? null;
        if (!is_string($id) || $id === '' || isset($usedIds[$id])) {
            $id = 'AI-' . $timestamp . '-' . ($index + 1);
        }
        $task['id'] = $id;
        $usedIds[$id] = true;

        if (!isset($task['question'], $task['answer_schema'], $task['rubric'])) {
            continue;
        }

        $validated[] = $task;
    }

    return $validated;
}

function sendResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readApiKey(array $configValues, string $configDir): ?string
{
    if (defined('OPENAI_API_KEY') && OPENAI_API_KEY) {
        return trim(OPENAI_API_KEY);
    }
    if (isset($configValues['OPENAI_API_KEY']) && $configValues['OPENAI_API_KEY']) {
        return trim((string) $configValues['OPENAI_API_KEY']);
    }
    if (defined('OPENAI_KEY_FILE') && OPENAI_KEY_FILE) {
        $path = OPENAI_KEY_FILE;
        if (is_readable($path)) {
            $content = trim((string) file_get_contents($path));
            return $content ?: null;
        }
    }
    if (isset($configValues['OPENAI_KEY_FILE']) && $configValues['OPENAI_KEY_FILE']) {
        $filePath = (string) $configValues['OPENAI_KEY_FILE'];
        if (!preg_match('~^(?:[A-Za-z]:[\\/]|/|\\\\)~', $filePath)) {
            $filePath = rtrim($configDir, '/\\') . '/' . ltrim($filePath, '/\\');
        }
        $resolved = realpath($filePath) ?: $filePath;
        if (is_readable($resolved)) {
            $content = trim((string) file_get_contents($resolved));
            return $content ?: null;
        }
    }
    return null;
}

function callOpenAi(array $payload, string $apiKey, string $configDir): array
{
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    if (!$ch) {
        return ['error' => 'Kunne ikke initialisere forespørgsel.', 'status' => 500];
    }

    $caBundle = findCaBundle($configDir);
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

function findCaBundle(string $configDir): ?string
{
    $files = glob(rtrim($configDir, '/\\') . '/cacert-*.pem');
    return $files ? $files[0] : null;
}

function loadConfigContext(string $startDir): array
{
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }

    $current = $startDir;
    for ($i = 0; $i < 8; $i++) {
        $configPath = rtrim($current, '/\\') . '/Config/config.php';
        if (is_file($configPath)) {
            $configDir = dirname($configPath);
            $loaded = require_once $configPath;
            $configValues = is_array($loaded) ? $loaded : [];

            return $cached = [
                'config' => $configValues,
                'dir' => $configDir,
            ];
        }

        $parent = dirname($current);
        if ($parent === $current) {
            break;
        }
        $current = $parent;
    }

    throw new \RuntimeException('Config ikke fundet');
}
