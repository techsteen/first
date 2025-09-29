<?php
require_once __DIR__ . '/../../Config/config.php';

$audience = 'DHCP-teamet';
$greeting = config_greeting($audience);
$supportEmail = config_value('supportEmail', 'kontakt@eksempel.dk');
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlspecialchars(APP_NAME . ' - DHCP', ENT_QUOTES, 'UTF-8'); ?></title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <h1><?php echo htmlspecialchars($greeting, ENT_QUOTES, 'UTF-8'); ?></h1>
        <p>Support: <a href="mailto:<?php echo htmlspecialchars($supportEmail, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($supportEmail, ENT_QUOTES, 'UTF-8'); ?></a></p>
    </main>
    <script src="script.js"></script>
</body>
</html>
