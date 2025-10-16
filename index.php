<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/feed_config.php';

$timezone = new DateTimeZone('Europe/Copenhagen');
$generatedAt = new DateTimeImmutable('now', $timezone);

$feedConfigPath = __DIR__ . '/data/feeds.json';
$configNotices = [];
$feedConfig = readFeedConfig($feedConfigPath, $configNotices);
$feedSections = normaliseFeedSections($feedConfig, $configNotices);

$feedErrors = $configNotices;
$sections = [];
$allItems = [];
$tagSet = [];

foreach ($feedSections as $sectionTitle => $sectionConfig) {
    $sectionItems = [];

    $feeds = isset($sectionConfig['feeds']) && is_array($sectionConfig['feeds']) ? $sectionConfig['feeds'] : [];

    foreach ($feeds as $feed) {
        $sectionItems = array_merge($sectionItems, fetchFeedItems($feed, $timezone, $feedErrors));
    }

    if (!empty($sectionItems)) {
        usort($sectionItems, static function (array $a, array $b): int {
            return $b['timestamp'] <=> $a['timestamp'];
        });

        if (!empty($sectionConfig['max_items'])) {
            $sectionItems = array_slice($sectionItems, 0, (int) $sectionConfig['max_items']);
        }

        foreach ($sectionItems as $item) {
            foreach ($item['tags'] as $tag) {
                $tagSet[$tag] = true;
            }
        }
    }

    $sections[$sectionTitle] = $sectionItems;
    $allItems = array_merge($allItems, $sectionItems);
}

$topStories = [];
$usingFallback = false;

if (!empty($allItems)) {
    $unique = [];
    foreach ($allItems as $item) {
        $key = normalizeUrl($item['url']);
        if (isset($unique[$key])) {
            continue;
        }
        $unique[$key] = $item;
    }

    $allItemsSorted = array_values($unique);
    usort($allItemsSorted, static function (array $a, array $b): int {
        return $b['timestamp'] <=> $a['timestamp'];
    });

    $topStories = array_slice($allItemsSorted, 0, 4);
} else {
    $usingFallback = true;
    [$topStories, $sections, $tagSet] = loadFallbackContent($timezone);
}

$tags = array_keys($tagSet);
sort($tags);

/**
 * @param array{name?:string,url?:string,tags?:array<int,string>,limit?:int} $feed
 * @return array<int,array{title:string,url:string,source:string,summary:string,tags:array<int,string>,published_at:string,timestamp:int}>
 */
function fetchFeedItems(array $feed, DateTimeZone $timezone, array &$errors): array
{
    $url = $feed['url'] ?? '';
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        $errors[] = sprintf('Feed URL mangler eller er ugyldig (%s).', $url ?: 'ukendt');
        return [];
    }

    $limit = isset($feed['limit']) ? (int) $feed['limit'] : 5;
    if ($limit <= 0) {
        $limit = 5;
    }

    $contextOptions = [
        'http' => [
            'timeout' => 6,
            'user_agent' => 'AI-Avisen/1.0 (+https://aiavisen.example)',
            'header' => "Accept: application/rss+xml, application/xml;q=0.9, */*;q=0.8\r\n",
        ],
        'https' => [
            'timeout' => 6,
            'user_agent' => 'AI-Avisen/1.0 (+https://aiavisen.example)',
            'header' => "Accept: application/rss+xml, application/xml;q=0.9, */*;q=0.8\r\n",
        ],
    ];

    $context = stream_context_create($contextOptions);
    $raw = @file_get_contents($url, false, $context);

    if ($raw === false) {
        $errors[] = sprintf('Kunne ikke hente feedet "%s".', $feed['name'] ?? $url);
        return [];
    }

    $previous = libxml_use_internal_errors(true);
    $xml = simplexml_load_string($raw, 'SimpleXMLElement', LIBXML_NOCDATA);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    if ($xml === false) {
        $errors[] = sprintf('Kunne ikke parse feedet "%s".', $feed['name'] ?? $url);
        return [];
    }

    $items = [];
    $feedTitle = trim((string) ($feed['name'] ?? ''));

    if (isset($xml->channel)) {
        if ($feedTitle === '' && isset($xml->channel->title)) {
            $feedTitle = trim((string) $xml->channel->title);
        }

        foreach ($xml->channel->item as $item) {
            if (count($items) >= $limit) {
                break;
            }

            $title = trim((string) $item->title);
            $link = trim((string) $item->link);

            if ($title === '' || !filter_var($link, FILTER_VALIDATE_URL)) {
                continue;
            }

            $summary = extractSummary($item);
            $published = (string) ($item->pubDate ?? $item->children('http://purl.org/dc/elements/1.1/')->date ?? '');
            $publishedAt = normaliseDate($published, $timezone);

            $itemTags = $feed['tags'] ?? [];
            if (isset($item->category)) {
                foreach ($item->category as $category) {
                    $itemTags[] = (string) $category;
                }
            }
            $itemTags = normaliseTags($itemTags);

            if (empty($itemTags)) {
                $itemTags = ['ai'];
            }

            $items[] = [
                'title' => $title,
                'url' => $link,
                'source' => $feedTitle !== '' ? $feedTitle : hostFromUrl($link),
                'summary' => $summary,
                'tags' => $itemTags,
                'published_at' => $publishedAt->format('Y-m-d H:i:s'),
                'timestamp' => $publishedAt->getTimestamp(),
            ];
        }
    } elseif (isset($xml->entry)) {
        if ($feedTitle === '' && isset($xml->title)) {
            $feedTitle = trim((string) $xml->title);
        }

        foreach ($xml->entry as $entry) {
            if (count($items) >= $limit) {
                break;
            }

            $title = trim((string) $entry->title);
            if ($title === '') {
                continue;
            }

            $link = '';
            foreach ($entry->link as $linkNode) {
                $attributes = $linkNode->attributes();
                $rel = isset($attributes['rel']) ? (string) $attributes['rel'] : 'alternate';
                if ($rel === 'alternate' && isset($attributes['href'])) {
                    $link = trim((string) $attributes['href']);
                    break;
                }
            }

            if ($link === '' || !filter_var($link, FILTER_VALIDATE_URL)) {
                continue;
            }

            $summarySource = (string) ($entry->summary ?? $entry->content ?? '');
            $summary = truncateText($summarySource);
            $published = (string) ($entry->updated ?? $entry->published ?? '');
            $publishedAt = normaliseDate($published, $timezone);

            $itemTags = $feed['tags'] ?? [];
            if (isset($entry->category)) {
                foreach ($entry->category as $category) {
                    $attributes = $category->attributes();
                    if (isset($attributes['term'])) {
                        $itemTags[] = (string) $attributes['term'];
                    } else {
                        $itemTags[] = (string) $category;
                    }
                }
            }
            $itemTags = normaliseTags($itemTags);

            if (empty($itemTags)) {
                $itemTags = ['ai'];
            }

            $items[] = [
                'title' => $title,
                'url' => $link,
                'source' => $feedTitle !== '' ? $feedTitle : hostFromUrl($link),
                'summary' => $summary,
                'tags' => $itemTags,
                'published_at' => $publishedAt->format('Y-m-d H:i:s'),
                'timestamp' => $publishedAt->getTimestamp(),
            ];
        }
    }

    return $items;
}

function extractSummary(SimpleXMLElement $item): string
{
    $contentNamespace = 'http://purl.org/rss/1.0/modules/content/';
    $content = $item->children($contentNamespace);
    if (!empty($content->encoded)) {
        return truncateText((string) $content->encoded);
    }

    if (isset($item->description)) {
        return truncateText((string) $item->description);
    }

    return 'Ingen kort beskrivelse fra kilden endnu.';
}

function truncateText(string $text, int $maxLength = 280): string
{
    $text = trim(preg_replace('/\s+/u', ' ', strip_tags($text)));

    if ($text === '') {
        return 'Ingen kort beskrivelse fra kilden endnu.';
    }

    $length = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);

    if ($length <= $maxLength) {
        return $text;
    }

    $truncated = function_exists('mb_substr')
        ? mb_substr($text, 0, $maxLength - 1, 'UTF-8')
        : substr($text, 0, $maxLength - 1);

    $lastSpace = function_exists('mb_strrpos')
        ? mb_strrpos($truncated, ' ', 0, 'UTF-8')
        : strrpos($truncated, ' ');

    if ($lastSpace !== false) {
        $truncated = function_exists('mb_substr')
            ? mb_substr($truncated, 0, $lastSpace, 'UTF-8')
            : substr($truncated, 0, $lastSpace);
    }

    return rtrim($truncated) . '…';
}

function normaliseDate(string $value, DateTimeZone $timezone): DateTimeImmutable
{
    if ($value !== '') {
        try {
            $date = new DateTimeImmutable($value);
            return $date->setTimezone($timezone);
        } catch (Exception $exception) {
            // Fald tilbage til nu nedenfor.
        }
    }

    return new DateTimeImmutable('now', $timezone);
}

/**
 * @param array<int,string> $tags
 * @return array<int,string>
 */
function normaliseTags(array $tags): array
{
    $normalised = [];

    foreach ($tags as $tag) {
        $clean = trim((string) $tag);
        if ($clean === '') {
            continue;
        }

        $clean = function_exists('mb_strtolower') ? mb_strtolower($clean, 'UTF-8') : strtolower($clean);
        $clean = preg_replace('/[^a-z0-9æøåäöü\-\s]/u', '', $clean);
        $clean = preg_replace('/\s+/u', '-', $clean);

        if ($clean === '') {
            continue;
        }

        $normalised[$clean] = true;
    }

    return array_keys($normalised);
}

function hostFromUrl(string $url): string
{
    $host = parse_url($url, PHP_URL_HOST) ?? $url;
    return $host !== null ? $host : $url;
}

function normalizeUrl(string $url): string
{
    $parts = parse_url($url);
    if ($parts === false) {
        return $url;
    }

    $scheme = strtolower($parts['scheme'] ?? 'https');
    $host = strtolower($parts['host'] ?? '');
    $path = $parts['path'] ?? '';
    $query = isset($parts['query']) ? '?' . $parts['query'] : '';

    return $scheme . '://' . $host . $path . $query;
}

/**
 * @return array{0:array<int,array<string,mixed>>,1:array<string,array<int,array<string,mixed>>>,2:array<string,bool>}
 */
function loadFallbackContent(DateTimeZone $timezone): array
{
    $now = time();

    $topStories = [
        createFallbackEntry(
            'EU lancerer ny milliardfond til ansvarlig AI-forskning',
            'EU Commission',
            'https://example.com/eu-fond',
            'Fonden skal accelerere europæiske pilotprojekter med fokus på bæredygtig AI og nye datainfrastrukturer.',
            ['politik', 'forskning', 'eu'],
            $timezone,
            0,
            $now
        ),
        createFallbackEntry(
            'Open source-initiativ løfter sløret for dansk sprogbank',
            'AI Nordic Lab',
            'https://example.com/sprogbank',
            'Teamet bag LLM-da offentliggør en ny sprogbank til udvikling af danske sprogmodeller med åbne licenser.',
            ['open-source', 'dansk', 'llm'],
            $timezone,
            3600,
            $now
        ),
        createFallbackEntry(
            'VC-investorer rykker penge fra chatbots til AI-værktøjer',
            'Nordic Tech News',
            'https://example.com/vc-investorer',
            'Ny rapport viser stigende interesse i agent-understøttede workflows i SaaS-sektoren.',
            ['investering', 'saas'],
            $timezone,
            7200,
            $now
        ),
        createFallbackEntry(
            'Kommunerne tester beslutningsstøtte til velfærd',
            'Kommunernes Landsforening',
            'https://example.com/kommuner',
            'Tre pilotkommuner afprøver AI-opsummeringer af borgerhenvendelser og mødemateriale.',
            ['offentlig-sektor', 'implementering'],
            $timezone,
            10800,
            $now
        ),
    ];

    $sections = [
        'Trends' => [
            createFallbackEntry(
                'AI-chatbots bliver del af kundeservice-samarbejde',
                'CX Weekly',
                'https://example.com/cx-weekly',
                'Partnerskab mellem Zendesk og to nordiske scaleups skal give fælles FAQ-videnbase.',
                ['kundeservice', 'partnerskab'],
                $timezone,
                14400,
                $now
            ),
        ],
        'Værktøjer' => [
            createFallbackEntry(
                'Automatisér opsummeringer i Slack på 20 minutter',
                'Ops Platform Blog',
                'https://example.com/slack-guide',
                'Trin-for-trin guide til at forbinde webhooks og OpenAI Assistants i Slack-kanaler.',
                ['workflow', 'guide'],
                $timezone,
                18000,
                $now
            ),
        ],
        'Forskning' => [
            createFallbackEntry(
                'Papir: “Robust Danish Named Entity Recognition”',
                'arXiv',
                'https://example.com/ner-paper',
                'Nyt studie viser hvordan kombinationen af aktive læringsstrategier og humans-in-the-loop hæver kvaliteten.',
                ['forskning', 'nlp'],
                $timezone,
                21600,
                $now
            ),
        ],
        'Video & Podcasts' => [
            createFallbackEntry(
                'Podcast: “Dataetikkens nye dilemmaer”',
                'TechTorsdag',
                'https://example.com/dataetik',
                'Samtale med jurist Ida Møller om, hvordan AI-aktører bør dele dataindsigt med offentligheden.',
                ['podcast', 'etik'],
                $timezone,
                25200,
                $now
            ),
        ],
    ];

    $tagSet = [];
    $merged = $topStories;
    foreach ($sections as $entries) {
        $merged = array_merge($merged, $entries);
    }

    foreach ($merged as $item) {
        foreach ($item['tags'] as $tag) {
            $tagSet[$tag] = true;
        }
    }

    return [$topStories, $sections, $tagSet];
}

/**
 * @param array<int,string> $tags
 */
function createFallbackEntry(
    string $title,
    string $source,
    string $url,
    string $summary,
    array $tags,
    DateTimeZone $timezone,
    int $offsetSeconds,
    int $now
): array {
    if ($offsetSeconds < 0) {
        $offsetSeconds = 0;
    }

    $timestamp = $now - $offsetSeconds;
    $published = (new DateTimeImmutable('@' . $timestamp))->setTimezone($timezone);

    $normalisedTags = normaliseTags($tags);

    if (empty($normalisedTags)) {
        $normalisedTags = ['ai'];
    }

    return [
        'title' => $title,
        'source' => $source,
        'url' => $url,
        'summary' => $summary,
        'tags' => $normalisedTags,
        'published_at' => $published->format('Y-m-d H:i:s'),
        'timestamp' => $published->getTimestamp(),
    ];
}
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Avisen – Din kuraterede indgang til AI-nyheder</title>
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
    <header class="masthead">
        <div>
            <h1>AI Avisen</h1>
            <p class="tagline">Automatisk indsamlet fra førende AI-kilder – suppleret med redaktionelle noter.</p>
        </div>
        <div class="meta">
            <span class="stamp">Opdateret <?php echo $generatedAt->format('d. M Y \k\l. H:i'); ?> CET</span>
            <nav class="utility">
                <a href="admin/feeds.php">Tilføj kilde</a>
                <a href="#">Om projektet</a>
                <a href="#">Abonnér via RSS</a>
            </nav>
        </div>
    </header>

    <?php if (!empty($feedErrors)): ?>
        <div class="notice notice--error">
            <strong>Feeds der ikke svarede:</strong>
            <ul>
                <?php foreach ($feedErrors as $error): ?>
                    <li><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <?php if ($usingFallback): ?>
        <div class="notice notice--warning">
            Viser eksempelindhold, fordi ingen feeds kunne hentes i denne session. Tjek dine feed-URL'er eller serverens netværksadgang.
        </div>
    <?php endif; ?>

    <section class="intro">
        <div class="intro__col intro__col--briefing">
            <h2>Morgensituationen</h2>
            <p>Redaktionen kombinerer automatiske feeds, AI-sammenfatninger og manuelle tilføjelser for at give dig et overblik på under fem minutter. Brug filtrene til at fokusere på det, der er vigtigt for dit arbejde.</p>
        </div>
        <div class="intro__col intro__col--filters">
            <h3>Filtrér på emne</h3>
            <div class="tag-cloud" id="tagCloud">
                <?php if (!empty($tags)): ?>
                    <?php foreach ($tags as $tag): ?>
                        <button class="tag" data-tag="<?php echo htmlspecialchars($tag, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($tag, ENT_QUOTES, 'UTF-8'); ?></button>
                    <?php endforeach; ?>
                <?php else: ?>
                    <span class="tag tag--disabled">Ingen tags endnu</span>
                <?php endif; ?>
            </div>
            <button class="tag tag--clear" data-tag="all">Nulstil filtre</button>
        </div>
        <div class="intro__col intro__col--cta">
            <h3>Få et dagligt recap</h3>
            <form class="signup" action="#" method="post">
                <label for="email">Skriv dig op til vores daglige brief.</label>
                <div class="signup__row">
                    <input type="email" id="email" name="email" placeholder="din@mail.dk" required>
                    <button type="submit">Tilmeld</button>
                </div>
                <small>Vi sender maks. én mail om dagen.</small>
            </form>
        </div>
    </section>

    <main>
        <?php if (!empty($topStories)): ?>
            <section class="top-stories">
                <h2>Tophistorier</h2>
                <div class="top-grid">
                    <?php foreach ($topStories as $story): ?>
                        <?php include __DIR__ . '/partials/card-top.php'; ?>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php foreach ($sections as $sectionTitle => $items): ?>
            <?php if (empty($items)) {
                continue;
            } ?>
            <section class="news-section">
                <div class="section-header">
                    <h2><?php echo htmlspecialchars($sectionTitle, ENT_QUOTES, 'UTF-8'); ?></h2>
                </div>
                <div class="section-grid">
                    <?php foreach ($items as $story): ?>
                        <?php include __DIR__ . '/partials/card-standard.php'; ?>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endforeach; ?>
    </main>

    <section class="roadmap">
        <div class="roadmap__content">
            <h2>Sådan udbygger vi platformen</h2>
            <ol>
                <li><strong>Automatiske feeds:</strong> Kør dette script på et cronjob, der gemmer resultaterne i SQLite eller JSON.</li>
                <li><strong>AI-summeringer:</strong> Brug OpenAI til at komprimere længere artikler og foreslå tags.</li>
                <li><strong>Redaktionelt værktøj:</strong> Tilføj en let admin-side til manuelle links og notater fra redaktionen.</li>
                <li><strong>Personlige filtre:</strong> Gem læsernes præferencer i localStorage og foreslå relevante historier.</li>
            </ol>
        </div>
        <aside class="roadmap__aside">
            <h3>Kildebassin (eksempel)</h3>
            <ul>
                <li>The Decoder</li>
                <li>arXiv cs.AI</li>
                <li>Zapier AI-blog</li>
                <li>Ben's Bites</li>
                <li>Practical AI podcast</li>
            </ul>
        </aside>
    </section>

    <footer class="site-footer">
        <p>AI Avisen er et eksperimentelt nyhedsoverblik bygget med PHP og åbne feeds. Kontakt os på <a href="mailto:redaktion@aiavisen.dk">redaktion@aiavisen.dk</a>.</p>
    </footer>

    <script src="assets/app.js"></script>
</body>
</html>
