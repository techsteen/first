<?php
require_once __DIR__ . '/../../../Config/config.php';

$audience = 'C-udviklere';
$greeting = config_greeting($audience);
$timezone = config_value('timezone', 'UTC');
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlspecialchars(APP_NAME . ' - C Loops', ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1><?php echo htmlspecialchars($greeting, ENT_QUOTES, 'UTF-8'); ?></h1>
    </header>
    <section>
        <p>Konfigurationen angiver tidszonen som <strong><?php echo htmlspecialchars($timezone, ENT_QUOTES, 'UTF-8'); ?></strong>.</p>
        <p>Denne side blev gengivet: <time datetime="<?php echo date('c'); ?>"><?php echo date('d-m-Y H:i'); ?></time>.</p>
    </section>
    <script src="loops.js"></script>
</body>
</html>
