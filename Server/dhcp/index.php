<?php
$config = require_once __DIR__ . '/../../Config/config.php';

$apiBase = rtrim($config['OPENAI_BASE'] ?? '', '/');
$model   = $config['OPENAI_MODEL'] ?? '';
$timeout = (int)($config['TIMEOUT'] ?? 30);
$apiKey  = $config['OPENAI_API_KEY'] ?? '';
$caBundle = $config['CA_BUNDLE'] ?? '';

$answer = null;
$errorMessage = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $prompt = trim($_POST['prompt'] ?? '');

    if ($prompt === '') {
        $errorMessage = 'Ingen prompt sendt til ChatGPT.';
    } elseif ($apiKey === '') {
        $errorMessage = 'API-nøglen mangler – opdater Config/config.php med en gyldig nøgle.';
    } else {
        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'Du er en hjælpsom assistent, der svarer på dansk.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.2,
        ];

        $endpoint = $apiBase . '/chat/completions';
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
        ]);

        if (is_string($caBundle) && $caBundle !== '' && file_exists($caBundle)) {
            curl_setopt($ch, CURLOPT_CAINFO, $caBundle);
        }

        $rawResponse = curl_exec($ch);
        $curlErrNo = curl_errno($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = $curlErrNo ? curl_error($ch) : null;
        curl_close($ch);

        if ($curlErrNo) {
            $errorMessage = 'Forbindelsen til ChatGPT fejlede: ' . $curlError;
        } elseif ($httpStatus < 200 || $httpStatus >= 300) {
            $errorMessage = 'ChatGPT svarede med HTTP-status ' . $httpStatus . '. Svar: ' . $rawResponse;
        } else {
            $decoded = json_decode($rawResponse, true);
            if (!is_array($decoded) || empty($decoded['choices'][0]['message']['content'])) {
                $errorMessage = 'ChatGPT returnerede et uventet svar.';
            } else {
                $answer = trim($decoded['choices'][0]['message']['content']);
            }
        }
    }
}
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

        <section class="probe">
            <h2>Tjek API-forbindelse</h2>
            <p>Send en forespørgsel til ChatGPT for at forklare hvad DHCP er.</p>
            <form method="post">
                <input type="hidden" name="prompt" value="Forklar kort hvad DHCP er.">
                <button type="submit">Spørg ChatGPT</button>
            </form>

            <?php if ($answer !== null): ?>
                <div class="result" role="status">
                    <h3>Svar fra ChatGPT</h3>
                    <p><?php echo nl2br(htmlspecialchars($answer, ENT_QUOTES, 'UTF-8')); ?></p>
                </div>
            <?php elseif ($errorMessage !== null): ?>
                <div class="result error" role="alert">
                    <h3>Fejl</h3>
                    <p><?php echo nl2br(htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8')); ?></p>
                </div>
            <?php endif; ?>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>
