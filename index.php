<?php
$generatedAt = new DateTime('now', new DateTimeZone('Europe/Copenhagen'));

$topStories = [
    [
        'title' => 'EU lancerer ny milliardfond til ansvarlig AI-forskning',
        'source' => 'EU Commission',
        'url' => '#',
        'summary' => 'Fonden skal accelerere europæiske pilotprojekter med fokus på bæredygtig AI og nye datainfrastrukturer.',
        'tags' => ['politik', 'forskning', 'eu'],
        'published_at' => '2024-06-03 08:15'
    ],
    [
        'title' => 'Open source-initiativ løfter sløret for dansk sprogbank',
        'source' => 'AI Nordic Lab',
        'url' => '#',
        'summary' => 'Teamet bag LLM-da offentliggør en ny sprogbank til udvikling af danske sprogmodeller med åbne licenser.',
        'tags' => ['open-source', 'dansk', 'LLM'],
        'published_at' => '2024-06-03 07:45'
    ],
    [
        'title' => 'VC-investorer rykker penge fra chatbots til AI-værktøjer',
        'source' => 'Nordic Tech News',
        'url' => '#',
        'summary' => 'Ny rapport viser stigende interesse i “agentic operations” og AI-understøttede workflows i SaaS-sektoren.',
        'tags' => ['investering', 'SaaS'],
        'published_at' => '2024-06-02 16:30'
    ],
];

$sections = [
    'Trends' => [
        [
            'title' => 'Kommunerne tester beslutningsstøtte til velfærd',
            'source' => 'Kommunernes Landsforening',
            'url' => '#',
            'summary' => 'Tre pilotkommuner afprøver AI-opsummeringer af borgerhenvendelser og mødemateriale.',
            'tags' => ['offentlig sektor', 'implementering'],
            'published_at' => '2024-06-03 06:10'
        ],
        [
            'title' => 'AI-chatbots bliver del af kundeservice-samarbejde',
            'source' => 'CX Weekly',
            'url' => '#',
            'summary' => 'Partnerskab mellem Zendesk og to nordiske scaleups skal give fælles FAQ-videnbase.',
            'tags' => ['kundeservice', 'partnerskab'],
            'published_at' => '2024-06-02 13:48'
        ],
    ],
    'Værktøjer' => [
        [
            'title' => 'Ny prompt-cheatsheet fra DTU Compute',
            'source' => 'DTU Compute',
            'url' => '#',
            'summary' => 'Forskere deler bedste praksis for danske teams der bygger med GPT-4o og Claude 3.',
            'tags' => ['resources', 'LLM'],
            'published_at' => '2024-06-01 18:05'
        ],
        [
            'title' => 'Automatisér opsummeringer i Slack på 20 minutter',
            'source' => 'Ops Platform Blog',
            'url' => '#',
            'summary' => 'Trin-for-trin guide til at forbinde webhooks og OpenAI Assistants i Slack-kanaler.',
            'tags' => ['workflow', 'guide'],
            'published_at' => '2024-05-31 09:52'
        ],
    ],
    'Forskning' => [
        [
            'title' => 'Papir: “Robust Danish Named Entity Recognition”',
            'source' => 'arXiv',
            'url' => '#',
            'summary' => 'Nyt studie viser hvordan kombinationen af aktive læringsstrategier og humans-in-the-loop hæver kvaliteten.',
            'tags' => ['forskning', 'NLP'],
            'published_at' => '2024-05-30 21:20'
        ],
        [
            'title' => 'CBS analyserer AI i nordiske ledelsesgange',
            'source' => 'CBS',
            'url' => '#',
            'summary' => 'Interviewstudie med 32 ledere: “AI skaber lyst til eksperimenter, men kræver klare guardrails.”',
            'tags' => ['ledelse', 'strategi'],
            'published_at' => '2024-05-29 11:00'
        ],
    ],
    'Video & Podcasts' => [
        [
            'title' => 'Podcast: “Dataetikkens nye dilemmaer”',
            'source' => 'TechTorsdag',
            'url' => '#',
            'summary' => 'Samtale med jurist Ida Møller om, hvordan AI-aktører bør dele dataindsigt med offentligheden.',
            'tags' => ['podcast', 'etik'],
            'published_at' => '2024-05-28 08:00'
        ],
        [
            'title' => 'Video: Sådan bygger DR digitale assistenter',
            'source' => 'DR Medieforskning',
            'url' => '#',
            'summary' => 'Product owner deler lessons learned fra DR’s interne AI-agentprojekt.',
            'tags' => ['video', 'case'],
            'published_at' => '2024-05-27 15:42'
        ],
    ],
];

$tags = [];
foreach ($topStories as $story) {
    $tags = array_merge($tags, $story['tags']);
}
foreach ($sections as $entries) {
    foreach ($entries as $story) {
        $tags = array_merge($tags, $story['tags']);
    }
}
$tags = array_unique($tags);
sort($tags);
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
            <p class="tagline">Daglig kuratering af de vigtigste nyheder, værktøjer og analyser om kunstig intelligens.</p>
        </div>
        <div class="meta">
            <span class="stamp">Opdateret <?php echo $generatedAt->format('d. M Y \k\l. H:i'); ?> CET</span>
            <nav class="utility">
                <a href="#">Tilføj kilde</a>
                <a href="#">Om projektet</a>
                <a href="#">Abonnér via RSS</a>
            </nav>
        </div>
    </header>

    <section class="intro">
        <div class="intro__col intro__col--briefing">
            <h2>Morgensituationen</h2>
            <p>Redaktionen kombinerer automatiske feeds og AI-sammenfatninger for at give dig et overblik på under fem minutter. Brug filtre for at fokusere på det, der er vigtigt for dit arbejde.</p>
        </div>
        <div class="intro__col intro__col--filters">
            <h3>Filtrér på emne</h3>
            <div class="tag-cloud" id="tagCloud">
                <?php foreach ($tags as $tag): ?>
                    <button class="tag" data-tag="<?php echo htmlspecialchars($tag); ?>"><?php echo htmlspecialchars($tag); ?></button>
                <?php endforeach; ?>
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
        <section class="top-stories">
            <h2>Tophistorier</h2>
            <div class="top-grid">
                <?php foreach ($topStories as $story): ?>
                    <?php include __DIR__ . '/partials/card-top.php'; ?>
                <?php endforeach; ?>
            </div>
        </section>

        <?php foreach ($sections as $sectionTitle => $items): ?>
            <section class="news-section">
                <div class="section-header">
                    <h2><?php echo htmlspecialchars($sectionTitle); ?></h2>
                    <a class="section-link" href="#">Se alle</a>
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
                <li><strong>Automatiske feeds:</strong> Opsæt SimplePie og et `fetch.php`-cronjob, der læser kilder ind i en SQLite-database.</li>
                <li><strong>AI-summeringer:</strong> Brug OpenAI til at komprimere længere artikler til korte highlights og tagge efter emne.</li>
                <li><strong>Redaktionelt værktøj:</strong> Tilføj en let admin-side til manuelle links og notater fra redaktionen.</li>
                <li><strong>Personlige filtre:</strong> Gem læsernes præferencer i localStorage og foreslå relevante historier.</li>
            </ol>
        </div>
        <aside class="roadmap__aside">
            <h3>Kildebassin (eksempel)</h3>
            <ul>
                <li>Politiken – Teknologi</li>
                <li>Version2</li>
                <li>Financial Times – AI</li>
                <li>Substack: “European AI Digest”</li>
                <li>Podcast: “Techtopia”</li>
            </ul>
        </aside>
    </section>

    <footer class="site-footer">
        <p>AI Avisen er et eksperimentelt nyhedsoverblik bygget med PHP og åbne feeds. Kontakt os på <a href="mailto:redaktion@aiavisen.dk">redaktion@aiavisen.dk</a>.</p>
    </footer>

    <script src="assets/app.js"></script>
</body>
</html>
