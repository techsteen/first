<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Ugyldig JSON']);
    exit;
}

$candidateConfigs = [
    __DIR__ . '/../config/OPENAI_KEY.php',
    __DIR__ . '/../Config/OPENAI_KEY.php',
    __DIR__ . '/../config/config.php',
    __DIR__ . '/../Config/config.php',
    __DIR__ . '/../../config/OPENAI_KEY.php',
    __DIR__ . '/../../Config/OPENAI_KEY.php',
    __DIR__ . '/../../config/config.php',
    __DIR__ . '/../../Config/config.php'
];

$configPath = null;
foreach ($candidateConfigs as $candidate) {
    if (is_file($candidate)) {
        $configPath = $candidate;
        break;
    }
}

if ($configPath) {
    $loaded = require $configPath;
}

$apiKey = null;
if (defined('OPENAI_API_KEY')) {
    $apiKey = OPENAI_API_KEY;
} elseif (isset($loaded) && is_array($loaded)) {
    $apiKey = $loaded['OPENAI_API_KEY']
        ?? $loaded['openai_api_key']
        ?? $loaded['OPENAI_KEY']
        ?? $loaded['openai_key']
        ?? null;
} elseif (isset($config) && is_array($config)) {
    $apiKey = $config['OPENAI_API_KEY']
        ?? $config['openai_api_key']
        ?? $config['OPENAI_KEY']
        ?? $config['openai_key']
        ?? null;
}

if (!$apiKey) {
    $envKey = getenv('OPENAI_API_KEY');
    if ($envKey) {
        $apiKey = $envKey;
    }
}

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'API-nøglen er ikke sat. Placer OPENAI_KEY.php eller config.php med OPENAI_API_KEY i config/ eller Config/, eller angiv miljøvariablen OPENAI_API_KEY.']);
    exit;
}

$executionMode = $input['execution_mode'] ?? 'deterministic';
$schema = $input['output_schema'] ?? null;

$systemPrompt = "Du er en kransimulations-assistent. Du skal altid returnere gyldig JSON som matcher det givne schema. \n" .
    "Hvis execution_mode er 'deterministic', skal feltet timeline være en tom liste. \n" .
    "Hvis execution_mode er 'ai_emulation', skal du generere en realistisk, deterministisk timeline uden tilfældighed. \n" .
    "Tilføj maks 2 korte forklaringer og 2 mikro-hints. \n" .
    "Undgå kodeuddrag og returner kun JSON.";

$userContent = json_encode([
    'execution_mode' => $executionMode,
    'task' => $input['task'] ?? null,
    'student_code_excerpt' => $input['student_code_excerpt'] ?? '',
    'failed_tests' => $input['failed_tests'] ?? [],
    'sim_state' => $input['sim_state'] ?? null,
    'parse_error' => $input['parse_error'] ?? null,
    'output_schema' => $schema
], JSON_PRETTY_PRINT);

$payload = [
    'model' => 'gpt-4.1-mini',
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $userContent]
    ],
    'temperature' => 0,
    'response_format' => [
        'type' => 'json_object'
    ]
];

try {
    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20
    ]);
    $response = curl_exec($ch);
    if ($response === false) {
        throw new Exception('Ingen svar fra OpenAI.');
    }
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        throw new Exception('OpenAI-fejl: ' . $statusCode);
    }

    $data = json_decode($response, true);
    if (!$data) {
        throw new Exception('Ugyldigt svar fra OpenAI.');
    }

    $message = $data['choices'][0]['message']['content'] ?? null;
    if (!$message) {
        throw new Exception('Tomt svar fra modellen.');
    }

    echo $message;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
