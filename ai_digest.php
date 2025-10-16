<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/ai_digest.php';

$timezone = new DateTimeZone('Europe/Copenhagen');
$errors = [];
$resultItems = [];
$requestedUrl = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $requestedUrl = trim((string) ($_POST['source_url'] ?? ''));

    if ($requestedUrl === '' || !filter_var($requestedUrl, FILTER_VALIDATE_URL)) {
        $errors[] = 'Indsæt en gyldig URL til den side, AI’en skal gennemgå.';
    } else {
        $pageContent = fetchPageForDigest($requestedUrl, $errors);
        if ($pageContent !== null) {
            $digest = generateDigestFromPage($requestedUrl, $pageContent, $timezone, $errors);
            if ($digest !== null) {
                $resultItems = $digest['items'];
            }
        }
    }
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
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title>AI-genereret nyhedsudtræk</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="ai-digest">
<header class="masthead">
    <div>
        <h1>AI Avisen</h1>
        <p class="tagline">AI-genereret overblik fra en vilkårlig side.</p>
    </div>
    <div class="meta">
        <span class="stamp">Eksperimentelt værktøj</span>
        <nav class="utility">
            <a href="index.php">Forside</a>
            <a href="admin/feeds.php">Administrér kilder</a>
        </nav>
    </div>
</header>
<main class="ai-layout">
    <section class="panel">
        <h2>Fremstil et AI-overblik</h2>
        <p>Indsæt en URL til en artikeloversigt, og lad ChatGPT udtrække de vigtigste nyheder som et midlertidigt feed. Hvis artiklerne har angivet publiceringsdatoer, vises kun poster fra de seneste to døgn.</p>
        <form method="post" class="form">
            <label for="source_url">Sideadresse</label>
            <div class="form__row">
                <input type="url" name="source_url" id="source_url" placeholder="https://…" value="<?php echo htmlspecialchars($requestedUrl); ?>" required>
                <button type="submit">Generér</button>
            </div>
        </form>
        <p class="help-text">API-nøglen hentes fra <code>/config/config.php</code>, som er blokeret for direkte webadgang.</p>
    </section>

    <?php if (!empty($errors)): ?>
        <section class="panel panel--error">
            <h3>Fejl</h3>
            <ul>
                <?php foreach ($errors as $error): ?>
                    <li><?php echo htmlspecialchars($error); ?></li>
                <?php endforeach; ?>
            </ul>
        </section>
    <?php endif; ?>

    <?php if (!empty($resultItems)): ?>
        <section class="panel">
            <h2>AI-udtrukne artikler</h2>
            <div class="grid grid--ai">
                <?php foreach ($resultItems as $item): ?>
                    <article class="card">
                        <header class="card__header">
                            <span class="card__source">
                                <?php echo htmlspecialchars($item['source'] ?? parse_url($item['url'], PHP_URL_HOST) ?? ''); ?>
                            </span>
                            <?php if (!empty($item['published_at'])): ?>
                                <time datetime="<?php echo htmlspecialchars($item['published_at']); ?>">
                                    <?php echo htmlspecialchars(date('d/m H:i', strtotime($item['published_at']))); ?>
                                </time>
                            <?php endif; ?>
                        </header>
                        <h3 class="card__title">
                            <a href="<?php echo htmlspecialchars($item['url']); ?>" target="_blank" rel="noopener">
                                <?php echo htmlspecialchars($item['title']); ?>
                            </a>
                        </h3>
                        <p class="card__summary"><?php echo htmlspecialchars($item['summary']); ?></p>
                        <?php
                        $tags = $item['tags'] ?? [];
                        if (empty($tags)) {
                            $tags = ['ai-digest'];
                        }
                        ?>
                        <footer class="card__footer">
                            <?php foreach ($tags as $tag): ?>
                                <span class="badge">#<?php echo htmlspecialchars($tag); ?></span>
                            <?php endforeach; ?>
                            <a class="read-more" href="<?php echo htmlspecialchars($item['url']); ?>" target="_blank" rel="noopener">Læs →</a>
                        </footer>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endif; ?>
</main>
<footer class="footer">
    <small>Indholdet gemmes ikke – brug det som inspiration til manuelt kuraterede indslag.</small>
</footer>
</body>
</html>
