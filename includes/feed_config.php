<?php

declare(strict_types=1);

/**
 * @return array{sections: array<int,array{id?:string,title:string,max_items:int,feeds:array<int,array{id?:string,name:string,url:string,tags?:array<int,string>,limit?:int}>}>}
 */
function defaultFeedConfig(): array
{
    return [
        'sections' => [
            [
                'id' => 'trends',
                'title' => 'Trends',
                'max_items' => 6,
                'feeds' => [
                    [
                        'id' => 'the-decoder-ai-news',
                        'name' => 'The Decoder – AI News',
                        'url' => 'https://the-decoder.com/en/feed/',
                        'tags' => ['trends', 'international'],
                        'limit' => 5,
                    ],
                    [
                        'id' => 'ai-weekly',
                        'name' => 'AI Weekly',
                        'url' => 'https://aiweekly.co/feed/',
                        'tags' => ['nyhedsbrev', 'analyse'],
                        'limit' => 3,
                    ],
                ],
            ],
            [
                'id' => 'tools',
                'title' => 'Værktøjer',
                'max_items' => 6,
                'feeds' => [
                    [
                        'id' => 'zapier-ai-workflow',
                        'name' => 'Zapier – AI Workflow Tips',
                        'url' => 'https://zapier.com/blog/tag/artificial-intelligence/rss/',
                        'tags' => ['værktøjer', 'workflow'],
                        'limit' => 4,
                    ],
                    [
                        'id' => 'bens-bites',
                        'name' => "Ben's Bites",
                        'url' => 'https://bensbites.beehiiv.com/feed',
                        'tags' => ['produkt', 'opsummering'],
                        'limit' => 3,
                    ],
                ],
            ],
            [
                'id' => 'research',
                'title' => 'Forskning',
                'max_items' => 6,
                'feeds' => [
                    [
                        'id' => 'arxiv-cs-ai',
                        'name' => 'arXiv cs.AI',
                        'url' => 'https://export.arxiv.org/rss/cs.AI',
                        'tags' => ['forskning', 'arxiv'],
                        'limit' => 6,
                    ],
                    [
                        'id' => 'sciencedaily-ai',
                        'name' => 'ScienceDaily – AI',
                        'url' => 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml',
                        'tags' => ['forskning', 'anvendelse'],
                        'limit' => 4,
                    ],
                ],
            ],
            [
                'id' => 'media',
                'title' => 'Video & Podcasts',
                'max_items' => 4,
                'feeds' => [
                    [
                        'id' => 'practical-ai',
                        'name' => 'Practical AI',
                        'url' => 'https://feeds.simplecast.com/tOjNXec5',
                        'tags' => ['podcast', 'praktisk'],
                        'limit' => 4,
                    ],
                    [
                        'id' => 'eye-on-ai',
                        'name' => 'Eye on AI',
                        'url' => 'https://feeds.megaphone.fm/eye-on-ai',
                        'tags' => ['podcast', 'branche'],
                        'limit' => 3,
                    ],
                ],
            ],
        ],
    ];
}

/**
 * @param string $path
 * @param array<int,string> $errors
 * @return array{sections: array<int,array{id?:string,title:string,max_items:int,feeds:array<int,array{id?:string,name:string,url:string,tags?:array<int,string>,limit?:int}>}>}
 */
function readFeedConfig(string $path, array &$errors): array
{
    if (!is_readable($path)) {
        $errors[] = 'Konfigurationsfilen for feeds blev ikke fundet. Standardopsætningen bruges i stedet.';
        return defaultFeedConfig();
    }

    $json = file_get_contents($path);
    if ($json === false) {
        $errors[] = 'Kunne ikke læse feed-konfigurationen. Standardopsætningen bruges i stedet.';
        return defaultFeedConfig();
    }

    $data = json_decode($json, true);

    if (!is_array($data) || !isset($data['sections']) || !is_array($data['sections'])) {
        $errors[] = 'Feed-konfigurationen er ugyldig og blev nulstillet til standardværdier.';
        return defaultFeedConfig();
    }

    return $data;
}

/**
 * @param array{sections: array<int,array{id?:string,title:string,max_items?:int,feeds?:array<int,array{id?:string,name?:string,url?:string,tags?:array<int,string>,limit?:int}>}>} $config
 * @param array<int,string> $errors
 * @return array<string,array{max_items:int,feeds:array<int,array{id?:string,name:string,url:string,tags:array<int,string>,limit:int}>}>
 */
function normaliseFeedSections(array $config, array &$errors): array
{
    $sections = [];

    foreach ($config['sections'] as $section) {
        if (!is_array($section)) {
            continue;
        }

        $title = trim((string) ($section['title'] ?? ''));
        if ($title === '') {
            $errors[] = 'En sektion uden titel blev ignoreret.';
            continue;
        }

        $maxItems = isset($section['max_items']) ? (int) $section['max_items'] : 6;
        if ($maxItems <= 0) {
            $maxItems = 6;
        }

        $feeds = [];
        $rawFeeds = isset($section['feeds']) && is_array($section['feeds']) ? $section['feeds'] : [];
        foreach ($rawFeeds as $feed) {
            if (!is_array($feed)) {
                continue;
            }

            $name = trim((string) ($feed['name'] ?? ''));
            $url = trim((string) ($feed['url'] ?? ''));
            if ($name === '' || !filter_var($url, FILTER_VALIDATE_URL)) {
                $errors[] = sprintf('Et feed i sektionen "%s" blev ignoreret, fordi navn eller URL mangler/er ugyldig.', $title);
                continue;
            }

            $limit = isset($feed['limit']) ? (int) $feed['limit'] : 5;
            if ($limit <= 0) {
                $limit = 5;
            }

            $tags = [];
            if (isset($feed['tags']) && is_array($feed['tags'])) {
                foreach ($feed['tags'] as $tag) {
                    $tags[] = (string) $tag;
                }
            }

            $feeds[] = [
                'id' => ensureFeedId($feed, $name, $url),
                'name' => $name,
                'url' => $url,
                'tags' => $tags,
                'limit' => $limit,
            ];
        }

        $sections[$title] = [
            'id' => isset($section['id']) ? (string) $section['id'] : slugify($title),
            'max_items' => $maxItems,
            'feeds' => $feeds,
        ];
    }

    return $sections;
}

/**
 * @param array{id?:string} $feed
 */
function ensureFeedId(array $feed, string $name, string $url): string
{
    $id = isset($feed['id']) ? trim((string) $feed['id']) : '';
    if ($id !== '') {
        return $id;
    }

    $slug = slugify($name);
    if ($slug !== '') {
        return $slug;
    }

    return 'feed_' . substr(sha1($url), 0, 8);
}

function slugify(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    $value = function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
    $value = preg_replace('/[^a-z0-9æøåäöü\s-]/u', '', $value);
    $value = preg_replace('/\s+/u', '-', $value);
    $value = preg_replace('/-+/u', '-', $value);

    return trim((string) $value, '-');
}

function saveFeedConfig(string $path, array $config): bool
{
    $directory = dirname($path);
    if (!is_dir($directory)) {
        if (!mkdir($directory, 0775, true) && !is_dir($directory)) {
            return false;
        }
    }

    $encoded = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($encoded === false) {
        return false;
    }

    return file_put_contents($path, $encoded . "\n") !== false;
}

