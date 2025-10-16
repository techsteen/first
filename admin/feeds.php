<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/feed_config.php';

$feedConfigPath = __DIR__ . '/../data/feeds.json';
$configErrors = [];
$config = readFeedConfig($feedConfigPath, $configErrors);
$successMessages = [];
$errors = $configErrors;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    $postErrors = [];
    $postSuccess = [];
    $changed = false;

    switch ($action) {
        case 'update-section':
            [$changed, $postErrors, $postSuccess] = handleUpdateSection($config, $_POST);
            break;
        case 'add-section':
            [$changed, $postErrors, $postSuccess] = handleAddSection($config, $_POST);
            break;
        case 'delete-section':
            [$changed, $postErrors, $postSuccess] = handleDeleteSection($config, $_POST);
            break;
        case 'add-feed':
            [$changed, $postErrors, $postSuccess] = handleAddFeed($config, $_POST);
            break;
        case 'update-feed':
            [$changed, $postErrors, $postSuccess] = handleUpdateFeed($config, $_POST);
            break;
        case 'delete-feed':
            [$changed, $postErrors, $postSuccess] = handleDeleteFeed($config, $_POST);
            break;
        default:
            if ($action !== '') {
                $postErrors[] = 'Ukendt handling.';
            }
    }

    if ($changed && empty($postErrors)) {
        if (saveFeedConfig($feedConfigPath, $config)) {
            $postSuccess[] = 'Ændringerne blev gemt.';
        } else {
            $postErrors[] = 'Kunne ikke gemme ændringerne. Tjek filrettighederne for data/feeds.json.';
        }
    }

    $errors = array_merge($errors, $postErrors);
    $successMessages = array_merge($successMessages, $postSuccess);

    // Genindlæs konfigurationen for at få opdaterede data.
    $configErrors = [];
    $config = readFeedConfig($feedConfigPath, $configErrors);
    $errors = array_merge($errors, $configErrors);
}

$sections = $config['sections'] ?? [];

function handleUpdateSection(array &$config, array $payload): array
{
    $sectionId = trim((string) ($payload['section_id'] ?? ''));
    if ($sectionId === '') {
        return [false, ['Sektion-ID mangler.'], []];
    }

    $index = findSectionIndex($config['sections'] ?? [], $sectionId);
    if ($index === -1) {
        return [false, ['Sektionen blev ikke fundet.'], []];
    }

    $title = trim((string) ($payload['title'] ?? ''));
    $maxItems = (int) ($payload['max_items'] ?? 6);

    $errors = [];
    if ($title === '') {
        $errors[] = 'Sektionens navn skal udfyldes.';
    }

    if ($maxItems <= 0) {
        $maxItems = 1;
    }

    if (!empty($errors)) {
        return [false, $errors, []];
    }

    $config['sections'][$index]['title'] = $title;
    $config['sections'][$index]['max_items'] = $maxItems;

    if (!isset($config['sections'][$index]['id']) || $config['sections'][$index]['id'] === '') {
        $config['sections'][$index]['id'] = slugify($title);
    }

    return [true, [], ['Sektionen blev opdateret.']];
}

function handleAddSection(array &$config, array $payload): array
{
    $title = trim((string) ($payload['title'] ?? ''));
    $maxItems = (int) ($payload['max_items'] ?? 6);

    if ($title === '') {
        return [false, ['Sektionens navn skal udfyldes.'], []];
    }

    if ($maxItems <= 0) {
        $maxItems = 1;
    }

    $id = slugify($title);
    if ($id === '') {
        $id = 'section_' . substr(sha1($title . microtime(true)), 0, 8);
    }

    $sections = $config['sections'] ?? [];
    $originalId = $id;
    $suffix = 1;
    while (findSectionIndex($sections, $id) !== -1) {
        $id = $originalId . '-' . $suffix;
        $suffix++;
    }

    $config['sections'][] = [
        'id' => $id,
        'title' => $title,
        'max_items' => $maxItems,
        'feeds' => [],
    ];

    return [true, [], ['Sektionen blev oprettet.']];
}

function handleDeleteSection(array &$config, array $payload): array
{
    $sectionId = trim((string) ($payload['section_id'] ?? ''));
    if ($sectionId === '') {
        return [false, ['Sektion-ID mangler.'], []];
    }

    $index = findSectionIndex($config['sections'] ?? [], $sectionId);
    if ($index === -1) {
        return [false, ['Sektionen blev ikke fundet.'], []];
    }

    unset($config['sections'][$index]);
    $config['sections'] = array_values($config['sections']);

    return [true, [], ['Sektionen blev slettet.']];
}

function handleAddFeed(array &$config, array $payload): array
{
    $sectionId = trim((string) ($payload['section_id'] ?? ''));
    $index = findSectionIndex($config['sections'] ?? [], $sectionId);
    if ($index === -1) {
        return [false, ['Sektionen blev ikke fundet.'], []];
    }

    $name = trim((string) ($payload['name'] ?? ''));
    $url = trim((string) ($payload['url'] ?? ''));
    $tagsInput = trim((string) ($payload['tags'] ?? ''));
    $limit = (int) ($payload['limit'] ?? 5);

    $errors = [];
    if ($name === '') {
        $errors[] = 'Feedets navn skal udfyldes.';
    }

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        $errors[] = 'Feedets URL er ikke gyldig.';
    }

    if ($limit <= 0) {
        $limit = 5;
    }

    if (!empty($errors)) {
        return [false, $errors, []];
    }

    $tags = [];
    if ($tagsInput !== '') {
        foreach (explode(',', $tagsInput) as $tag) {
            $clean = trim($tag);
            if ($clean !== '') {
                $tags[] = $clean;
            }
        }
    }

    $feedId = slugify($name);
    if ($feedId === '') {
        $feedId = 'feed_' . substr(sha1($url), 0, 8);
    }

    $feeds = $config['sections'][$index]['feeds'] ?? [];
    $originalId = $feedId;
    $suffix = 1;
    while (findFeedIndex($feeds, $feedId) !== -1) {
        $feedId = $originalId . '-' . $suffix;
        $suffix++;
    }

    $feeds[] = [
        'id' => $feedId,
        'name' => $name,
        'url' => $url,
        'tags' => $tags,
        'limit' => $limit,
    ];

    $config['sections'][$index]['feeds'] = $feeds;

    return [true, [], ['Feedet blev tilføjet.']];
}

function handleUpdateFeed(array &$config, array $payload): array
{
    $sectionId = trim((string) ($payload['section_id'] ?? ''));
    $feedId = trim((string) ($payload['feed_id'] ?? ''));

    $sectionIndex = findSectionIndex($config['sections'] ?? [], $sectionId);
    if ($sectionIndex === -1) {
        return [false, ['Sektionen blev ikke fundet.'], []];
    }

    $feeds = $config['sections'][$sectionIndex]['feeds'] ?? [];
    $feedIndex = findFeedIndex($feeds, $feedId);
    if ($feedIndex === -1) {
        return [false, ['Feedet blev ikke fundet.'], []];
    }

    $name = trim((string) ($payload['name'] ?? ''));
    $url = trim((string) ($payload['url'] ?? ''));
    $tagsInput = trim((string) ($payload['tags'] ?? ''));
    $limit = (int) ($payload['limit'] ?? 5);

    $errors = [];
    if ($name === '') {
        $errors[] = 'Feedets navn skal udfyldes.';
    }

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        $errors[] = 'Feedets URL er ikke gyldig.';
    }

    if ($limit <= 0) {
        $limit = 5;
    }

    if (!empty($errors)) {
        return [false, $errors, []];
    }

    $tags = [];
    if ($tagsInput !== '') {
        foreach (explode(',', $tagsInput) as $tag) {
            $clean = trim($tag);
            if ($clean !== '') {
                $tags[] = $clean;
            }
        }
    }

    $config['sections'][$sectionIndex]['feeds'][$feedIndex]['name'] = $name;
    $config['sections'][$sectionIndex]['feeds'][$feedIndex]['url'] = $url;
    $config['sections'][$sectionIndex]['feeds'][$feedIndex]['limit'] = $limit;
    $config['sections'][$sectionIndex]['feeds'][$feedIndex]['tags'] = $tags;

    return [true, [], ['Feedet blev opdateret.']];
}

function handleDeleteFeed(array &$config, array $payload): array
{
    $sectionId = trim((string) ($payload['section_id'] ?? ''));
    $feedId = trim((string) ($payload['feed_id'] ?? ''));

    $sectionIndex = findSectionIndex($config['sections'] ?? [], $sectionId);
    if ($sectionIndex === -1) {
        return [false, ['Sektionen blev ikke fundet.'], []];
    }

    $feeds = $config['sections'][$sectionIndex]['feeds'] ?? [];
    $feedIndex = findFeedIndex($feeds, $feedId);
    if ($feedIndex === -1) {
        return [false, ['Feedet blev ikke fundet.'], []];
    }

    unset($config['sections'][$sectionIndex]['feeds'][$feedIndex]);
    $config['sections'][$sectionIndex]['feeds'] = array_values($config['sections'][$sectionIndex]['feeds']);

    return [true, [], ['Feedet blev slettet.']];
}

/**
 * @param array<int,array{id?:string}> $sections
 */
function findSectionIndex(array $sections, string $sectionId): int
{
    foreach ($sections as $index => $section) {
        if (isset($section['id']) && (string) $section['id'] === $sectionId) {
            return (int) $index;
        }
    }

    return -1;
}

/**
 * @param array<int,array{id?:string}> $feeds
 */
function findFeedIndex(array $feeds, string $feedId): int
{
    foreach ($feeds as $index => $feed) {
        if (isset($feed['id']) && (string) $feed['id'] === $feedId) {
            return (int) $index;
        }
    }

    return -1;
}

function renderTags(array $tags): string
{
    if (empty($tags)) {
        return '';
    }

    $escaped = array_map(static function (string $tag): string {
        return htmlspecialchars($tag, ENT_QUOTES, 'UTF-8');
    }, $tags);

    return implode(', ', $escaped);
}

?><!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title>Administrer feeds – AI Avisen</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../assets/styles.css">
    <style>
        body {
            max-width: 1100px;
            margin: 0 auto;
            padding: 2rem 1.5rem 4rem;
        }
        h1 {
            margin-bottom: 1rem;
        }
        .admin-nav {
            margin-bottom: 2rem;
            display: flex;
            gap: 1rem;
        }
        .admin-nav a {
            color: var(--color-primary);
            text-decoration: none;
        }
        .flash {
            border-radius: 6px;
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
        }
        .flash--error {
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #7f1d1d;
        }
        .flash--success {
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            color: #14532d;
        }
        .section-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            background: #fff;
        }
        .section-header {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }
        .feed-list {
            margin-top: 1rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 1rem;
        }
        .feed-item {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
            align-items: start;
            padding: 1rem 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .feed-item:last-child {
            border-bottom: none;
        }
        .feed-item form {
            display: contents;
        }
        .feed-item label,
        .feed-add label,
        .section-form label,
        .new-section-form label {
            font-weight: 600;
            display: block;
            margin-bottom: 0.4rem;
        }
        .feed-item input[type="text"],
        .feed-item input[type="url"],
        .feed-item input[type="number"],
        .feed-add input[type="text"],
        .feed-add input[type="url"],
        .feed-add input[type="number"],
        .section-form input[type="text"],
        .section-form input[type="number"],
        .new-section-form input[type="text"],
        .new-section-form input[type="number"] {
            width: 100%;
            padding: 0.6rem 0.75rem;
            border-radius: 6px;
            border: 1px solid #cbd5f5;
            font-size: 0.95rem;
        }
        .form-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .form-actions button {
            border: none;
            border-radius: 6px;
            padding: 0.55rem 0.9rem;
            cursor: pointer;
            font-weight: 600;
        }
        .btn-primary {
            background: var(--color-primary);
            color: #fff;
        }
        .btn-secondary {
            background: var(--color-muted);
            color: #0f172a;
        }
        .btn-danger {
            background: #dc2626;
            color: #fff;
        }
        .feed-add {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px dashed #cbd5f5;
        }
        .new-section-form {
            margin-top: 2rem;
            border: 1px dashed #cbd5f5;
            padding: 1.5rem;
            border-radius: 12px;
            background: #f8fafc;
        }
        @media (max-width: 640px) {
            .feed-item {
                grid-template-columns: 1fr;
            }
            .form-actions {
                flex-direction: column;
                align-items: stretch;
            }
            .form-actions button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <h1>Administrer feeds</h1>
    <nav class="admin-nav">
        <a href="../index.php">← Tilbage til forsiden</a>
    </nav>

    <?php foreach ($errors as $error): ?>
        <div class="flash flash--error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php endforeach; ?>

    <?php foreach ($successMessages as $message): ?>
        <div class="flash flash--success"><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php endforeach; ?>

    <?php if (empty($sections)): ?>
        <p>Der er endnu ingen sektioner. Brug formularen nederst til at oprette den første sektion.</p>
    <?php endif; ?>

    <?php foreach ($sections as $section): ?>
        <?php
            $sectionId = (string) ($section['id'] ?? '');
            $feeds = $section['feeds'] ?? [];
        ?>
        <section class="section-card">
            <header class="section-header">
                <h2><?php echo htmlspecialchars((string) ($section['title'] ?? 'Uden titel'), ENT_QUOTES, 'UTF-8'); ?></h2>
                <form method="post" class="section-form">
                    <input type="hidden" name="section_id" value="<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">
                    <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end;">
                        <div>
                            <label for="section-title-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">Navn</label>
                            <input id="section-title-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>" type="text" name="title" value="<?php echo htmlspecialchars((string) ($section['title'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                        </div>
                        <div>
                            <label for="section-max-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">Maks. antal artikler</label>
                            <input id="section-max-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>" type="number" name="max_items" min="1" value="<?php echo htmlspecialchars((string) ($section['max_items'] ?? 6), ENT_QUOTES, 'UTF-8'); ?>" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" name="action" value="update-section" class="btn-primary">Opdater sektion</button>
                            <button type="submit" name="action" value="delete-section" class="btn-danger" formnovalidate onclick="return confirm('Er du sikker på, at du vil slette sektionen og alle dens feeds?');">Slet sektion</button>
                        </div>
                    </div>
                </form>
            </header>

            <div class="feed-list">
                <?php if (!empty($feeds)): ?>
                    <?php foreach ($feeds as $feed): ?>
                        <?php $feedId = (string) ($feed['id'] ?? ''); ?>
                        <div class="feed-item">
                            <form method="post">
                                <input type="hidden" name="section_id" value="<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">
                                <input type="hidden" name="feed_id" value="<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>">
                                <div>
                                    <label for="feed-name-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>">Navn</label>
                                    <input id="feed-name-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>" type="text" name="name" value="<?php echo htmlspecialchars((string) ($feed['name'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                                </div>
                                <div>
                                    <label for="feed-url-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>">URL</label>
                                    <input id="feed-url-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>" type="url" name="url" value="<?php echo htmlspecialchars((string) ($feed['url'] ?? ''), ENT_QUOTES, 'UTF-8'); ?>" required>
                                </div>
                                <div>
                                    <label for="feed-tags-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>">Tags (komma-separeret)</label>
                                    <input id="feed-tags-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>" type="text" name="tags" value="<?php echo renderTags(isset($feed['tags']) && is_array($feed['tags']) ? $feed['tags'] : []); ?>">
                                </div>
                                <div>
                                    <label for="feed-limit-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>">Maks. poster</label>
                                    <input id="feed-limit-<?php echo htmlspecialchars($feedId, ENT_QUOTES, 'UTF-8'); ?>" type="number" name="limit" min="1" value="<?php echo htmlspecialchars((string) ($feed['limit'] ?? 5), ENT_QUOTES, 'UTF-8'); ?>" required>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" name="action" value="update-feed" class="btn-primary">Gem</button>
                                    <button type="submit" name="action" value="delete-feed" class="btn-danger" formnovalidate onclick="return confirm('Vil du slette dette feed?');">Slet</button>
                                </div>
                            </form>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p>Ingen feeds i denne sektion endnu.</p>
                <?php endif; ?>

                <div class="feed-add">
                    <h3>Tilføj feed</h3>
                    <form method="post">
                        <input type="hidden" name="section_id" value="<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">
                        <div class="feed-item" style="padding:0; border:none;">
                            <div>
                                <label for="new-feed-name-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">Navn</label>
                                <input id="new-feed-name-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>" type="text" name="name" required>
                            </div>
                            <div>
                                <label for="new-feed-url-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">URL</label>
                                <input id="new-feed-url-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>" type="url" name="url" required>
                            </div>
                            <div>
                                <label for="new-feed-tags-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">Tags (komma-separeret)</label>
                                <input id="new-feed-tags-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>" type="text" name="tags" placeholder="fx nyhed, forskning">
                            </div>
                            <div>
                                <label for="new-feed-limit-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>">Maks. poster</label>
                                <input id="new-feed-limit-<?php echo htmlspecialchars($sectionId, ENT_QUOTES, 'UTF-8'); ?>" type="number" name="limit" min="1" value="5">
                            </div>
                            <div class="form-actions">
                                <button type="submit" name="action" value="add-feed" class="btn-secondary">Tilføj feed</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    <?php endforeach; ?>

    <section class="new-section-form">
        <h2>Opret ny sektion</h2>
        <form method="post">
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem;">
                <div>
                    <label for="new-section-title">Navn</label>
                    <input id="new-section-title" type="text" name="title" required>
                </div>
                <div>
                    <label for="new-section-max">Maks. antal artikler</label>
                    <input id="new-section-max" type="number" name="max_items" min="1" value="6">
                </div>
            </div>
            <div class="form-actions" style="margin-top:1rem;">
                <button type="submit" name="action" value="add-section" class="btn-secondary">Opret sektion</button>
            </div>
        </form>
    </section>

    <p style="margin-top:2rem; font-size:0.9rem; color:#475569;">Tip: Beskyt denne side med adgangskode via din hosting eller et simpelt login-script, så det kun er redaktionen der kan ændre feeds.</p>
</body>
</html>
