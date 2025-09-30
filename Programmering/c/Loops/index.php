<?php
$config = require_once __DIR__ . '/../../../Config/config.php';

$apiKey = $config['OPENAI_API_KEY'] ?? '';
$timeout = $config['TIMEOUT'] ?? 0;
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title>ChatGPT i C-loops</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>ChatGPT fra C-loops</h1>
    </header>
    <section>
        <p>Denne side bruger en fælles ChatGPT-konfiguration.</p>
        <p>API-nøglen er sat (skjult) og timeout er <strong><?php echo htmlspecialchars((string) $timeout, ENT_QUOTES, 'UTF-8'); ?></strong> sekunder.</p>
        <details>
            <summary>Debug</summary>
            <p>CA-bundle: <code><?php echo htmlspecialchars($config['CA_BUNDLE'] ?? '', ENT_QUOTES, 'UTF-8'); ?></code></p>
        </details>
    </section>
    <script src="loops.js"></script>
</body>
</html>
