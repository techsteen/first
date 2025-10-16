<?php
declare(strict_types=1);

require_once __DIR__ . '/feed_config.php';

/**
 * @return array{items:array<int,array{title:string,summary:string,url:string,source?:string,published_at?:string,tags?:array<int,string>}>}|null
 */
function generateDigestFromPage(string $url, string $content, DateTimeZone $timezone, array &$errors): ?array
{
    $apiKey = getenv('OPENAI_API_KEY');
    if ($apiKey === false || $apiKey === '') {
        $errors[] = 'OpenAI API-nøglen er ikke sat på serveren. Tilføj den som en miljøvariabel (OPENAI_API_KEY).';
        return null;
    }

    $now = new DateTimeImmutable('now', $timezone);
    $systemPrompt = 'Du er en assistent der udtrækker nyhedspunkter fra en HTML-side. '
        . 'Returnér et JSON-objekt med feltet "items" (liste). '
        . 'Hvert element skal have mindst title, summary, url. '
        . 'Medtag kilde-navn hvis det kan findes, og publiceringsdato hvis den er tilgængelig som ISO-8601. '
        . 'Filtrer artikler, så kun indhold publiceret inden for de seneste 2 døgn fra "current_time" bevares. '
        . 'Hvis ingen datoer findes, vælg de vigtigste 5 punkter.';

    $userPrompt = sprintf(
        "current_time: %s\nsource_url: %s\n---\n%s",
        $now->format(DateTimeInterface::ATOM),
        $url,
        trim($content)
    );

    $payload = [
        'model' => 'gpt-4.1-mini',
        'response_format' => ['type' => 'json_object'],
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
        'temperature' => 0.2,
        'max_output_tokens' => 600,
    ];

    $jsonPayload = json_encode($payload, JSON_THROW_ON_ERROR);

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    if ($ch === false) {
        $errors[] = 'Kunne ikke initialisere forbindelsen til OpenAI.';
        return null;
    }

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        $errors[] = 'OpenAI API-kaldet fejlede: ' . curl_error($ch);
        curl_close($ch);
        return null;
    }

    $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        $errors[] = 'OpenAI API returnerede en fejl (status ' . $statusCode . ').';
        return null;
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        $errors[] = 'Kunne ikke læse svaret fra OpenAI.';
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
