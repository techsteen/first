<?php
declare(strict_types=1);

require_once __DIR__ . '/feed_config.php';

function openAIConfigDisplayPath(?string $set = null): string
{
    static $display = 'config/config.php';

    if ($set !== null && $set !== '') {
        $display = $set;
    }

    return $display;
}

/**
 * @return array<int,array{path:string,label:string}>
 */
function openAIConfigCandidates(): array
{
    $projectDir = dirname(__DIR__);
    $candidates = [];
    $seen = [];

    $addCandidate = static function (string $path, string $label) use (&$candidates, &$seen): void {
        $normalised = str_replace('\\', '/', $path);
        if (isset($seen[$normalised])) {
            return;
        }

        $seen[$normalised] = true;
        $candidates[] = ['path' => $path, 'label' => $label];
    };

    $current = $projectDir;
    for ($level = 0; $level <= 4; $level++) {
        $prefix = str_repeat('../', $level);
        $dir = rtrim($current, "\\/");

        foreach (['config', 'Config'] as $folder) {
            $path = $dir . '/' . $folder . '/config.php';
            $label = ($prefix === '' ? '' : $prefix) . $folder . '/config.php';
            $addCandidate($path, $label);
        }

        $next = dirname($current);
        if ($next === '' || $next === $current) {
            break;
        }

        $current = $next;
    }

    return $candidates;
}

/**
 * @return array<int,string>
 */
function getOpenAIConfigPathHints(): array
{
    $candidates = openAIConfigCandidates();
    $labels = [];

    foreach ($candidates as $candidate) {
        $labels[] = $candidate['label'];
    }

    return array_values(array_unique($labels));
}

/**
 * @return array{path:string,label:string}|null
 */
function findOpenAIConfigPath(): ?array
{
    foreach (openAIConfigCandidates() as $candidate) {
        if (is_file($candidate['path'])) {
            return $candidate;
        }
    }

    return null;
}

function getOpenAIConfigHint(): string
{
    $existing = findOpenAIConfigPath();
    if ($existing !== null) {
        return $existing['label'];
    }

    $hints = getOpenAIConfigPathHints();
    if (!empty($hints)) {
        return $hints[0];
    }

    return 'config/config.php';
}

/**
 * @return array<string,mixed>|null
 */
function loadOpenAIConfig(array &$errors): ?array
{
    static $config = null;
    static $attempted = false;

    if ($config !== null) {
        return $config;
    }

    if ($attempted) {
        return null;
    }

    $attempted = true;

    $candidate = findOpenAIConfigPath();
    if ($candidate === null) {
        $hints = getOpenAIConfigPathHints();
        if (!empty($hints)) {
            openAIConfigDisplayPath($hints[0]);
            $errors[] = 'Konfigurationsfilen til OpenAI blev ikke fundet. Placér den f.eks. i: ' . implode(', ', $hints) . '.';
        } else {
            $errors[] = 'Konfigurationsfilen til OpenAI blev ikke fundet.';
        }

        return null;
    }

    $configPath = $candidate['path'];
    $display = $candidate['label'];
    openAIConfigDisplayPath($display);

    $loaded = include $configPath;
    if (!is_array($loaded)) {
        $errors[] = sprintf('Konfigurationsfilen (%s) skal returnere et array med indstillinger.', $display);
        return null;
    }

    $overridePath = dirname(__DIR__) . '/config/config.local.php';
    if (is_file($overridePath)) {
        $override = include $overridePath;
        if (is_array($override)) {
            $loaded = array_merge($loaded, $override);
        } else {
            $errors[] = 'config.local.php blev ignoreret, fordi filen ikke returnerede et array.';
        }
    }

    $required = ['OPENAI_API_KEY', 'OPENAI_MODEL', 'OPENAI_BASE'];
    foreach ($required as $key) {
        if (!array_key_exists($key, $loaded) || trim((string) $loaded[$key]) === '') {
            $errors[] = sprintf('Indstillingen %s mangler i %s.', $key, $display);
            return null;
        }
    }

    $config = $loaded;
    return $config;
}

/**
 * @return array{items:array<int,array{title:string,summary:string,url:string,source?:string,published_at?:string,tags?:array<int,string>}>}|null
 */
function generateDigestFromPage(string $url, string $content, DateTimeZone $timezone, array &$errors): ?array
{
    $connection = resolveOpenAIConnection($errors);
    if ($connection === null) {
        return null;
    }

    $now = new DateTimeImmutable('now', $timezone);
    $systemPrompt = 'Du er en assistent der udtrækker nyhedspunkter fra en HTML-side. '
        . 'Returnér et JSON-objekt med feltet "items" (liste). '
        . 'Hvert element skal have mindst title, summary, url. '
        . 'Medtag kilde-navn hvis det kan findes, og publiceringsdato hvis den er tilgængelig som ISO-8601. '
        . 'Filtrer artikler, så kun indhold publiceret inden for de seneste 2 døgn fra "current_time" bevares. '
        . 'Hvis ingen datoer findes, vælg de vigtigste 5 punkter. '
        . 'Skriv alle titler og resuméer på dansk.';

    $userPrompt = sprintf(
        "current_time: %s\nsource_url: %s\n---\n%s",
        $now->format(DateTimeInterface::ATOM),
        $url,
        trim($content)
    );

    $payload = [
        'response_format' => ['type' => 'json_object'],
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
        'temperature' => 0.2,
        'max_tokens' => 600,
    ];

    $data = callOpenAIChat($connection, $payload, $errors);
    if ($data === null) {
        return null;
    }

    $content = $data['choices'][0]['message']['content'] ?? '';
    if (!is_string($content) || trim($content) === '') {
        $errors[] = 'OpenAI svarede uden indhold.';
        return null;
    }

    $parsed = json_decode($content, true);
    if (!is_array($parsed) || !isset($parsed['items']) || !is_array($parsed['items'])) {
        $errors[] = 'OpenAI svarede i et uventet format.';
        return null;
    }

    $cutoff = $now->sub(new DateInterval('P2D'));
    $items = [];

    foreach ($parsed['items'] as $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = isset($item['title']) ? trim((string) $item['title']) : '';
        $summary = isset($item['summary']) ? trim((string) $item['summary']) : '';
        $link = isset($item['url']) ? trim((string) $item['url']) : '';

        if ($title === '' || $summary === '' || !filter_var($link, FILTER_VALIDATE_URL)) {
            continue;
        }

        $prepared = [
            'title' => $title,
            'summary' => $summary,
            'url' => $link,
        ];

        if (!empty($item['source'])) {
            $prepared['source'] = trim((string) $item['source']);
        }

        if (!empty($item['tags']) && is_array($item['tags'])) {
            $prepared['tags'] = normaliseTags($item['tags']);
        }

        if (!empty($item['published_at'])) {
            $parsedDate = parsePublishedDate((string) $item['published_at'], $timezone);
            if ($parsedDate !== null) {
                if ($parsedDate < $cutoff) {
                    continue;
                }
                $prepared['published_at'] = $parsedDate->format('Y-m-d H:i');
            }
        }

        $items[] = $prepared;
    }

    if (empty($items)) {
        $errors[] = 'Ingen relevante artikler blev fundet i perioden de seneste to dage.';
        return null;
    }

    return ['items' => $items];
}

function parsePublishedDate(string $value, DateTimeZone $timezone): ?DateTimeImmutable
{
    $value = trim($value);
    if ($value === '') {
        return null;
    }

    try {
        $date = new DateTimeImmutable($value, $timezone);
        return $date;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * @return array{apiKey:string,apiBase:string,model:string,timeout:int,caBundle:string}|null
 */
function resolveOpenAIConnection(array &$errors): ?array
{
    static $connection = null;
    static $attempted = false;

    if ($connection !== null) {
        return $connection;
    }

    if ($attempted) {
        return null;
    }

    $attempted = true;

    $configErrors = [];
    $config = loadOpenAIConfig($configErrors);
    if ($config === null) {
        foreach ($configErrors as $configError) {
            $errors[] = $configError;
        }
        return null;
    }

    $displayPath = openAIConfigDisplayPath();

    $apiKey = trim((string) ($config['OPENAI_API_KEY'] ?? ''));
    if ($apiKey === '') {
        $errors[] = sprintf('OpenAI API-nøglen er ikke udfyldt i %s.', $displayPath);
        return null;
    }

    $apiBase = rtrim((string) ($config['OPENAI_BASE'] ?? ''), '/');
    if ($apiBase === '') {
        $errors[] = sprintf('OPENAI_BASE i %s må ikke være tom.', $displayPath);
        return null;
    }

    $model = trim((string) ($config['OPENAI_MODEL'] ?? ''));
    if ($model === '') {
        $errors[] = sprintf('OPENAI_MODEL i %s må ikke være tom.', $displayPath);
        return null;
    }

    $timeout = isset($config['TIMEOUT']) ? (int) $config['TIMEOUT'] : 60;
    if ($timeout <= 0) {
        $timeout = 60;
    }

    $caBundle = isset($config['CA_BUNDLE']) ? (string) $config['CA_BUNDLE'] : '';
    if ($caBundle !== '' && !is_file($caBundle)) {
        $errors[] = 'CA_BUNDLE peger på en fil, der ikke findes. Upload certifikatfilen, eller opdater stien. For nu bruges PHPs standard-certifikat.';
        $caBundle = '';
    }

    $connection = [
        'apiKey' => $apiKey,
        'apiBase' => $apiBase,
        'model' => $model,
        'timeout' => $timeout,
        'caBundle' => $caBundle,
    ];

    return $connection;
}

/**
 * @param array{apiKey:string,apiBase:string,model:string,timeout:int,caBundle:string} $connection
 * @return array<string,mixed>|null
 */
function callOpenAIChat(array $connection, array $payload, array &$errors): ?array
{
    $payload['model'] = $connection['model'];

    try {
        $jsonPayload = json_encode($payload, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        $errors[] = 'Kunne ikke forberede forespørgslen til OpenAI: ' . $exception->getMessage();
        return null;
    }

    $endpoint = $connection['apiBase'] . '/chat/completions';
    $ch = curl_init($endpoint);
    if ($ch === false) {
        $errors[] = 'Kunne ikke initialisere forbindelsen til OpenAI.';
        return null;
    }

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $connection['apiKey'],
    ];

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_TIMEOUT => $connection['timeout'],
    ];

    if ($connection['caBundle'] !== '') {
        $options[CURLOPT_CAINFO] = $connection['caBundle'];
    }

    curl_setopt_array($ch, $options);

    $response = curl_exec($ch);
    if ($response === false) {
        $errors[] = 'OpenAI API-kaldet fejlede: ' . curl_error($ch);
        curl_close($ch);
        return null;
    }

    $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        $decodedError = json_decode($response, true);
        if (is_array($decodedError) && isset($decodedError['error']['message'])) {
            $errors[] = 'OpenAI API returnerede en fejl (status ' . $statusCode . '): ' . trim((string) $decodedError['error']['message']);
        } else {
            $errors[] = 'OpenAI API returnerede en fejl (status ' . $statusCode . ').';
        }
        return null;
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        $errors[] = 'Kunne ikke læse svaret fra OpenAI.';
        return null;
    }

    return $data;
}

/**
 * @return string|null
 */
function fetchPageForDigest(string $url, array &$errors): ?string
{
    $contextOptions = [
        'http' => [
            'timeout' => 8,
            'user_agent' => 'AI-Avisen/1.0 (+https://example.com)',
        ],
        'https' => [
            'timeout' => 8,
            'user_agent' => 'AI-Avisen/1.0 (+https://example.com)',
        ],
    ];

    $context = stream_context_create($contextOptions);
    $raw = @file_get_contents($url, false, $context);

    if ($raw === false) {
        $errors[] = 'Kunne ikke hente siden. Tjek om adressen er korrekt, eller prøv igen senere.';
        return null;
    }

    $encoding = mb_detect_encoding($raw, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true) ?: 'UTF-8';
    $converted = mb_convert_encoding($raw, 'UTF-8', $encoding);

    $text = strip_tags($converted);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $text = preg_replace('/\s+/', ' ', $text);

    if ($text === null) {
        $errors[] = 'Kunne ikke klargøre siden til AI-resumé.';
        return null;
    }

    return mb_substr(trim($text), 0, 12000);
}

/**
 * @param array<int,array{title:string,url:string,source:string,summary:string,tags:array<int,string>,published_at:string,timestamp:int}> $items
 * @return array<int,array{title:string,url:string,source:string,summary:string,tags:array<int,string>,published_at:string,timestamp:int}>
 */
function translateFeedItemsToDanish(array $items, string $feedName, array &$errors): array
{
    static $translationDisabled = false;

    if ($translationDisabled || empty($items)) {
        return $items;
    }

    $connectionErrors = [];
    $connection = resolveOpenAIConnection($connectionErrors);
    if ($connection === null) {
        foreach ($connectionErrors as $error) {
            $errors[] = $error;
        }
        $translationDisabled = true;
        return $items;
    }

    $payloadItems = [];
    foreach ($items as $index => $item) {
        $payloadItems[] = [
            'index' => $index,
            'title' => $item['title'],
            'summary' => $item['summary'],
        ];
    }

    try {
        $encodedItems = json_encode(['items' => $payloadItems], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (JsonException $exception) {
        $errors[] = 'Kunne ikke klargøre tekster til oversættelse: ' . $exception->getMessage();
        $translationDisabled = true;
        return $items;
    }

    $feedLabel = $feedName !== '' ? $feedName : 'ukendt kilde';
    $systemPrompt = 'Du oversætter journalistiske overskrifter og resuméer til dansk. '
        . 'Returnér JSON med feltet "items" som en liste af objekter med index, title og summary. '
        . 'Bevar navne på personer, organisationer og produkter. '
        . 'Oversæt kun teksten; ændr ikke URL’er eller rækkefølgen.';

    $userPrompt = 'Feed: ' . $feedLabel . "\n" . 'Indhold:' . "\n" . $encodedItems;

    $payload = [
        'response_format' => ['type' => 'json_object'],
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
        'temperature' => 0.0,
        'max_tokens' => 800,
    ];

    $responseErrors = [];
    $data = callOpenAIChat($connection, $payload, $responseErrors);
    if ($data === null) {
        foreach ($responseErrors as $error) {
            $errors[] = $error;
        }
        $translationDisabled = true;
        return $items;
    }

    $content = $data['choices'][0]['message']['content'] ?? '';
    if (!is_string($content) || trim($content) === '') {
        $errors[] = 'Oversættelsen fra OpenAI manglede indhold.';
        $translationDisabled = true;
        return $items;
    }

    $decoded = json_decode($content, true);
    if (!is_array($decoded) || !isset($decoded['items']) || !is_array($decoded['items'])) {
        $errors[] = 'Oversættelsen fra OpenAI havde et uventet format.';
        $translationDisabled = true;
        return $items;
    }

    foreach ($decoded['items'] as $translated) {
        if (!is_array($translated) || !isset($translated['index'])) {
            continue;
        }

        $index = (int) $translated['index'];
        if (!isset($items[$index])) {
            continue;
        }

        if (isset($translated['title']) && is_string($translated['title']) && trim($translated['title']) !== '') {
            $items[$index]['title'] = trim($translated['title']);
        }

        if (isset($translated['summary']) && is_string($translated['summary']) && trim($translated['summary']) !== '') {
            $items[$index]['summary'] = trim($translated['summary']);
        }
    }

    return $items;
}
