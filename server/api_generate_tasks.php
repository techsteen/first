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

sendResponse([
    'status' => 'disabled',
    'message' => 'Dynamisk generering er slået fra. Brug assets/ai_prebuilt_tasks.json til forudbyggede opgaver.',
    'source' => 'static'
], 410);

exit;

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
    global $configValues, $configDir;
    $allowed = ['topic', 'difficulty', 'count', 'debug'];
    foreach ($input as $key => $value) {
        if (!in_array($key, $allowed, true)) {
            sendResponse(['error' => 'Ugyldige felter i forespørgslen.'], 400);
        }
    }

    if (!isset($input['topic'], $input['difficulty'])) {
        sendResponse(['error' => 'Felterne topic og difficulty er påkrævet.'], 400);
    }

    $topic = $input['topic'];
    $difficulty = (int) $input['difficulty'];
    $count = isset($input['count']) ? (int) $input['count'] : 1;
    $debug = !empty($input['debug']);

    if (!is_string($topic) || $topic === '') {
        sendResponse(['error' => 'Ugyldigt emne.'], 400);
    }

    if ($difficulty < 1 || $difficulty > 5) {
        sendResponse(['error' => 'Sværhedsgrad skal være mellem 1 og 5.'], 400);
    }

    $count = 1;

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

    $apiKey = readApiKey($configValues, $configDir);
    if (!$apiKey) {
        sendResponse(['error' => 'API-nøglen kunne ikke indlæses. Kontakt administratoren.'], 500);
    }

    $systemPrompt = 'Du er en dansk subnetting-underviser der genererer opgaver. Brug kun de givne skabeloner. '
        . 'Returnér JSON med feltet "tasks" som en liste af opgaver.';

    $userPrompt = buildGeneratorPrompt($selected, $topic, $difficulty, $count);
    $debugPrompt = $debug ? $userPrompt : null;

    $payload = [
        'model' => 'gpt-4o-mini',
        'temperature' => 0.2,
        'response_format' => ['type' => 'json_object'],
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt]
        ]
    ];

    $result = callOpenAi($payload, $apiKey, $configDir);
    if (isset($result['error'])) {
        $fallback = loadCachedTasksFor($topic, $difficulty);
        if ($fallback) {
            logEvent([
                'timestamp' => date('c'),
                'route' => 'generate_cache_hit',
                'task_count' => count($fallback),
                'topic' => $topic,
                'difficulty' => $difficulty
            ]);
            sendResponse([
                'tasks' => $fallback,
                'source' => 'cache',
                'message' => 'AI-tjenesten svarede ikke. Viser det senest gemte sæt for dette emne.'
            ], 200, $debugPrompt);
        }
        sendResponse(['error' => $result['error']], $result['status'] ?? 500, $debugPrompt);
    }

    $content = $result['content'] ?? '';
    $decoded = json_decode($content, true);
    if (!isset($decoded['tasks']) || !is_array($decoded['tasks'])) {
        $fallback = loadCachedTasksFor($topic, $difficulty);
        if ($fallback) {
            logEvent([
                'timestamp' => date('c'),
                'route' => 'generate_cache_hit',
                'task_count' => count($fallback),
                'topic' => $topic,
                'difficulty' => $difficulty
            ]);
            sendResponse([
                'tasks' => $fallback,
                'source' => 'cache',
                'message' => 'AI-svaret kunne ikke læses. Viser seneste fungerende sæt i stedet.'
            ], 200, $debugPrompt);
        }
        sendResponse(['error' => 'AI-svaret havde ikke gyldigt task-format.'], 502, $debugPrompt);
    }

    $validated = validateGeneratedTasks($decoded['tasks'], $topic, $difficulty);

    if (!count($validated)) {
        $manualTasks = buildTasksFromTemplates($selected, $topic, $difficulty);
        if (count($manualTasks)) {
            $validated = validateGeneratedTasks($manualTasks, $topic, $difficulty);
        }
    }

    if (!count($validated)) {
        $fallback = loadCachedTasksFor($topic, $difficulty);
        if ($fallback) {
            logEvent([
                'timestamp' => date('c'),
                'route' => 'generate_cache_hit',
                'task_count' => count($fallback),
                'topic' => $topic,
                'difficulty' => $difficulty
            ]);
            sendResponse([
                'tasks' => $fallback,
                'source' => 'cache',
                'message' => 'AI-svaret indeholdt ingen gyldige opgaver. Viser et tidligere sæt.'
            ], 200, $debugPrompt);
        }
        sendResponse(['error' => 'AI-svaret indeholdt ingen gyldige opgaver.'], 502, $debugPrompt);
    }

    cacheGeneratedTasks($topic, $difficulty, $validated);

    $logRoute = (isset($manualTasks) && count($manualTasks)) ? 'generate_template' : 'generate';

    logEvent([
        'timestamp' => date('c'),
        'route' => $logRoute,
        'task_count' => count($validated),
        'topic' => $topic,
        'difficulty' => $difficulty
    ]);

    $response = [
        'tasks' => $validated,
        'source' => 'live'
    ];

    if (isset($manualTasks) && count($manualTasks)) {
        $response['source'] = 'template';
        $response['message'] = 'AI-svaret kunne ikke bruges, så opgaven er bygget direkte ud fra skabelonen.';
    }

    sendResponse($response, 200, $debugPrompt);
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

        if (!isset($task['question']) || trim((string) $task['question']) === '') {
            continue;
        }

        if (!isset($task['answer_schema']['expected']) || !is_array($task['answer_schema']['expected'])) {
            continue;
        }

        if ($task['type'] === 'fill_in_table') {
            $tables = [];
            if (isset($task['table'])) {
                $tables = is_array($task['table']) ? $task['table'] : [$task['table']];
            }
            if (!count($tables)) {
                continue;
            }

            if ($topic === 'subnetting') {
                $subnetTable = null;
                foreach ($tables as $tableCandidate) {
                    $title = isset($tableCandidate['title']) ? strtolower((string) $tableCandidate['title']) : '';
                    if (strpos($title, 'delnet') !== false) {
                        $subnetTable = $tableCandidate;
                        break;
                    }
                }
                if (!$subnetTable) {
                    continue;
                }
                $rows = $subnetTable['rows'] ?? [];
                if (!is_array($rows) || count($rows) < 4) {
                    continue;
                }
            }

            $task['table'] = $tables;
        }

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

function buildTasksFromTemplates(array $templates, string $topic, int $difficulty): array
{
    $built = [];
    foreach ($templates as $index => $template) {
        if (!is_array($template)) {
            continue;
        }

        $type = $template['type'] ?? 'short_answer';

        if ($topic === 'subnetting' && $type === 'fill_in_table') {
            $task = buildSubnetPlanTaskFromTemplate($template, $index, $difficulty);
            if ($task) {
                $built[] = $task;
            }
        }
    }

    return $built;
}

function buildSubnetPlanTaskFromTemplate(array $template, int $index, int $difficulty): ?array
{
    $variables = $template['variables'] ?? [];
    $scenarios = $variables['scenarios'] ?? [];
    if (!is_array($scenarios) || !count($scenarios)) {
        return null;
    }

    $scenario = $scenarios[$index % count($scenarios)];
    $network = $scenario['network'] ?? null;
    $class = $scenario['class'] ?? null;
    $borrowedBits = $scenario['borrowed_bits'] ?? null;
    $subnetMask = $scenario['subnet_mask'] ?? null;
    $hostsPerSubnet = $scenario['hosts_per_subnet'] ?? null;
    $subnetCount = $scenario['subnet_count'] ?? null;
    $tableSubnets = $scenario['table_subnets'] ?? [];

    if (!$network || !$class || !$subnetMask || !$hostsPerSubnet || !$subnetCount || !is_array($tableSubnets) || count($tableSubnets) < 4) {
        return null;
    }

    $title = 'Subnetplanlægning af klasse ' . strtoupper((string) $class) . ' netværk';
    $question = sprintf(
        'Du er netværksadministrator for %s. Del netværket op i %d lige store subnet og udfyld tabellerne med netadresse, broadcast og brugbare værter.',
        $network,
        (int) $subnetCount
    );

    $summaryRows = [
        [
            ['value' => 'Basenetværk', 'editable' => false],
            ['value' => $network, 'editable' => false]
        ],
        [
            ['value' => 'Netværksklasse', 'editable' => false],
            ['value' => '', 'editable' => true, 'placeholder' => 'fx Klasse ' . strtoupper((string) $class)]
        ],
        [
            ['value' => 'Antal lånte bits', 'editable' => false],
            ['value' => '', 'editable' => true, 'placeholder' => 'fx ' . (int) $borrowedBits]
        ],
        [
            ['value' => 'Subnetmaske', 'editable' => false],
            ['value' => '', 'editable' => true, 'placeholder' => 'fx ' . $subnetMask]
        ],
        [
            ['value' => 'Brugbare værter pr. delnet', 'editable' => false],
            ['value' => '', 'editable' => true, 'placeholder' => 'fx ' . (int) $hostsPerSubnet]
        ],
        [
            ['value' => 'Antal subnet', 'editable' => false],
            ['value' => '', 'editable' => true, 'placeholder' => 'fx ' . (int) $subnetCount]
        ]
    ];

    $tableRows = [];
    $expected = [];

    $expected[] = 'Klasse ' . strtoupper((string) $class);
    $expected[] = (string) $borrowedBits;
    $expected[] = $subnetMask;
    $expected[] = (string) $hostsPerSubnet;
    $expected[] = (string) $subnetCount;

    foreach ($tableSubnets as $subnet) {
        $label = $subnet['label'] ?? null;
        $net = $subnet['network'] ?? null;
        $broadcast = $subnet['broadcast'] ?? null;
        $firstHost = $subnet['first_host'] ?? null;
        $lastHost = $subnet['last_host'] ?? null;

        if (!$label || !$net || !$broadcast || !$firstHost || !$lastHost) {
            continue;
        }

        $tableRows[] = [
            ['value' => $label, 'editable' => false],
            ['value' => '', 'editable' => true, 'placeholder' => $net],
            ['value' => '', 'editable' => true, 'placeholder' => $broadcast],
            ['value' => '', 'editable' => true, 'placeholder' => $firstHost . '-' . $lastHost]
        ];

        $expected[] = $net;
        $expected[] = $broadcast;
        $expected[] = $firstHost . '-' . $lastHost;
    }

    if (count($tableRows) < 4) {
        return null;
    }

    $hints = [
        sprintf('Start med at beregne hvor mange bits der skal lånes fra hostdelen for at få %d delnet.', (int) $subnetCount),
        sprintf('Kontrollér at hvert delnet giver %d brugbare værter og at net- og broadcastadresserne følger blokstørrelsen.', (int) $hostsPerSubnet)
    ];

    $rubric = [
        'max_score' => 1,
        'criteria' => [
            'Alle opsummeringsfelter skal udfyldes korrekt ud fra scenariet.',
            'Hvert delnet skal have den rigtige netadresse, broadcastadresse og interval af brugbare værter.'
        ],
        'solution' => sprintf(
            'Klasse %s-nettet %s låner %d bit og bruger masken %s. Hvert delnet giver %d brugbare værter. Delnettene udfyldes som angivet i tabellen.',
            strtoupper((string) $class),
            $network,
            (int) $borrowedBits,
            $subnetMask,
            (int) $hostsPerSubnet
        )
    ];

    return [
        'title' => $title,
        'type' => 'fill_in_table',
        'difficulty' => $template['difficulty'] ?? $difficulty,
        'topic' => 'subnetting',
        'question' => $question,
        'table' => [
            [
                'title' => 'Opsummering',
                'headers' => ['Felt', 'Svar'],
                'rows' => $summaryRows
            ],
            [
                'title' => 'Delnetoversigt',
                'headers' => ['Delnet', 'Netadresse', 'Broadcastadresse', 'Brugbart værtsinterval'],
                'rows' => $tableRows
            ]
        ],
        'hints' => $hints,
        'answer_schema' => [
            'expected' => $expected
        ],
        'rubric' => $rubric,
        'max_attempts_before_solution' => 3
    ];
}

function sendResponse(array $data, int $status = 200, ?string $debugPrompt = null): void
{
    if ($debugPrompt !== null && !isset($data['debug_prompt'])) {
        $data['debug_prompt'] = $debugPrompt;
    }
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

function cacheGeneratedTasks(string $topic, int $difficulty, array $tasks): void
{
    $path = __DIR__ . '/../data/ai_task_cache.json';
    $payload = [
        'tasks' => $tasks,
        'cached_at' => date('c')
    ];

    $all = [];
    if (is_file($path)) {
        $raw = file_get_contents($path);
        $decoded = $raw ? json_decode($raw, true) : null;
        if (is_array($decoded)) {
            $all = $decoded;
        }
    }

    if (!isset($all[$topic])) {
        $all[$topic] = [];
    }

    $all[$topic][(string) $difficulty] = $payload;

    @file_put_contents(
        $path,
        json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
}

function loadCachedTasksFor(string $topic, int $difficulty): ?array
{
    $path = __DIR__ . '/../data/ai_task_cache.json';
    if (!is_readable($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if (!$raw) {
        return null;
    }
    $decoded = json_decode($raw, true);
    if (!isset($decoded[$topic][(string) $difficulty]['tasks'])) {
        return null;
    }
    $tasks = $decoded[$topic][(string) $difficulty]['tasks'];
    return is_array($tasks) ? $tasks : null;
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
