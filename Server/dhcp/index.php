<?php
$config = require_once __DIR__ . '/../../Config/config.php';

$apiBase = $config['OPENAI_BASE'] ?? '';
$model = $config['OPENAI_MODEL'] ?? '';
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title>ChatGPT DHCP-integration</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <h1>DHCP &amp; ChatGPT</h1>
        <p>Aktiv model: <strong><?php echo htmlspecialchars($model, ENT_QUOTES, 'UTF-8'); ?></strong></p>
        <p>API-endpoint: <code><?php echo htmlspecialchars($apiBase, ENT_QUOTES, 'UTF-8'); ?></code></p>
    </main>
    <script src="script.js"></script>
</body>
</html>
