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

function cleanPath($path)
{
    return rtrim(str_replace('\\', '/', (string) $path), '/');
}

function candidateConfigFiles()
{
    $fileCandidates = array();
    $directoryCandidates = array();

    $fileHints = array('OPENAI_CONFIG_PATH', 'CONFIG_FILE');
    foreach ($fileHints as $envVar) {
        $value = getenv($envVar);
        if (is_string($value) && $value !== '') {
            $fileCandidates[] = $value;
        }
    }

    $dirHints = array('OPENAI_CONFIG_DIR', 'CONFIG_DIR');
    foreach ($dirHints as $envVar) {
        $value = getenv($envVar);
        if (is_string($value) && $value !== '') {
            $directoryCandidates[] = cleanPath($value);
        }
    }

    $roots = array(
        __DIR__,
        dirname(__DIR__),
        dirname(__DIR__, 2),
        dirname(__DIR__, 3)
    );
    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        $roots[] = $_SERVER['DOCUMENT_ROOT'];
    }

    $roots = array_filter(array_map(function ($root) {
        if ($root === false || $root === null) {
            return null;
        }
        return cleanPath($root);
    }, $roots));

    $fileNames = array('config.php', 'Config.php', 'openai.php', 'settings.php', 'credentials.php');
    $dirNames = array('config', 'Config');

    foreach ($roots as $root) {
        foreach ($fileNames as $fileName) {
            $fileCandidates[] = $root . '/' . $fileName;
        }
        foreach ($dirNames as $dirName) {
            $directoryCandidates[] = $root . '/' . $dirName;
            foreach ($fileNames as $fileName) {
                $fileCandidates[] = $root . '/' . $dirName . '/' . $fileName;
            }
        }
    }

    $directories = array();
    foreach ($directoryCandidates as $dir) {
        if (!is_string($dir) || $dir === '') {
            continue;
        }
        $dir = cleanPath($dir);
        if (!is_dir($dir)) {
            continue;
        }
        $directories[] = $dir;
    }

    foreach ($directories as $dir) {
        foreach ($fileNames as $fileName) {
            $fileCandidates[] = $dir . '/' . $fileName;
        }
    }

    $unique = array();
    $result = array();
    foreach ($fileCandidates as $file) {
        if (!is_string($file) || $file === '') {
            continue;
        }
        $file = cleanPath($file);
        if (isset($unique[$file])) {
            continue;
        }
        $unique[$file] = true;
        $result[] = $file;
    }

    return $result;
}

function resolveConfigValue(array $config, array $keys)
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $config) && $config[$key] !== '' && $config[$key] !== null) {
            return $config[$key];
        }
    }

    $sectionNames = array('openai', 'OPENAI');
    foreach ($sectionNames as $sectionName) {
        if (!isset($config[$sectionName]) || !is_array($config[$sectionName])) {
            continue;
        }
        $section = $config[$sectionName];
        $sectionLower = array_change_key_case($section, CASE_LOWER);
        foreach ($keys as $key) {
            $normalized = strtolower($key);
            if (array_key_exists($key, $section) && $section[$key] !== null && $section[$key] !== '') {
                return $section[$key];
            }
            if (array_key_exists($normalized, $sectionLower) && $sectionLower[$normalized] !== null && $sectionLower[$normalized] !== '') {
                return $sectionLower[$normalized];
            }
        }
    }

    return null;
}

function findConfigData(array $keyNames)
{
    $paths = candidateConfigFiles();
    $seen = array();
    $fallback = null;

    foreach ($paths as $path) {
        if (!is_file($path)) {
            continue;
        }

        $real = realpath($path) ?: $path;
        if (isset($seen[$real])) {
            continue;
        }
        $seen[$real] = true;

        unset($config, $loaded);
        $loaded = require $path;

        $data = null;
        if (is_array($loaded)) {
            $data = $loaded;
        } elseif (isset($config) && is_array($config)) {
            $data = $config;
        } elseif (isset($GLOBALS['config']) && is_array($GLOBALS['config'])) {
            $data = $GLOBALS['config'];
        }

        if (!is_array($data) || empty($data)) {
            continue;
        }

        $value = resolveConfigValue($data, $keyNames);
        if ($value) {
            return array('data' => $data, 'source' => $real);
        }

        if ($fallback === null) {
            $fallback = array('data' => $data, 'source' => $real);
        }
    }

    return $fallback ?: array('data' => array(), 'source' => null);
}

$keyCandidates = array('OPENAI_API_KEY', 'openai_api_key', 'OPENAI_KEY', 'openai_key');

$configMeta = findConfigData($keyCandidates);
$configData = $configMeta['data'];
$configSource = $configMeta['source'];

$apiKey = resolveConfigValue($configData, $keyCandidates);

if (!$apiKey && defined('OPENAI_API_KEY')) {
    $apiKey = OPENAI_API_KEY;
}

if (!$apiKey) {
    $envKey = getenv('OPENAI_API_KEY');
    if ($envKey) {
        $apiKey = $envKey;
    }
}

if (!$apiKey) {
    if ($configSource) {
        error_log('[ai.php] Konfigurationsfil uden OPENAI_API_KEY: ' . $configSource);
    }
    http_response_code(500);
    echo json_encode(['error' => 'API-nøglen blev ikke fundet. Tilføj OPENAI_API_KEY til config/config.php (eller angiv OPENAI_API_KEY som miljøvariabel).']);
    exit;
}

$model = resolveConfigValue($configData, ['OPENAI_MODEL', 'openai_model'])
    ?? getenv('OPENAI_MODEL')
    ?? 'gpt-4.1-mini';

$baseUrl = resolveConfigValue($configData, ['OPENAI_BASE', 'openai_base'])
    ?? getenv('OPENAI_BASE')
    ?? 'https://api.openai.com/v1';

$timeout = resolveConfigValue($configData, ['TIMEOUT', 'timeout'])
    ?? getenv('OPENAI_TIMEOUT')
    ?? 20;
$timeout = (int) $timeout;
if ($timeout <= 0) {
    $timeout = 20;
}

$caBundle = resolveConfigValue($configData, ['CA_BUNDLE', 'ca_bundle'])
    ?? getenv('OPENAI_CA_BUNDLE')
    ?? null;
if ($caBundle && !is_string($caBundle)) {
    $caBundle = null;
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
    'model' => $model,
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
    $endpoint = rtrim($baseUrl, '/') . '/chat/completions';
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => $timeout
    ]);
    if ($caBundle && is_file($caBundle)) {
        curl_setopt($ch, CURLOPT_CAINFO, $caBundle);
    }
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($response === false) {
        $curlError = curl_error($ch);
        $curlErrno = curl_errno($ch);
        error_log('[ai.php] cURL error ' . $curlErrno . ': ' . $curlError);
        curl_close($ch);
        throw new Exception('Ingen svar fra OpenAI. Se serverlog for detaljer.');
    }
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        error_log('[ai.php] OpenAI HTTP ' . $statusCode . ' response: ' . $response);
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
